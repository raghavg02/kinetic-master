import numpy as np
from model_loader import get_model

SEQUENCE_LENGTH = 30

# In-memory buffer per session to avoid cross-talk
session_buffers = {}

def predict_form(landmarks, exercise, session_id="default"):
    # Ensure landmarks are in the flat array format expected by LSTM
    # (num_landmarks * 4) e.g. 33 * 4 = 132
    flat_landmarks = []
    for lm in landmarks:
        flat_landmarks.extend([lm['x'], lm['y'], lm['z'], lm.get('visibility', 1.0)])
    
    # Use sessionId to manage sequence buffer
    buffer_key = f"{session_id}_{exercise}"
    if buffer_key not in session_buffers:
        session_buffers[buffer_key] = []
    
    seq = session_buffers[buffer_key]
    seq.append(flat_landmarks)
    
    if len(seq) < SEQUENCE_LENGTH:
        return "waiting", 0.0
    
    if len(seq) > SEQUENCE_LENGTH:
        seq.pop(0)
    
    model = get_model(exercise)
    if model is None:
        return "no_model", 0.0
        
    X = np.array(seq)
    X = np.expand_dims(X, axis=0) # Add batch dimension
    
    try:
        pred = model.predict(X, verbose=0)[0][0]
        form = "correct" if pred > 0.5 else "incorrect"
        return form, float(pred)
    except Exception as e:
        print(f"Error during LSTM prediction: {e}")
        return "error", 0.0