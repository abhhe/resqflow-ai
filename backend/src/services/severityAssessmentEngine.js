/**
 * Intelligent Emergency Severity Assessment Engine
 * Problem Statement: PS10 - ResQFlow AI (Feature 1)
 * 
 * Multi-factor explainable severity scoring and entity extraction.
 * Evaluates threat to life, casualty volume, physiological distress,
 * scene hazards, and information uncertainty.
 * 
 * DISCLAIMER: This is a hackathon operational simulation tool for emergency
 * resource prioritization and does NOT constitute a certified medical diagnosis.
 */

const NUMBER_WORDS_MAP = {
  'twelve': 12, 'eleven': 11, 'ten': 10, 'nine': 9, 'eight': 8,
  'seven': 7, 'six': 6, 'five': 5, 'four': 4, 'three': 3,
  'two': 2, 'one': 1, 'several': 4, 'multiple': 3, 'single': 1
};

const KNOWN_LOCATIONS = [
  'Kukatpally', 'Miyapur', 'JNTU', 'KPHB',
  'Erragadda', 'Ameerpet', 'Hitec City', 'SR Nagar'
];

class SeverityAssessmentEngine {
  /**
   * Parse structured entities from unstructured emergency text
   */
  extractEntities(text) {
    if (!text || typeof text !== 'string') {
      return {
        category: 'OTHER',
        location: 'Kukatpally',
        casualties: 1,
        criticalPatients: 0,
        consciousness: 'UNKNOWN',
        breathing: 'UNKNOWN',
        hazards: [],
        specialRequirements: ['basic_life_support'],
        isInformationComplete: false,
        rawText: ''
      };
    }

    const raw = text.trim();
    const lower = raw.toLowerCase();

    // 1. Location Detection
    let location = null;
    let hasExplicitLocation = false;
    for (const loc of KNOWN_LOCATIONS) {
      const regex = new RegExp(`\\b${loc.toLowerCase()}\\b`, 'i');
      if (regex.test(lower)) {
        location = loc;
        hasExplicitLocation = true;
        break;
      }
    }
    if (!location) {
      if (lower.includes('hitec') || lower.includes('cyber towers')) { location = 'Hitec City'; hasExplicitLocation = true; }
      else if (lower.includes('kphb')) { location = 'KPHB'; hasExplicitLocation = true; }
      else if (lower.includes('jntu')) { location = 'JNTU'; hasExplicitLocation = true; }
      else if (lower.includes('sr nagar') || lower.includes('srnagar')) { location = 'SR Nagar'; hasExplicitLocation = true; }
      else {
        location = 'Kukatpally'; // default fallback with flag
        hasExplicitLocation = false;
      }
    }

    // 2. Casualties Extraction (Digits or Number words)
    let casualties = null;
    let hasExplicitCasualties = false;
    const digitMatch = lower.match(/\b(\d+)\s*(people|persons|victims|injured|patients|casualties|trapped)?\b/i);
    if (digitMatch && digitMatch[1]) {
      casualties = parseInt(digitMatch[1], 10);
      hasExplicitCasualties = true;
    } else {
      for (const [word, val] of Object.entries(NUMBER_WORDS_MAP)) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(lower)) {
          casualties = val;
          hasExplicitCasualties = true;
          break;
        }
      }
      if (casualties === null) {
        if (/\b(a|an)\s+(person|victim|patient|individual|casualty|worker|driver)\b/i.test(lower)) {
          casualties = 1;
          hasExplicitCasualties = true;
        } else if (/\b(people|victims|injured|trapped)\b/i.test(lower)) {
          casualties = 2; // conservative plural
          hasExplicitCasualties = true;
        } else {
          casualties = 1;
          hasExplicitCasualties = false;
        }
      }
    }

    // 3. Critical Patients Detection
    let criticalPatients = 0;
    const critMatch = lower.match(/\b(\d+)\s*(critical|unconscious|severe|in icu)\b/i);
    if (critMatch && critMatch[1]) {
      criticalPatients = parseInt(critMatch[1], 10);
    } else if (lower.includes('critical') || lower.includes('unconscious') || lower.includes('unresponsive')) {
      criticalPatients = Math.min(casualties, 1);
    }

    // 4. Physiological Status
    let consciousness = 'CONSCIOUS';
    if (lower.includes('unconscious') || lower.includes('unresponsive') || lower.includes('passed out') || lower.includes('collapsed')) {
      consciousness = 'UNCONSCIOUS';
    } else if (lower.includes('semi-conscious') || lower.includes('dazed') || lower.includes('disoriented')) {
      consciousness = 'ALTERED';
    }

    let breathing = 'NORMAL';
    if (lower.includes('not breathing') || lower.includes('stopped breathing') || lower.includes('no pulse')) {
      breathing = 'NOT_BREATHING';
    } else if (lower.includes('difficulty breathing') || lower.includes('shortness of breath') || lower.includes('gasping') || lower.includes('choking')) {
      breathing = 'DIFFICULTY_BREATHING';
    }

    // 5. Environmental & Scene Hazards
    const hazards = [];
    if (lower.includes('flood') || lower.includes('flooding') || lower.includes('submerged') || lower.includes('water trapped')) {
      hazards.push('URBAN_FLOODING');
    }
    if (lower.includes('fire') || lower.includes('smoke') || lower.includes('flames')) {
      hazards.push('STRUCTURAL_FIRE');
    }
    if (lower.includes('collapse') || lower.includes('debris') || lower.includes('rubble')) {
      hazards.push('STRUCTURAL_COLLAPSE');
    }
    if (lower.includes('chemical') || lower.includes('gas leak') || lower.includes('toxic')) {
      hazards.push('HAZMAT');
    }
    if (lower.includes('heavy rain') || lower.includes('rain') || lower.includes('waterlogged')) {
      hazards.push('SEVERE_WEATHER');
    }

    // 6. Emergency Category & Special Requirements
    let category = 'GENERAL_EMERGENCY';
    const specialRequirements = [];

    if (lower.includes('cardiac') || lower.includes('heart') || lower.includes('chest pain') || lower.includes('stroke') || breathing === 'NOT_BREATHING') {
      category = 'CARDIAC';
      specialRequirements.push('als', 'defibrillator', 'cardiac_icu');
    } else if (lower.includes('accident') || lower.includes('crash') || lower.includes('collision') || lower.includes('trauma') || lower.includes('bleeding') || lower.includes('fracture')) {
      category = 'ROAD_ACCIDENT';
      specialRequirements.push('trauma', 'bleeding_control', 'trauma_center');
    } else if (hazards.includes('URBAN_FLOODING') || lower.includes('flood') || lower.includes('drowning')) {
      category = 'FLOOD';
      specialRequirements.push('rescue_boat', 'rescue_team', 'hypothermia_care');
    } else if (lower.includes('fall') || lower.includes('head injury')) {
      category = 'TRAUMA';
      specialRequirements.push('trauma', 'spine_board');
    } else if (hazards.includes('STRUCTURAL_FIRE') || lower.includes('burn') || lower.includes('fire') || lower.includes('flames')) {
      category = 'FIRE';
      specialRequirements.push('rescue_team', 'fire_rescue', 'burn_care', 'trauma');
    } else if (breathing === 'DIFFICULTY_BREATHING' || lower.includes('asthma') || lower.includes('respiratory')) {
      category = 'RESPIRATORY';
      specialRequirements.push('als', 'ventilator', 'oxygen');
    }

    // Completeness check
    const isInformationComplete = (
      hasExplicitLocation &&
      hasExplicitCasualties &&
      raw.length > 20 &&
      category !== 'OTHER' &&
      category !== 'GENERAL_EMERGENCY' &&
      !lower.includes('somewhere') &&
      !lower.includes('unwell') &&
      !lower.includes('unknown')
    );

    return {
      category,
      location,
      casualties: Math.max(1, casualties || 1),
      criticalPatients,
      consciousness,
      breathing,
      hazards,
      specialRequirements,
      isInformationComplete,
      rawText: raw
    };
  }

  /**
   * Multi-factor clinical triage assessment algorithm
   */
  assessSeverity(incidentOrText) {
    let entities;
    if (typeof incidentOrText === 'string') {
      entities = this.extractEntities(incidentOrText);
    } else if (incidentOrText && typeof incidentOrText === 'object') {
      const fullText = [
        incidentOrText.description, 
        incidentOrText.symptoms, 
        incidentOrText.rawText, 
        incidentOrText.category
      ].filter(Boolean).join('. ');
      
      entities = incidentOrText.entities || this.extractEntities(fullText);
      
      if (incidentOrText.category) {
        entities.category = incidentOrText.category;
      }
      if (incidentOrText.consciousness) {
        entities.consciousness = incidentOrText.consciousness;
      }
      if (incidentOrText.breathing) {
        entities.breathing = incidentOrText.breathing;
      }
      if (incidentOrText.criticalPatients !== undefined) {
        entities.criticalPatients = incidentOrText.criticalPatients;
      }
      if (incidentOrText.affectedPeople || incidentOrText.people_affected || incidentOrText.casualties) {
        entities.casualties = incidentOrText.affectedPeople || incidentOrText.people_affected || incidentOrText.casualties;
      }
      if (incidentOrText.hazards) {
        entities.hazards = incidentOrText.hazards;
      }
      if (incidentOrText.node || incidentOrText.locationName) {
        entities.location = incidentOrText.node || incidentOrText.locationName;
      }
      if (incidentOrText.category === 'UNKNOWN') {
        entities.isInformationComplete = false;
      }

      // Check symptoms string if provided
      if (incidentOrText.symptoms) {
        const sym = incidentOrText.symptoms.toLowerCase();
        if (sym.includes('unconscious') || sym.includes('unresponsive') || sym.includes('collapsed')) {
          entities.consciousness = 'UNCONSCIOUS';
        }
        if (sym.includes('not breathing') || sym.includes('no pulse') || sym.includes('arrest')) {
          entities.breathing = 'NOT_BREATHING';
        } else if (sym.includes('gasping') || sym.includes('difficulty') || sym.includes('shortness of breath')) {
          entities.breathing = 'DIFFICULTY_BREATHING';
        }
      }

      // Ensure capability alignments based on category
      if (entities.category === 'CARDIAC') {
        if (!entities.specialRequirements.includes('als')) {
          entities.specialRequirements.unshift('als');
        }
        if (!entities.specialRequirements.includes('cardiac_icu')) {
          entities.specialRequirements.push('cardiac_icu');
        }
        if (!entities.criticalPatients) {
          entities.criticalPatients = 1;
        }
      } else if (entities.category === 'ROAD_ACCIDENT' || entities.category === 'TRAUMA') {
        if (!entities.specialRequirements.includes('trauma')) {
          entities.specialRequirements.unshift('trauma');
        }
      } else if (entities.category === 'FIRE' || entities.category === 'BUILDING_COLLAPSE') {
        if (!entities.specialRequirements.includes('rescue_team')) {
          entities.specialRequirements.unshift('rescue_team');
        }
        if (!entities.specialRequirements.includes('fire_rescue')) {
          entities.specialRequirements.push('fire_rescue');
        }
      } else if (entities.category === 'FLOOD') {
        if (!entities.specialRequirements.includes('rescue_boat')) {
          entities.specialRequirements.unshift('rescue_boat');
        }
      } else if (entities.category === 'RESPIRATORY') {
        if (!entities.specialRequirements.includes('als')) {
          entities.specialRequirements.unshift('als');
        }
      }
    } else {
      entities = this.extractEntities('');
    }

    const scoringBreakdown = {
      baseThreatScore: 0,
      casualtyScore: 0,
      physiologicalScore: 0,
      hazardScore: 0,
      completenessPenalty: 0
    };
    const extractedEvidence = [];

    // Factor 1: Immediate Threat to Life (0 - 40 pts)
    switch (entities.category) {
      case 'CARDIAC':
        scoringBreakdown.baseThreatScore = 38;
        extractedEvidence.push('Critical cardiac/cardiovascular event detected (+38 pts)');
        break;
      case 'ROAD_ACCIDENT':
        scoringBreakdown.baseThreatScore = 30;
        extractedEvidence.push('High-kinetic trauma/accident impact (+30 pts)');
        break;
      case 'FLOOD':
        scoringBreakdown.baseThreatScore = 28;
        extractedEvidence.push('Environmental water hazard with trapped victims (+28 pts)');
        break;
      case 'FIRE':
        scoringBreakdown.baseThreatScore = 34;
        extractedEvidence.push('Active fire hazard / thermal injury (+34 pts)');
        break;
      case 'TRAUMA':
        scoringBreakdown.baseThreatScore = 26;
        extractedEvidence.push('Severe trauma injury reported (+26 pts)');
        break;
      case 'RESPIRATORY':
        scoringBreakdown.baseThreatScore = 32;
        extractedEvidence.push('Respiratory distress / compromised airway (+32 pts)');
        break;
      default:
        scoringBreakdown.baseThreatScore = 15;
        extractedEvidence.push('Standard non-specific emergency (+15 pts)');
    }

    // Factor 2: Casualty Volume & Critical Ratio (0 - 20 pts)
    const victimPts = Math.min(10, (entities.casualties || 1) * 2);
    const critPts = Math.min(10, ((entities.criticalPatients !== undefined ? entities.criticalPatients : (entities.category === 'CARDIAC' ? 1 : 0))) * 10);
    scoringBreakdown.casualtyScore = victimPts + critPts;
    extractedEvidence.push(`${entities.casualties} casualties (${entities.criticalPatients || 0} critical) (+${victimPts + critPts} pts)`);

    // Factor 3: Physiological Distress (0 - 20 pts)
    if (entities.breathing === 'NOT_BREATHING' || entities.breathing === 'APNEIC') {
      scoringBreakdown.physiologicalScore += 12;
      extractedEvidence.push('Apnea / absent respiration (+12 pts)');
    } else if (entities.breathing === 'DIFFICULTY_BREATHING') {
      scoringBreakdown.physiologicalScore += 8;
      extractedEvidence.push('Compromised breathing effort (+8 pts)');
    }

    if (entities.consciousness === 'UNCONSCIOUS' || entities.consciousness === 'UNRESPONSIVE') {
      scoringBreakdown.physiologicalScore += 8;
      extractedEvidence.push('Unconscious / unresponsive state (+8 pts)');
    } else if (entities.consciousness === 'ALTERED') {
      scoringBreakdown.physiologicalScore += 4;
      extractedEvidence.push('Altered mental status (+4 pts)');
    }

    // Factor 4: Scene & Environmental Hazards (0 - 15 pts)
    if (entities.hazards.includes('URBAN_FLOODING')) {
      scoringBreakdown.hazardScore += 10;
      extractedEvidence.push('Rapid urban flooding / submersion risk (+10 pts)');
    }
    if (entities.hazards.includes('STRUCTURAL_FIRE') || entities.hazards.includes('STRUCTURAL_COLLAPSE') || entities.hazards.includes('FUEL_LEAK')) {
      scoringBreakdown.hazardScore += 10;
      extractedEvidence.push('Structural/fuel entrapment hazard (+10 pts)');
    }
    if (entities.hazards.includes('SEVERE_WEATHER')) {
      scoringBreakdown.hazardScore += 5;
      extractedEvidence.push('Adverse weather condition (+5 pts)');
    }
    scoringBreakdown.hazardScore = Math.min(15, scoringBreakdown.hazardScore);

    // Factor 5: Information Completeness & Uncertainty Check
    let confidenceScore = 0.95;
    let needsHumanReview = false;

    if (!entities.isInformationComplete) {
      confidenceScore = 0.60;
      needsHumanReview = true;
      extractedEvidence.push('Information incomplete or unconfirmed: flagged for human verification');
    }

    // Baseline clinical priority constant
    const baseConstant = entities.category === 'OTHER' || entities.category === 'UNKNOWN' ? 10 : 25;

    // Calculate Raw Priority (0 - 100)
    const rawScore = (
      baseConstant +
      scoringBreakdown.baseThreatScore +
      scoringBreakdown.casualtyScore +
      scoringBreakdown.physiologicalScore +
      scoringBreakdown.hazardScore
    );
    const priorityScore = Math.min(100, Math.max(15, rawScore));

    // Determine Category
    let severityCategory = 'LOW';
    if (priorityScore >= 85) severityCategory = 'CRITICAL';
    else if (priorityScore >= 65) severityCategory = 'HIGH';
    else if (priorityScore >= 40) severityCategory = 'MEDIUM';

    // Construct Clinical Justification
    const reason = `Assessed as ${severityCategory} priority (${priorityScore}/100) based on base threat (${scoringBreakdown.baseThreatScore} pts), ${entities.casualties} casualties (${scoringBreakdown.casualtyScore} pts), physiological signs (${scoringBreakdown.physiologicalScore} pts), and hazards (${scoringBreakdown.hazardScore} pts).`;

    return {
      severityCategory,
      priorityScore,
      confidenceScore,
      needsHumanReview,
      entities,
      scoringBreakdown,
      extractedEvidence,
      reason,
      recommendedCapability: entities.specialRequirements[0] || 'basic_life_support',
      safetyDisclaimer: 'SIMULATED HACKATHON TRIAGE SCORER - NOT CLINICAL DIAGNOSIS'
    };
  }
}

const severityAssessmentEngine = new SeverityAssessmentEngine();

module.exports = {
  SeverityAssessmentEngine,
  severityAssessmentEngine,
  assessSeverity: (payload) => severityAssessmentEngine.assessSeverity(payload)
};
