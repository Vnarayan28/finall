import re
import os
import shutil
import cv2
import asyncio
from pytube import YouTube
from typing import List, Optional
from dotenv import load_dotenv
from tenacity import retry, wait_exponential, stop_after_attempt
import google.generativeai as genai
from langchain_community.tools import YouTubeSearchTool
load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

class FrameProcessor:
    """Handles video frame processing with rate limiting"""
    def __init__(self):
        self.rate_limit = asyncio.Semaphore(5)  # 5 concurrent requests

    @retry(wait=wait_exponential(multiplier=1, min=2, max=10), 
           stop=stop_after_attempt(3))
    async def upload_file(self, path: str) -> Optional[dict]:
        """Upload a file with rate limiting and retries"""
        async with self.rate_limit:
            if not os.path.exists(path):
                return None
            try:
                return genai.upload_file(path=path)
            except Exception as e:
                print(f"Upload failed for {path}: {str(e)}")
                return None

def get_valid_filename(title: str) -> str:
    """Sanitize YouTube title for filename"""
    return re.sub(r'[\\/*?:"<>|]', "", title).strip()

async def download_youtube_video(url: str, path: str) -> tuple:
    """Improved YouTube download with error handling"""
    try:
        yt = YouTube(url)
        sanitized_title = get_valid_filename(yt.title)
        output_path = os.path.join(path, sanitized_title)
        
        os.makedirs(output_path, exist_ok=True)
        
        # Download best progressive stream
        video_stream = yt.streams.filter(progressive=True, file_extension="mp4").order_by("resolution").desc().first()
        video_path = video_stream.download(output_path=output_path, filename="video.mp4")
        
        return video_path, os.path.join(output_path, "audio.mp3")
    
    except Exception as e:
        print(f"Download failed: {str(e)}")
        raise

def extract_key_frames(video_path: str, interval_sec: int = 10) -> str:
    """Extract frames at specified intervals with OpenCV"""
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_interval = int(fps * interval_sec)
    output_dir = os.path.join("content", "frames", os.path.basename(video_path).split('.')[0])
    
    shutil.rmtree(output_dir, ignore_errors=True)
    os.makedirs(output_dir, exist_ok=True)
    
    frame_count = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        if frame_count % frame_interval == 0:
            timestamp = frame_count // int(fps)
            min, sec = divmod(timestamp, 60)
            cv2.imwrite(os.path.join(output_dir, f"frame_{min:02d}_{sec:02d}.jpg"), frame)
            
        frame_count += 1
        
    cap.release()
    return output_dir

async def process_media(frame_dir: str, audio_path: str) -> tuple:
    """Process and upload media files with Gemini"""
    processor = FrameProcessor()
    
    # Upload audio
    audio_response = await processor.upload_file(audio_path)
    
    # Upload key frames
    frame_paths = [os.path.join(frame_dir, f) for f in os.listdir(frame_dir)]
    frame_responses = [await processor.upload_file(p) for p in frame_paths]
    
    return audio_response, [fr for fr in frame_responses if fr is not None]

async def get_youtube_data(topic: str, max_results: int = 1) -> dict:
    """Get YouTube data for a topic with error handling"""
    try:
        tool = YouTubeSearchTool()
        results = tool.run(f"{topic}, {max_results}")
        
        if not results:
            raise ValueError("No YouTube results found")
            
        # Extract first valid URL
        match = re.search(r'(https?://\S+)', results)
        if not match:
            raise ValueError("No valid URL found in results")
            
        video_url = match.group(1)
        video_path, audio_path = await download_youtube_video(video_url, "downloads")
        frame_dir = extract_key_frames(video_path)
        
        audio_data, frame_data = await process_media(frame_dir, audio_path)
        
        return {
            "audio": audio_data,
            "frames": frame_data,
            "metadata": {
                "title": YouTube(video_url).title,
                "url": video_url,
                "duration": YouTube(video_url).length
            }
        }
    
    except Exception as e:
        print(f"Error processing YouTube data: {str(e)}")
        return {}