/**
 * Hospital Eligibility Matching Engine
 * Problem Statement: PS10 - ResQFlow AI (Part 5 & Part 6)
 * 
 * Implements strict, clinically grounded hospital matching using hard eligibility constraints:
 * - Mandatory ICU Capacity Enforcement: If ICU required and availableIcuBeds === 0 -> REJECT
 * - Mandatory Specialty Matching: Trauma, Burns, HazMat Decon, Cardiology
 * - Mandatory General Emergency Bed Availability
 * - Distance NEVER overrides clinical eligibility (a closer hospital with 0 ICU is REJECTED in favor of an eligible hospital further away)
 * - Safe Reservation Ledger & Explicit Rejection Explanations
 */

const { graphRouter } = require('./hyderabadGraphRouter');

class HospitalEligibilityService {
  /**
   * Evaluates all hospitals in network against incident medical requirements.
   * Categorizes into strictly eligible vs rejected with transparent reasons.
   */
  evaluateHospitalEligibility(incident, hospitals) {
    const category = incident.category || 'GENERAL_EMERGENCY';
    const priority = incident.priorityScore || incident.priority || 50;
    const isCritical = incident.severityCategory === 'CRITICAL' || priority >= 85 || category === 'CARDIAC';
    const isTrauma = category === 'ROAD_ACCIDENT' || category === 'TRAUMA' || category === 'BUILDING_COLLAPSE';
    const isBurn = category === 'FIRE';
    const isHazmat = category === 'CHEMICAL_LEAK' || category === 'HAZMAT';

    // Derive hospital clinical requirements from medical assessment
    const requiredFacilities = [];
    let icuRequired = false;

    if (category === 'CARDIAC') {
      icuRequired = true;
      requiredFacilities.push('cardiology', 'icu');
    } else if (isBurn) {
      if (incident.injuredCount > 0 || isCritical) icuRequired = true;
      requiredFacilities.push('burn_care', 'burns');
    } else if (isHazmat) {
      if (isCritical) icuRequired = true;
      requiredFacilities.push('decontamination', 'hazmat');
    } else if (isTrauma) {
      if (isCritical) icuRequired = true;
      requiredFacilities.push('trauma');
    } else if (isCritical) {
      icuRequired = true;
    }

    const eligibleHospitals = [];
    const rejectedHospitals = [];

    const incidentNode = incident.node || 'Kukatpally';

    for (const hospital of hospitals) {
      const hospId = hospital.hospitalId || hospital._id;
      const hospName = hospital.name;
      const specialties = (hospital.specialties || []).map(s => s.toLowerCase());
      const availableIcu = hospital.availableIcuBeds !== undefined ? hospital.availableIcuBeds : (hospital.icuBeds || 0);
      const availableGen = hospital.availableGeneralBeds !== undefined ? hospital.availableGeneralBeds : (hospital.bedsAvailable || 0);
      const isOnline = hospital.status !== 'OFFLINE' && hospital.status !== 'UNAVAILABLE';

      const rejectionReasons = [];

      // Constraint 1: Hospital Operational Status
      if (!isOnline) {
        rejectionReasons.push('Hospital is currently OFFLINE or under emergency diversion.');
      }

      // Constraint 2: Mandatory ICU Capacity Check
      if (icuRequired && availableIcu <= 0) {
        rejectionReasons.push('Rejected — no available ICU beds (ICU beds: 0).');
      }

      // Constraint 3: Mandatory Trauma Care Check
      if (isTrauma && !hospital.traumaCapable && !hospital.traumaCenter && !specialties.includes('trauma')) {
        rejectionReasons.push('Rejected — no certified trauma center / trauma surgery facilities.');
      }

      // Constraint 4: Mandatory Burn Care Check
      if (isBurn && !specialties.includes('burns') && !specialties.includes('burn_care')) {
        rejectionReasons.push('Rejected — no specialized burn care unit or thermal resuscitation facility.');
      }

      // Constraint 5: Mandatory HazMat / Chemical Decontamination Check
      if (isHazmat && !specialties.includes('hazmat') && !specialties.includes('decontamination')) {
        rejectionReasons.push('Rejected — no certified chemical decontamination / HazMat containment facility.');
      }

      // Constraint 6: Mandatory Cardiology Check
      if (category === 'CARDIAC' && !specialties.includes('cardiology') && !specialties.includes('als')) {
        rejectionReasons.push('Rejected — lacks 24/7 cardiac catheterization and interventional cardiology department.');
      }

      // Constraint 7: General Bed Capacity Check
      if (!icuRequired && availableGen <= 0) {
        rejectionReasons.push('Rejected — general emergency ward capacity exhausted (Beds: 0).');
      }

      // Calculate travel time and route
      const route = graphRouter.findShortestPath(incidentNode, hospital.node || 'Ameerpet');
      const travelTimeMinutes = route ? route.travel_time_min : 15;
      const distanceKm = route ? route.distance_km : 8;

      const evalResult = {
        hospitalId: hospId,
        hospitalName: hospName,
        hospitalNode: hospital.node,
        availableIcuBeds: availableIcu,
        availableGeneralBeds: availableGen,
        specialties: hospital.specialties || [],
        distanceKm,
        travelTimeMinutes,
        route,
        isEligible: rejectionReasons.length === 0,
        rejectionReasons,
        rejectionReason: rejectionReasons.join(' '),
        score: 0
      };

      if (evalResult.isEligible) {
        // Suitability scoring for ELIGIBLE hospitals only (Distance never overrides mandatory eligibility)
        // Score: higher is better. Base 100 - travel time penalty + available bed bonuses
        evalResult.score = Math.max(10, 100 - (travelTimeMinutes * 2) + Math.min(20, availableIcu * 2));
        eligibleHospitals.push(evalResult);
      } else {
        rejectedHospitals.push(evalResult);
      }
    }

    // Sort eligible hospitals by score descending (lowest travel time among certified eligible facilities)
    eligibleHospitals.sort((a, b) => b.score - a.score);

    const selectedHospital = eligibleHospitals.length > 0 ? eligibleHospitals[0] : null;

    return {
      incidentId: incident.incidentId || incident._id,
      category,
      icuRequired,
      requiredFacilities,
      hasEligibleHospital: eligibleHospitals.length > 0,
      selectedHospital,
      eligibleHospitals,
      rejectedHospitals,
      missingRequirements: eligibleHospitals.length === 0 ? requiredFacilities : [],
      status: eligibleHospitals.length > 0 ? 'HOSPITAL_MATCHED' : 'NO_ELIGIBLE_HOSPITAL'
    };
  }

  /**
   * Atomically reserves bed capacity in selected hospital
   */
  reserveCapacity(hospital, isIcuRequired) {
    if (isIcuRequired) {
      if (hospital.availableIcuBeds > 0) hospital.availableIcuBeds -= 1;
      if (hospital.icuBeds > 0) hospital.icuBeds -= 1;
    } else {
      if (hospital.availableGeneralBeds > 0) hospital.availableGeneralBeds -= 1;
      if (hospital.bedsAvailable > 0) hospital.bedsAvailable -= 1;
    }
  }

  /**
   * Releases bed capacity on resolution or reallocation
   */
  releaseCapacity(hospital, isIcuRequired) {
    if (isIcuRequired) {
      if (hospital.availableIcuBeds !== undefined) hospital.availableIcuBeds += 1;
      if (hospital.icuBeds !== undefined) hospital.icuBeds += 1;
    } else {
      if (hospital.availableGeneralBeds !== undefined) hospital.availableGeneralBeds += 1;
      if (hospital.bedsAvailable !== undefined) hospital.bedsAvailable += 1;
    }
  }
}

const hospitalEligibilityService = new HospitalEligibilityService();

module.exports = {
  HospitalEligibilityService,
  hospitalEligibilityService,
  evaluateHospitalEligibility: (incident, hospitals) => hospitalEligibilityService.evaluateHospitalEligibility(incident, hospitals)
};

