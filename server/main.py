import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import PORT
from app.api import auth, lectures, qa, stress

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="EduFocus API",
    description="API for EduFocus application, providing lecture generation, Q&A, and stress analysis.",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True, # Not strictly needed if no cookies are used for auth
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include API routers
app.include_router(auth.router, tags=["Authentication"])
app.include_router(lectures.router, tags=["Lectures"])
app.include_router(qa.router, tags=["Q&A"])
app.include_router(stress.router, tags=["Stress Analysis"])

@app.get("/", summary="Root endpoint", tags=["General"])
async def root():
    return {"message": "Welcome to the EduFocus API!"}

if __name__ == "__main__":
    logger.info(f"Starting Uvicorn server on port {PORT}")
    # Ensure you run this from the project root (your_project_root/) using:
    # python -m app.main
    # Or, if app/main.py is run directly:
    uvicorn.run("app.main:app", host="0.0.0.0", port=PORT, reload=True)