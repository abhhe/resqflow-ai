import os
import json
from dotenv import load_dotenv
from app.services.nlp_extractor import extract_emergency_data

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
model = None
if API_KEY and API_KEY != "placeholder_key_change_me_later":
    try:
        import google.generativeai as genai
        genai.configure(api_key=API_KEY)
        model = genai.GenerativeModel('gemini-1.5-pro-latest')
    except Exception as e:
        print(f"Gemini configuration error: {e}")
        model = None

async def analyze_incident(description: str, category: str = "OTHER", image_path: str = None) -> dict:
    """
    Analyzes an incident description and returns structured extraction.
    Falls back deterministically if API key is not configured or fails.
    """
    if not model or not API_KEY or API_KEY == "placeholder_key_change_me_later":
        return simulate_analysis(description, category)

    prompt = f"""
    You are an AI emergency dispatch assistant. Analyze the following incident report:
    Category: {category}
    Description: {description}
    
    Output your response STRICTLY as a JSON object with the following schema:
    {{
        "type": string (e.g. "accident", "cardiac", "flood", "trauma"),
        "location": string,
        "people_affected": integer,
        "required_capability": string (e.g. "trauma", "als", "rescue_boat", "basic_life_support"),
        "severity": string ("CRITICAL", "HIGH", "MODERATE", "LOW"),
        "priority": integer (0-100),
        "confidenceScore": float (0.0-1.0),
        "needsHumanVerification": boolean,
        "reasoning": string
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text.replace('```json', '').replace('```', '').strip()
        parsed = json.loads(text)
        return parsed
    except Exception as e:
        print(f"Gemini API Error, using deterministic fallback: {e}")
        return simulate_analysis(description, category)

def simulate_analysis(description: str, category: str = "OTHER") -> dict:
    """Deterministic, production-ready fallback requiring no external API keys"""
    extracted = extract_emergency_data(description)
    if category and category != "OTHER" and extracted.get("type") == "other":
        extracted["recommendedCategory"] = category
    return extracted

