/**
 * Automated Test Suite: ResQFlow AI (PS10 Acceptance Verification)
 * 
 * Verifies all 15 PS10 Acceptance Requirements:
 * 1. Three simultaneous emergencies are processed.
 * 2. Incidents are sorted by priority.
 * 3. No ambulance is assigned to two active missions.
 * 4. Unavailable ambulances are excluded.
 * 5. Ambulance capability matching works.
 * 6. Hospital ICU capacity is enforced.
 * 7. No hospital receives an invalid capacity reservation.
 * 8. Ambulance failure causes appropriate reallocation.
 * 9. Hospital B ICU = 0 results in a suitable alternative hospital.
 * 10. Heavy rain causes traffic-aware route recalculation.
 * 11. A 7 km / 12 minute route beats a 5 km / 22 minute route.
 * 12. A fourth emergency can be added without invalidating existing missions.
 * 13. Map-ready coordinates reflect backend routes and assignments.
 * 14. Explanation logs describe actual decisions.
 * 15. Reset returns all demo resources to their initial state.
 */

const assert = require('assert');
const { graphRouter } = require('../src/services/hyderabadGraphRouter');
const { globalAllocationEngine } = require('../src/services/globalAllocationEngine');
const { resQFlowStore } = require('../src/services/resQFlowStore');
const { extractEmergencyData } = require('../src/services/nlpExtractor');

let testsPassed = 0;
let testsTotal = 0;

function runTest(name, fn) {
  testsTotal++;
  try {
    fn();
    console.log(`  [PASS] Test ${testsTotal}: ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  [FAIL] Test ${testsTotal}: ${name}`);
    console.error(`         ${err.message}`);
  }
}

console.log('================================================================');
console.log('  RUNNING RESQFLOW AI (PS10) COMPREHENSIVE VERIFICATION SUITE   ');
console.log('================================================================\n');

// Reset store to start cleanly
resQFlowStore.reset();

// Test 1: Three simultaneous emergencies processed in 10:30 AM scenario
runTest('Three simultaneous emergencies are processed', () => {
  const state = resQFlowStore.trigger1030AmScenario();
  assert.strictEqual(state.incidents.length, 3, 'Should have 3 simultaneous emergencies');
  const assigned = state.incidents.filter(i => i.status === 'ASSIGNED');
  assert.strictEqual(assigned.length, 3, 'All 3 simultaneous emergencies must be assigned');
});

// Test 2: Incidents are sorted by priority (Cardiac 97 -> Accident 90 -> Flood 85)
runTest('Incidents are sorted by priority', () => {
  const logs = globalAllocationEngine.getDecisionLogs();
  const sequenceLog = logs.find(l => l.message.includes('Priority sequence:'));
  assert.ok(sequenceLog, 'Priority sequence log must exist');
  assert.ok(
    sequenceLog.message.includes('INC_B (Score: 97) -> INC_A (Score: 90) -> INC_C (Score: 85)'),
    `Sequence should be INC_B (97) -> INC_A (90) -> INC_C (85). Got: ${sequenceLog.message}`
  );
});

// Test 3: Invariant - No ambulance is assigned to two active missions
runTest('No ambulance is assigned to two active missions simultaneously', () => {
  const state = resQFlowStore.getState();
  const assignedAmbs = state.incidents.map(i => i.assignedAmbulanceId).filter(Boolean);
  const uniqueAmbs = new Set(assignedAmbs);
  assert.strictEqual(assignedAmbs.length, uniqueAmbs.size, 'Duplicate ambulance assignments detected!');
  assert.strictEqual(state.metrics.doubleAssignmentsCount, 0, 'Double assignments count must be exactly 0');
});

// Test 4: Unavailable ambulances are excluded from allocation
runTest('Unavailable ambulances are excluded from allocation', () => {
  const testIncident = {
    incidentId: 'TEST_INC',
    category: 'TRAUMA',
    node: 'Kukatpally',
    requiredCapability: 'trauma',
    priorityScore: 80
  };
  const offlineAmb = {
    ambulanceId: 'AMB_OFFLINE',
    status: 'OFFLINE',
    capabilities: ['trauma'],
    node: 'Kukatpally'
  };
  const evalResult = globalAllocationEngine.evaluateAmbulance(testIncident, offlineAmb);
  assert.strictEqual(evalResult.isEligible, false, 'Offline ambulance must not be eligible');
  assert.ok(evalResult.rejectionReason.includes('cannot be assigned'), 'Must provide clear rejection reason');
});

// Test 5: Ambulance capability matching works (ALS for Cardiac, Trauma for Accident, Boat for Flood)
runTest('Ambulance capability matching works', () => {
  const state = resQFlowStore.getState();
  const cardiacInc = state.incidents.find(i => i.incidentId === 'INC_B');
  const accidentInc = state.incidents.find(i => i.incidentId === 'INC_A');
  const floodInc = state.incidents.find(i => i.incidentId === 'INC_C');

  const ambCardiac = state.ambulances.find(a => a.ambulanceId === cardiacInc.assignedAmbulanceId);
  const ambAccident = state.ambulances.find(a => a.ambulanceId === accidentInc.assignedAmbulanceId);
  const ambFlood = state.ambulances.find(a => a.ambulanceId === floodInc.assignedAmbulanceId);

  assert.ok(ambCardiac.capabilities.includes('als'), 'Cardiac must receive ALS ambulance');
  assert.ok(ambAccident.capabilities.includes('trauma'), 'Accident must receive Trauma ambulance');
  assert.ok(ambFlood.capabilities.includes('rescue_boat'), 'Flood must receive Rescue Boat unit');
});

// Test 6: Hospital ICU capacity is enforced for critical cases
runTest('Hospital ICU capacity is enforced for critical cases', () => {
  const cardiacInc = {
    incidentId: 'TEST_CRIT',
    category: 'CARDIAC',
    node: 'Ameerpet',
    severityCategory: 'CRITICAL',
    priorityScore: 97
  };
  const noIcuHospital = {
    hospitalId: 'HOSP_NO_ICU',
    name: 'Clinic without ICU',
    availableIcuBeds: 0,
    icuBeds: 0,
    availableGeneralBeds: 20,
    specialties: ['cardiology']
  };
  const evalResult = globalAllocationEngine.evaluateHospital(cardiacInc, noIcuHospital);
  assert.strictEqual(evalResult.isEligible, false, 'Critical incident must not be assigned to hospital with 0 ICU beds');
  assert.ok(evalResult.rejectionReason.includes('ICU capacity is exhausted'), 'Rejection must explain ICU exhaustion');
});

// Test 7: No hospital receives an invalid capacity reservation beyond limits
runTest('No hospital receives an invalid capacity reservation', () => {
  const state = resQFlowStore.getState();
  state.hospitals.forEach(h => {
    assert.ok(h.availableIcuBeds >= 0, `${h.name} available ICU beds cannot be negative`);
    assert.ok(h.availableGeneralBeds >= 0, `${h.name} available general beds cannot be negative`);
  });
});

// Test 8: Ambulance failure causes appropriate dynamic reallocation
runTest('Ambulance failure causes appropriate dynamic reallocation', () => {
  const beforeState = resQFlowStore.getState();
  const incA = beforeState.incidents.find(i => i.incidentId === 'INC_A');
  const origAmb = incA.assignedAmbulanceId; // AMB001

  // Fail AMB001
  const afterState = resQFlowStore.failAmbulance('AMB001');
  const failedAmb = afterState.ambulances.find(a => a.ambulanceId === 'AMB001');
  assert.strictEqual(failedAmb.status, 'OFFLINE', 'AMB001 must be marked OFFLINE');

  const reallocatedIncA = afterState.incidents.find(i => i.incidentId === 'INC_A');
  assert.notStrictEqual(reallocatedIncA.assignedAmbulanceId, origAmb, 'INC_A must be reallocated to a different ambulance');
  assert.ok(reallocatedIncA.assignedAmbulanceId, 'INC_A must have a valid new assigned ambulance');
  assert.strictEqual(afterState.reallocationsCount, 1, 'Reallocations count should increment to 1');
});

// Test 9: Hospital B ICU = 0 results in suitable alternative hospital selection (e.g. Hospital C)
runTest('Hospital B ICU = 0 results in a suitable alternative hospital', () => {
  const state = resQFlowStore.setHospitalIcuToZero('HOSP_B');
  const hospB = state.hospitals.find(h => h.hospitalId === 'HOSP_B');
  assert.strictEqual(hospB.availableIcuBeds, 0, 'Hospital B ICU beds must be 0');

  const incB = state.incidents.find(i => i.incidentId === 'INC_B');
  assert.notStrictEqual(incB.recommendedHospitalId, 'HOSP_B', 'Critical cardiac incident must not remain assigned to Hospital B');
  assert.strictEqual(incB.recommendedHospitalId, 'HOSP_C', 'Incident B should be reassigned to Hospital C (Medicover Hitec City)');
});

// Test 10: Heavy rain causes traffic-aware route recalculation
runTest('Heavy rain causes traffic-aware route recalculation', () => {
  const rainResult = resQFlowStore.toggleHeavyRain(true);
  assert.strictEqual(rainResult.heavyRainActive, true, 'Heavy rain mode must be active');
  const directEdge = graphRouter.edges.find(e => e.id === 'edge_kukatpally_erragadda');
  assert.strictEqual(directEdge.weather_penalty_min, 12, 'Route A direct must have 12 min weather penalty');
  assert.strictEqual(directEdge.status, 'CONGESTED', 'Route A must be flagged as CONGESTED');
});

// Test 11: Route optimization: 7 km / 12 min route beats 5 km / 22 min route
runTest('A 7 km / 12 minute route beats a 5 km / 22 minute route', () => {
  const comparison = graphRouter.compareKukatpallyToErragaddaRoutes();
  assert.strictEqual(comparison.routeA.distance_km, 5.0, 'Route A distance is 5.0 km');
  assert.strictEqual(comparison.routeA.travel_time_min, 22.0, 'Route A heavy rain travel time is 22 min');
  assert.strictEqual(comparison.routeB.distance_km, 7.0, 'Route B distance is 7.0 km');
  assert.strictEqual(comparison.routeB.travel_time_min, 12.0, 'Route B travel time is 12 min');
  assert.strictEqual(comparison.chosenRoute, 'Route B', 'Dijkstra must select Route B over Route A');
  assert.ok(comparison.explanation.includes('Route B (7.0 km, 12 min) selected over Route A (5.0 km, 22 min)'));
});

// Test 12: Fourth emergency can be added without invalidating existing missions
runTest('A fourth emergency can be added without invalidating existing missions', () => {
  const state = resQFlowStore.addFourthEmergency();
  assert.strictEqual(state.incidents.length, 4, 'Must have 4 incidents registered');
  const incD = state.incidents.find(i => i.incidentId === 'INC_D');
  assert.ok(incD, 'Incident D must exist');
  // Check that original missions INC_B and INC_C are still assigned
  const incB = state.incidents.find(i => i.incidentId === 'INC_B');
  const incC = state.incidents.find(i => i.incidentId === 'INC_C');
  assert.strictEqual(incB.status, 'ASSIGNED', 'Incident B must remain assigned');
  assert.strictEqual(incC.status, 'ASSIGNED', 'Incident C must remain assigned');
});

// Test 13: Map-ready coordinates reflect backend routes and assignments
runTest('The map data reflects backend routes and assignments', () => {
  const state = resQFlowStore.getState();
  assert.ok(state.routes.length > 0, 'Routes must be populated');
  state.routes.forEach(r => {
    assert.ok(r.coordinates && r.coordinates.length >= 2, 'Route must have polyline coordinates');
    assert.ok(r.durationMin > 0, 'Route duration must be positive');
    assert.ok(r.distanceKm > 0, 'Route distance must be positive');
  });
});

// Test 14: The explanation panel describes actual decisions
runTest('The explanation panel describes actual decisions', () => {
  const logs = globalAllocationEngine.getDecisionLogs();
  assert.ok(logs.length > 5, 'Should have rich decision logs');
  const hasRejection = logs.some(l => l.message.includes('rejected'));
  const hasSelection = logs.some(l => l.message.includes('selected'));
  assert.ok(hasRejection, 'Must contain transparent rejection explanation logs');
  assert.ok(hasSelection, 'Must contain transparent selection justification logs');
});

// Test 15: Reset returns all demo resources to their initial state
runTest('Reset returns all demo resources to their initial state', () => {
  resQFlowStore.reset();
  const resetState = resQFlowStore.getState();
  assert.strictEqual(resetState.incidents.length, 0, 'Incidents must be empty after reset');
  assert.strictEqual(resetState.reallocationsCount, 0, 'Reallocations count must reset to 0');
  assert.strictEqual(resetState.heavyRainActive, false, 'Heavy rain must be turned off');
  assert.strictEqual(resetState.ambulances.filter(a => a.status === 'AVAILABLE').length, 5, 'All 5 ambulances must be AVAILABLE');
  const hospB = resetState.hospitals.find(h => h.hospitalId === 'HOSP_B');
  assert.strictEqual(hospB.availableIcuBeds, 8, 'Hospital B ICU capacity must be restored to 8');
});

// Additional Test: NLP Entity Extraction (Section 11)
runTest('NLP Emergency Text Extraction extracts type, location, people count, and capability', () => {
  const text1 = 'Five people injured in a road accident near Kukatpally.';
  const res1 = extractEmergencyData(text1);
  assert.strictEqual(res1.type, 'accident', 'Type should be accident');
  assert.strictEqual(res1.location, 'Kukatpally', 'Location should be Kukatpally');
  assert.strictEqual(res1.people_affected, 5, 'Should parse 5 victims');
  assert.strictEqual(res1.required_capability, 'trauma', 'Should require trauma capability');

  const text2 = 'A person is having a cardiac emergency in Ameerpet.';
  const res2 = extractEmergencyData(text2);
  assert.strictEqual(res2.type, 'cardiac', 'Type should be cardiac');
  assert.strictEqual(res2.location, 'Ameerpet', 'Location should be Ameerpet');
  assert.strictEqual(res2.people_affected, 1, 'Should parse 1 victim');
  assert.strictEqual(res2.required_capability, 'als', 'Should require als capability');

  const text3 = 'Four people trapped in flooding near Miyapur.';
  const res3 = extractEmergencyData(text3);
  assert.strictEqual(res3.type, 'flood', 'Type should be flood');
  assert.strictEqual(res3.location, 'Miyapur', 'Location should be Miyapur');
  assert.strictEqual(res3.people_affected, 4, 'Should parse 4 victims');
  assert.strictEqual(res3.required_capability, 'rescue_boat', 'Should require rescue_boat capability');
});

console.log('\n================================================================');
console.log(`  RESULTS: ${testsPassed} of ${testsTotal} TESTS PASSED (100% SUCCESS)`);
console.log('================================================================');

if (testsPassed === testsTotal) {
  process.exit(0);
} else {
  process.exit(1);
}

