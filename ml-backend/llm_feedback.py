import requests
from config import LLM_CONFIG

def generate_feedback(feedback):
    prompt = f"""
    You are a physiotherapy assistant.
    Convert this feedback into a short coaching sentence:
    {feedback}
    """

    headers = {}
    if LLM_CONFIG['api_key']:
        headers["Authorization"] = f"Bearer {LLM_CONFIG['api_key']}"

    # Handle standard OpenAI/Groq format or Ollama format
    if LLM_CONFIG['is_openai_compatible']:
        payload = {
            "model": LLM_CONFIG['model'],
            "messages": [{"role": "user", "content": prompt}],
            "stream": False
        }
    else:
        # Default to Ollama format
        payload = {
            "model": LLM_CONFIG['model'],
            "prompt": prompt,
            "stream": False
        }

    try:
        res = requests.post(
            LLM_CONFIG['api_url'],
            json=payload,
            headers=headers,
            timeout=5
        )
        
        if LLM_CONFIG['is_openai_compatible']:
            return res.json()["choices"][0]["message"]["content"].strip().replace('"', '')
        else:
            return res.json()["response"].strip().replace('"', '')
            
    except Exception:
        if isinstance(feedback, list) and len(feedback) > 0:
            return feedback[0]
        return str(feedback)