import os
import logging
from fastapi import APIRouter, HTTPException, Body, Depends
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from retell_ai_python_sdk.retell_sdk import RetellSDK
from retell_ai_python_sdk.models import CallResponse 

logger = logging.getLogger(__name__)

if not os.getenv("RETELL_API_KEY"): 
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    dotenv_path = os.path.join(project_root, '.env')
    if os.path.exists(dotenv_path):
        load_dotenv(dotenv_path=dotenv_path)
        logger.info(f".env loaded from: {dotenv_path}")
    else:
        logger.warning(f".env file not found at {dotenv_path}. Retell API key might not be available.")


router = APIRouter()

retell_api_key = os.getenv("RETELL_API_KEY")
if not retell_api_key:
    logger.critical("RETELL_API_KEY not found in environment variables. Retell functionality will fail.")
    retell_sdk_instance = None 
else:
    retell_sdk_instance = RetellSDK(api_key=retell_api_key)
    logger.info("Retell SDK initialized successfully.")


RETELL_AGENT_ID_CONFIG = os.getenv("RETELL_AGENT_ID", "your_default_agent_id_here")
RETELL_FROM_NUMBER_CONFIG = os.getenv("RETELL_FROM_NUMBER", "+916307942349")

class RetellCallRequest(BaseModel):
    text_to_explain: str = Field(..., description="The text content the Retell agent should explain.")
    user_phone_number: str = Field(..., description="The phone number of the user to call.", pattern=r"^\+[1-9]\d{1,14}$") # Basic E.164 validation
    video_id: str | None = None
    topic: str | None = None

class RetellCallResponse(BaseModel):
    message: str
    call_id: str | None = None



async def get_retell_sdk():
    if not retell_sdk_instance:
        raise HTTPException(
            status_code=503, 
            detail="Retell service is not configured or unavailable. Missing API key."
        )
    return retell_sdk_instance


@router.post(
    "/initiate-retell-call",
    response_model=RetellCallResponse,
    summary="Initiates a call via Retell AI to explain a given text.",
    tags=["Retell Call"] 
)
async def initiate_call_endpoint(
    payload: RetellCallRequest = Body(...),
    retell: RetellSDK = Depends(get_retell_sdk)
):
    logger.info(f"Received Retell call request for user: {payload.user_phone_number}, topic: {payload.topic}")

    if RETELL_AGENT_ID_CONFIG == "your_default_agent_id_here":
        logger.error("FATAL: RETELL_AGENT_ID is not configured in environment variables.")
        raise HTTPException(status_code=500, detail="Retell Agent ID not configured on the backend.")

    if RETELL_FROM_NUMBER_CONFIG == "+1XXXXXXXXXX":
        logger.error("FATAL: RETELL_FROM_NUMBER is not configured in environment variables.")
        raise HTTPException(status_code=500, detail="Retell 'from' number not configured on the backend.")

    custom_parameters = {
        "text_to_explain_param": payload.text_to_explain,
        "topic_param": payload.topic,
        "video_id_param": payload.video_id,
    }

    try:
        logger.info(f"Attempting Retell call from {RETELL_FROM_NUMBER_CONFIG} to {payload.user_phone_number} using agent {RETELL_AGENT_ID_CONFIG}")
        
        call_api_response: CallResponse = retell.call.create_phone_call(
            from_number=RETELL_FROM_NUMBER_CONFIG,
            to_number=payload.user_phone_number,
            agent_id=RETELL_AGENT_ID_CONFIG,
            retell_llm_dynamic_variables=custom_parameters
        )
        
        logger.info(f"Retell API call successful: call_id={call_api_response.call_id}, status={call_api_response.status}")
        
        return RetellCallResponse(
            message="Call initiated successfully!",
            call_id=call_api_response.call_id
        )

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Retell API call failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initiate call via Retell: {str(e)}"
        )