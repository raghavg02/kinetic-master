from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from enum import Enum

from rehabai_engine import RehabAIEngine

import logging

engine = RehabAIEngine()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="RehabAI Backend",
    version="1.0"
)


# Exercise options
class ExerciseType(str, Enum):

    squat = "squat"
    pushup = "pushup"
    lunge = "lunge"
    plank = "plank"
    knee_extension = "knee_extension"
    shoulder_abduction = "shoulder_abduction"


class PoseLandmark(BaseModel):

    x: float
    y: float
    z: Optional[float] = 0.0
    visibility: Optional[float] = 1.0


# In-memory session storage for production (consider Redis for scale)
session_states = {}

class PoseData(BaseModel):
    landmarks: List[PoseLandmark]
    exercise: ExerciseType
    sessionId: Optional[str] = "default"


@app.post("/predict")
async def predict(data: PoseData):
    try:
        # logger.info(f"Exercise: {data.exercise}, Session: {data.sessionId}")

        landmarks_list = []
        for lm in data.landmarks:
            landmarks_list.append({
                "x": lm.x,
                "y": lm.y,
                "z": lm.z,
                "visibility": lm.visibility
            })

        # Get or initialize session state
        state = session_states.get(data.sessionId)

        result = engine.process_frame(
            landmarks_list,
            data.exercise,
            state,
            data.sessionId # Pass session_id to engine
        )

        # Update session state with the new state returned by the engine
        if data.sessionId:
            session_states[data.sessionId] = result.get("session_state")

        return result

    except Exception as e:
        logger.error(f"Error in predict: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


from video_processor import download_video, process_video_file
import os
import tempfile
from fastapi import BackgroundTasks

@app.post("/process-video")
async def process_video(
    video_url: str, 
    exercise: ExerciseType, 
    sessionId: str,
    callback_url: Optional[str] = None
):
    try:
        logger.info(f"Received video processing request for session: {sessionId}")
        
        # In a real production app, we would use BackgroundTasks
        # but for simplicity and immediate response, we'll process and return
        # or we could implement a webhook callback.
        
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tf:
            temp_path = tf.name
            
        try:
            if not download_video(video_url, temp_path):
                raise Exception("Failed to download video from URL")
                
            results = process_video_file(temp_path, exercise, engine, sessionId)
            
            if "error" in results:
                raise Exception(results["error"])
                
            # If a callback URL is provided, we could notify the main backend
            # For now, we return the results directly to the caller (main backend)
            return {
                "success": True,
                "sessionId": sessionId,
                "results": results
            }
            
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    except Exception as e:
        logger.error(f"Error in process_video: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.get("/supported-exercises")
async def supported_exercises():

    return {
        "exercises": [
            "squat",
            "pushup",
            "lunge",
            "plank",
            "knee_extension",
            "shoulder_abduction"
        ]
    }