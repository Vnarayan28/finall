import logging
import base64
from io import BytesIO
from fastapi import APIRouter, HTTPException
from PIL import Image
import numpy as np
from deepface import DeepFace

from app.services.heart_metrics import HeartMetricsCalculator

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/analyze-stress", summary="Analyze stress from video frames")
async def analyze_stress_endpoint(data: dict): 
    try:
        frames = data.get('frames', [])
        if not frames: # Basic validation
            raise HTTPException(status_code=400, detail="No frames provided for analysis.")
        if not isinstance(frames, list) or not all(isinstance(f, str) for f in frames):
             raise HTTPException(status_code=400, detail="Frames must be a list of strings (data URLs).")


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
                        actions=['emotion'], 
                        detector_backend='ssd', 
                        silent=True,
                        enforce_detection=False
                    )
                    
                    if not face_analysis_results or not isinstance(face_analysis_results, list) or not face_analysis_results[0].get('region'):
                        logger.warning(f"Frame {i+1}: No face detected or region missing. Skipping. Result: {face_analysis_results}")
                        continue

                    if len(face_analysis_results) > 1:
                        logger.warning(f"Frame {i+1}: Multiple faces ({len(face_analysis_results)}) detected. Using the first one.")
                        # For now, process the first one. Consider skipping or specific logic for multiple faces.
                    
                    face_analysis = face_analysis_results[0]

                    box = face_analysis.get('region')
                    if not box or not all(k in box for k in ['x', 'y', 'w', 'h']):
                        logger.warning(f"Frame {i+1}: Face detected but region data is incomplete. Skipping. Box: {box}")
                        continue
                    
                    x, y, w, h = box['x'], box['y'], box['w'], box['h']
                    logger.info(f"Frame {i+1}: Detected face at x:{x}, y:{y}, w:{w}, h:{h}")

                    if w <= 0 or h <= 0:
                        logger.warning(f"Frame {i+1}: Invalid face region dimensions. w:{w}, h:{h}. Skipping.")
                        continue

                    roi_y1 = y + (h // 8)
                    roi_y2 = y + (h // 4)
                    roi_x1 = x + (w // 3)
                    roi_x2 = x + w - (w // 3)

                    if not (roi_x1 < roi_x2 and roi_y1 < roi_y2):
                        logger.warning(f"Frame {i+1}: Invalid forehead ROI. Box: {box}, ROI:({roi_x1},{roi_y1},{roi_x2},{roi_y2}). Skipping.")
                        continue
                    
                    logger.info(f"Frame {i+1}: Forehead ROI x1:{roi_x1}, y1:{roi_y1}, x2:{roi_x2}, y2:{roi_y2}")

                    forehead = image.crop((int(roi_x1), int(roi_y1), int(roi_x2), int(roi_y2)))
                    
                    if forehead.size[0] == 0 or forehead.size[1] == 0:
                        logger.warning(f"Frame {i+1}: Cropped forehead empty. Image: {image.size}, Crop: ({roi_x1},{roi_y1},{roi_x2},{roi_y2}). Skipping.")
                        continue

                    forehead_array = np.array(forehead)
                    if forehead_array.ndim < 3 or forehead_array.shape[2] < 2:
                        logger.warning(f"Frame {i+1}: Forehead array shape {forehead_array.shape} unexpected. Skipping.")
                        continue
                    
                    green_channel_intensity = forehead_array[..., 1]
                    intensity_values.append(green_channel_intensity)
                    processed_frame_count += 1
                    logger.info(f"Frame {i+1}: Added green channel. Total valid intensities: {len(intensity_values)}")

                except ValueError as ve:
                    logger.warning(f"Frame {i+1}: ValueError in face analysis (no face?). Error: {ve}. Skipping.")
                    continue
                except Exception as face_error:
                    logger.error(f"Frame {i+1}: Error in face/forehead processing. Error: {face_error}", exc_info=True)
                    continue

            except Exception as frame_error:
                logger.error(f"Frame {i+1}: General error processing frame. Error: {frame_error}", exc_info=True)
                continue
        
        MIN_VALID_FRAMES = 30 
        if len(intensity_values) < MIN_VALID_FRAMES:
            logger.error(f"Insufficient valid frames for analysis: {len(intensity_values)} collected, need {MIN_VALID_FRAMES}.")
            return {"error": f"Insufficient valid frames ({len(intensity_values)} collected). Ensure clear, stable face view."}

        logger.info(f"Proceeding to HeartMetricsCalculator with {len(intensity_values)} valid intensity frames.")
        calculator = HeartMetricsCalculator(fps=10) # Assuming 10 FPS from frontend
        avg_hr, sdnn, rmssd, bsi, lf_hf_ratio = calculator.estimate_heart_rate(intensity_values)
        
        logger.info(f"Analysis results: HR:{avg_hr}, SDNN:{sdnn}, RMSSD:{rmssd}, BSI:{bsi}, LF/HF:{lf_hf_ratio}")

        return {
            "avg_heart_rate": avg_hr if not np.isnan(avg_hr) else 0,
            "sdnn": sdnn if not np.isnan(sdnn) else 0,
            "rmssd": rmssd if not np.isnan(rmssd) else 0,
            "bsi": bsi if not np.isnan(bsi) else 0,
            "lf_hf_ratio": lf_hf_ratio if not np.isnan(lf_hf_ratio) else 0
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Overall stress analysis error: {str(e)}", exc_info=True)
        return {"error": "Failed to process stress analysis due to an unexpected internal server error."}