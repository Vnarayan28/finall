from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from pymongo import MongoClient
import os
from dotenv import load_dotenv
import requests
from typing import List

load_dotenv()
from pydantic import BaseModel

class VideoRequest(BaseModel):
    topic: str

# Database setup
client = MongoClient(os.getenv("MONGO_URI"))
db = client[os.getenv("DB_NAME")]
users_collection = db["users"]
lectures_collection = db["lectures"]

# Security setup
SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class LectureRequest(BaseModel):
    topic: str

class VideoResource(BaseModel):
    title: str
    videoId: str
    description: str
    channel: str
    duration: str
    status: str = "todo"

class TokenData(BaseModel):
    user_id: str
    email: str

# Utility functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
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
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        
        if not user_id or not email:
            raise credentials_exception
            
        return TokenData(user_id=user_id, email=email)
        
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Token validation failed: {str(e)}")

# Routes
@app.post("/signup")
async def signup(user: UserCreate):
    if users_collection.find_one({"$or": [{"email": user.email}, {"username": user.username}]}):
        raise HTTPException(status_code=400, detail="Email or username already registered")

    hashed_pwd = hash_password(user.password)
    user_data = {
        "username": user.username,
        "email": user.email,
        "password": hashed_pwd,
        "created_at": datetime.utcnow()
    }
    result = users_collection.insert_one(user_data)
    
    token = create_token(
        {"sub": str(result.inserted_id), "email": user.email},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {"message": "User registered successfully", "token": token}

@app.post("/login")
async def login(user: UserLogin):
    db_user = users_collection.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(
        {"sub": str(db_user["_id"]), "email": db_user["email"]},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {"message": "Login successful", "token": token}

class TopicRequest(BaseModel):
    topic: str

@app.post("/get_videos")
async def get_videos(data: VideoRequest):
    try:
        if not YOUTUBE_API_KEY:
            raise HTTPException(status_code=500, detail="YouTube API key not configured")

        search_url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            "part": "snippet",
            "q": data.topic,
            "type": "video",
            "maxResults": 6,
            "key": YOUTUBE_API_KEY,
            "relevanceLanguage": "en",
            "videoDuration": "medium",
            "videoEmbeddable": "true",
            "videoSyndicated": "true"
        }

        search_response = requests.get(search_url, params=params)
        search_response.raise_for_status()
        search_results = search_response.json()

        if not search_results.get("items"):
            raise HTTPException(status_code=404, detail="No videos found")

        video_ids = [item["id"]["videoId"] for item in search_results["items"]]
        details_url = "https://www.googleapis.com/youtube/v3/videos"
        details_params = {
            "part": "snippet,contentDetails",
            "id": ",".join(video_ids),
            "key": YOUTUBE_API_KEY
        }

        details_response = requests.get(details_url, params=details_params)
        details_response.raise_for_status()
        details_results = details_response.json()

        videos = []
        for item in details_results["items"]:
            duration = item["contentDetails"]["duration"]
            duration = duration.replace("PT", "").replace("H", ":").replace("M", ":").replace("S", "")

            videos.append(VideoResource(
                title=item["snippet"]["title"],
                videoId=item["id"],
                description=item["snippet"]["description"],
                channel=item["snippet"]["channelTitle"],
                duration=duration
            ))

        return {"videos": videos}

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"YouTube API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Add to imports
from youtube_transcript_api import YouTubeTranscriptApi
import google.generativeai as genai
from pydantic import BaseModel

# Add after security setup
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Add new models
class Slide(BaseModel):
    title: str
    template_id: int
    texts: List[str] = []
    speaker_notes: str = ""
    images: List[dict] = []

class Lecture(BaseModel):
    title: str
    description: str 
    slides: List[Slide]
    video_id: str
    topic: str

# Enhanced generate-lecture endpoint
@app.post("/generate-lecture")
async def generate_lecture(request: LectureRequest, current_user: TokenData = Depends(get_current_user)):
    try:
        # Get video details
        video = (await get_videos(request, current_user))["videos"][0]
        
        # Get transcript
        transcript = YouTubeTranscriptApi.get_transcript(video.videoId)
        transcript_text = " ".join([t['text'] for t in transcript])
        
        # Generate with Gemini
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(f"""
            Generate lecture slides about {request.topic} using this transcript:
            {transcript_text[:8000]}
            
            Use this JSON format:
            {Slide.schema_json()}
        """)
        
        # Parse response
        slides = [Slide(**slide) for slide in json.loads(response.text)]
        
        # Create lecture
        lecture_data = Lecture(
            title=f"{request.topic} Lecture",
            description=f"Generated from video: {video.title}",
            slides=slides,
            video_id=video.videoId,
            topic=request.topic
        ).dict()
        
        # Store in DB
        lectures_collection.insert_one(lecture_data)
        
        return {"lecture": lecture_data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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