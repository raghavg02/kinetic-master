import os
import tensorflow as tf

# In TF 2.16+, keras is the default. We use the one bundled with TF.
try:
    from tensorflow.keras.models import load_model
except ImportError:
    # Fallback for some TF installations where keras is not properly aliased
    import keras
    load_model = keras.models.load_model

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")

models = {}

def load_models():
    if not os.path.exists(MODEL_DIR):
        print(f"Model directory {MODEL_DIR} not found.")
        return

    for file in os.listdir(MODEL_DIR):
        if file.endswith(".keras"):
            name = file.replace("_model.keras", "")
            try:
                models[name] = load_model(os.path.join(MODEL_DIR, file))
            except Exception as e:
                print(f"Failed to load model {file}: {e}")

    print("Loaded models:", list(models.keys()))

load_models()

def get_model(exercise):
    return models.get(exercise)