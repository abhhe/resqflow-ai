/**
 * Centralized Multi-Agency Resource Allocation Engine
 * Problem Statement: PS10 - ResQFlow AI (Part 3 & Part 4)
 * 
 * Orchestrates cross-agency resource dispatching:
 * - Fire Services (Fire engines, water tenders)
 * - Search & Rescue (USAR squads, rescue boats)
 * - Emergency Medical Services (ALS/BLS ambulances via Kuhn-Munkres Hungarian Optimizer)
 * - Police & Law Enforcement (Perimeter cordons, crowd control)
 * - Traffic Police (Road clearance, green corridor, towing)
 * - Specialized Units (HazMat decontamination, structural safety engineers)
 * - Hospital Facilities (Evaluated via strict HospitalEligibilityService)
 * 
 * Zero Double-Booking Invariant & Explainable Decision/Rejection Traces.
 */

const { solveHungarian } = require('./hungarianOptimizer');
const { graphRouter } = require('./hyderabadGraphRouter');
const { emergencyResponsePlanner } = require('./emergencyResponsePlanner');
const { hospitalEligibilityService } = require('./hospitalEligibilityService');

class MultiAgencyAllocationEngine {
  constructor() {
    this.decisionLogs = [];
  }

  logDecision(msg) {
    const entry = `[MULTI-AGENCY] ${msg}`;
    console.log(entry);
    this.decisionLogs.unshift({
      timestamp: new Date().toISOString(),
      message: entry
    });
    if (this.decisionLogs.length > 200) this.decisionLogs.pop();
  }

  getDecisionLogs() {
    return this.decisionLogs;
  }

  clearLogs() {
    this.decisionLogs = [];
  }

  /**
   * Evaluates all incidents and cross-agency resource inventories
   */
  allocateMultiAgencyEmergencies(incidents, multiAgencyResources, ambulances, hospitals) {
    const startTime = Date.now();
    this.logDecision(`Starting Multi-Agency Allocation for ${incidents.length} incident(s).`);

    // Clone working pools to enforce atomic reservation invariants
    const workingResources = (multiAgencyResources || []).map(r => ({ ...r, capabilities: [...(r.capabilities || [])] }));
    const workingAmbulances = (ambulances || []).map(a => ({ ...a, capabilities: [...(a.capabilities || [])] }));
    const workingHospitals = (hospitals || []).map(h => ({ ...h, specialties: [...(h.specialties || [])] }));

    // Sort incidents by priority (Critical First)
    const sortedIncidents = [...incidents].sort((a, b) => {
      const pA = a.priorityScore || a.priority || 50;
      const pB = b.priorityScore || b.priority || 50;
      return pB - pA;
    });

    const incidentAllocations = [];

    // Phase 1: Formulate Response Plan & Agency Matching per Incident
    for (const incident of sortedIncidents) {
      const incId = incident.incidentId || incident._id;
      const incNode = incident.node || 'Kukatpally';

      // 1. Generate Multi-Agency Response Plan
      const responsePlan = emergencyResponsePlanner.planMultiAgencyResponse(incident);
      this.logDecision(`${incId} (${responsePlan.category}): Required agencies [${responsePlan.requiredAgencies.join(', ')}]`);

      const allocatedAgencies = {};
      const missingAgencies = [];
      const agencyRoutes = {};

      // 2. Evaluate Hospital Eligibility (Part 5 & 6 Hard Constraints)
      const hospitalEval = hospitalEligibilityService.evaluateHospitalEligibility(incident, workingHospitals);
      let selectedHospital = null;

      if (hospitalEval.hasEligibleHospital) {
        selectedHospital = hospitalEval.selectedHospital;
        this.logDecision(`${incId}: Hospital matched -> ${selectedHospital.hospitalName} (ICU: ${selectedHospital.availableIcuBeds}, ETA: ${selectedHospital.travelTimeMinutes}m).`);
        
        // Atomically reserve bed in working hospital pool
        const hospObj = workingHospitals.find(h => (h.hospitalId || h._id) === selectedHospital.hospitalId);
        if (hospObj) {
          hospitalEligibilityService.reserveCapacity(hospObj, hospitalEval.icuRequired);
        }
      } else {
        this.logDecision(`CRITICAL ALERT for ${incId}: NO ELIGIBLE HOSPITAL. Missing: [${hospitalEval.missingRequirements.join(', ')}]. Patient placed in pending-destination state.`);
      }

      // 3. Allocate Multi-Agency Resources (Fire, Rescue, Police, Traffic, HazMat, Structural)
      for (const agency of responsePlan.requiredAgencies) {
        if (agency === 'AMBULANCE' || agency === 'HOSPITAL') continue; // Handled specially

        const plan = responsePlan.agencyPlans[agency];
        if (!plan) continue;

        // Search for matching available resource
        const candidates = workingResources.filter(r => 
          r.agency === agency && 
          r.status === 'AVAILABLE' &&
          r.capabilities.some(c => plan.requiredCapabilities.includes(c))
        );

        if (candidates.length > 0) {
          // Rank by travel time from resource node to incident node
          candidates.sort((a, b) => {
            const routeA = graphRouter.findShortestPath(a.node, incNode);
            const routeB = graphRouter.findShortestPath(b.node, incNode);
            const timeA = routeA ? routeA.travel_time_min : 99;
            const timeB = routeB ? routeB.travel_time_min : 99;
            return timeA - timeB;
          });

          const chosenResource = candidates[0];
          const route = graphRouter.findShortestPath(chosenResource.node, incNode);

          // Atomic Reservation: lock resource to mission (Zero Double-Booking Invariant)
          chosenResource.status = 'ASSIGNED';
          chosenResource.currentAssignment = incId;
          chosenResource.currentIncidentId = incId;
          chosenResource.etaMinutes = route ? route.travel_time_min : 8;

          allocatedAgencies[agency] = {
            allocated: true,
            resourceId: chosenResource.resourceId || chosenResource._id,
            resourceName: chosenResource.name,
            resourceType: chosenResource.type,
            crew: chosenResource.crew,
            node: chosenResource.node,
            etaMinutes: chosenResource.etaMinutes,
            routeLabel: route ? route.chosenRouteName : 'Direct Route',
            coordinates: route ? route.coordinates : [],
            role: plan.role,
            reason: plan.reason
          };

          agencyRoutes[agency] = route;
          this.logDecision(`${incId}: Allocated ${agency} -> ${chosenResource.name} (ETA: ${chosenResource.etaMinutes}m via ${chosenResource.node}).`);
        } else {
          // Shortage handling: Resource unavailable, queued without starving other agencies
          missingAgencies.push({
            agency,
            role: plan.role,
            reason: `Resource Shortage: No available ${agency} unit with capabilities [${plan.requiredCapabilities.join(', ')}]. Placed in priority dispatch queue.`
          });
          this.logDecision(`SHORTAGE for ${incId}: ${agency} units exhausted. Requirement queued.`);
        }
      }

      incidentAllocations.push({
        incidentId: incId,
        category: responsePlan.category,
        priorityScore: responsePlan.priorityScore,
        responsePlan,
        hospitalEvaluation: hospitalEval,
        selectedHospital,
        allocatedAgencies,
        missingAgencies,
        agencyRoutes,
        hasMissingAgencies: missingAgencies.length > 0
      });
    }

    // Phase 2: Hungarian Optimization for Medical Ambulances (One-to-One Match)
    const pendingAmbulanceIncidents = incidentAllocations.filter(alloc => 
      alloc.responsePlan.requiredAgencies.includes('AMBULANCE')
    );

    if (pendingAmbulanceIncidents.length > 0 && workingAmbulances.length > 0) {
      // Build Cost Matrix for Hungarian Matching
      const costMatrix = [];
      const mapping = [];

      for (let i = 0; i < pendingAmbulanceIncidents.length; i++) {
        const alloc = pendingAmbulanceIncidents[i];
        const inc = sortedIncidents.find(inc => (inc.incidentId || inc._id) === alloc.incidentId);
        const reqPlan = alloc.responsePlan.agencyPlans.AMBULANCE;
        const requiredCaps = reqPlan?.requiredCapabilities || ['basic_life_support'];
        const priority = alloc.priorityScore;
        const weightFactor = 1 + ((100 - priority) / 50);

        const row = [];
        for (let j = 0; j < workingAmbulances.length; j++) {
          const amb = workingAmbulances[j];
          const isAvailable = amb.status === 'AVAILABLE';
          const hasCap = requiredCaps.some(c => amb.capabilities.includes(c));

          if (!isAvailable || !hasCap) {
            row.push(1e7); // Incompatible / Unavailable
          } else {
            const route = graphRouter.findShortestPath(amb.node, inc.node || 'Kukatpally');
            const travelTime = route ? route.travel_time_min : 15;
            row.push(Math.round(travelTime * weightFactor));
          }
        }
        costMatrix.push(row);
        mapping.push({ alloc, inc });
      }

      const assignmentIndices = solveHungarian(costMatrix);

      for (let incIdx = 0; incIdx < assignmentIndices.length; incIdx++) {
        const ambIdx = assignmentIndices[incIdx];
        const mapItem = mapping[incIdx];
        const cost = (ambIdx >= 0 && costMatrix[incIdx]) ? costMatrix[incIdx][ambIdx] : 1e7;

        if (mapItem && ambIdx >= 0 && cost < 1e6) {
          const amb = workingAmbulances[ambIdx];
          const inc = mapItem.inc;
          const route = graphRouter.findShortestPath(amb.node, inc.node || 'Kukatpally');

          // Lock ambulance to mission
          amb.status = 'ASSIGNED';
          amb.currentAssignment = mapItem.alloc.incidentId;
          amb.currentIncidentId = mapItem.alloc.incidentId;
          amb.etaMinutes = route ? route.travel_time_min : 8;

          mapItem.alloc.allocatedAgencies.AMBULANCE = {
            allocated: true,
            resourceId: amb.ambulanceId,
            resourceName: `${amb.ambulanceId} (${amb.type})`,
            resourceType: amb.type,
            crew: `${amb.driverName} & Paramedic Crew`,
            node: amb.node,
            etaMinutes: amb.etaMinutes,
            routeLabel: route ? route.chosenRouteName : 'Corridor',
            coordinates: route ? route.coordinates : [],
            role: 'Medical Transport & Field Stabilization',
            reason: `Assigned via Kuhn-Munkres Hungarian solver matching capability [${amb.capabilities.join(', ')}].`
          };
          this.logDecision(`${mapItem.alloc.incidentId}: Hungarian allocated AMBULANCE -> ${amb.ambulanceId} (ETA: ${amb.etaMinutes}m).`);
        } else if (mapItem) {
          mapItem.alloc.missingAgencies.push({
            agency: 'AMBULANCE',
            role: 'Emergency Medical Transport',
            reason: 'Fleet Saturation: All available compatible ambulances allocated to higher-priority emergencies. Queued as #1.'
          });
          this.logDecision(`SHORTAGE for ${mapItem.alloc.incidentId}: No eligible ambulance available in Hungarian matching.`);
        }
      }
    }

    const recomputeTimeMs = Date.now() - startTime;
    this.logDecision(`Multi-Agency Allocation completed in ${recomputeTimeMs}ms.`);

    return {
      success: true,
      recomputeTimeMs,
      incidentAllocations,
      updatedResources: workingResources,
      updatedAmbulances: workingAmbulances,
      updatedHospitals: workingHospitals,
      decisionLogs: this.getDecisionLogs()
    };
  }
}

const multiAgencyAllocationEngine = new MultiAgencyAllocationEngine();

module.exports = {
  MultiAgencyAllocationEngine,
  multiAgencyAllocationEngine
};
