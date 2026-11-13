
"""
Deterministic NLP Emergency Text Extraction Engine (Python Service)
PS10 ResQFlow AI - Section 11
"""

import re
from typing import Dict, Any

NUMBER_WORDS_MAP = {
    'twelve': 12, 'eleven': 11, 'ten': 10, 'nine': 9, 'eight': 8,
    'seven': 7, 'six': 6, 'five': 5, 'four': 4, 'three': 3,
    'two': 2, 'one': 1, 'several': 4, 'multiple': 3, 'single': 1
}

KNOWN_LOCATIONS = [
    'Kukatpally', 'Miyapur', 'JNTU', 'KPHB',
    'Erragadda', 'Ameerpet', 'Hitec City', 'SR Nagar'
]

def extract_emergency_data(text: str) -> Dict[str, Any]:
    if not text or not isinstance(text, str):
        return {
            "type": "other",
            "location": "Kukatpally",
            "people_affected": 1,
            "required_capability": "basic_life_support",
            "severity": "MODERATE",
            "priority": 50,
            "confidenceScore": 0.3,
            "needsHumanVerification": True,
            "reasoning": "Empty or invalid input text."
        }

    raw = text.strip()
    lower = raw.lower()

    # 1. Location
    matched_location = None
    for loc in KNOWN_LOCATIONS:
        if re.search(r'\b' + re.escape(loc.lower()) + r'\b', lower):
            matched_location = loc
            break

    if not matched_location:
        if 'hitec' in lower or 'cyber towers' in lower:
            matched_location = 'Hitec City'
        elif 'kphb' in lower:
            matched_location = 'KPHB'
        elif 'jntu' in lower:
            matched_location = 'JNTU'
        elif 'sr nagar' in lower or 'srnagar' in lower:
            matched_location = 'SR Nagar'
        else:
            matched_location = 'Kukatpally'

    # 2. Count of People Affected
    people_count = None
    digit_match = re.search(r'\b(\d+)\s*(people|persons|victims|injured|patients|casualties|trapped)?\b', lower)
    if digit_match and digit_match.group(1):
        people_count = int(digit_match.group(1))
    else:
        for word, val in NUMBER_WORDS_MAP.items():
            if re.search(r'\b' + re.escape(word) + r'\b', lower):
                people_count = val
                break

        if people_count is None:
            if re.search(r'\b(a|an)\s+(person|victim|patient|individual|casualty|worker|driver)\b', lower):
                people_count = 1
            elif re.search(r'\b(people|victims|injured|trapped)\b', lower):
                people_count = 2
            else:
                people_count = 1

    # 3. Emergency Type & Capability
    emergency_type = 'other'
    required_capability = 'basic_life_support'
    severity = 'MODERATE'
    priority = 60
    confidence_score = 0.95

    if any(w in lower for w in ['cardiac', 'heart', 'chest pain', 'stroke', 'unconscious']):
        emergency_type = 'cardiac'
        required_capability = 'als'
        severity = 'CRITICAL'
        priority = 97
    elif any(w in lower for w in ['accident', 'crash', 'collision', 'trauma', 'bleeding']):
        emergency_type = 'accident'
        required_capability = 'trauma'
        severity = 'HIGH'
        priority = 90
    elif any(w in lower for w in ['flood', 'flooding', 'water', 'trapped', 'submerged', 'rescue']):
        emergency_type = 'flood'
        required_capability = 'rescue_boat'
        severity = 'HIGH'
        priority = 85
    elif any(w in lower for w in ['fall', 'fracture', 'head injury']):
        emergency_type = 'trauma'
        required_capability = 'trauma'
        severity = 'HIGH'
        priority = 78
    elif any(w in lower for w in ['fire', 'burn']):
        emergency_type = 'fire'
        required_capability = 'trauma'
        severity = 'CRITICAL'
        priority = 92
    else:
        confidence_score = 0.65

    needs_human = confidence_score < 0.85 or not matched_location

    return {
        "type": emergency_type,
        "location": matched_location,
        "people_affected": people_count,
        "required_capability": required_capability,
        "severity": severity,
        "priority": priority,
        "confidenceScore": confidence_score,
        "needsHumanVerification": needs_human,
        "rawText": raw,
        "reasoning": f"Deterministic entity extraction: detected type='{emergency_type}', location='{matched_location}', victims={people_count}, capability='{required_capability}'."
    }
