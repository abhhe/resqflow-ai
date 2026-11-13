/**
 * Category-Based Multi-Agency Emergency Response Planner
 * Problem Statement: PS10 - ResQFlow AI (Part 1 & Part 2)
 * 
 * Formulates a unified multi-agency response plan evaluating all required emergency agencies:
 * - Fire Brigade (Fire engines, water tenders, firefighters)
 * - Search & Rescue (USAR, extrication squads, rescue boats)
 * - Emergency Medical Services (ALS, BLS, Trauma ambulances, paramedics)
 * - Law Enforcement (Perimeter security, crowd control, public safety)
 * - Traffic Police (Road clearance, green corridor, congestion diversions)
 * - Specialized Units (HazMat, chemical containment, structural safety engineers)
 * - Receiving Hospital Facilities (Cardiology, Trauma Center, Burn Unit, HazMat Decon, ICU)
 */

const NUMBER_WORDS_MAP = {
  'twelve': 12, 'eleven': 11, 'ten': 10, 'nine': 9, 'eight': 8,
  'seven': 7, 'six': 6, 'five': 5, 'four': 4, 'three': 3,
  'two': 2, 'one': 1, 'several': 4, 'multiple': 3, 'single': 1
};

class EmergencyResponsePlanner {
  constructor() {
    this.customCategoryRules = new Map();
  }

  /**
   * Extensible Architecture: Register custom category rules at runtime
   */
  registerCategoryRule(category, plannerFn) {
    this.customCategoryRules.set(category.toUpperCase(), plannerFn);
  }

  /**
   * Part 1: Deep Incident Understanding & Structured Information Extraction
   */
  extractIncidentFacts(incidentData) {
    if (typeof incidentData === 'string') {
      incidentData = { description: incidentData, rawText: incidentData };
    } else if (!incidentData) {
      incidentData = {};
    }

    const rawText = [
      incidentData.description,
      incidentData.symptoms,
      incidentData.hazards?.join ? incidentData.hazards.join(' ') : incidentData.hazards,
      incidentData.rawText
    ].filter(Boolean).join('. ');

    const lower = rawText.toLowerCase();

    // Infer category from text if not explicitly provided
    let category = incidentData.category || null;
    if (!category) {
      if (lower.includes('fire') || lower.includes('smoke') || lower.includes('flames') || lower.includes('burn')) category = 'FIRE';
      else if (lower.includes('crash') || lower.includes('collision') || lower.includes('accident') || lower.includes('car') || lower.includes('bus') || lower.includes('highway')) category = 'ROAD_ACCIDENT';
      else if (lower.includes('flood') || lower.includes('submerged') || lower.includes('drowning') || lower.includes('waterlog')) category = 'FLOOD';
      else if (lower.includes('collapse') || lower.includes('rubble') || lower.includes('debris')) category = 'BUILDING_COLLAPSE';
      else if (lower.includes('gas leak') || lower.includes('chemical') || lower.includes('hazmat') || lower.includes('toxic')) category = 'HAZMAT';
      else if (lower.includes('cardiac') || lower.includes('heart attack') || lower.includes('chest pain')) category = 'CARDIAC';
      else category = 'MEDICAL';
    }

    // 1. Confirmed vs Inferred People Counts
    let affectedCount = incidentData.affectedPeople || incidentData.people_affected || incidentData.casualties || null;
    let injuredCount = incidentData.injuredCount || null;
    let trappedCount = incidentData.trappedCount || null;

    // Helper to parse count from digits or words
    const parseCount = (txt, keywordsPattern, requireKeywords = false) => {
      const dMatch = txt.match(new RegExp(`\\b(\\d+)\\s*(?:${keywordsPattern})\\b`, 'i'));
      if (dMatch) return parseInt(dMatch[1], 10);

      for (const [word, val] of Object.entries(NUMBER_WORDS_MAP)) {
        if (new RegExp(`\\b${word}\\s*(?:${keywordsPattern})\\b`, 'i').test(txt)) {
          return val;
        }
      }

      if (!requireKeywords) {
        for (const [word, val] of Object.entries(NUMBER_WORDS_MAP)) {
          if (new RegExp(`\\b${word}\\b`, 'i').test(txt)) {
            return val;
          }
        }
        const standaloneDigit = txt.match(/\b(\d+)\b/);
        if (standaloneDigit && parseInt(standaloneDigit[1], 10) > 0 && parseInt(standaloneDigit[1], 10) <= 50) {
          return parseInt(standaloneDigit[1], 10);
        }
      }

      return null;
    };

    if (!affectedCount) {
      affectedCount = parseCount(lower, 'people|persons|victims|casualties|inside|occupants|injured|patients', false);
      if (!affectedCount) {
        if (lower.includes('a person') || lower.includes('one person') || lower.includes('patient')) affectedCount = 1;
        else affectedCount = 1;
      }
    }

    if (!injuredCount) {
      injuredCount = parseCount(lower, 'injured|hurt|bleeding|burned|casualties|patients', true);
      if (!injuredCount) {
        if (lower.includes('injured') || lower.includes('hurt') || lower.includes('bleeding')) injuredCount = affectedCount;
        else if (['CARDIAC', 'RESPIRATORY', 'ROAD_ACCIDENT', 'TRAUMA'].includes(category)) injuredCount = affectedCount;
        else injuredCount = 0;
      }
    }

    if (!trappedCount) {
      if (lower.includes('trapped') || lower.includes('stuck') || lower.includes('stranded') || lower.includes('under rubble')) {
        trappedCount = parseCount(lower, '(?:people|persons|workers)?\\s*(?:trapped|stuck|stranded|under rubble)', true);
        if (!trappedCount) {
          trappedCount = Math.max(1, affectedCount - injuredCount);
        }
      } else {
        trappedCount = 0;
      }
    }

    // 2. Scene Hazards
    const fireReported = category === 'FIRE' || lower.includes('fire') || lower.includes('smoke') || lower.includes('flames');
    const trappedReported = trappedCount > 0 || lower.includes('trapped') || lower.includes('extricat') || lower.includes('debris');
    const floodReported = category === 'FLOOD' || lower.includes('flood') || lower.includes('water') || lower.includes('submerged');
    const collapseReported = category === 'BUILDING_COLLAPSE' || lower.includes('collapse') || lower.includes('rubble');
    const hazmatReported = category === 'CHEMICAL_LEAK' || category === 'HAZMAT' || lower.includes('gas leak') || lower.includes('chemical') || lower.includes('toxic');
    const roadBlocked = lower.includes('blocked') || lower.includes('blocking') || lower.includes('congestion') || lower.includes('traffic jam') || lower.includes('vehicles blocking');

    // 3. Information Confidence & Audit
    const confirmed = {};
    const inferred = {};
    const unknown = [];

    if (incidentData.category) confirmed.category = incidentData.category;
    else inferred.category = category;

    if (incidentData.affectedPeople) confirmed.affectedPeople = incidentData.affectedPeople;
    else inferred.affectedPeople = affectedCount;

    if (incidentData.injuredCount !== undefined) confirmed.injuredCount = incidentData.injuredCount;
    else inferred.injuredCount = injuredCount;

    if (incidentData.trappedCount !== undefined) confirmed.trappedCount = incidentData.trappedCount;
    else inferred.trappedCount = trappedCount;

    if (fireReported) confirmed.fire = true;
    if (trappedReported) confirmed.trapped = trappedCount;
    if (injuredCount > 0) confirmed.casualties = injuredCount;
    else if (affectedCount > 0) confirmed.casualties = affectedCount;
    confirmed.affectedPeople = affectedCount;
    inferred.affectedPeople = affectedCount;
    inferred.casualties = injuredCount || affectedCount;
    if (roadBlocked) confirmed.roadBlock = true;
    if (hazmatReported) confirmed.chemicalHazard = true;

    if (!incidentData.symptoms && injuredCount > 0) unknown.push('Specific physiological vital signs not recorded');
    if (hazmatReported && !lower.includes('un number') && !lower.includes('chemical name')) unknown.push('Exact chemical agent identity pending hazmat confirmation');

    const needsHumanReview = unknown.length > 0 || (affectedCount > 5 && injuredCount === 0);

    return {
      category,
      affectedCount,
      injuredCount,
      trappedCount,
      fireReported,
      trappedReported,
      floodReported,
      collapseReported,
      hazmatReported,
      roadBlocked,
      confirmed,
      inferred,
      unknown,
      needsHumanReview,
      rawText
    };
  }

  /**
   * Part 2: Formulates Comprehensive Multi-Agency Response Plan
   */
  planMultiAgencyResponse(incidentData) {
    const facts = this.extractIncidentFacts(incidentData);
    const category = facts.category.toUpperCase();

    // Check custom extensible category registry first
    if (this.customCategoryRules.has(category)) {
      return this.customCategoryRules.get(category)(facts, incidentData);
    }

    const agencyPlans = {};
    const requiredAgencies = [];
    const reasons = [];
    let priorityScore = 75;

    // A. FIRE ACCIDENT
    if (category === 'FIRE' || facts.fireReported) {
      priorityScore = Math.max(priorityScore, 92);

      // Agency 1: Fire Services
      requiredAgencies.push('FIRE');
      agencyPlans.FIRE = {
        required: true,
        agencyName: 'Telangana State Disaster Response & Fire Services',
        priority: 1,
        resourceTypes: ['FIRE_ENGINE', 'WATER_TENDER'],
        requiredCapabilities: ['fire_suppression', 'water_tender'],
        role: 'Primary Fire Suppression, Thermal Containment & Extrication',
        reason: 'Active fire reported with smoke hazard. Rapid suppression required to prevent structural breach.'
      };
      reasons.push('FIRE BRIGADE: Dispatched for active fire suppression and boundary cooling.');

      // Agency 2: Search & Rescue (if trapped or large occupancy)
      if (facts.trappedReported || facts.affectedCount > 3) {
        requiredAgencies.push('RESCUE');
        agencyPlans.RESCUE = {
          required: true,
          agencyName: 'Urban Search & Rescue (USAR)',
          priority: 1,
          resourceTypes: ['RESCUE_TEAM'],
          requiredCapabilities: ['search_and_rescue', 'extrication'],
          role: 'Victim Search, Snorkel Ladder Rescue & Breathing Apparatus Entry',
          reason: `${facts.trappedCount || facts.affectedCount} occupants reported trapped/inside burning structure.`
        };
        reasons.push(`SEARCH & RESCUE: Dispatched because ${facts.trappedCount || facts.affectedCount} occupants are at risk inside.`);
      }

      // Agency 3: Emergency Medical Services (Ambulance) if injured or medical danger
      if (facts.injuredCount > 0 || facts.affectedCount > 0) {
        requiredAgencies.push('AMBULANCE');
        agencyPlans.AMBULANCE = {
          required: true,
          agencyName: 'Emergency Medical Services (108 Fleet)',
          priority: 2,
          resourceTypes: ['ADVANCED_LIFE_SUPPORT', 'TRAUMA'],
          requiredCapabilities: ['trauma', 'burn_care', 'als'],
          quantity: Math.max(1, Math.ceil((facts.injuredCount || 1) / 2)),
          role: 'Burn Resuscitation, Inhalation Treatment & Trauma Care',
          reason: `${facts.injuredCount} burn/smoke inhalation casualties reported on scene.`
        };
        reasons.push(`AMBULANCE: Dispatched ${Math.max(1, Math.ceil((facts.injuredCount || 1) / 2))} medical unit(s) for ${facts.injuredCount || 1} injured/at-risk victims.`);
      }

      // Agency 4: Police (Crowd & Perimeter)
      requiredAgencies.push('POLICE');
      agencyPlans.POLICE = {
        required: true,
        agencyName: 'Law Enforcement Patrol Division',
        priority: 2,
        resourceTypes: ['PATROL_CAR'],
        requiredCapabilities: ['perimeter_security', 'crowd_control'],
        role: 'Perimeter Cordon & Evacuation Security',
        reason: 'Public safety cordon required around fire hazard zone.'
      };
      reasons.push('POLICE: Dispatched for 100-meter safety perimeter and public evacuation cordon.');

      // Agency 5: Traffic Police (if road blocked or major corridor)
      if (facts.roadBlocked || facts.affectedCount > 4) {
        requiredAgencies.push('TRAFFIC');
        agencyPlans.TRAFFIC = {
          required: true,
          agencyName: 'Hyderabad Traffic Police Rapid Clearance',
          priority: 1,
          resourceTypes: ['TRAFFIC_PATROL'],
          requiredCapabilities: ['traffic_diversion', 'green_corridor', 'road_clearance'],
          role: 'Road Clearance, Towing & Emergency Green Corridor',
          reason: 'Vehicles blocking access road. Immediate corridor clearance needed for fire tenders.'
        };
        reasons.push('TRAFFIC POLICE: Dispatched to clear road blockage and establish emergency green corridor.');
      }

      // Agency 6: Hospital Requirements
      if (facts.injuredCount > 0) {
        requiredAgencies.push('HOSPITAL');
        agencyPlans.HOSPITAL = {
          required: true,
          agencyName: 'Burn & Trauma Medical Network',
          priority: 1,
          requiredSpecialties: ['burns', 'burn_care', 'trauma', 'icu'],
          icuBedsRequired: Math.min(2, Math.max(1, Math.floor(facts.injuredCount * 0.5))),
          generalBedsRequired: Math.max(1, facts.injuredCount),
          role: 'Specialized Burn Unit & Critical Inhalation Care',
          reason: 'Mandatory burn center with confirmed ICU bed availability.'
        };
        reasons.push('HOSPITAL: Matching specialized burn center with mandatory ICU capacity.');
      }
    }

    // B. ROAD ACCIDENT
    else if (category === 'ROAD_ACCIDENT' || category === 'TRAUMA') {
      priorityScore = Math.max(priorityScore, facts.injuredCount > 2 ? 90 : 82);

      // Agency 1: Ambulance (ALS / Trauma)
      requiredAgencies.push('AMBULANCE');
      agencyPlans.AMBULANCE = {
        required: true,
        agencyName: 'Emergency Medical Services',
        priority: 1,
        resourceTypes: ['ADVANCED_LIFE_SUPPORT', 'TRAUMA'],
        requiredCapabilities: ['trauma', 'als'],
        quantity: Math.max(1, Math.ceil(facts.injuredCount / 2)),
        role: 'Trauma Resuscitation & High-Kinetic Kinetic Care',
        reason: `${facts.injuredCount} trauma casualties from road crash.`
      };
      reasons.push(`AMBULANCE: Dispatched ${Math.max(1, Math.ceil(facts.injuredCount / 2))} trauma unit(s) for ${facts.injuredCount} injured victims.`);

      // Agency 2: Rescue Extrication (if victims trapped)
      if (facts.trappedReported) {
        requiredAgencies.push('RESCUE');
        agencyPlans.RESCUE = {
          required: true,
          agencyName: 'Rescue Extrication Squad',
          priority: 1,
          resourceTypes: ['RESCUE_TEAM'],
          requiredCapabilities: ['hydraulic_cutters', 'extrication'],
          role: 'Hydraulic Extrication & Vehicle Cutting',
          reason: 'Victims pinned inside crushed vehicle.'
        };
        reasons.push('RESCUE SQUAD: Dispatched with hydraulic jaws-of-life for vehicle extrication.');
      }

      // Agency 3: Traffic Police
      requiredAgencies.push('TRAFFIC');
      agencyPlans.TRAFFIC = {
        required: true,
        agencyName: 'Hyderabad Traffic Police',
        priority: 2,
        resourceTypes: ['TRAFFIC_PATROL'],
        requiredCapabilities: ['traffic_diversion', 'road_clearance', 'towing_winch'],
        role: 'Wreckage Towing & Highway Congestion Diversion',
        reason: 'Accident blocking lanes. Towing and green corridor required.'
      };
      reasons.push('TRAFFIC POLICE: Dispatched for wreckage towing and accident traffic diversion.');

      // Agency 4: Police
      requiredAgencies.push('POLICE');
      agencyPlans.POLICE = {
        required: true,
        agencyName: 'Law Enforcement',
        priority: 3,
        resourceTypes: ['PATROL_CAR'],
        requiredCapabilities: ['public_safety', 'cordon'],
        role: 'Accident Scene Documentation & Public Safety',
        reason: 'Collision investigation and scene security.'
      };

      // Agency 5: Trauma Hospital
      requiredAgencies.push('HOSPITAL');
      agencyPlans.HOSPITAL = {
        required: true,
        agencyName: 'Level-1 Trauma Center Network',
        priority: 1,
        requiredSpecialties: ['trauma', 'surgery', 'icu'],
        icuBedsRequired: Math.min(2, Math.max(1, Math.floor(facts.injuredCount * 0.4))),
        generalBedsRequired: Math.max(1, facts.injuredCount),
        role: 'Level-1 Trauma Surgery & Intensive Care',
        reason: 'Crash impact necessitates certified trauma surgical facilities.'
      };
      reasons.push('HOSPITAL: Mandatory Level-1 Trauma Center matching with confirmed surgery/ICU beds.');
    }

    // C. CARDIAC EMERGENCY
    else if (category === 'CARDIAC') {
      priorityScore = Math.max(priorityScore, 95);

      // Agency 1: ALS Ambulance
      requiredAgencies.push('AMBULANCE');
      agencyPlans.AMBULANCE = {
        required: true,
        agencyName: 'Advanced Cardiac Life Support (ALS)',
        priority: 1,
        resourceTypes: ['ADVANCED_LIFE_SUPPORT'],
        requiredCapabilities: ['als', 'cardiac', 'defibrillator'],
        quantity: 1,
        role: 'Advanced Airway, 12-Lead ECG & Defibrillation',
        reason: 'Suspected acute myocardial infarction / cardiac arrest.'
      };
      reasons.push('AMBULANCE: Dispatched dedicated ALS unit equipped with 12-lead ECG, defibrillator, and critical cardiac medications.');

      // Agency 2: Cardiac ICU Hospital
      requiredAgencies.push('HOSPITAL');
      agencyPlans.HOSPITAL = {
        required: true,
        agencyName: 'Cardiac Catheterization & Intensive Care Center',
        priority: 1,
        requiredSpecialties: ['cardiology', 'als', 'icu'],
        icuBedsRequired: 1,
        generalBedsRequired: 0,
        role: 'Coronary ICU & Emergency Angioplasty Intervention',
        reason: 'Time-critical reperfusion therapy requires available cardiac ICU.'
      };
      reasons.push('HOSPITAL: Mandatory cardiac specialty with strictly enforced ICU bed availability.');
    }

    // D. FLOODING / WATER RESCUE
    else if (category === 'FLOOD' || facts.floodReported) {
      priorityScore = Math.max(priorityScore, 88);

      // Agency 1: Water Rescue
      requiredAgencies.push('RESCUE');
      agencyPlans.RESCUE = {
        required: true,
        agencyName: 'NDRF / SDRF Water Rescue Unit',
        priority: 1,
        resourceTypes: ['RESCUE_BOAT'],
        requiredCapabilities: ['water_rescue', 'rescue_boat', 'flood_evacuation'],
        role: 'Motorized Boat Evacuation & Deep Water Extrication',
        reason: `${facts.affectedCount} individuals stranded in rising floodwater.`
      };
      reasons.push(`WATER RESCUE: Dispatched motorized rescue boats and divers for ${facts.affectedCount} stranded people.`);

      // Agency 2: Medical Ambulance
      requiredAgencies.push('AMBULANCE');
      agencyPlans.AMBULANCE = {
        required: true,
        agencyName: 'Disaster Medical Transport',
        priority: 2,
        resourceTypes: ['PATIENT_TRANSPORT', 'BASIC_LIFE_SUPPORT'],
        requiredCapabilities: ['basic_life_support', 'flood_support'],
        quantity: Math.max(1, Math.ceil(facts.affectedCount / 3)),
        role: 'Hypothermia Management & Medical Triage',
        reason: 'Vulnerable flood victims requiring warming and triage.'
      };
      reasons.push('AMBULANCE: Dispatched disaster medical transport for hypothermia care.');

      // Agency 3: Police & Traffic
      requiredAgencies.push('POLICE');
      agencyPlans.POLICE = {
        required: true,
        agencyName: 'Disaster Evacuation Police',
        priority: 2,
        resourceTypes: ['PATROL_CAR'],
        requiredCapabilities: ['evacuation_support', 'public_safety'],
        role: 'Flood Zone Evacuation & Perimeter Control',
        reason: 'Secure inundation zone and assist community evacuation.'
      };

      requiredAgencies.push('TRAFFIC');
      agencyPlans.TRAFFIC = {
        required: true,
        agencyName: 'Traffic Police Water Diversion',
        priority: 1,
        resourceTypes: ['TRAFFIC_PATROL'],
        requiredCapabilities: ['traffic_diversion'],
        role: 'Closure of Waterlogged Roads & Safe Detours',
        reason: 'Prevent vehicles from entering submerged roads.'
      };
      reasons.push('TRAFFIC POLICE: Dispatched to barricade submerged corridors and route traffic safely.');

      // Agency 4: Hospital
      requiredAgencies.push('HOSPITAL');
      agencyPlans.HOSPITAL = {
        required: true,
        agencyName: 'Emergency Inundation Receiving Hospital',
        priority: 2,
        requiredSpecialties: ['flooding_trauma', 'general'],
        icuBedsRequired: 0,
        generalBedsRequired: Math.max(1, facts.affectedCount),
        role: 'Hypothermia Treatment & General Medical Admission',
        reason: 'Receiving facility for water-exposed individuals.'
      };
    }

    // E. BUILDING COLLAPSE
    else if (category === 'BUILDING_COLLAPSE' || facts.collapseReported) {
      priorityScore = Math.max(priorityScore, 96);

      // Agency 1: Search & Rescue
      requiredAgencies.push('RESCUE');
      agencyPlans.RESCUE = {
        required: true,
        agencyName: 'Urban Search & Rescue (USAR Squad)',
        priority: 1,
        resourceTypes: ['RESCUE_TEAM'],
        requiredCapabilities: ['search_and_rescue', 'structural_collapse', 'acoustic_listening', 'rescue_team'],
        role: 'Canine / Acoustic Search & Heavy Rubble Extrication',
        reason: `${facts.affectedCount} occupants suspected trapped under collapsed building debris.`
      };
      reasons.push('SEARCH & RESCUE: Dispatched specialized USAR squad with acoustic listening and concrete cutting tools.');

      // Agency 2: Fire Services
      requiredAgencies.push('FIRE');
      agencyPlans.FIRE = {
        required: true,
        agencyName: 'Disaster Fire & Rescue Division',
        priority: 1,
        resourceTypes: ['SNORKEL_LADDER', 'FIRE_ENGINE'],
        requiredCapabilities: ['heavy_extrication', 'fire_suppression'],
        role: 'Structural Shoring & Secondary Fire Prevention',
        reason: 'Prevent dust explosion, gas leaks, and secondary fires.'
      };

      // Agency 3: Structural Safety Specialists
      requiredAgencies.push('SPECIALIZED');
      agencyPlans.SPECIALIZED = {
        required: true,
        agencyName: 'GHMC Structural Engineering Response Unit',
        priority: 1,
        resourceTypes: ['STRUCTURAL_ENGINEERING'],
        requiredCapabilities: ['structural_evaluation', 'collapse_shoring'],
        role: 'Building Integrity Assessment & Shoring Clearance',
        reason: 'Assess structural load stability before rescue personnel enter hazard zone.'
      };
      reasons.push('STRUCTURAL ENGINEERS: Dispatched to assess structural integrity before personnel entry.');

      // Agency 4: Medical Fleet
      requiredAgencies.push('AMBULANCE');
      agencyPlans.AMBULANCE = {
        required: true,
        agencyName: 'Emergency Medical Services (Trauma Fleet)',
        priority: 1,
        resourceTypes: ['TRAUMA', 'ADVANCED_LIFE_SUPPORT'],
        requiredCapabilities: ['trauma', 'spine_board'],
        quantity: Math.max(2, Math.ceil(facts.affectedCount / 2)),
        role: 'Crush Syndrome Management & Field Stabilization',
        reason: 'Immediate care for victims extricated from debris.'
      };

      // Agency 5: Police & Traffic
      requiredAgencies.push('POLICE');
      agencyPlans.POLICE = {
        required: true,
        agencyName: 'Law Enforcement',
        priority: 1,
        resourceTypes: ['PATROL_CAR'],
        requiredCapabilities: ['perimeter_security', 'crowd_control'],
        role: 'Disaster Zone Cordon & Anti-Looting Security',
        reason: 'Maintain strict 200m cordon around unstable structure.'
      };

      requiredAgencies.push('TRAFFIC');
      agencyPlans.TRAFFIC = {
        required: true,
        agencyName: 'Traffic Police',
        priority: 1,
        resourceTypes: ['TRAFFIC_PATROL'],
        requiredCapabilities: ['traffic_diversion', 'green_corridor'],
        role: 'Clear Access Arteries for Heavy Machinery & Cranes',
        reason: 'Establish dedicated unimpeded lane for excavation cranes.'
      };

      // Agency 6: Trauma Hospital
      requiredAgencies.push('HOSPITAL');
      agencyPlans.HOSPITAL = {
        required: true,
        agencyName: 'Level-1 Trauma & Orthopedic Center',
        priority: 1,
        requiredSpecialties: ['trauma', 'surgery', 'icu', 'orthopedics'],
        icuBedsRequired: Math.min(3, Math.max(1, Math.floor(facts.affectedCount * 0.5))),
        generalBedsRequired: Math.max(2, facts.affectedCount),
        role: 'Crush Syndrome Hemodialysis & Orthopedic Trauma Care',
        reason: 'Multi-system trauma management with surgical ICU.'
      };
      reasons.push('HOSPITAL: Mandatory Level-1 trauma center with orthopedic surgery and critical care.');
    }

    // F. CHEMICAL OR GAS LEAK (HAZMAT)
    else if (category === 'CHEMICAL_LEAK' || category === 'HAZMAT' || facts.hazmatReported) {
      priorityScore = Math.max(priorityScore, 94);

      // Agency 1: HazMat Response Team
      requiredAgencies.push('HAZMAT');
      agencyPlans.HAZMAT = {
        required: true,
        agencyName: 'Telangana Disaster HazMat Response Unit',
        priority: 1,
        resourceTypes: ['HAZMAT_TEAM'],
        requiredCapabilities: ['chemical_containment', 'gas_leak_neutralization', 'decontamination_tent', 'hazmat_suit_level_a'],
        role: 'Hot-Zone Chemical Plume Containment & Vapor Neutralization',
        reason: 'Toxic vapor dispersion reported. Certified Level-A entry suits required.'
      };
      reasons.push('HAZMAT TEAM: Dispatched Level-A certified chemical containment and vapor neutralization unit.');

      // Agency 2: Fire Services
      requiredAgencies.push('FIRE');
      agencyPlans.FIRE = {
        required: true,
        agencyName: 'Fire & Rescue HazMat Division',
        priority: 1,
        resourceTypes: ['FIRE_ENGINE'],
        requiredCapabilities: ['foam_cannons', 'water_tender'],
        role: 'Water Curtain Vapor Knockdown & Foam Scrubbing',
        reason: 'Deploy water curtains to prevent toxic cloud from drifting to residential areas.'
      };

      // Agency 3: Police Evacuation
      requiredAgencies.push('POLICE');
      agencyPlans.POLICE = {
        required: true,
        agencyName: 'Police Evacuation Command',
        priority: 1,
        resourceTypes: ['PATROL_CAR'],
        requiredCapabilities: ['evacuation_support', 'cordon'],
        role: 'Upwind Evacuation Cordon (500m Radius)',
        reason: 'Evacuate civilians upwind from chemical dispersion vector.'
      };
      reasons.push('POLICE: Dispatched to enforce 500-meter upwind public evacuation radius.');

      // Agency 4: Traffic Police
      requiredAgencies.push('TRAFFIC');
      agencyPlans.TRAFFIC = {
        required: true,
        agencyName: 'Traffic Police Plume Diversion',
        priority: 1,
        resourceTypes: ['TRAFFIC_PATROL'],
        requiredCapabilities: ['traffic_diversion'],
        role: 'Seal Downwind Roads & Prevent Vehicle Ingress',
        reason: 'Prevent motorist exposure to toxic plume.'
      };

      // Agency 5: Medical Ambulances
      requiredAgencies.push('AMBULANCE');
      agencyPlans.AMBULANCE = {
        required: true,
        agencyName: 'HazMat Medical Support',
        priority: 2,
        resourceTypes: ['ADVANCED_LIFE_SUPPORT'],
        requiredCapabilities: ['als', 'oxygen', 'ventilator'],
        quantity: Math.max(1, Math.ceil(facts.injuredCount / 2)),
        role: 'Chemical Inhalation Care & Antidote Administration',
        reason: 'Paramedics equipped with respiratory filters and atropine/antidotes.'
      };

      // Agency 6: Decontamination-Capable Hospital
      requiredAgencies.push('HOSPITAL');
      agencyPlans.HOSPITAL = {
        required: true,
        agencyName: 'Toxicology & Decontamination Hospital Network',
        priority: 1,
        requiredSpecialties: ['hazmat', 'toxicology', 'decontamination', 'icu'],
        icuBedsRequired: 1,
        generalBedsRequired: Math.max(1, facts.injuredCount),
        role: 'Mass Decontamination Tent & Intensive Pulmonary Care',
        reason: 'Mandatory hospital with dedicated chemical decontamination shower facility.'
      };
      reasons.push('HOSPITAL: Mandatory hospital with certified chemical decontamination shower facilities.');
    }

    // G. GENERAL MEDICAL / DEFAULT
    else {
      priorityScore = Math.max(priorityScore, 70);

      // Agency 1: Ambulance
      requiredAgencies.push('AMBULANCE');
      agencyPlans.AMBULANCE = {
        required: true,
        agencyName: 'Emergency Medical Services',
        priority: 1,
        resourceTypes: ['BASIC_LIFE_SUPPORT', 'ADVANCED_LIFE_SUPPORT'],
        requiredCapabilities: ['basic_life_support'],
        quantity: 1,
        role: 'Patient Evaluation & Safe Clinical Transport',
        reason: 'Medical assessment and emergency department transfer.'
      };
      reasons.push('AMBULANCE: Dispatched medical unit for patient clinical evaluation.');

      // Agency 2: Hospital
      requiredAgencies.push('HOSPITAL');
      agencyPlans.HOSPITAL = {
        required: true,
        agencyName: 'General Emergency Department',
        priority: 1,
        requiredSpecialties: ['general'],
        icuBedsRequired: 0,
        generalBedsRequired: 1,
        role: 'Emergency Department Admission',
        reason: 'General emergency medical care.'
      };
      reasons.push('HOSPITAL: Matching nearest hospital with available emergency beds.');
    }

    return {
      category,
      priorityScore,
      facts,
      requiredAgencies,
      agencyPlans,
      reasons,
      planTimestamp: new Date().toISOString()
    };
  }
}

const emergencyResponsePlanner = new EmergencyResponsePlanner();

module.exports = {
  EmergencyResponsePlanner,
  emergencyResponsePlanner,
  planMultiAgencyResponse: (data) => emergencyResponsePlanner.planMultiAgencyResponse(data),
  extractIncidentFacts: (text) => emergencyResponsePlanner.extractIncidentFacts(text)
};

