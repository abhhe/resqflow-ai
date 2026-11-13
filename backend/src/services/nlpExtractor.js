/**
 * Deterministic NLP Emergency Text Extraction Engine
 * Problem Statement: PS10 - ResQFlow AI (Section 11)
 * 
 * Extracts:
 * - Emergency type
 * - Location
 * - Number of affected people (digits and number words)
 * - Required resource capability
 * - Severity indicators & Priority score
 * - Human verification flag
 */

const NUMBER_WORDS_MAP = {
  'twelve': 12,
  'eleven': 11,
  'ten': 10,
  'nine': 9,
  'eight': 8,
  'seven': 7,
  'six': 6,
  'five': 5,
  'four': 4,
  'three': 3,
  'two': 2,
  'one': 1,
  'several': 4,
  'multiple': 3,
  'single': 1
};

const KNOWN_LOCATIONS = [
  'Kukatpally',
  'Miyapur',
  'JNTU',
  'KPHB',
  'Erragadda',
  'Ameerpet',
  'Hitec City',
  'SR Nagar'
];

function extractEmergencyData(text) {
  if (!text || typeof text !== 'string') {
    return {
      type: 'other',
      location: 'Kukatpally',
      people_affected: 1,
      required_capability: 'basic_life_support',
      severity: 'MODERATE',
      priority: 50,
      confidenceScore: 0.3,
      needsHumanVerification: true,
      reasoning: 'Empty or invalid input text.'
    };
  }

  const raw = text.trim();
  const lower = raw.toLowerCase();

  // 1. Extract Location
  let matchedLocation = null;
  for (const loc of KNOWN_LOCATIONS) {
    const locLower = loc.toLowerCase();
    const regex = new RegExp(`\\b${locLower}\\b`, 'i');
    if (regex.test(lower)) {
      matchedLocation = loc;
      break;
    }
  }

  if (!matchedLocation) {
    if (lower.includes('hitec') || lower.includes('cyber towers')) matchedLocation = 'Hitec City';
    else if (lower.includes('kphb')) matchedLocation = 'KPHB';
    else if (lower.includes('jntu')) matchedLocation = 'JNTU';
    else if (lower.includes('sr nagar') || lower.includes('srnagar')) matchedLocation = 'SR Nagar';
    else matchedLocation = 'Kukatpally';
  }

  // 2. Extract Count of Affected People (Digits or words)
  let peopleCount = null;
  let trappedCount = 0;
  
  // Try numerical digits first (e.g. "5 people", "4 injured")
  const digitMatch = lower.match(/\b(\d+)\s*(people|persons|victims|injured|patients|casualties)?\b/i);
  if (digitMatch && digitMatch[1]) {
    peopleCount = parseInt(digitMatch[1], 10);
  } else {
    // Check specific number words with keywords
    for (const [word, val] of Object.entries(NUMBER_WORDS_MAP)) {
      const wordKeywordRegex = new RegExp(`\\b${word}\\s*(people|persons|victims|injured|patients|casualties)?\\b`, 'i');
      if (wordKeywordRegex.test(lower)) {
        peopleCount = val;
        break;
      }
    }
  }

  // Trapped extraction (e.g., "4 people trapped" or "two trapped")
  const trappedDigitMatch = lower.match(/\b(\d+)\s*(?:people|persons)?\s*(?:trapped|stuck|stranded|under rubble)\b/i);
  if (trappedDigitMatch && trappedDigitMatch[1]) {
    trappedCount = parseInt(trappedDigitMatch[1], 10);
  } else {
    for (const [word, val] of Object.entries(NUMBER_WORDS_MAP)) {
      const trapWordRegex = new RegExp(`\\b${word}\\s*(?:people|persons)?\s*(?:trapped|stuck|stranded|under rubble)\\b`, 'i');
      if (trapWordRegex.test(lower)) {
        trappedCount = val;
        break;
      }
    }
  }

  if (peopleCount === null) {
    if (/\b(a|an)\s+(person|victim|patient|individual|casualty|worker|driver)\b/i.test(lower)) {
      peopleCount = 1;
    } else if (/\b(people|victims|injured|trapped)\b/i.test(lower)) {
      peopleCount = 2; // general plural fallback
    } else {
      peopleCount = 1;
    }
  }

  // 3. Extract Emergency Type and Required Capability
  let emergencyType = 'ROAD_ACCIDENT';
  let requiredCapability = 'trauma';
  let severity = 'HIGH';
  let priority = 85;
  let confidenceScore = 0.95;
  const detectedHazards = [];

  if (lower.includes('cardiac') || lower.includes('heart') || lower.includes('chest pain') || lower.includes('stroke') || lower.includes('unconscious')) {
    emergencyType = 'CARDIAC';
    requiredCapability = 'als';
    severity = 'CRITICAL';
    priority = 97;
  } else if (lower.includes('fire') || lower.includes('burn') || lower.includes('smoke') || lower.includes('flames')) {
    emergencyType = 'FIRE';
    requiredCapability = 'trauma';
    severity = 'CRITICAL';
    priority = 95;
    detectedHazards.push('FIRE');
    if (lower.includes('smoke')) detectedHazards.push('SMOKE');
  } else if (lower.includes('flood') || lower.includes('flooding') || lower.includes('water') || lower.includes('submerged') || lower.includes('drowning')) {
    emergencyType = 'FLOOD';
    requiredCapability = 'rescue_boat';
    severity = 'HIGH';
    priority = 88;
    detectedHazards.push('FLOODING');
  } else if (lower.includes('collapse') || lower.includes('rubble') || lower.includes('debris') || lower.includes('building')) {
    emergencyType = 'BUILDING_COLLAPSE';
    requiredCapability = 'trauma';
    severity = 'CRITICAL';
    priority = 94;
    detectedHazards.push('STRUCTURAL_COLLAPSE');
  } else if (lower.includes('chemical') || lower.includes('gas leak') || lower.includes('toxic') || lower.includes('hazmat')) {
    emergencyType = 'HAZMAT';
    requiredCapability = 'als';
    severity = 'CRITICAL';
    priority = 96;
    detectedHazards.push('CHEMICAL_VAPOR');
  } else if (lower.includes('accident') || lower.includes('crash') || lower.includes('collision') || lower.includes('highway') || lower.includes('vehicular')) {
    emergencyType = 'ROAD_ACCIDENT';
    requiredCapability = 'trauma';
    severity = 'HIGH';
    priority = 90;
    if (lower.includes('fuel') || lower.includes('leak')) detectedHazards.push('FUEL_LEAK');
    if (lower.includes('traffic') || lower.includes('jam') || lower.includes('blocking')) detectedHazards.push('ROAD_BLOCKED');
  } else if (lower.includes('trauma') || lower.includes('fall') || lower.includes('fracture') || lower.includes('bleeding')) {
    emergencyType = 'TRAUMA';
    requiredCapability = 'trauma';
    severity = 'HIGH';
    priority = 80;
  } else if (lower.includes('asthma') || lower.includes('breathing') || lower.includes('respiratory')) {
    emergencyType = 'RESPIRATORY';
    requiredCapability = 'als';
    severity = 'HIGH';
    priority = 85;
  } else {
    emergencyType = 'MEDICAL';
    requiredCapability = 'basic_life_support';
    severity = 'MODERATE';
    priority = 70;
    confidenceScore = 0.85;
  }

  const needsHumanVerification = confidenceScore < 0.85 || !matchedLocation;

  const typeMapping = {
    'ROAD_ACCIDENT': 'accident',
    'CARDIAC': 'cardiac',
    'FLOOD': 'flood',
    'FIRE': 'fire',
    'BUILDING_COLLAPSE': 'collapse',
    'HAZMAT': 'hazmat',
    'TRAUMA': 'trauma',
    'RESPIRATORY': 'respiratory',
    'MEDICAL': 'medical'
  };
  const normalizedType = typeMapping[emergencyType] || emergencyType.toLowerCase();

  return {
    type: normalizedType,
    category: emergencyType,
    location: matchedLocation,
    node: matchedLocation,
    people_affected: peopleCount,
    affectedPeople: peopleCount,
    casualties: peopleCount,
    trappedCount: trappedCount,
    hazards: detectedHazards,
    required_capability: requiredCapability,
    severity,
    priority,
    confidenceScore,
    needsHumanVerification,
    rawText: raw,
    reasoning: `Deterministic entity extraction: category='${emergencyType}', location='${matchedLocation}', casualties=${peopleCount}, trapped=${trappedCount}, capability='${requiredCapability}'.`
  };
}

module.exports = {
  extractEmergencyData,
  KNOWN_LOCATIONS,
  NUMBER_WORDS_MAP
};
