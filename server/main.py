from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from jose import jwt, JWTError
from datetime import datetime, timedelta
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from youtube_transcript_api import YouTubeTranscriptApi
import google.generativeai as genai 
import requests
import re
import logging

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

def hash_password(password: str) -> str:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    return pwd_context.verify(plain, hashed)

def create_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(authorization: str = Header(None)) -> TokenData:
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not authorization or not authorization.startswith("Bearer "):
        raise credentials_exception
    
    token = authorization.split(" ")[1]
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if not (user_id := payload.get("sub")) or not (email := payload.get("email")):
            raise credentials_exception
        return TokenData(user_id=user_id, email=email)
    except JWTError as e:
        logger.error(f"JWT validation failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")

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
        
        time_parts = []
        if hours: time_parts.append(f"{hours}")
        time_parts.append(f"{minutes:02d}")
        time_parts.append(f"{seconds:02d}")
        
        return ":".join(time_parts), total_seconds
    except Exception as e:
        logger.error(f"Duration parsing failed: {str(e)}")
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
            {"sub": str(result.inserted_id), "email": user.email},
            timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
    }

@app.post("/login")
async def login(user: UserLogin):
    if not (db_user := users_collection.find_one({"email": user.email})) or \
       not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {
        "message": "Login successful",
        "token": create_token(
            {"sub": str(db_user["_id"]), "email": db_user["email"]},
            timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
    }

@app.get("/api/generate-lecture")
async def generate_lecture(topic: str):
    YT_API_KEY = os.getenv("YOUTUBE_API_KEY")
    if not YT_API_KEY:
        return {"error": "YouTube API key not configured"}

    try:
        video_ids = []
        next_page_token = None
        
        # Fetch multiple pages to account for filtering
        for _ in range(3):
            search_res = requests.get(
                "https://www.googleapis.com/youtube/v3/search",
                params={
                    "part": "snippet",
                    "q": topic,
                    "type": "video",
                    "maxResults": 100,
                    "key": YT_API_KEY,
                    "pageToken": next_page_token or "",
                    "relevanceLanguage": "en",
                    "videoEmbeddable": "true"
                }
            )
            search_res.raise_for_status()
            search_data = search_res.json()
            video_ids.extend(item["id"]["videoId"] for item in search_data.get("items", []))
            if not (next_page_token := search_data.get("nextPageToken")):
                break

        # Get video details in chunks with retries
        all_video_details = []
        chunk_size = 50
        for i in range(0, len(video_ids), chunk_size):
            chunk = video_ids[i:i + chunk_size]
            for attempt in range(3):
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
                except Exception as e:
                    if attempt == 2:
                        logger.error(f"Failed to fetch video details: {str(e)}")
                    continue

        videos = []
        for item in all_video_details:
            try:
                video_id = item["id"]
                snippet = item.get("snippet", {})
                content_details = item.get("contentDetails", {})
                
                # Validate duration
                iso_duration = content_details.get("duration", "")
                readable_duration, total_seconds = parse_duration(iso_duration)
                if not readable_duration or total_seconds < 240:
                    continue
                
                # Validate thumbnail
                thumbnails = snippet.get("thumbnails", {})
                thumbnail = thumbnails.get("high", {}).get("url") or \
                            thumbnails.get("medium", {}).get("url") or \
                            thumbnails.get("default", {}).get("url")
                if not thumbnail:
                    continue
                
                videos.append({
                    "videoId": video_id,
                    "title": snippet.get("title", "Untitled Video"),
                    "description": snippet.get("description", ""),
                    "thumbnails": thumbnail,
                    "channel": snippet.get("channelTitle", "Unknown Channel"),
                    "duration": readable_duration,
                    "status": "todo"
                })
                
                if len(videos) >= 100:
                    break
                    
            except Exception as e:
                logger.error(f"Error processing video {video_id}: {str(e)}")
                continue

        return {"videos": videos[:100]}

    except Exception as e:
        logger.error(f"API error: {str(e)}")
        return {"error": "Failed to fetch videos. Please try again later."}

@app.get("/generate-answer")
async def generate_answer(videoId: str, topic: str, question: str):
    try:
        transcript = YouTubeTranscriptApi.get_transcript(videoId)
        transcript_text = " ".join([t['text'] for t in transcript])

        import wikipedia
        try:
            wikipedia_content = wikipedia.summary(topic, sentences=3, auto_suggest=False)
        except wikipedia.exceptions.PageError:
            wikipedia_content = "No relevant Wikipedia page found."
        except wikipedia.exceptions.DisambiguationError as e:
            wikipedia_content = f"Multiple matches: {', '.join(e.options[:3])}"
        except wikipedia.exceptions.WikipediaException as e:
            wikipedia_content = f"Wikipedia error: {str(e)}"

        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel("gemini-1.5-pro-latest")
        response = model.generate_content(
            f"Answer '{question}' using:\n"
            f"- Transcript: {transcript_text[:8000]}\n"
            f"- Wikipedia: {wikipedia_content}\n"
            "Provide a concise answer."
        )
        return {"answer": response.text.strip()}

    except Exception as e:
        logger.error(f"Answer generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate answer")

@app.get("/user/lectures")
async def get_user_lectures(current_user: TokenData = Depends(get_current_user)):
    lectures = list(lectures_collection.find(
        {"user_id": current_user.user_id},
        {"_id": 0, "topic": 1, "created_at": 1, "videos": 1}
    ).sort("created_at", -1).limit(10))
    
    for lecture in lectures:
        lecture["created_at"] = lecture["created_at"].isoformat()
    
    return {"lectures": lectures}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)