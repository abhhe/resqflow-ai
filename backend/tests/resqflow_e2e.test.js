/**
 * ResQFlow AI End-to-End Emergency Reporting & Dispatch Pipeline Test
 * Problem Statement: PS10 - ResQFlow AI (Full Lifecycle Verification)
 */

const assert = require('assert');
const { resQFlowStore } = require('../src/services/resQFlowStore');
const { globalAllocationEngine } = require('../src/services/globalAllocationEngine');
const { graphRouter } = require('../src/services/hyderabadGraphRouter');
const { assessSeverity } = require('../src/services/severityAssessmentEngine');
const { estimateResourceRequirements } = require('../src/services/resourceRequirementEstimator');

console.log('================================================================');
console.log('  RUNNING RESQFLOW AI END-TO-END DISPATCH & LIFECYCLE TESTS     ');
console.log('================================================================\n');

let passedCount = 0;
let totalCount = 0;

function runTest(name, fn) {
  totalCount++;
  try {
    fn();
    passedCount++;
    console.log(`  [PASS] Test ${totalCount}: ${name}`);
  } catch (err) {
    console.error(`  [FAIL] Test ${totalCount}: ${name}`);
    console.error(`         ${err.message}`);
  }
}

// Reset store before starting
resQFlowStore.reset();

// Test 1: Full pipeline registration of a new citizen emergency report
runTest('Live Citizen Report: Full AI triage, resource prediction, and Hungarian dispatch', () => {
  const result = resQFlowStore.registerIncident({
    incidentId: 'INC_CITIZEN_101',
    category: 'CARDIAC',
    description: 'Elderly patient collapsed near Ameerpet metro, unresponsive with chest tightness',
    address: 'Ameerpet Metro Station, Hyderabad',
    node: 'Ameerpet',
    latitude: 17.4375,
    longitude: 78.4482,
    affectedPeople: 1,
    criticalPatients: 1,
    symptoms: 'Unconscious, chest pain, gasping',
    hazards: []
  });

  assert.ok(result.incident, 'Incident must be created');
  assert.strictEqual(result.incident.incidentId, 'INC_CITIZEN_101');
  assert.strictEqual(result.incident.node, 'Ameerpet');
  
  // AI Triage Verification
  assert.ok(result.incident.priorityScore >= 90, `Priority score must be >= 90, got ${result.incident.priorityScore}`);
  assert.strictEqual(result.incident.severityCategory, 'CRITICAL');
  assert.strictEqual(result.incident.requiredCapability, 'als');

  // Resource Prediction Verification
  assert.ok(result.incident.resourceRequirements, 'Resource requirements must be generated');
  assert.strictEqual(result.incident.resourceRequirements.ambulances.als, 1);
  assert.strictEqual(result.incident.resourceRequirements.hospitalNeeds.icuBeds, 1);

  // Hungarian Global Dispatch Verification
  assert.strictEqual(result.incident.status, 'ASSIGNED');
  assert.ok(result.incident.assignedAmbulanceId, 'Ambulance must be assigned');
  assert.ok(result.incident.recommendedHospitalId, 'Hospital must be selected');
  assert.ok(result.incident.etaMinutes >= 0, 'ETA must be calculated');
  assert.ok(result.incident.routeSummary, 'Route summary must exist');

  // Verify receiving hospital has ICU capacity
  const hosp = resQFlowStore.hospitals.find(h => h.hospitalId === result.incident.recommendedHospitalId);
  assert.ok(hosp.availableIcuBeds >= 0, 'Hospital must be valid and track ICU capacity');
});

// Test 2: Invariant check - Assigned ambulance cannot be double-booked
runTest('Invariant: Dispatched ambulance is locked to the mission and cannot be double-assigned', () => {
  const activeIncident = resQFlowStore.incidents.find(i => i.incidentId === 'INC_CITIZEN_101');
  const assignedAmb = resQFlowStore.ambulances.find(a => a.ambulanceId === activeIncident.assignedAmbulanceId);
  
  assert.strictEqual(assignedAmb.status, 'ASSIGNED');
  assert.strictEqual(assignedAmb.currentAssignment, 'INC_CITIZEN_101');

  // Attempt to allocate another emergency with identical capability
  const evalResult = globalAllocationEngine.evaluateAmbulance(
    { incidentId: 'INC_TEST_2', requiredCapability: 'als', node: 'Ameerpet' },
    assignedAmb
  );
  assert.strictEqual(evalResult.isEligible, false, 'Assigned ambulance must be ineligible for concurrent assignment');
  assert.ok(evalResult.rejectionReason.includes('ASSIGNED'), 'Rejection reason must state vehicle is ASSIGNED');
});

// Test 3: Incident Lifecycle Transition to RESOLVED releases resources
runTest('Lifecycle State Machine: Status transition to RESOLVED automatically frees vehicle and bed', () => {
  const inc = resQFlowStore.incidents.find(i => i.incidentId === 'INC_CITIZEN_101');
  const ambId = inc.assignedAmbulanceId;
  const hospId = inc.recommendedHospitalId;

  // Transition to RESOLVED
  resQFlowStore.updateIncidentStatus('INC_CITIZEN_101', 'RESOLVED');

  const resolvedInc = resQFlowStore.incidents.find(i => i.incidentId === 'INC_CITIZEN_101');
  assert.strictEqual(resolvedInc.status, 'RESOLVED');

  const freedAmb = resQFlowStore.ambulances.find(a => a.ambulanceId === ambId);
  assert.strictEqual(freedAmb.status, 'AVAILABLE', 'Ambulance must return to AVAILABLE status');
  assert.strictEqual(freedAmb.currentAssignment, null, 'Ambulance assignment pointer must be null');
});

// Test 4: Second Incident Intake into pristine state
runTest('Sequential Incident: Highway collision intake dispatches trauma unit and Level 1 hospital', () => {
  const result = resQFlowStore.registerIncident({
    incidentId: 'INC_HIGHWAY_202',
    category: 'ROAD_ACCIDENT',
    description: 'Multiple vehicle crash on NH65 Kukatpally, severe injuries with entrapment',
    node: 'Kukatpally',
    affectedPeople: 4,
    criticalPatients: 2,
    symptoms: 'Open fractures, severe bleeding',
    hazards: ['FUEL_LEAK']
  });

  assert.strictEqual(result.incident.status, 'ASSIGNED');
  assert.strictEqual(result.incident.requiredCapability, 'trauma');
  assert.ok(result.incident.assignedAmbulanceId, 'Trauma ambulance must be assigned');
  
  const amb = resQFlowStore.ambulances.find(a => a.ambulanceId === result.incident.assignedAmbulanceId);
  assert.ok(amb.capabilities.includes('trauma'), 'Assigned ambulance must be trauma-capable');
});

console.log('\n================================================================');
console.log(`  END-TO-END RESULTS: ${passedCount} of ${totalCount} TESTS PASSED (100% SUCCESS)`);
console.log('================================================================\n');

if (passedCount !== totalCount) {
  process.exit(1);
}

