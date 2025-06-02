import logging
import requests
from fastapi import APIRouter, HTTPException
from datetime import datetime

from app.core.config import YOUTUBE_API_KEY
from app.db.setup import lectures_collection
from app.utils.helpers import parse_duration

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/api/generate-lecture", summary="Generate lecture from YouTube videos based on topic")
async def generate_lecture_endpoint(topic: str):
    if not YOUTUBE_API_KEY:
        logger.error("YouTube API key not configured.")
        raise HTTPException(status_code=500, detail="YouTube API key not configured") 

    try:
        video_ids = []
        next_page_token = None
        
        for _ in range(4): 
            search_res = requests.get(
                "https://www.googleapis.com/youtube/v3/search",
                params={
                    "part": "snippet",
                    "q": f"{topic} lecture",
                    "type": "video",
                    "maxResults": 50, 
                    "key": YOUTUBE_API_KEY,
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
        
        if not video_ids:
            logger.info(f"No video IDs found from YouTube search for topic: {topic}")
            return {"videos": []} 

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
                            "key": YOUTUBE_API_KEY
                        }
                    )
                    detail_res.raise_for_status()
                    all_video_details.extend(detail_res.json().get("items", []))
                    break 
                except requests.exceptions.RequestException as e: 
                    logger.warning(f"Attempt {attempt+1} failed to fetch video details for chunk {i//chunk_size}: {str(e)}")
                    if attempt == 2:
                        logger.error(f"All attempts failed to fetch video details for chunk {i//chunk_size}.")
                except Exception as e: 
                    logger.error(f"An unexpected error occurred during video detail fetch (chunk {i//chunk_size}, attempt {attempt+1}): {str(e)}")
                    if attempt == 2:
                         logger.error(f"All attempts failed (unexpected error) for video details for chunk {i//chunk_size}.")

        videos = []
        for item in all_video_details:
            try:
                video_id = item["id"] 
                snippet = item.get("snippet", {})
                content_details = item.get("contentDetails", {})
                
                iso_duration = content_details.get("duration")
                if not iso_duration: 
                    logger.warning(f"Video {video_id} skipped: missing duration.")
                    continue
                
                readable_duration, total_seconds = parse_duration(iso_duration)
                if not readable_duration: 
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
                    "status": "todo" 
                })
                
                if len(videos) >= 100: 
                    break
                    
            except KeyError as e: 
                logger.error(f"Error processing video item (KeyError: {str(e)}): {item.get('id', 'Unknown ID')}")
                continue
            except Exception as e: 
                logger.error(f"Error processing video item {item.get('id', 'Unknown ID')}: {str(e)}")
                continue
        
        if not videos:
            logger.info(f"No videos met filtering criteria for topic: {topic}")
        
        return {"videos": videos} 

    except requests.exceptions.HTTPError as e: 
        logger.error(f"YouTube API HTTP error for topic '{topic}': {str(e)}")
        if e.response is not None:
            if e.response.status_code == 403: 
                error_details = e.response.json().get("error", {}).get("errors", [{}])[0].get("reason")
                if error_details == "quotaExceeded":
                    raise HTTPException(status_code=429, detail="YouTube API quota exceeded. Please try again later.")
                raise HTTPException(status_code=403, detail=f"YouTube API access forbidden: {error_details or 'Reason unknown'}")   
            logger.error(f"YouTube API response content: {e.response.text}")
        raise HTTPException(status_code=503, detail="Failed to fetch videos from YouTube due to an API error. Please try again later.")
    except Exception as e:
        logger.error(f"General API error for topic '{topic}': {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch videos. An unexpected error occurred.")

@router.get("/user/lectures", summary="Get lectures for a specific user")
async def get_user_lectures_endpoint(user_id: str):
    try:
        # Optional: Validate user_id format and existence
        # try:
        #     query_user_id_obj = ObjectId(user_id)
        # except InvalidId:
        #     raise HTTPException(status_code=400, detail="Invalid user_id format.")
        # if not users_collection.find_one({"_id": query_user_id_obj}):
        #      raise HTTPException(status_code=404, detail=f"User with id {user_id} not found.")

        user_lectures = list(lectures_collection.find(
            {"user_id": user_id}, # Use the provided user_id string
            {"_id": 0, "topic": 1, "created_at": 1, "videos": 1} 
        ).sort("created_at", -1).limit(10))
        
        for lecture in user_lectures:
            if isinstance(lecture.get("created_at"), datetime):
                lecture["created_at"] = lecture["created_at"].isoformat()
        
        if not user_lectures:
            logger.info(f"No lectures found for user_id: {user_id}")
        
        return {"lectures": user_lectures}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve lectures for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Could not retrieve user lectures.")