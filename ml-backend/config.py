import os
from dotenv import load_dotenv

load_dotenv()

# Exercise Configuration and Model Settings

EXERCISE_CONFIG = {
    'training_epochs': 50,
    'batch_size': 32,
    'learning_rate': 0.001,
    'validation_split': 0.2
}

MODEL_SETTINGS = {
    'model_type': 'neural_network',
    'layers': [
        {'type': 'dense', 'units': 64, 'activation': 'relu'},
        {'type': 'dense', 'units': 32, 'activation': 'relu'},
        {'type': 'output', 'units': 1, 'activation': 'sigmoid'}
    ],
    'optimizer': 'adam'
}

# LLM Configuration for Coaching Feedback
LLM_CONFIG = {
    'api_url': os.getenv('LLM_API_URL', 'http://localhost:11434/api/generate'),
    'api_key': os.getenv('LLM_API_KEY', ''),
    'model': os.getenv('LLM_MODEL', 'llama3'),
    'is_openai_compatible': os.getenv('LLM_IS_OPENAI', 'false').lower() == 'true'
}