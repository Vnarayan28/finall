import logging
import os
import re
from datetime import datetime, timedelta

import google.generativeai as genai
import requests
import uvicorn
import wikipedia
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from passlib.context import CryptContext
from pymongo import MongoClient
from pydantic import BaseModel
from youtube_transcript_api import YouTubeTranscriptApi

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# MongoDB Setup
client = MongoClient(os.getenv("MONGO_URI"))
db = client[os.getenv("DB_NAME")]
users_collection = db["users"]
lectures_collection = db["lectures"]

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class TokenData(BaseModel):
    user_id: str
    email: str

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)) # Use defined expiration
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(authorization: str = Header(None)) -> TokenData:
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not authorization or not authorization.startswith("Bearer "):
        logger.warning("Missing or malformed Authorization Bearer header.")
        raise credentials_exception
    
    token = authorization.split(" ")[1]
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if not (user_id := payload.get("sub")) or not (email := payload.get("email")):
            logger.warning(f"Token missing sub or email: {payload}")
            raise credentials_exception
        return TokenData(user_id=user_id, email=email)
    except JWTError as e:
        logger.error(f"JWT validation failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token") # Re-raise as HTTPException for consistent error handling

def parse_duration(iso_str: str) -> tuple:
    try:
        hours = minutes = seconds = 0
        
        if hours_match := re.search(r'(\d+)H', iso_str):
            hours = int(hours_match.group(1))
        if minutes_match := re.search(r'(\d+)M', iso_str):
            minutes = int(minutes_match.group(1))
        if seconds_match := re.search(r'(\d+)S', iso_str):
            seconds = int(seconds_match.group(1))
        
        total_seconds = hours * 3600 + minutes * 60 + seconds
        
        if total_seconds < 240:  # 4 minutes minimum
            return None, total_seconds
        
        # Format readable duration consistently
        h_disp = total_seconds // 3600
        m_disp = (total_seconds % 3600) // 60
        s_disp = total_seconds % 60
        
        if h_disp > 0:
            readable_duration = f"{h_disp}:{m_disp:02d}:{s_disp:02d}"
        else:
            readable_duration = f"{m_disp:02d}:{s_disp:02d}"
            
        return readable_duration, total_seconds
    except Exception as e:
        logger.error(f"Duration parsing failed for '{iso_str}': {str(e)}")
        return None, 0

@app.post("/signup")
async def signup(user: UserCreate):
    if users_collection.find_one({"$or": [{"email": user.email}, {"username": user.username}]}):
        raise HTTPException(status_code=400, detail="Email or username already registered")

    user_data = {
        "username": user.username,
        "email": user.email,
        "password": hash_password(user.password),
        "created_at": datetime.utcnow()
    }
    result = users_collection.insert_one(user_data)
    
    return {
        "message": "User registered successfully",
        "token": create_token(
            {"sub": str(result.inserted_id), "email": user.email}
            # Default expiration from create_token will be used
        )
    }

@app.post("/login")
async def login(user: UserLogin):
    db_user = users_collection.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {
        "message": "Login successful",
        "token": create_token(
            {"sub": str(db_user["_id"]), "email": db_user["email"]}
            # Default expiration from create_token will be used
        )
    }

@app.get("/api/generate-lecture")
async def generate_lecture(topic: str):
    YT_API_KEY = os.getenv("YOUTUBE_API_KEY")
    if not YT_API_KEY:
        logger.error("YouTube API key not configured.")
        raise HTTPException(status_code=500, detail="YouTube API key not configured") # Changed to HTTPException

    try:
        video_ids = []
        next_page_token = None
        
        # Fetch multiple pages to account for filtering
        # Changed range from 3 to 4, so 4*50 = 200 videos max
        for _ in range(4): # MODIFIED: Increased page fetches
            search_res = requests.get(
                "https://www.googleapis.com/youtube/v3/search",
                params={
                    "part": "snippet",
                    "q": f"{topic} lecture",
                    "type": "video",
                    "maxResults": 50, # MODIFIED: Corrected maxResults to 50 (API limit)
                    "key": YT_API_KEY,
                    "pageToken": next_page_token or "",
                    "relevanceLanguage": "en",
                    "videoEmbeddable": "true"
                }
            )
            search_res.raise_for_status() # Raises HTTPError for bad responses (4XX or 5XX)
            search_data = search_res.json()
            video_ids.extend(item["id"]["videoId"] for item in search_data.get("items", []))
            if not (next_page_token := search_data.get("nextPageToken")):
                break
        
        if not video_ids:
            logger.info(f"No video IDs found from YouTube search for topic: {topic}")
            return {"videos": []} # Return empty list if no IDs found

        all_video_details = []
        chunk_size = 50 # YouTube API limit for IDs per request in videos.list
        for i in range(0, len(video_ids), chunk_size):
            chunk = video_ids[i:i + chunk_size]
            for attempt in range(3): # Retry logic for fetching details
                try:
                    detail_res = requests.get(
                        "https://www.googleapis.com/youtube/v3/videos",
                        params={
                            "part": "contentDetails,snippet",
                            "id": ",".join(chunk),
                            "key": YT_API_KEY
                        }
                    )
                    detail_res.raise_for_status()
                    all_video_details.extend(detail_res.json().get("items", []))
                    break 
                except requests.exceptions.RequestException as e: # More specific exception
                    logger.warning(f"Attempt {attempt+1} failed to fetch video details for chunk {i//chunk_size}: {str(e)}")
                    if attempt == 2:
                        logger.error(f"All attempts failed to fetch video details for chunk {i//chunk_size}.")
                        # Decide if to continue with partial data or raise error; here, we continue
                    # time.sleep(1) # Optional: add a small delay before retrying
                except Exception as e: # Catch other potential errors
                    logger.error(f"An unexpected error occurred during video detail fetch (chunk {i//chunk_size}, attempt {attempt+1}): {str(e)}")
                    if attempt == 2:
                         logger.error(f"All attempts failed (unexpected error) for video details for chunk {i//chunk_size}.")


        videos = []
        for item in all_video_details:
            try:
                video_id = item["id"] # This should always exist if item is valid
                snippet = item.get("snippet", {})
                content_details = item.get("contentDetails", {})
                
                iso_duration = content_details.get("duration")
                if not iso_duration: # Skip if duration is missing
                    logger.warning(f"Video {video_id} skipped: missing duration.")
                    continue
                
                readable_duration, total_seconds = parse_duration(iso_duration)
                if not readable_duration: # This implies total_seconds < 240 as per parse_duration logic
                    logger.debug(f"Video {video_id} skipped: duration {iso_duration} ({total_seconds}s) is less than 4 minutes.")
                    continue 
                
                thumbnails = snippet.get("thumbnails", {})
                thumbnail = (thumbnails.get("high", {}).get("url") or
                             thumbnails.get("medium", {}).get("url") or
                             thumbnails.get("default", {}).get("url"))
                if not thumbnail:
                    logger.warning(f"Video {video_id} skipped: missing thumbnail.")
                    continue
                
                videos.append({
                    "videoId": video_id,
                    "title": snippet.get("title", "Untitled Video"),
                    "description": snippet.get("description", ""),
                    "thumbnails": thumbnail,
                    "channel": snippet.get("channelTitle", "Unknown Channel"),
                    "duration": readable_duration,
                    "status": "todo" # Default status
                })
                
                if len(videos) >= 100: # Max videos to return
                    break
                    
            except KeyError as e: # Catch potential KeyErrors if API structure is unexpected
                logger.error(f"Error processing video item (KeyError: {str(e)}): {item.get('id', 'Unknown ID')}")
                continue
            except Exception as e: # General catch-all for other errors during processing
                logger.error(f"Error processing video item {item.get('id', 'Unknown ID')}: {str(e)}")
                continue
        
        if not videos:
            logger.info(f"No videos met filtering criteria for topic: {topic}")
        
        return {"videos": videos} # Returns up to 100 videos

    except requests.exceptions.HTTPError as e: # Specific for HTTP errors from requests
        logger.error(f"YouTube API HTTP error for topic '{topic}': {str(e)}")
        # Provide more specific error message based on status code if possible
        if e.response is not None:
            if e.response.status_code == 403: # Quota exceeded or other permission issues
                 # Check response content for reason, e.g., quotaExceeded
                error_details = e.response.json().get("error", {}).get("errors", [{}])[0].get("reason")
                if error_details == "quotaExceeded":
                    raise HTTPException(status_code=429, detail="YouTube API quota exceeded. Please try again later.")
                raise HTTPException(status_code=403, detail=f"YouTube API access forbidden: {error_details or 'Reason unknown'}")   
            logger.error(f"YouTube API response content: {e.response.text}")
        raise HTTPException(status_code=503, detail="Failed to fetch videos from YouTube due to an API error. Please try again later.")
    except Exception as e:
        logger.error(f"General API error for topic '{topic}': {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch videos. An unexpected error occurred.")


@app.get("/generate-answer")
async def generate_answer(videoId: str, topic: str, question: str):
    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(videoId)
        transcript_text = " ".join([t['text'] for t in transcript_list])

        wikipedia_content = ""
        try:
            wikipedia_content = wikipedia.summary(topic, sentences=5, auto_suggest=False)
        except wikipedia.exceptions.PageError:
            wikipedia_content = "No relevant Wikipedia page found for the topic."
        except wikipedia.exceptions.DisambiguationError as e:
            options = e.options[:3]
            wikipedia_content = f"The topic '{topic}' is ambiguous. Possible matches: {', '.join(options)}. Please be more specific."
        except wikipedia.exceptions.WikipediaException as e:
            logger.warning(f"Wikipedia lookup error for topic '{topic}': {str(e)}")
            wikipedia_content = "Could not retrieve information from Wikipedia due to an error."
        except Exception as e:
            logger.error(f"Unexpected error during Wikipedia lookup for topic '{topic}': {str(e)}")
            wikipedia_content = "An unexpected error occurred while fetching Wikipedia content."

        GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
        if not GEMINI_API_KEY:
            logger.error("Gemini API key not configured.")
            raise HTTPException(status_code=500, detail="Generative AI service not configured.")

        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")

        max_transcript_chars = 20000 
        prompt = (
            f"Based on the following information, please answer the question: '{question}'.\n\n"
            f"From YouTube Video Transcript (Topic: {topic}, Video ID: {videoId}):\n\"\"\"\n{transcript_text[:max_transcript_chars]}\n\"\"\"\n\n"
            f"From Wikipedia (Topic: {topic}):\n\"\"\"\n{wikipedia_content}\n\"\"\"\n\n"
            "Provide a concise and direct answer to the question. If the information is insufficient, state that."
        )

        try:
            response = model.generate_content(prompt)
            return {"answer": response.text.strip()}
        except ResourceExhausted as e:
            logger.warning(f"Gemini API quota exceeded: {str(e)}")
            raise HTTPException(status_code=429, detail="Gemini API quota exceeded. Please wait and try again.")

    except YouTubeTranscriptApi.CouldNotRetrieveTranscript as e:
        logger.warning(f"Could not retrieve transcript for videoId {videoId}: {str(e)}")
        raise HTTPException(status_code=404, detail=f"Transcript not available for video {videoId}. It might be disabled or the video doesn't exist.")
    except Exception as e:
        logger.error(f"Answer generation failed for videoId {videoId}, topic '{topic}': {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate answer due to an internal error.")


@app.get("/user/lectures")
async def get_user_lectures(current_user: TokenData = Depends(get_current_user)):
    try:
        user_lectures = list(lectures_collection.find(
            {"user_id": current_user.user_id},
            {"_id": 0, "topic": 1, "created_at": 1, "videos": 1} # Projection
        ).sort("created_at", -1).limit(10))
        
        # Ensure created_at is formatted as ISO string
        for lecture in user_lectures:
            if isinstance(lecture.get("created_at"), datetime):
                lecture["created_at"] = lecture["created_at"].isoformat()
        
        return {"lectures": user_lectures}
    except Exception as e:
        logger.error(f"Failed to retrieve lectures for user {current_user.user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not retrieve user lectures.")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))