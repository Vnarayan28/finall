import logging
import wikipedia
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted
from fastapi import APIRouter, HTTPException
from youtube_transcript_api import YouTubeTranscriptApi

from app.core.config import GEMINI_API_KEY

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/generate-answer", summary="Generate answer based on video transcript and Wikipedia")
async def generate_answer_endpoint(videoId: str, topic: str, question: str):
    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(videoId)
        transcript_text = " ".join([t['text'] for t in transcript_list])

        wikipedia_content = ""
        try:
            # It's good practice to set a user-agent for Wikipedia
            # Replace with your actual app info if you have it
            wikipedia.set_user_agent("EduFocusApp/1.0 (youremail@example.com; yourprojectwebsite.com)")
            wikipedia_content = wikipedia.summary(topic, sentences=5, auto_suggest=False)
        except wikipedia.exceptions.PageError:
            logger.info(f"Wikipedia page not found for topic: {topic}")
            wikipedia_content = "No relevant Wikipedia page found for the topic."
        except wikipedia.exceptions.DisambiguationError as e:
            options = e.options[:3] 
            logger.info(f"Wikipedia topic '{topic}' is ambiguous. Options: {options}")
            wikipedia_content = f"The topic '{topic}' is ambiguous. Possible matches: {', '.join(options)}. Please be more specific."
        except wikipedia.exceptions.WikipediaException as e:
            logger.warning(f"Wikipedia lookup error for topic '{topic}': {str(e)}")
            wikipedia_content = "Could not retrieve information from Wikipedia due to an error."
        except Exception as e:
            logger.error(f"Unexpected error during Wikipedia lookup for topic '{topic}': {str(e)}", exc_info=True)
            wikipedia_content = "An unexpected error occurred while fetching Wikipedia content."


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
        except Exception as e:
            logger.error(f"Error during Gemini content generation: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail="Failed to generate answer from AI model.")

    except YouTubeTranscriptApi.CouldNotRetrieveTranscript as e:
        logger.warning(f"Could not retrieve transcript for videoId {videoId}: {str(e)}")
        raise HTTPException(status_code=404, detail=f"Transcript not available for video {videoId}. It might be disabled or the video doesn't exist.")
    except Exception as e:
        logger.error(f"Answer generation failed for videoId {videoId}, topic '{topic}': {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate answer due to an internal error.")