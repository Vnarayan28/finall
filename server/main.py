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
from pydantic import BaseModel

load_dotenv()

app = FastAPI()

# MongoDB Setup
client = MongoClient(os.getenv("MONGO_URI"))
db = client[os.getenv("DB_NAME")]
users_collection = db["users"]
lectures_collection = db["lectures"]

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

# CORS configuration
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

class VideoRequest(BaseModel):
    topic: str

class TokenData(BaseModel):
    user_id: str
    email: str

def hash_password(password: str) -> str:
    import passlib.context
    pwd_context = passlib.context.CryptContext(schemes=["bcrypt"], deprecated="auto")
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    import passlib.context
    pwd_context = passlib.context.CryptContext(schemes=["bcrypt"], deprecated="auto")
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

@app.post("/get_videos")
async def get_videos(topic: str):
    try:
        import requests
        response = requests.get(
            "https://www.googleapis.com/youtube/v3/search",
            params={
                "part": "snippet",
                "q": topic,
                "key": os.getenv("YOUTUBE_API_KEY"),
                "maxResults": 5,
                "type": "video"
            }
        )

        data = response.json()
        return {"videos": data.get("items", [])}

    except Exception as e:
        return {"error": str(e)}

@app.get("/generate-answer")
async def generate_answer(videoId: str, topic: str, question: str):
    try:
        # Fetch YouTube transcript
        transcript = YouTubeTranscriptApi.get_transcript(videoId)
        transcript_text = " ".join([t['text'] for t in transcript])

        # Fetch Wikipedia content
        import wikipedia
        try:
            wikipedia_content = wikipedia.summary(topic, sentences=3, auto_suggest=False)
        except wikipedia.exceptions.PageError:
            wikipedia_content = "No relevant Wikipedia page found."
        except wikipedia.exceptions.DisambiguationError as e:
            wikipedia_content = f"Multiple matches found. Please be more specific: {', '.join(e.options[:3])}"
        except wikipedia.exceptions.WikipediaException as e:
            wikipedia_content = f"Wikipedia API error: {str(e)}"

        # Generate answer using Gemini AI
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel("gemini-1.5-pro-latest")
        prompt = f"""
        Answer the question '{question}' using the following information:
        - YouTube Transcript: {transcript_text[:8000]}
        - Wikipedia: {wikipedia_content}
        Return a clear and concise answer.
        """
        response = model.generate_content(prompt)
        return {"answer": response.text.strip()}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating answer: {str(e)}")

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