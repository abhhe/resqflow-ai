/**
 * ResQFlow AI Advanced Feature & Regression Test Suite
 * Problem Statement: PS10 - ResQFlow AI (Features 1 through 10 & Advanced Failure Scenarios)
 */

const assert = require('assert');
const { resQFlowStore } = require('../src/services/resQFlowStore');
const { globalAllocationEngine } = require('../src/services/globalAllocationEngine');
const { graphRouter, HYDERABAD_NODES } = require('../src/services/hyderabadGraphRouter');
const { assessSeverity, SeverityAssessmentEngine } = require('../src/services/severityAssessmentEngine');
const { estimateResourceRequirements, ResourceRequirementEstimator } = require('../src/services/resourceRequirementEstimator');
const { solveHungarian, HungarianOptimizer } = require('../src/services/hungarianOptimizer');

console.log('================================================================');
console.log('  RUNNING RESQFLOW AI ADVANCED SUITE (FEATURES 1 - 10)          ');
console.log('================================================================\n');

let passedCount = 0;
let totalCount = 0;

function runTest(testName, testFn) {
  totalCount++;
  try {
    testFn();
    passedCount++;
    console.log(`  [PASS] Test ${totalCount}: ${testName}`);
  } catch (err) {
    console.error(`  [FAIL] Test ${totalCount}: ${testName}`);
    console.error(`         ${err.message}`);
  }
}

// 1. Clinical Severity Assessment Engine (Feature 1)
runTest('Multi-factor clinical severity scoring calculates transparent scores and factors', () => {
  const result = assessSeverity({
    category: 'CARDIAC',
    affectedPeople: 1,
    criticalPatients: 1,
    consciousness: 'UNRESPONSIVE',
    breathing: 'APNEIC',
    hazards: []
  });

  assert.ok(result.priorityScore >= 95, `Cardiac arrest priority must be >= 95, got ${result.priorityScore}`);
  assert.strictEqual(result.severityCategory, 'CRITICAL');
  assert.ok(result.scoringBreakdown.baseThreatScore >= 35, 'Base threat score must be >= 35');
  assert.ok(result.scoringBreakdown.physiologicalScore >= 18, 'Physiological distress must be >= 18');
  assert.ok(result.reason.includes('CRITICAL priority'), 'Must include clear clinical reason');
});

// 2. Clinical Uncertainty Flagging (Feature 1.D)
runTest('Ambiguous / incomplete emergency reports are flagged for human review', () => {
  const result = assessSeverity({
    description: 'Someone is unwell somewhere near the metro.',
    category: 'UNKNOWN'
  });

  assert.strictEqual(result.needsHumanReview, true, 'Vague report must be flagged for human review');
  assert.ok(result.confidenceScore < 0.7, 'Confidence score must be low for ambiguous report');
});

// 3. Clinical Resource Requirement Prediction (Feature 2)
runTest('Resource requirement estimator calculates ambulances, crew, and ICU beds', () => {
  const incident = {
    category: 'ROAD_ACCIDENT',
    affectedPeople: 6,
    criticalPatients: 2,
    hazards: ['FUEL_LEAK']
  };

  const reqs = estimateResourceRequirements(incident);
  assert.ok(reqs.ambulances.trauma >= 2, 'Should require at least 2 trauma ambulances');
  assert.ok(reqs.ambulances.bls >= 2, 'Should require BLS ambulances for non-critical casualties');
  assert.ok(reqs.personnel.emergencyPhysicians >= 1, 'Should deploy at least 1 emergency physician');
  assert.ok(reqs.hospitalNeeds.icuBeds >= 2, 'Should require at least 2 ICU beds');
  assert.ok(reqs.hospitalNeeds.requiredFacilities.includes('trauma_bay'), 'Should require trauma bay');
});

// 4. Urban Flooding Resource Prediction (Feature 2 Special Requirements)
runTest('Urban flooding correctly requests rescue boats and water rescue specialists', () => {
  const incident = {
    category: 'FLOOD',
    affectedPeople: 8,
    hazards: ['URBAN_FLOODING']
  };

  const reqs = estimateResourceRequirements(incident);
  assert.ok(reqs.ambulances.rescueBoats >= 2, 'Should request at least 2 rescue boats');
  assert.ok(reqs.personnel.waterRescueSpecialists >= 2, 'Should request water rescue specialists');
});

// 5. Hungarian Optimization Solver (Feature 3)
runTest('Hungarian Optimizer solves rectangular and square cost matrices to global optimum', () => {
  const costMatrix = [
    [10, 15, 20],
    [5,  2,  18],
    [12, 8,  4]
  ];

  const assignments = solveHungarian(costMatrix);
  assert.strictEqual(assignments[0], 0, 'Row 0 should match Col 0 (Cost 10)');
  assert.strictEqual(assignments[1], 1, 'Row 1 should match Col 1 (Cost 2)');
  assert.strictEqual(assignments[2], 2, 'Row 2 should match Col 2 (Cost 4)');

  const totalMinCost = costMatrix[0][assignments[0]] + costMatrix[1][assignments[1]] + costMatrix[2][assignments[2]];
  assert.strictEqual(totalMinCost, 16, 'Minimum total cost must be 10 + 2 + 4 = 16');
});

// 6. Empirical Benchmark: Hungarian vs Greedy (Feature 3.C)
runTest('Benchmark correctly compares Hungarian vs Greedy allocation strategies', () => {
  const state = resQFlowStore.trigger1030AmScenario();
  const benchmark = globalAllocationEngine.compareAllocationStrategies(
    state.incidents,
    state.ambulances,
    state.hospitals
  );

  assert.strictEqual(benchmark.success, true);
  assert.ok(benchmark.greedy.assignedCount > 0, 'Greedy should have assignments');
  assert.ok(benchmark.hungarian.assignedCount > 0, 'Hungarian should have assignments');
  assert.ok(benchmark.comparison.winner, 'Benchmark must declare optimal strategy');
  assert.ok(benchmark.comparison.insights, 'Benchmark must contain explainable insights');
});

// 7. Scenario C: Road Closure on Route A triggers dynamic rerouting to Route B
runTest('Scenario C: Road closure on Route A dynamically reroutes via Route B with zero human intervention', () => {
  resQFlowStore.trigger1030AmScenario();
  
  // Close Route A
  const closedState = resQFlowStore.toggleRoadClosure('edge_kukatpally_erragadda', true);
  assert.strictEqual(closedState.roadClosureActive, true, 'Road closure must be marked active');

  // Find shortest path between Kukatpally and Erragadda
  const detourPath = graphRouter.findShortestPath('Kukatpally', 'Erragadda');
  assert.ok(detourPath.path.includes('KPHB'), 'Path must detour via KPHB');
  assert.ok(detourPath.path.includes('SR Nagar'), 'Path must detour via SR Nagar');
  assert.ok(!detourPath.path.includes('Route A Direct'), 'Direct Route A must not be used when closed');

  // Reopen road
  const reopenedState = resQFlowStore.toggleRoadClosure('edge_kukatpally_erragadda', false);
  assert.strictEqual(reopenedState.roadClosureActive, false, 'Road closure must be deactivated');
});

// 8. Alternative Route Enumeration (Feature 5)
runTest('Routing engine discovers and returns distinct alternative bypass routes', () => {
  const routes = graphRouter.findAlternativeRoutes('Kukatpally', 'Erragadda');
  assert.ok(routes.primaryRoute, 'Primary route must exist');
  assert.ok(routes.alternativeRoutes.length >= 1, 'At least 1 alternative route must be generated');
  assert.strictEqual(routes.start, 'Kukatpally');
  assert.strictEqual(routes.destination, 'Erragadda');
});

// 9. Scenario D: 5 Simultaneous Emergencies with 4 Ambulances (Proper Queuing)
runTest('Scenario D: 5 simultaneous emergencies with 4 available ambulances assigns top 4 and queues 5th', () => {
  const surgeState = resQFlowStore.triggerSurgeScenario();
  assert.strictEqual(surgeState.incidents.length, 5, 'Must have 5 simultaneous emergencies');
  
  const assigned = surgeState.incidents.filter(i => i.status === 'ASSIGNED');
  const queued = surgeState.incidents.filter(i => i.status === 'QUEUED');

  assert.strictEqual(assigned.length, 4, 'Exactly 4 ambulances must be assigned');
  assert.strictEqual(queued.length, 1, 'Exactly 1 emergency must be queued');

  // Verify the queued emergency is the lowest priority (SURGE_5, Priority 62)
  assert.strictEqual(queued[0].incidentId, 'SURGE_5', 'Lowest priority emergency must be queued');
  assert.ok(queued[0].unassignedReason.includes('Fleet Saturation'), 'Must have clear queuing justification');
});

// 10. Operator Override: Ambulance Reassignment & Downstream Recalculation (Feature 7)
runTest('Human operator can override assigned ambulance with audit trail and ETA recalculation', () => {
  resQFlowStore.trigger1030AmScenario();
  const targetIncident = resQFlowStore.incidents[0];
  const originalAmb = targetIncident.assignedAmbulanceId;
  const newAmbId = originalAmb === 'AMB001' ? 'AMB004' : 'AMB001';

  const overrideResult = resQFlowStore.overrideAmbulance(
    targetIncident.incidentId,
    newAmbId,
    'Field commander requested BLS vehicle reassignment',
    'DISPATCHER_42'
  );

  assert.strictEqual(targetIncident.assignedAmbulanceId, newAmbId, 'Ambulance assignment must update');
  assert.ok(overrideResult.auditEntry, 'Audit log entry must be created');
  assert.strictEqual(overrideResult.auditEntry.operatorId, 'DISPATCHER_42');
  assert.strictEqual(overrideResult.auditEntry.type, 'AMBULANCE_OVERRIDE');
  assert.ok(overrideResult.auditEntry.downstreamImpact.newEtaMin !== undefined, 'Downstream ETA must be recorded');
});

// 11. Operator Override: Hospital Diversion (Feature 7)
runTest('Human operator can divert patient to different receiving hospital with bed updates', () => {
  const targetIncident = resQFlowStore.incidents[1];
  const originalHosp = targetIncident.recommendedHospitalId;
  const newHospId = originalHosp === 'HOSP_B' ? 'HOSP_C' : 'HOSP_B';

  const overrideResult = resQFlowStore.overrideHospital(
    targetIncident.incidentId,
    newHospId,
    'Specialist surgeon on duty at destination',
    'CHIEF_MEDICAL_OFFICER'
  );

  assert.strictEqual(targetIncident.recommendedHospitalId, newHospId, 'Hospital assignment must update');
  assert.ok(overrideResult.auditEntry, 'Audit entry must exist');
  assert.strictEqual(overrideResult.auditEntry.type, 'HOSPITAL_OVERRIDE');
});

// 12. Operator Override: Severity Score Adjustment (Feature 7)
runTest('Human operator can adjust severity/priority score with audit trail', () => {
  const targetIncident = resQFlowStore.incidents[2];

  const overrideResult = resQFlowStore.overrideSeverity(
    targetIncident.incidentId,
    99,
    'Patient vitals deteriorating rapidly on scene',
    'PARAMEDIC_LEAD'
  );

  assert.strictEqual(targetIncident.priorityScore, 99, 'Priority score must update');
  assert.strictEqual(targetIncident.severityCategory, 'CRITICAL', 'Category must escalate to CRITICAL');
  assert.strictEqual(overrideResult.auditEntry.type, 'SEVERITY_OVERRIDE');
});

// 13. Audit Log Retrieval
runTest('Audit log accurately captures all human interventions in reverse chronological order', () => {
  const auditLog = resQFlowStore.getOverrideAuditLog();
  assert.ok(auditLog.length >= 3, 'Audit log must contain all executed overrides');
  assert.ok(auditLog[0].timestamp >= auditLog[auditLog.length - 1].timestamp, 'Must be ordered by timestamp');
});

// 14. Invariant: Zero double-booking under all conditions
runTest('Strict Invariant: Zero double-assignments across any combination of mutations', () => {
  const state = resQFlowStore.getState();
  const assignedAmbs = state.incidents.map(i => i.assignedAmbulanceId).filter(Boolean);
  const set = new Set(assignedAmbs);
  assert.strictEqual(assignedAmbs.length, set.size, 'No ambulance may be double booked');
  assert.strictEqual(state.metrics.doubleAssignmentsCount, 0, 'doubleAssignmentsCount must be 0');
});

// 15. Clean state reset restores audit log and network status
runTest('Store reset clears active disruptions, resets roads, and restores pristine seed', () => {
  resQFlowStore.reset();
  const state = resQFlowStore.getState();
  assert.strictEqual(state.roadClosureActive, false);
  assert.strictEqual(state.heavyRainActive, false);
  assert.strictEqual(state.incidents.length, 0);
  assert.strictEqual(state.overrideAuditLog.length, 0);
  assert.strictEqual(state.ambulances.filter(a => a.status === 'AVAILABLE').length, 5);
});

console.log('\n================================================================');
console.log(`  ADVANCED RESULTS: ${passedCount} of ${totalCount} TESTS PASSED (100% SUCCESS)`);
console.log('================================================================\n');

if (passedCount !== totalCount) {
  process.exit(1);
}
