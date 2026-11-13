/**
 * Resource Requirement Prediction Module
 * Problem Statement: PS10 - ResQFlow AI (Feature 2)
 * 
 * Predicts and estimates exact resource requirements:
 * - Number of ambulances (ALS, BLS, Trauma)
 * - Rescue boats and rescue teams
 * - Paramedics and medical personnel
 * - Hospital general beds and ICU beds
 * 
 * Based on incident type, casualty count, critical patient ratio,
 * environmental conditions, and scene hazards.
 */

class ResourceRequirementEstimator {
  estimateRequirements(incidentData) {
    const category = incidentData.category || incidentData.type || 'GENERAL_EMERGENCY';
    const totalCasualties = Math.max(1, incidentData.affectedPeople || incidentData.people_affected || incidentData.casualties || 1);
    const criticalPatients = incidentData.criticalPatients || (category === 'CARDIAC' ? 1 : Math.floor(totalCasualties * 0.3));
    const nonCriticalPatients = Math.max(0, totalCasualties - criticalPatients);
    const hazards = incidentData.hazards || [];
    const isFlood = category === 'FLOOD' || hazards.includes('URBAN_FLOODING');
    const isFire = category === 'FIRE' || hazards.includes('STRUCTURAL_FIRE');

    // 1. Ambulance Fleet Calculation
    let alsRequired = 0;
    let traumaRequired = 0;
    let blsRequired = 0;
    let rescueBoatsRequired = 0;

    if (category === 'CARDIAC') {
      alsRequired = Math.max(1, criticalPatients);
    } else if (category === 'ROAD_ACCIDENT' || category === 'TRAUMA') {
      traumaRequired = Math.max(1, Math.ceil(criticalPatients * 1.0));
      // For remaining non-critical casualties (1 BLS per 2 patients)
      blsRequired = Math.ceil(nonCriticalPatients / 2);
    } else if (isFlood) {
      rescueBoatsRequired = Math.max(1, Math.ceil(totalCasualties / 3));
      alsRequired = criticalPatients > 0 ? 1 : 0;
      blsRequired = Math.max(1, Math.ceil(totalCasualties / 3));
    } else if (isFire) {
      traumaRequired = Math.max(1, criticalPatients);
      blsRequired = Math.max(1, Math.ceil(nonCriticalPatients / 2));
    } else {
      alsRequired = criticalPatients > 0 ? 1 : 0;
      blsRequired = Math.max(1, Math.ceil(nonCriticalPatients / 2));
    }

    const totalAmbulances = alsRequired + traumaRequired + blsRequired;

    // 2. Medical Personnel Calculation
    const advancedParamedics = (alsRequired * 2) + (traumaRequired * 1);
    const basicParamedics = (blsRequired * 1) + (rescueBoatsRequired * 1);
    const emergencyPhysicians = criticalPatients >= 2 ? 1 : 0;
    const waterRescueSpecialists = isFlood ? Math.max(2, rescueBoatsRequired * 2) : 0;

    // 3. Hospital Capacity Calculation
    const icuBedsRequired = Math.max(category === 'CARDIAC' ? 1 : 0, criticalPatients);
    const generalBedsRequired = Math.max(1, nonCriticalPatients);

    // 4. Facility Requirements
    const requiredFacilities = [];
    if (category === 'CARDIAC') requiredFacilities.push('Cardiac Catheterization Lab', 'Coronary ICU');
    if (category === 'ROAD_ACCIDENT' || category === 'TRAUMA') requiredFacilities.push('Level 1 Trauma Center', 'Emergency Surgery Suite', 'trauma_bay');
    if (isFlood) requiredFacilities.push('Hypothermia Management Unit', 'Trauma Resuscitation');
    if (isFire) requiredFacilities.push('Burn Unit', 'Pulmonary Critical Care');

    // 5. Explainable Reasoning
    const reasoning = [
      `Casualty Assessment: ${totalCasualties} total casualties with ${criticalPatients} critical patients.`,
      `Vehicle Dispatch: ${totalAmbulances} ambulance(s) recommended (${alsRequired} ALS, ${traumaRequired} Trauma, ${blsRequired} BLS${isFlood ? `, ${rescueBoatsRequired} Rescue Boat(s)` : ''}).`,
      `Clinical Crew: ${advancedParamedics + basicParamedics} paramedics required (${advancedParamedics} ALS/Trauma-certified, ${basicParamedics} BLS)${waterRescueSpecialists > 0 ? ` + ${waterRescueSpecialists} water rescue specialists` : ''}.`,
      `Hospital Bed Target: ${icuBedsRequired} ICU bed(s) and ${generalBedsRequired} General bed(s) required across target receiving hospitals.`
    ];

    return {
      incidentCategory: category,
      totalCasualties,
      criticalPatients,
      ambulances: {
        total: totalAmbulances,
        als: alsRequired,
        trauma: traumaRequired,
        bls: blsRequired,
        rescueBoats: rescueBoatsRequired
      },
      personnel: {
        advancedParamedics,
        basicParamedics,
        emergencyPhysicians,
        waterRescueSpecialists,
        totalPersonnel: advancedParamedics + basicParamedics + emergencyPhysicians + waterRescueSpecialists
      },
      hospitalNeeds: {
        icuBeds: icuBedsRequired,
        generalBeds: generalBedsRequired,
        requiredFacilities
      },
      reasoning,
      estimationMethod: 'Deterministic Constraint-Based Clinical Estimation Model'
    };
  }
}

const resourceRequirementEstimator = new ResourceRequirementEstimator();

module.exports = {
  ResourceRequirementEstimator,
  resourceRequirementEstimator,
  estimateResourceRequirements: (data) => resourceRequirementEstimator.estimateRequirements(data)
};
