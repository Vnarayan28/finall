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
        """Retrieve lecture data with improved query."""
        try:
            collection = self.db.lectures
            data = collection.find_one(
                {"email": user_email, "lectures.title": lecture_title},
                {"lectures.$": 1, "_id": 0}
            )
            return data.get("lectures", [{}])[0] if data else None
        except PyMongoError as e:
            logger.error(f"Lecture query failed: {e}")
            return None

    def get_template(self, template_id):
        """Safer template retrieval with validation."""
        try:
            collection = self.db.templates
            template = collection.find_one({"template_id": template_id})
            
            if not template or not all(k in template for k in 
                                      ["description", "num_images", "num_texts"]):
                return None
                
            return {
                "description": template["description"],
                "num_images": template["num_images"],
                "num_texts": template["num_texts"]
            }
        except PyMongoError as e:
            logger.error(f"Template query failed: {e}")
            return None

    def close(self):
        """Graceful connection closure."""
        try:
            self.client.close()
            logger.info("MongoDB connection closed")
        except PyMongoError as e:
            logger.error(f"Error closing connection: {e}")