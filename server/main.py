import logging
import os
import re
from datetime import datetime, timedelta
import base64
from io import BytesIO
from deepface import DeepFace
import numpy as np
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted
import requests
import uvicorn
import wikipedia
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from passlib.context import CryptContext
from PIL import Image
from pymongo import MongoClient
from pydantic import BaseModel
from youtube_transcript_api import YouTubeTranscriptApi

load_dotenv()

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


# Note: numpy is already imported above, so this second import is redundant
# import numpy as np
from scipy.signal import find_peaks, detrend, butter, filtfilt
from scipy.fftpack import fft, fftfreq

class HeartMetricsCalculator:

    def __init__(self, fps=30, window_length_multiplier=2, step_size_multiplier=1):
        self.fps = fps
        self.window_length = fps * window_length_multiplier
        self.step_size = fps * step_size_multiplier

    @staticmethod
    def bandpass_filter(data, lowcut, highcut, fs, order=5):
        nyquist = 0.5 * fs
        low = lowcut / nyquist
        high = highcut / nyquist
        b, a = butter(order, [low, high], btype='band')
        return filtfilt(b, a, data)

    @staticmethod
    def calculate_heart_rate(peaks, fs):
        time_diff = np.diff(peaks) / fs
        heart_rates = 60 / time_diff
        return np.mean(heart_rates)

    @staticmethod
    def moving_average(data, window_size):
        return np.convolve(data, np.ones(window_size)/window_size, mode='valid')

    @staticmethod
    def compute_IBI(peaks, fs):
        return np.diff(peaks) / fs

    def estimate_heart_rate(self, roi_frames):
        heart_rates = []
        if len(roi_frames) <= 2: # Needs at least 3 frames for detrend, filter, moving_avg
            logger.warning(f"HeartMetricsCalculator: Insufficient roi_frames ({len(roi_frames)}), need > 2.")
            return 0, 0, 0, 0, 0

        intensity_over_time = [np.mean(frame) for frame in roi_frames]
        if len(intensity_over_time) <= 2: # detrend needs > 2 samples
            logger.warning(f"HeartMetricsCalculator: Insufficient intensity_over_time ({len(intensity_over_time)}), need > 2 for detrend.")
            return 0,0,0,0,0

        detrended_intensity = detrend(intensity_over_time)
        filtered_signal = self.bandpass_filter(detrended_intensity, 0.5, 3, self.fps)

        window_size = int(self.fps/3.0)
        if window_size < 1: window_size = 1 # Ensure window_size is at least 1
        
        if len(filtered_signal) < window_size: # moving_average needs signal > window_size
            logger.warning(f"HeartMetricsCalculator: Filtered signal length ({len(filtered_signal)}) is less than moving average window size ({window_size}).")
            # Attempt to proceed without smoothing or return default
            # For simplicity, let's assume we need smoothing.
            # If smoothing is critical, return defaults or use original filtered_signal.
            # smoothed_signal = filtered_signal # Option: proceed without smoothing
            # For now, return default if we can't smooth as per original logic path
            return 0,0,0,0,0


        smoothed_signal = self.moving_average(filtered_signal, window_size)

        if len(smoothed_signal) < self.window_length:
            logger.warning(f"HeartMetricsCalculator: Smoothed signal length ({len(smoothed_signal)}) is less than window_length ({self.window_length}).")
            # Optionally, try with a smaller window or use the whole signal if possible
            # For now, stick to original logic: if not enough data for segment, HR list remains empty.
            pass # Will result in empty heart_rates if loop doesn't run

        for start in range(0, len(smoothed_signal) - self.window_length, self.step_size):
            segment = smoothed_signal[start:start+self.window_length] # Use smoothed_signal here as per your original logic for peaks
            if len(segment) == 0: continue
            peaks, _ = find_peaks(segment, distance=self.fps/3.0, height=np.max(segment)*0.6 if np.max(segment) > 0 else 0)


            if len(peaks) > 1:
                heart_rate = self.calculate_heart_rate(peaks, self.fps)
                heart_rates.append(heart_rate)

        if len(heart_rates) > 0:
            avg_heart_rate = sum(heart_rates) / len(heart_rates)
        else:
            avg_heart_rate = 0
        
        # Use the longer filtered_signal for IBI calculation, as per original logic
        all_peaks, _ = find_peaks(filtered_signal, distance=self.fps/3.0, height=np.max(filtered_signal)*0.6 if np.max(filtered_signal)>0 else 0)
        if len(all_peaks) < 2:
             logger.warning(f"HeartMetricsCalculator: Not enough peaks ({len(all_peaks)}) in full filtered_signal for IBI.")
             return avg_heart_rate, 0, 0, 0, 0

        ibi = self.compute_IBI(all_peaks, self.fps)
        if len(ibi) == 0:
            logger.warning("HeartMetricsCalculator: IBI calculation resulted in an empty array.")
            return avg_heart_rate, 0, 0, 0, 0

        sdnn = np.std(ibi) if len(ibi) > 0 else 0
        rmssd = np.sqrt(np.mean(np.square(np.diff(ibi)))) if len(ibi) > 1 else 0
        bsi = (1 / rmssd) if rmssd > 0 else 0


        if len(ibi) < 2:
            logger.warning(f"HeartMetricsCalculator: IBI length ({len(ibi)}) too short for FFT.")
            lf_hf_ratio = 0
        else:
            mean_ibi_val = np.mean(ibi)
            if mean_ibi_val <= 0: # Avoid division by zero or negative d for fftfreq
                logger.warning(f"HeartMetricsCalculator: Mean IBI is non-positive ({mean_ibi_val}), cannot compute FFT reliably.")
                lf_hf_ratio = 0
            else:
                frequencies = fftfreq(len(ibi), d=mean_ibi_val)
                power_spectrum = np.abs(fft(ibi))**2
                lf_band = (0.04, 0.15)
                hf_band = (0.15, 0.4)
                lf_power = np.sum(power_spectrum[(frequencies >= lf_band[0]) & (frequencies < lf_band[1])])
                hf_power = np.sum(power_spectrum[(frequencies >= hf_band[0]) & (frequencies < hf_band[1])])
                lf_hf_ratio = (lf_power / hf_power) if hf_power > 0 else 0

        return avg_heart_rate, sdnn, rmssd, bsi, lf_hf_ratio


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
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
        
        if total_seconds < 240:
            return None, total_seconds
        
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
        )
    }

@app.get("/api/generate-lecture")
async def generate_lecture(topic: str):
    YT_API_KEY = os.getenv("YOUTUBE_API_KEY")
    if not YT_API_KEY:
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
                            "key": YT_API_KEY
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


@app.post("/analyze-stress")
async def analyze_stress(data: dict):
    try:
        frames = data.get('frames', [])
        intensity_values = []
        processed_frame_count = 0
        
        for i, frame_data_url in enumerate(frames):
            logger.debug(f"Processing frame {i+1}/{len(frames)}")
            if not isinstance(frame_data_url, str) or ',' not in frame_data_url:
                logger.warning(f"Frame {i+1}: Invalid data URL format. Skipping.")
                continue

            try:
                header, encoded = frame_data_url.split(',', 1)
                image_data = base64.b64decode(encoded)
                image = Image.open(BytesIO(image_data)).convert('RGB')

                try:
                    face_analysis_results = DeepFace.analyze(
                        img_path=np.array(image),
                        actions=['emotion'], # 'region' is implicitly returned with emotion
                        detector_backend='ssd', # Consider 'mtcnn' or 'retinaface' if ssd struggles
                        silent=True,
                        enforce_detection=False # Important: allows processing even if no face, handle below
                    )
                    
                    # DeepFace returns a list, one dict per detected face.
                    # If enforce_detection is False and no face, it might return list with dict containing error or just empty list
                    if not face_analysis_results or not isinstance(face_analysis_results, list) or not face_analysis_results[0].get('region'):
                        logger.warning(f"Frame {i+1}: No face detected or region missing. Skipping. Analysis result: {face_analysis_results}")
                        continue

                    if len(face_analysis_results) > 1:
                        logger.warning(f"Frame {i+1}: Multiple faces ({len(face_analysis_results)}) detected. Using the first one. Skipping.")
                        continue # Or decide to pick the largest, most central, etc. For now, skip.

                    face_analysis = face_analysis_results[0] # Use the first detected face

                    box = face_analysis.get('region')
                    if not box or not all(k in box for k in ['x', 'y', 'w', 'h']):
                        logger.warning(f"Frame {i+1}: Face detected but region data is incomplete. Skipping. Box: {box}")
                        continue
                    
                    x, y, w, h = box['x'], box['y'], box['w'], box['h']
                    logger.info(f"Frame {i+1}: Detected face at x:{x}, y:{y}, w:{w}, h:{h}")

                    if w <= 0 or h <= 0:
                        logger.warning(f"Frame {i+1}: Invalid face region dimensions (w or h is zero or negative). w:{w}, h:{h}. Skipping.")
                        continue

                    # Calculate forehead coordinates
                    roi_y1 = y + (h // 8)
                    roi_y2 = y + (h // 4)
                    roi_x1 = x + (w // 3)
                    roi_x2 = x + w - (w // 3)

                    if not (roi_x1 < roi_x2 and roi_y1 < roi_y2):
                        logger.warning(f"Frame {i+1}: Invalid forehead ROI calculated (e.g., x1>=x2 or y1>=y2). Face box: {box}, Forehead_coords: ({roi_x1},{roi_y1},{roi_x2},{roi_y2}). Skipping.")
                        continue
                    
                    logger.info(f"Frame {i+1}: Calculated forehead ROI x1:{roi_x1}, y1:{roi_y1}, x2:{roi_x2}, y2:{roi_y2}")

                    forehead = image.crop((int(roi_x1), int(roi_y1), int(roi_x2), int(roi_y2)))
                    
                    if forehead.size[0] == 0 or forehead.size[1] == 0:
                        logger.warning(f"Frame {i+1}: Cropped forehead is empty. Original image size: {image.size}, Forehead_crop_box: ({roi_x1},{roi_y1},{roi_x2},{roi_y2}). Skipping.")
                        continue

                    forehead_array = np.array(forehead)
                    if forehead_array.ndim < 3 or forehead_array.shape[2] < 2: # Need at least R, G, B for [..., 1]
                        logger.warning(f"Frame {i+1}: Forehead array has unexpected shape {forehead_array.shape} (ndim < 3 or channels < 2). Skipping.")
                        continue
                    
                    green_channel = forehead_array[..., 1]
                    intensity_values.append(green_channel)
                    processed_frame_count += 1
                    logger.info(f"Frame {i+1}: Added green channel from forehead. Total valid intensity_values: {len(intensity_values)}")

                except ValueError as ve: # Often from DeepFace if no face found and enforce_detection=True (but we use False)
                    logger.warning(f"Frame {i+1}: ValueError during face analysis (likely no face detectable by backend). Error: {ve}. Skipping.")
                    continue
                except Exception as face_error:
                    logger.error(f"Frame {i+1}: Error during face/forehead processing. Error: {face_error}", exc_info=True)
                    continue

            except Exception as frame_error:
                logger.error(f"Frame {i+1}: General error processing frame. Error: {frame_error}", exc_info=True)
                continue
        
        # Increased threshold for more robust analysis, e.g., 3 seconds of data at 10fps = 30 frames
        # The HeartMetricsCalculator also has internal checks.
        MIN_VALID_FRAMES = 30 # Adjustable threshold
        if len(intensity_values) < MIN_VALID_FRAMES:
            logger.error(f"Insufficient valid frames for robust analysis: {len(intensity_values)} collected, need at least {MIN_VALID_FRAMES}.")
            return {"error": f"Insufficient valid frames for analysis ({len(intensity_values)} collected). Please ensure your face and forehead are clearly visible, well-lit, and stable in the camera view."}

        logger.info(f"Proceeding to HeartMetricsCalculator with {len(intensity_values)} valid intensity frames.")
        calculator = HeartMetricsCalculator(fps=10) # Assuming 10 FPS from frontend
        avg_hr, sdnn, rmssd, bsi, lf_hf_ratio = calculator.estimate_heart_rate(intensity_values)
        
        logger.info(f"Analysis results: HR:{avg_hr}, SDNN:{sdnn}, RMSSD:{rmssd}, BSI:{bsi}, LF/HF:{lf_hf_ratio}")

        return {
            "avg_heart_rate": avg_hr if not np.isnan(avg_hr) else 0,
            "sdnn": sdnn if not np.isnan(sdnn) else 0,
            "rmssd": rmssd if not np.isnan(rmssd) else 0,
            "bsi": bsi if not np.isnan(bsi) else 0, # BSI added
            "lf_hf_ratio": lf_hf_ratio if not np.isnan(lf_hf_ratio) else 0
        }

    except Exception as e:
        logger.error(f"Overall stress analysis error: {str(e)}", exc_info=True)
        return {"error": "Failed to process stress analysis due to an unexpected internal server error."}


@app.get("/user/lectures")
async def get_user_lectures(current_user: TokenData = Depends(get_current_user)):
    try:
        user_lectures = list(lectures_collection.find(
            {"user_id": current_user.user_id},
            {"_id": 0, "topic": 1, "created_at": 1, "videos": 1} 
        ).sort("created_at", -1).limit(10))
        
        for lecture in user_lectures:
            if isinstance(lecture.get("created_at"), datetime):
                lecture["created_at"] = lecture["created_at"].isoformat()
        
        return {"lectures": user_lectures}
    except Exception as e:
        logger.error(f"Failed to retrieve lectures for user {current_user.user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not retrieve user lectures.")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))