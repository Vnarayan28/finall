from pymongo import MongoClient
from pymongo.errors import PyMongoError
import logging

logger = logging.getLogger(__name__)

class MongoDBManager:
    """Handles MongoDB connections and operations."""
    
    def __init__(self, uri, db_name):
        try:
            self.client = MongoClient(uri)
            self.db = self.client[db_name]
            self.client.admin.command("ping")
            logger.info("Successfully connected to MongoDB")
        except PyMongoError as e:
            logger.error(f"MongoDB connection failed: {e}")
            raise RuntimeError("Database connection error")

    def get_lecture(self, user_email, lecture_title):
        """Retrieve lecture data."""
        try:
            collection = self.db.lectures
            data = collection.find_one(
                {"email": user_email, "title": lecture_title},
                {"_id": 0}
            )
            return data if data else {}
        except PyMongoError as e:
            logger.error(f"Lecture query failed: {e}")
            return {}

    def close(self):
        """Graceful connection closure."""
        try:
            self.client.close()
            logger.info("MongoDB connection closed")
        except PyMongoError as e:
            logger.error(f"Error closing connection: {e}")