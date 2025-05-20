import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")
JWT_SECRET = os.getenv("JWT_SECRET") # Still needed for creating tokens
ALGORITHM = "HS256" # Still needed for creating tokens
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # Still needed for creating tokens

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PORT = int(os.getenv("PORT", 8000))