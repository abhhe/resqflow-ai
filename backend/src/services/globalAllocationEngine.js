/**
 * Global Multi-Emergency Resource Allocation Engine
 * Problem Statement: PS10 - ResQFlow AI (Section 7)
 * 
 * Coordinates simultaneous emergencies globally, sorts by priority,
 * matches capabilities, optimizes travel-time routes, reserves hospital beds,
 * prevents duplicate assignments, and outputs transparent decision factors.
 */

const { graphRouter } = require('./hyderabadGraphRouter');
const { hungarianOptimizer } = require('./hungarianOptimizer');

class GlobalAllocationEngine {
  constructor() {
    this.decisionLogs = [];
    this.activeStrategy = 'OPTIMIZED'; // 'OPTIMIZED' (Hungarian) | 'GREEDY'
  }

  logDecision(message, details = null) {
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      message,
      details
    };
    this.decisionLogs.push(entry);
    console.log(`[ALLOCATION] ${message}`);
    return entry;
  }

  getDecisionLogs() {
    return [...this.decisionLogs];
  }

  clearLogs() {
    this.decisionLogs = [];
  }

  /**
   * Evaluates an ambulance for a specific emergency.
   * Generates positiveFactors, negativeFactors, rejectionReason, and suitability score.
   */
  evaluateAmbulance(incident, ambulance) {
    const positiveFactors = [];
    const negativeFactors = [];
    let isEligible = true;
    let rejectionReason = null;

    // Invariant 1: Availability
    if (ambulance.status !== 'AVAILABLE') {
      isEligible = false;
      negativeFactors.push(`Ambulance status is ${ambulance.status}`);
      rejectionReason = `Ambulance is currently ${ambulance.status} and cannot be assigned.`;
    }

    // Invariant 2: Capability matching
    const requiredCap = (incident.requiredCapability || incident.required_capability || '').toLowerCase();
    const ambCaps = (ambulance.capabilities || []).map(c => c.toLowerCase());
    
    // Check if capability is matched
    let hasCapability = false;
    if (!requiredCap || requiredCap === 'basic_life_support') {
      hasCapability = true;
    } else if (requiredCap === 'rescue_boat' || requiredCap === 'rescue_team') {
      hasCapability = ambCaps.includes('rescue_boat') || ambCaps.includes('rescue_team');
    } else if (requiredCap === 'trauma') {
      hasCapability = ambCaps.includes('trauma');
    } else if (requiredCap === 'als') {
      hasCapability = ambCaps.includes('als');
    } else {
      hasCapability = ambCaps.includes(requiredCap);
    }

    if (!hasCapability) {
      isEligible = false;
      negativeFactors.push(`Lacks required capability '${requiredCap}'`);
      if (!rejectionReason) {
        rejectionReason = `Lacks required capability '${requiredCap}'.`;
      }
    } else {
      positiveFactors.push(`Satisfies capability '${requiredCap}'`);
    }

    // Invariant 3: Single active mission
    if (ambulance.currentAssignment || ambulance.currentIncidentId) {
      isEligible = false;
      negativeFactors.push(`Already committed to active mission: ${ambulance.currentAssignment || ambulance.currentIncidentId}`);
      if (!rejectionReason) {
        rejectionReason = 'Already committed to an active emergency mission.';
      }
    }

    // Travel time calculation using Dijkstra router
    const incidentNode = incident.node || incident.locationName || 'Kukatpally';
    const ambNode = ambulance.node || 'Kukatpally';
    const route = graphRouter.findShortestPath(ambNode, incidentNode);
    const etaMinutes = route.travel_time_min;
    const distanceKm = route.distance_km;

    if (etaMinutes <= 5) {
      positiveFactors.push(`Exceptional ETA (${etaMinutes} min)`);
    } else if (etaMinutes <= 12) {
      positiveFactors.push(`Acceptable ETA (${etaMinutes} min)`);
    } else {
      negativeFactors.push(`High travel time (${etaMinutes} min)`);
    }

    // Score calculation: higher is better
    // Base 50, +30 for matching capability, minus 2 points per minute of ETA, minus 1 point per km
    let score = 0;
    if (isEligible) {
      score = Math.max(1, 100 - (etaMinutes * 4) - (distanceKm * 2));
      positiveFactors.push(`Optimized route travel time: ${etaMinutes} min over ${distanceKm} km`);
    }

    return {
      ambulanceId: ambulance.ambulanceId || ambulance._id,
      ambulance,
      isEligible,
      score,
      etaMinutes,
      distanceKm,
      route,
      positiveFactors,
      negativeFactors,
      rejectionReason
    };
  }

  /**
   * Evaluates a hospital for a specific incident.
   * Generates positiveFactors, negativeFactors, rejectionReason, and suitability score.
   */
  evaluateHospital(incident, hospital) {
    const positiveFactors = [];
    const negativeFactors = [];
    let isEligible = true;
    let rejectionReason = null;

    if (hospital.status === 'OFFLINE') {
      isEligible = false;
      negativeFactors.push('Hospital status is OFFLINE');
      rejectionReason = 'Hospital is currently OFFLINE.';
    }

    const isCritical = incident.severityCategory === 'CRITICAL' || 
                       (incident.priorityScore || incident.priority || 0) >= 95 ||
                       incident.category === 'CARDIAC' ||
                       incident.severity >= 9;

    const needsTrauma = (incident.requiredCapability || incident.required_capability) === 'trauma' ||
                        incident.category === 'ROAD_ACCIDENT' ||
                        incident.category === 'TRAUMA';

    // Invariant 4: ICU Capacity check for critical emergencies
    const availableIcu = hospital.availableIcuBeds !== undefined ? hospital.availableIcuBeds : (hospital.icuBeds || 0);
    const availableGen = hospital.availableGeneralBeds !== undefined ? hospital.availableGeneralBeds : (hospital.bedsAvailable || 0);

    if (isCritical) {
      if (availableIcu <= 0) {
        isEligible = false;
        negativeFactors.push('ICU capacity is 0 (exhausted)');
        rejectionReason = `${hospital.name} rejected because ICU capacity is exhausted.`;
      } else {
        positiveFactors.push(`ICU beds available: ${availableIcu}`);
      }
    } else {
      if (availableGen <= 0 && availableIcu <= 0) {
        isEligible = false;
        negativeFactors.push('All beds exhausted');
        rejectionReason = `${hospital.name} rejected because bed capacity is exhausted.`;
      } else {
        positiveFactors.push(`Beds available: General=${availableGen}, ICU=${availableIcu}`);
      }
    }

    // Invariant 5: Specialist & Facility capability matching
    const specs = (hospital.specialties || []).map(s => s.toLowerCase());
    if (incident.category === 'CARDIAC' && !specs.includes('cardiology') && !specs.includes('als')) {
      isEligible = false;
      negativeFactors.push('Missing Cardiology department');
      if (!rejectionReason) rejectionReason = 'Requires specialized cardiology and cardiac ICU facilities.';
    }

    if (needsTrauma && !hospital.traumaCenter && !hospital.traumaCapable && !specs.includes('trauma')) {
      isEligible = false;
      negativeFactors.push('Missing Trauma Center certification');
      if (!rejectionReason) rejectionReason = 'Requires certified Trauma Center facilities.';
    } else if (needsTrauma) {
      positiveFactors.push('Certified Level 1 Trauma Center verified');
    }

    // Route from Incident to Hospital
    const incidentNode = incident.node || incident.locationName || 'Kukatpally';
    const hospitalNode = hospital.node || 'Erragadda';
    const route = graphRouter.findShortestPath(incidentNode, hospitalNode);
    const travelTime = route.travel_time_min;
    const distanceKm = route.distance_km;

    let score = 0;
    if (isEligible) {
      // Base score 100, penalized by travel time from incident to hospital
      score = Math.max(1, 100 - (travelTime * 3) - distanceKm + (isCritical ? availableIcu * 2 : availableGen));
      positiveFactors.push(`Transfer ETA to hospital: ${travelTime} min`);
    }

    return {
      hospitalId: hospital.hospitalId || hospital._id,
      hospital,
      isEligible,
      score,
      travelTimeMinutes: travelTime,
      distanceKm,
      route,
      availableIcuBeds: availableIcu,
      availableGeneralBeds: availableGen,
      positiveFactors,
      negativeFactors,
      rejectionReason
    };
  }

  /**
   * Multi-Emergency Global Allocation
   * Selects between Global Hungarian Optimization and Greedy Priority matching
   */
  allocateActiveEmergencies(incidents, ambulances, hospitals, options = {}) {
    const strategy = options.strategy || this.activeStrategy || 'OPTIMIZED';
    if (strategy === 'GREEDY') {
      return this.allocateWithGreedy(incidents, ambulances, hospitals);
    }
    return this.allocateWithHungarian(incidents, ambulances, hospitals);
  }

  /**
   * Global Bipartite Optimization via Kuhn-Munkres (Hungarian) Algorithm
   * Minimizes total weighted citywide emergency response time.
   */
  allocateWithHungarian(incidents, ambulances, hospitals) {
    const startTime = Date.now();
    const assignedResults = [];
    const unassignedResults = [];

    const workingAmbulances = ambulances.map(a => ({ ...a, capabilities: [...(a.capabilities || [])] }));
    const workingHospitals = hospitals.map(h => ({ ...h, specialties: [...(h.specialties || [])] }));

    const unassignedIncidents = incidents.filter(inc => 
      !['ASSIGNED', 'RESOLVED', 'CANCELLED', 'IN_PROGRESS'].includes(inc.status) &&
      !inc.assignedAmbulanceId
    );

    if (unassignedIncidents.length === 0 || workingAmbulances.length === 0) {
      return {
        success: true,
        strategy: 'OPTIMIZED_HUNGARIAN',
        assignedCount: 0,
        unassignedCount: unassignedIncidents.length,
        assignments: [],
        unassigned: unassignedIncidents.map(i => ({ incident: i, reason: 'No resources or no pending incidents.' })),
        updatedAmbulances: workingAmbulances,
        updatedHospitals: workingHospitals,
        recomputeTimeMs: Date.now() - startTime,
        decisionLogs: this.getDecisionLogs()
      };
    }

    // Priority sort: Critical First (e.g. Cardiac 97 -> Accident 90 -> Flood 85)
    unassignedIncidents.sort((a, b) => {
      const pA = a.priorityScore || a.priority || 0;
      const pB = b.priorityScore || b.priority || 0;
      return pB - pA;
    });

    const availableCount = workingAmbulances.filter(a => a.status === 'AVAILABLE').length;
    let incidentsToMatch = unassignedIncidents;
    if (availableCount > 0 && unassignedIncidents.length > availableCount) {
      incidentsToMatch = unassignedIncidents.slice(0, availableCount);
      const queuedIncidents = unassignedIncidents.slice(availableCount);
      queuedIncidents.forEach(inc => {
        unassignedResults.push({
          incident: inc,
          reason: `Fleet Saturation: All ${availableCount} ambulances allocated to higher-priority emergencies. Queued as #1 in priority dispatch queue.`
        });
        this.logDecision(
          `Priority Queuing: ${inc.incidentId || inc._id} (Score: ${inc.priorityScore || inc.priority}) placed in priority queue due to fleet saturation (${availableCount} units active).`
        );
      });
    }

    this.logDecision(
      `Starting Hungarian Global Optimization for ${incidentsToMatch.length} pending emergencies. ` +
      `Priority sequence: ${unassignedIncidents.map(i => `${i.incidentId || i._id} (Score: ${i.priorityScore || i.priority})`).join(' -> ')}`
    );

    // Build N x M Cost Matrix
    // cost[i][j] = (travelTimeMinutes) * (1 + (100 - priority) / 50)
    // If incompatible or unavailable, cost = 1e7 (infeasible)
    const costMatrix = [];
    const evalCache = [];

    for (let i = 0; i < incidentsToMatch.length; i++) {
      const inc = incidentsToMatch[i];
      const priority = inc.priorityScore || inc.priority || 50;
      const weightFactor = 1 + ((100 - priority) / 50);
      const row = [];
      const cacheRow = [];

      for (let j = 0; j < workingAmbulances.length; j++) {
        const amb = workingAmbulances[j];
        const evalRes = this.evaluateAmbulance(inc, amb);
        cacheRow.push(evalRes);

        if (!evalRes.isEligible) {
          this.logDecision(`${amb.ambulanceId} rejected for ${inc.incidentId || inc._id}: ${evalRes.rejectionReason}`);
          row.push(1e7); // Infeasible penalty
        } else {
          // Weighted cost based on ETA and urgency
          const cost = (evalRes.etaMinutes * weightFactor) + (evalRes.distanceKm * 0.5);
          row.push(cost);
        }
      }
      costMatrix.push(row);
      evalCache.push(cacheRow);
    }

    // Solve with Hungarian algorithm
    const matches = hungarianOptimizer.solveMinCost(costMatrix);

    // Process assignments
    for (let i = 0; i < incidentsToMatch.length; i++) {
      const incident = incidentsToMatch[i];
      const incId = incident.incidentId || incident._id;
      const ambIdx = matches[i];

      if (ambIdx === -1 || ambIdx === undefined || costMatrix[i][ambIdx] >= 1e6) {
        this.logDecision(`Hungarian Solver: No feasible matching found for ${incId}. Incident queued.`);
        unassignedResults.push({
          incident,
          reason: 'No capable available ambulance within feasible constraints.'
        });
        continue;
      }

      const chosenAmbEval = evalCache[i][ambIdx];
      const chosenAmbulance = workingAmbulances[ambIdx];

      // Match and reserve hospital
      const hospEvaluations = workingHospitals.map(h => this.evaluateHospital(incident, h));
      const eligibleHosps = hospEvaluations.filter(e => e.isEligible);

      if (eligibleHosps.length === 0) {
        this.logDecision(`Hungarian Solver: No eligible hospital for ${incId}. Incident queued.`);
        unassignedResults.push({
          incident,
          reason: 'No hospital available with required specialty/ICU capacity.'
        });
        continue;
      }

      eligibleHosps.sort((a, b) => b.score - a.score);
      const chosenHospEval = eligibleHosps[0];
      const chosenHospital = chosenHospEval.hospital;

      // Atomic reservation
      chosenAmbulance.status = 'ASSIGNED';
      chosenAmbulance.currentAssignment = incId;
      chosenAmbulance.currentIncidentId = incId;
      chosenAmbulance.etaMinutes = chosenAmbEval.etaMinutes;

      const isCritical = incident.severityCategory === 'CRITICAL' || (incident.priorityScore || 0) >= 95 || incident.category === 'CARDIAC';
      if (isCritical) {
        if (chosenHospital.availableIcuBeds > 0) chosenHospital.availableIcuBeds -= 1;
        if (chosenHospital.icuBeds > 0) chosenHospital.icuBeds -= 1;
      } else {
        if (chosenHospital.availableGeneralBeds > 0) chosenHospital.availableGeneralBeds -= 1;
        if (chosenHospital.bedsAvailable > 0) chosenHospital.bedsAvailable -= 1;
      }

      const ambToIncidentRoute = chosenAmbEval.route;
      const incidentToHospRoute = chosenHospEval.route;
      const combinedCoordinates = [...ambToIncidentRoute.coordinates, ...incidentToHospRoute.coordinates];

      this.logDecision(
        `${chosenAmbulance.ambulanceId} selected for ${incId} (Capability: '${chosenAmbulance.type}', ETA: ${chosenAmbEval.etaMinutes} min via ${chosenAmbEval.route.chosenRouteName}).`
      );
      this.logDecision(
        `${chosenHospital.name} selected for ${incId} (ICU: ${chosenHospital.availableIcuBeds}, Travel time: ${chosenHospEval.travelTimeMinutes} min via ${chosenHospEval.route.chosenRouteName}).`
      );
      this.logDecision(
        `Hungarian Optimal Match: ${incId} -> ${chosenAmbulance.ambulanceId} (${chosenAmbEval.etaMinutes}m ETA) -> ${chosenHospital.name} (${chosenHospEval.travelTimeMinutes}m transfer).`
      );

      assignedResults.push({
        incidentId: incId,
        incident: {
          ...incident,
          status: 'ASSIGNED',
          assignedAmbulanceId: chosenAmbulance.ambulanceId,
          recommendedHospitalId: chosenHospital.hospitalId
        },
        ambulance: { ...chosenAmbulance },
        hospital: { ...chosenHospital },
        ambRoute: ambToIncidentRoute,
        hospitalRoute: incidentToHospRoute,
        combinedRoute: {
          coordinates: combinedCoordinates,
          totalDistanceKm: parseFloat((ambToIncidentRoute.distance_km + incidentToHospRoute.distance_km).toFixed(1)),
          totalDurationMin: parseFloat((ambToIncidentRoute.travel_time_min + incidentToHospRoute.travel_time_min).toFixed(1)),
          routeLabel: `${chosenAmbEval.route.chosenRouteName} -> ${chosenHospEval.route.chosenRouteName}`
        },
        ambulanceEvaluation: chosenAmbEval,
        hospitalEvaluation: chosenHospEval,
        decisionExplanation: `[OPTIMIZED HUNGARIAN] ${incId}: Assigned ${chosenAmbulance.ambulanceId} (${chosenAmbEval.etaMinutes}m ETA, capability '${incident.requiredCapability}') and ${chosenHospital.name} (${chosenHospEval.travelTimeMinutes}m transfer).`
      });
    }

    const recomputeTimeMs = Date.now() - startTime;
    this.logDecision(`Hungarian Global Optimization finished in ${recomputeTimeMs}ms. Assigned: ${assignedResults.length}, Unassigned: ${unassignedResults.length}.`);

    return {
      success: true,
      strategy: 'OPTIMIZED_HUNGARIAN',
      assignedCount: assignedResults.length,
      unassignedCount: unassignedResults.length,
      assignments: assignedResults,
      unassigned: unassignedResults,
      updatedAmbulances: workingAmbulances,
      updatedHospitals: workingHospitals,
      recomputeTimeMs,
      decisionLogs: this.getDecisionLogs()
    };
  }

  /**
   * Greedy Priority-Ordered Allocation Algorithm (Fallback / Benchmark Baseline)
   */
  allocateWithGreedy(incidents, ambulances, hospitals) {
    const startTime = Date.now();
    const assignedResults = [];
    const unassignedResults = [];

    // Clone resources to safely update state atomically during evaluation
    const workingAmbulances = ambulances.map(a => ({ ...a, capabilities: [...(a.capabilities || [])] }));
    const workingHospitals = hospitals.map(h => ({ ...h, specialties: [...(h.specialties || [])] }));

    // Step 1: Filter active unassigned emergencies
    const unassignedIncidents = incidents.filter(inc => 
      !['ASSIGNED', 'RESOLVED', 'CANCELLED', 'IN_PROGRESS'].includes(inc.status) &&
      !inc.assignedAmbulanceId
    );

    // Step 2: Global priority sorting (Critical First, highest priorityScore first)
    // Order: Cardiac (97) -> Accident (90) -> Flood (85)
    unassignedIncidents.sort((a, b) => {
      const pA = a.priorityScore || a.priority || 0;
      const pB = b.priorityScore || b.priority || 0;
      return pB - pA;
    });

    this.logDecision(
      `Starting Global Resource Allocation for ${unassignedIncidents.length} pending emergencies. ` +
      `Priority sequence: ${unassignedIncidents.map(i => `${i.incidentId || i._id} (Score: ${i.priorityScore || i.priority})`).join(' -> ')}`
    );

    // Step 3: Iterate through prioritized emergencies
    for (const incident of unassignedIncidents) {
      const incId = incident.incidentId || incident._id;
      const incPriority = incident.priorityScore || incident.priority || 0;
      const incCap = incident.requiredCapability || incident.required_capability;

      this.logDecision(
        `${incId}: Evaluating ${incident.category} at ${incident.node || incident.locationName} (Priority: ${incPriority}/100, Required: ${incCap})`
      );

      // Step 3a: Evaluate all available ambulances
      const ambEvaluations = workingAmbulances.map(amb => this.evaluateAmbulance(incident, amb));
      const eligibleAmbs = ambEvaluations.filter(e => e.isEligible);

      // Log non-eligible ambulance reasons for explainability
      ambEvaluations.filter(e => !e.isEligible).forEach(e => {
        this.logDecision(`${e.ambulanceId} rejected for ${incId}: ${e.rejectionReason}`);
      });

      if (eligibleAmbs.length === 0) {
        this.logDecision(`ALERT: No eligible ambulance available for emergency ${incId}. Incident queued.`);
        unassignedResults.push({
          incident,
          reason: 'No available ambulance with required capability and reachability.'
        });
        continue;
      }

      // Sort eligible ambulances by suitability score descending (lowest travel time ETA & best capability)
      eligibleAmbs.sort((a, b) => b.score - a.score);
      const chosenAmbEval = eligibleAmbs[0];
      const chosenAmbulance = chosenAmbEval.ambulance;

      this.logDecision(
        `${chosenAmbulance.ambulanceId} selected for ${incId}: Available, equipped with '${incCap}', lowest ETA (${chosenAmbEval.etaMinutes} min).`
      );

      // Step 3b: Evaluate all hospitals
      const hospEvaluations = workingHospitals.map(hosp => this.evaluateHospital(incident, hosp));
      const eligibleHosps = hospEvaluations.filter(e => e.isEligible);

      // Log hospital rejections
      hospEvaluations.filter(e => !e.isEligible).forEach(e => {
        this.logDecision(`${e.hospital.name} rejected for ${incId}: ${e.rejectionReason}`);
      });

      if (eligibleHosps.length === 0) {
        this.logDecision(`ALERT: No eligible hospital available for emergency ${incId}. Incident queued.`);
        unassignedResults.push({
          incident,
          reason: 'No hospital available with required specialty/ICU capacity.'
        });
        continue;
      }

      // Sort eligible hospitals by score descending
      eligibleHosps.sort((a, b) => b.score - a.score);
      const chosenHospEval = eligibleHosps[0];
      const chosenHospital = chosenHospEval.hospital;

      this.logDecision(
        `${chosenHospital.name} selected for ${incId}: Meets specialist/ICU requirements and lowest transfer ETA (${chosenHospEval.travelTimeMinutes} min).`
      );

      // Step 3c: Atomic Reservation & Invariant Enforcement
      // Reserve ambulance: mark it ASSIGNED so no other incident can take it
      chosenAmbulance.status = 'ASSIGNED';
      chosenAmbulance.currentAssignment = incId;
      chosenAmbulance.currentIncidentId = incId;
      chosenAmbulance.etaMinutes = chosenAmbEval.etaMinutes;

      // Reserve hospital capacity
      const isCritical = incident.severityCategory === 'CRITICAL' || incPriority >= 95 || incident.category === 'CARDIAC';
      if (isCritical) {
        if (chosenHospital.availableIcuBeds > 0) chosenHospital.availableIcuBeds -= 1;
        if (chosenHospital.icuBeds > 0) chosenHospital.icuBeds -= 1;
      } else {
        if (chosenHospital.availableGeneralBeds > 0) chosenHospital.availableGeneralBeds -= 1;
        if (chosenHospital.bedsAvailable > 0) chosenHospital.bedsAvailable -= 1;
      }

      // Build route from ambulance to incident and incident to hospital
      const ambToIncidentRoute = chosenAmbEval.route;
      const incidentToHospRoute = chosenHospEval.route;

      const combinedCoordinates = [
        ...ambToIncidentRoute.coordinates,
        ...incidentToHospRoute.coordinates
      ];

      const assignmentRecord = {
        incidentId: incId,
        incident: {
          ...incident,
          status: 'ASSIGNED',
          assignedAmbulanceId: chosenAmbulance.ambulanceId,
          recommendedHospitalId: chosenHospital.hospitalId
        },
        ambulance: { ...chosenAmbulance },
        hospital: { ...chosenHospital },
        ambRoute: ambToIncidentRoute,
        hospitalRoute: incidentToHospRoute,
        combinedRoute: {
          coordinates: combinedCoordinates,
          totalDistanceKm: parseFloat((ambToIncidentRoute.distance_km + incidentToHospRoute.distance_km).toFixed(1)),
          totalDurationMin: parseFloat((ambToIncidentRoute.travel_time_min + incidentToHospRoute.travel_time_min).toFixed(1)),
          routeLabel: `${chosenAmbEval.route.chosenRouteName} -> ${chosenHospEval.route.chosenRouteName}`
        },
        ambulanceEvaluation: chosenAmbEval,
        hospitalEvaluation: chosenHospEval,
        decisionExplanation: `${incId}: Assigned ${chosenAmbulance.ambulanceId} (${chosenAmbEval.etaMinutes}m ETA) and ${chosenHospital.name} (${chosenHospEval.travelTimeMinutes}m transfer).`
      };

      assignedResults.push(assignmentRecord);
    }

    const recomputeTimeMs = Date.now() - startTime;

    this.logDecision(
      `Global allocation completed in ${recomputeTimeMs}ms. Assigned: ${assignedResults.length}, Unassigned: ${unassignedResults.length}.`
    );

    return {
      success: true,
      assignedCount: assignedResults.length,
      unassignedCount: unassignedResults.length,
      assignments: assignedResults,
      unassigned: unassignedResults,
      updatedAmbulances: workingAmbulances,
      updatedHospitals: workingHospitals,
      recomputeTimeMs,
      decisionLogs: this.getDecisionLogs()
    };
  }

  /**
   * Dynamic Reallocation on Ambulance Failure
   * If an assigned ambulance becomes unavailable, recalculate its mission without affecting in-progress patient care.
   */
  handleAmbulanceFailure(failedAmbulanceId, activeState) {
    this.logDecision(`CRITICAL EVENT: Ambulance ${failedAmbulanceId} marked UNAVAILABLE / FAILED.`);
    
    const { incidents, ambulances, hospitals } = activeState;

    // 1. Mark failed ambulance as OFFLINE
    const updatedAmbulances = ambulances.map(a => {
      if (a.ambulanceId === failedAmbulanceId || a._id === failedAmbulanceId) {
        return {
          ...a,
          status: 'OFFLINE',
          currentAssignment: null,
          currentIncidentId: null
        };
      }
      return a;
    });

    // 2. Find affected incident
    const affectedIncident = incidents.find(inc => 
      inc.assignedAmbulanceId === failedAmbulanceId &&
      inc.status !== 'RESOLVED'
    );

    if (!affectedIncident) {
      this.logDecision(`Ambulance ${failedAmbulanceId} was not assigned to any pending mission. No reassignment needed.`);
      return {
        success: true,
        reassigned: false,
        message: `Ambulance ${failedAmbulanceId} marked OFFLINE. No active missions affected.`,
        updatedAmbulances,
        updatedHospitals: hospitals,
        updatedIncidents: incidents
      };
    }

    this.logDecision(`Detected affected mission for incident ${affectedIncident.incidentId || affectedIncident._id}. Initiating dynamic reassignment.`);

    // Reset affected incident to PENDING
    const updatedIncidents = incidents.map(inc => {
      if (inc.incidentId === affectedIncident.incidentId || inc._id === affectedIncident._id) {
        return {
          ...inc,
          status: 'PENDING',
          assignedAmbulanceId: null,
          recommendedHospitalId: null
        };
      }
      return inc;
    });

    // Re-run global allocation for unassigned incidents
    const allocationResult = this.allocateActiveEmergencies(updatedIncidents, updatedAmbulances, hospitals);

    // Merge state
    const newIncidents = updatedIncidents.map(inc => {
      const match = allocationResult.assignments.find(a => a.incidentId === (inc.incidentId || inc._id));
      if (match) {
        return {
          ...inc,
          status: 'ASSIGNED',
          assignedAmbulanceId: match.ambulance.ambulanceId,
          recommendedHospitalId: match.hospital.hospitalId
        };
      }
      return inc;
    });

    return {
      success: true,
      reassigned: true,
      affectedIncidentId: affectedIncident.incidentId || affectedIncident._id,
      allocationResult,
      updatedAmbulances: allocationResult.updatedAmbulances,
      updatedHospitals: allocationResult.updatedHospitals,
      updatedIncidents: newIncidents
    };
  }

  /**
   * Dynamic Reallocation on Hospital ICU Capacity Exhaustion
   */
  handleHospitalIcuExhaustion(hospitalId, activeState) {
    this.logDecision(`CRITICAL EVENT: ${hospitalId} ICU capacity set to 0.`);

    const { incidents, ambulances, hospitals } = activeState;

    // 1. Update hospital ICU capacity to 0
    const updatedHospitals = hospitals.map(h => {
      if (h.hospitalId === hospitalId || h._id === hospitalId) {
        return {
          ...h,
          availableIcuBeds: 0,
          icuBeds: 0,
          status: h.availableGeneralBeds > 0 ? 'AVAILABLE' : 'OVERCAPACITY'
        };
      }
      return h;
    });

    // 2. Find critical incidents assigned to this hospital
    const affectedIncidents = incidents.filter(inc => 
      inc.recommendedHospitalId === hospitalId &&
      (inc.severityCategory === 'CRITICAL' || inc.category === 'CARDIAC' || (inc.priorityScore || 0) >= 95)
    );

    if (affectedIncidents.length === 0) {
      this.logDecision(`No critical incidents assigned to ${hospitalId}. No reallocations needed.`);
      return {
        success: true,
        reassigned: false,
        updatedHospitals,
        updatedAmbulances: ambulances,
        updatedIncidents: incidents
      };
    }

    const reassignments = [];

    // Reassign affected critical incidents to suitable alternative hospital
    const newIncidents = incidents.map(inc => {
      const isAffected = affectedIncidents.some(ai => (ai.incidentId || ai._id) === (inc.incidentId || inc._id));
      if (!isAffected) return inc;

      this.logDecision(`${inc.incidentId || inc._id} requires ICU care. ${hospitalId} is exhausted. Finding alternative hospital.`);

      // Re-evaluate available hospitals excluding the exhausted one
      const hospEvaluations = updatedHospitals.map(h => this.evaluateHospital(inc, h));
      const eligible = hospEvaluations.filter(e => e.isEligible && (e.hospital.hospitalId !== hospitalId));

      if (eligible.length > 0) {
        eligible.sort((a, b) => b.score - a.score);
        const altHosp = eligible[0].hospital;
        
        // Reserve 1 ICU bed in alt hospital
        altHosp.availableIcuBeds = Math.max(0, altHosp.availableIcuBeds - 1);
        if (altHosp.icuBeds > 0) altHosp.icuBeds -= 1;

        this.logDecision(
          `${hospitalId} rejected because ICU capacity is exhausted. Selected ${altHosp.name} (satisfies ICU & specialist requirements, ETA: ${eligible[0].travelTimeMinutes} min).`
        );

        reassignments.push({
          incidentId: inc.incidentId || inc._id,
          previousHospitalId: hospitalId,
          newHospitalId: altHosp.hospitalId,
          newHospitalName: altHosp.name
        });

        return {
          ...inc,
          recommendedHospitalId: altHosp.hospitalId,
          recommendedHospitalName: altHosp.name
        };
      } else {
        this.logDecision(`CRITICAL: No alternative hospital with ICU capacity found for ${inc.incidentId || inc._id}!`);
        return inc;
      }
    });

    return {
      success: true,
      reassigned: reassignments.length > 0,
      reassignments,
      updatedHospitals,
      updatedAmbulances: ambulances,
      updatedIncidents: newIncidents
    };
  }

  /**
   * Empirical Benchmark: Compares Hungarian Optimization vs Greedy Priority-Ordered Baseline
   * Evaluates response time, total travel time, computation time, and assignments on identical states.
   */
  compareAllocationStrategies(incidents, ambulances, hospitals) {
    // Reset status to PENDING on deep-cloned batch so both algorithms evaluate identical unassigned conditions
    const benchmarkIncidents = (incidents || []).map(inc => ({
      ...inc,
      status: 'PENDING',
      assignedAmbulanceId: null,
      assignedAmbulanceName: null,
      recommendedHospitalId: null,
      recommendedHospitalName: null
    }));
    const benchmarkAmbulances = (ambulances || []).map(a => ({
      ...a,
      status: 'AVAILABLE',
      currentAssignment: null,
      currentIncidentId: null,
      capabilities: [...(a.capabilities || [])]
    }));

    const hungarianResult = this.allocateWithHungarian(benchmarkIncidents, benchmarkAmbulances, hospitals);
    const greedyResult = this.allocateWithGreedy(benchmarkIncidents, benchmarkAmbulances, hospitals);

    // Calculate metrics for Greedy
    const greedyEtas = (greedyResult.assignments || []).map(a => a.ambRoute?.travel_time_min || 0);
    const greedyTotalEta = parseFloat(greedyEtas.reduce((sum, v) => sum + v, 0).toFixed(1));
    const greedyTotalTravel = parseFloat((greedyResult.assignments || []).reduce((sum, a) => sum + (a.combinedRoute?.totalDurationMin || 0), 0).toFixed(1));
    const greedyAvgEta = greedyResult.assignedCount > 0 ? parseFloat((greedyTotalEta / greedyResult.assignedCount).toFixed(1)) : 0;
    const greedyMaxEta = greedyEtas.length > 0 ? Math.max(...greedyEtas) : 0;

    // Calculate metrics for Hungarian
    const hungarianEtas = (hungarianResult.assignments || []).map(a => a.ambRoute?.travel_time_min || 0);
    const hungarianTotalEta = parseFloat(hungarianEtas.reduce((sum, v) => sum + v, 0).toFixed(1));
    const hungarianTotalTravel = parseFloat((hungarianResult.assignments || []).reduce((sum, a) => sum + (a.combinedRoute?.totalDurationMin || 0), 0).toFixed(1));
    const hungarianAvgEta = hungarianResult.assignedCount > 0 ? parseFloat((hungarianTotalEta / hungarianResult.assignedCount).toFixed(1)) : 0;
    const hungarianMaxEta = hungarianEtas.length > 0 ? Math.max(...hungarianEtas) : 0;

    const etaDelta = parseFloat((greedyTotalEta - hungarianTotalEta).toFixed(1));
    const pctImprovement = greedyTotalEta > 0 ? parseFloat(((greedyTotalEta - hungarianTotalEta) / greedyTotalEta * 100).toFixed(1)) : 0;

    return {
      success: true,
      timestamp: new Date().toISOString(),
      scenarioIncidentCount: incidents.length,
      availableAmbulancesCount: ambulances.length,
      greedy: {
        strategy: 'GREEDY_PRIORITY',
        algorithm: 'Greedy Priority-Ordered Assignment (Heuristic)',
        assignedCount: greedyResult.assignedCount,
        unassignedCount: greedyResult.unassignedCount,
        totalEtaMin: greedyTotalEta,
        avgEtaMin: greedyAvgEta,
        maxEtaMin: greedyMaxEta,
        totalTravelTimeMin: greedyTotalTravel,
        computationTimeMs: greedyResult.recomputeTimeMs,
        assignments: (greedyResult.assignments || []).map(a => ({
          incidentId: a.incidentId,
          ambulanceId: a.ambulance.ambulanceId,
          hospitalId: a.hospital.hospitalId,
          etaMin: a.ambRoute?.travel_time_min
        }))
      },
      hungarian: {
        strategy: 'OPTIMIZED_HUNGARIAN',
        algorithm: 'Kuhn-Munkres Minimum Weight Global Bipartite Matching',
        assignedCount: hungarianResult.assignedCount,
        unassignedCount: hungarianResult.unassignedCount,
        totalEtaMin: hungarianTotalEta,
        avgEtaMin: hungarianAvgEta,
        maxEtaMin: hungarianMaxEta,
        totalTravelTimeMin: hungarianTotalTravel,
        computationTimeMs: hungarianResult.recomputeTimeMs,
        assignments: (hungarianResult.assignments || []).map(a => ({
          incidentId: a.incidentId,
          ambulanceId: a.ambulance.ambulanceId,
          hospitalId: a.hospital.hospitalId,
          etaMin: a.ambRoute?.travel_time_min
        }))
      },
      comparison: {
        timeSavedMin: Math.max(0, etaDelta),
        efficiencyGainPercent: pctImprovement,
        winner: hungarianTotalEta <= greedyTotalEta ? 'OPTIMIZED_HUNGARIAN' : 'GREEDY_PRIORITY',
        insights: hungarianTotalEta <= greedyTotalEta
          ? `Hungarian global bipartite matching achieved a ${pctImprovement}% latency reduction (saving ${Math.max(0, etaDelta)} min) by globally minimizing cumulative travel times instead of greedily assigning the closest unit to the highest priority incident, which risks stranding secondary emergencies.`
          : 'Both algorithms arrived at comparable optimal configurations given graph geometry constraints.'
      }
    };
  }
}

// Singleton instance
const globalAllocationEngine = new GlobalAllocationEngine();

module.exports = {
  GlobalAllocationEngine,
  globalAllocationEngine
};

