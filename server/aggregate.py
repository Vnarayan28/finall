import json
import os
import logging
from datetime import datetime
from typing import Dict, Any
from tenacity import retry, stop_after_attempt, wait_exponential
import google.generativeai as genai
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LectureGenerator:
    """Handles AI-powered lecture generation."""

    def __init__(self):
        self.client = MongoClient(os.getenv("MONGODB_URI"))
        self.db = self.client.get_database(os.getenv("DB_NAME"))
        self.api_keys = os.getenv("GEMINI_API_KEYS").split(",")
        self.current_key = 0

    def _switch_api_key(self):
        """Switch to the next available API key."""
        self.current_key = (self.current_key + 1) % len(self.api_keys)
        logger.warning(f"Switching to API Key {self.current_key + 1}")

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def _call_gemini(self, prompt: str) -> str:
        """Calls Gemini API synchronously (Flask is sync by default)."""
        genai.configure(api_key=self.api_keys[self.current_key])
        model = genai.GenerativeModel("gemini-1.5-pro-latest")

        try:
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Gemini API failed with key {self.current_key + 1}: {e}")
            self._switch_api_key()
            raise RuntimeError("AI generation failed.")

    def store_lecture(self, topic: str, content: Dict[str, Any]):
        """Stores lecture in MongoDB."""
        try:
            self.db.lectures.update_one(
                {"topic": topic},
                {"$set": content},
                upsert=True
            )
            logger.info(f"Lecture on '{topic}' stored successfully.")
        except PyMongoError as e:
            logger.error(f"Database error: {e}")
            raise RuntimeError(f"Database error: {e}")

    def generate(self, topic: str) -> Dict[str, Any]:
        """Generates lecture content and stores it in MongoDB."""
        try:
            # Check existing lecture
            existing = self.db.lectures.find_one({"topic": topic})
            if existing:
                logger.info(f"Lecture on '{topic}' retrieved from database.")
                return existing["content"]

            # Generate new content
            prompt = f"""
            Generate a detailed lecture on the topic '{topic}' in structured JSON format like:
            {{
                "title": "Lecture Title",
                "slides": [
                    {{
                        "title": "Slide 1 Title",
                        "content": "Detailed explanation for slide 1"
                    }},
                    {{
                        "title": "Slide 2 Title",
                        "content": "Detailed explanation for slide 2"
                    }}
                ]
            }}
            Only return valid JSON.
            """

            raw_response = self._call_gemini(prompt)

            # Ensure response is valid JSON
            try:
                lecture_data = json.loads(raw_response)
            except json.JSONDecodeError:
                logger.error("Gemini API returned invalid JSON.")
                lecture_data = {"title": topic, "slides": []}

            # Store and return
            self.store_lecture(topic, {
                "title": lecture_data.get("title", topic),
                "content": lecture_data,
                "timestamp": datetime.utcnow()
            })

            return lecture_data

        except Exception as e:
            logger.error(f"Lecture generation failed: {e}")
            raise RuntimeError(f"Generation failed: {e}")

# Singleton instance
generator = LectureGenerator()

# Public interface
def generate(topic: str):
    return generator.generate(topic)

def store_lecture(topic: str, content: Dict[str, Any]):
    generator.store_lecture(topic, content)
