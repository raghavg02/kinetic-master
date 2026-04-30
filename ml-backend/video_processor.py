import cv2
import mediapipe as mp
import numpy as np
import os
import requests
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

# Initialize MediaPipe Pose
try:
    import mediapipe as mp
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        enable_segmentation=False,
        min_detection_confidence=0.5
    )
except AttributeError as e:
    logger.error(f"MediaPipe initialization failed: {e}")
    # Fallback or dummy object to prevent startup crash
    class DummyPose:
        def process(self, *args, **kwargs):
            class DummyResults:
                pose_landmarks = None
            return DummyResults()
    pose = DummyPose()
    mp_pose = None
    logger.warning("Using DummyPose due to MediaPipe error. Video processing will not work.")

def download_video(url: str, save_path: str):
    response = requests.get(url, stream=True)
    if response.status_code == 200:
        with open(save_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=1024*1024):
                if chunk:
                    f.write(chunk)
        return True
    return False

def process_video_file(video_path: str, exercise: str, engine: Any, session_id: str) -> Dict[str, Any]:
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        logger.error(f"Could not open video file: {video_path}")
        return {"error": "Could not open video file"}

    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    logger.info(f"Processing video: {video_path}, Frames: {frame_count}, FPS: {fps}")

    session_state = None
    all_accuracies = []
    total_reps = 0
    feedback_summary = []
    
    # Process every Nth frame to speed up analysis if needed (e.g., skip 2 frames)
    skip_frames = 1 
    current_frame = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        if current_frame % skip_frames == 0:
            # Convert to RGB for MediaPipe
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(rgb_frame)

            if results.pose_landmarks:
                # Transform landmarks to the format expected by the engine
                landmarks = []
                for lm in results.pose_landmarks.landmark:
                    landmarks.append({
                        "x": lm.x,
                        "y": lm.y,
                        "z": lm.z,
                        "visibility": lm.visibility
                    })

                # Process frame through engine
                result = engine.process_frame(
                    landmarks,
                    exercise,
                    session_state,
                    session_id
                )
                
                session_state = result.get("session_state")
                all_accuracies.append(result.get("accuracy", 0))
                total_reps = result.get("repCount", 0)
                
                # Collect feedback that isn't just "Keep going"
                frame_feedback = result.get("feedback", [])
                for f in frame_feedback:
                    if "Great" not in f and "Keep going" not in f and f not in feedback_summary:
                        feedback_summary.append(f)

        current_frame += 1

    cap.release()

    # Calculate final stats
    avg_accuracy = sum(all_accuracies) / len(all_accuracies) if all_accuracies else 0
    
    return {
        "success": True,
        "totalReps": total_reps,
        "averageScore": int(avg_accuracy),
        "feedback": feedback_summary[:5], # Return top 5 unique feedback items
        "duration": int(frame_count / fps) if fps > 0 else 0
    }
