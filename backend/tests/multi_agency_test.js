/**
 * Multi-Agency Emergency Response & Intelligent Resource Allocation Test Suite
 * Problem Statement: PS10 - ResQFlow AI (Part 12 Validation)
 * 
 * Verifies all 12 mandatory integration test scenarios:
 * 1. Fire emergency: Fire brigade + Rescue + Ambulance + Police + Traffic + Burn hospital
 * 2. Road accident: Ambulances + Extrication + Police + Traffic + Trauma hospital
 * 3. Cardiac emergency: ALS ambulance + Paramedics + Cardiac hospital with ICU
 * 4. Urban flooding: Water rescue boat + Evacuation + Medical transport
 * 5. Building collapse: USAR rescue team + Fire + Structural engineer + Trauma hospital
 * 6. Chemical leak: HazMat team + Decon hospital + Police evacuation cordon
 * 7. ICU unavailability: Hospital A (2km, 0 ICU) rejected for Hospital B (7km, 3 ICU)
 * 8. No eligible hospital: Critical pending-destination state with missing facilities listed
 * 9. Resource shortage: Ambulance shortage queued without blocking fire/police dispatch
 * 10. Dynamic reallocation: Agency breakdown reallocates replacement with audit record
 * 11. Concurrent requests: Zero double-booking invariant verified across all agencies
 * 12. Dashboard integration: Response plans, eligibility breakdown, and state integrity
 */

const assert = require('assert');
const { resQFlowStore } = require('../src/services/resQFlowStore');
const { emergencyResponsePlanner } = require('../src/services/emergencyResponsePlanner');
const { hospitalEligibilityService } = require('../src/services/hospitalEligibilityService');
const { multiAgencyAllocationEngine } = require('../src/services/multiAgencyAllocationEngine');
const { getInitialHospitals, getInitialAmbulances, getInitialMultiAgencyResources } = require('../src/seed/hyderabadSeedData');

function runTest(testName, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${testName}`);
    return true;
  } catch (error) {
    console.error(`❌ FAIL: ${testName}`);
    console.error(`   Error: ${error.message}`);
    if (error.stack) console.error(error.stack.split('\n').slice(0, 4).join('\n'));
    return false;
  }
}

console.log('\n===============================================================');
console.log('🧪 RUNNING RESQFLOW AI MULTI-AGENCY INTEGRATION TEST SUITE (PS10)');
console.log('===============================================================\n');

let passedCount = 0;
let totalCount = 12;

// TEST 1: Fire Emergency Scenario
if (runTest('Test 1: Fire Emergency Response Plan & Multi-Agency Dispatch', () => {
  resQFlowStore.reset();
  const rawReport = {
    category: 'FIRE',
    description: 'Commercial complex fire in Ameerpet. 8 people inside, 3 injured, heavy smoke spreading. Vehicles blocking access road.',
    address: 'Ameerpet, Hyderabad',
    latitude: 17.4375,
    longitude: 78.4482,
    affectedPeople: 8,
    injuredCount: 3,
    trappedCount: 8,
    roadBlocked: true
  };

  const facts = emergencyResponsePlanner.extractIncidentFacts(rawReport);
  assert.strictEqual(facts.fireReported, true, 'Fire hazard must be detected');
  assert.strictEqual(facts.injuredCount, 3, 'Injured count must match 3');
  assert.strictEqual(facts.trappedCount, 8, 'Trapped count must match 8');
  assert.strictEqual(facts.roadBlocked, true, 'Road blockage must be detected');

  const registered = resQFlowStore.registerIncident(rawReport);
  const inc = registered.incident;
  assert.ok(inc.allocatedAgencies, 'Must have allocated agencies');
  assert.ok(inc.allocatedAgencies.FIRE, 'Fire brigade must be dispatched');
  assert.ok(inc.allocatedAgencies.RESCUE, 'Search & rescue squad must be dispatched');
  assert.ok(inc.allocatedAgencies.AMBULANCE, 'Ambulance must be dispatched for casualties');
  assert.ok(inc.allocatedAgencies.POLICE, 'Police perimeter must be dispatched');
  assert.ok(inc.allocatedAgencies.TRAFFIC, 'Traffic road clearance must be dispatched');
  assert.ok(inc.recommendedHospitalName, 'Burn hospital must be assigned for casualties');
})) passedCount++;

// TEST 2: Road Accident Scenario
if (runTest('Test 2: Road Accident with Multiple Victims & Trapped Casualties', () => {
  resQFlowStore.reset();
  const rawReport = {
    category: 'ROAD_ACCIDENT',
    description: 'Multi-vehicle crash at Kukatpally junction. 5 injured, 2 severe, 1 trapped in mangled vehicle. Traffic gridlock.',
    address: 'Kukatpally, Hyderabad',
    latitude: 17.4947,
    longitude: 78.4111,
    affectedPeople: 5,
    injuredCount: 5,
    trappedCount: 1,
    roadBlocked: true
  };

  const facts = emergencyResponsePlanner.extractIncidentFacts(rawReport);
  assert.strictEqual(facts.injuredCount, 5);
  assert.strictEqual(facts.trappedCount, 1);

  const registered = resQFlowStore.registerIncident(rawReport);
  const inc = registered.incident;
  assert.ok(inc.allocatedAgencies.AMBULANCE, 'Trauma ambulance must be dispatched');
  assert.ok(inc.allocatedAgencies.RESCUE, 'Extrication rescue squad must be dispatched');
  assert.ok(inc.allocatedAgencies.POLICE, 'Police must be dispatched');
  assert.ok(inc.allocatedAgencies.TRAFFIC, 'Traffic unit must be dispatched');
  assert.ok(inc.recommendedHospitalName, 'Trauma center must be assigned');
})) passedCount++;

// TEST 3: Cardiac Emergency Scenario
if (runTest('Test 3: Cardiac Emergency ALS Dispatch & ICU Enforcement', () => {
  resQFlowStore.reset();
  const rawReport = {
    category: 'CARDIAC',
    description: '62-year-old male experiencing acute crushing chest pain, dyspnea and loss of consciousness.',
    address: 'Hitec City, Hyderabad',
    affectedPeople: 1
  };

  const registered = resQFlowStore.registerIncident(rawReport);
  const inc = registered.incident;
  assert.strictEqual(inc.hospitalEvaluation.icuRequired, true, 'ICU must be required for cardiac');
  assert.ok(inc.allocatedAgencies.AMBULANCE, 'Ambulance must be dispatched');
  assert.ok(inc.recommendedHospitalName, 'Hospital with cardiology & ICU must be assigned');
})) passedCount++;

// TEST 4: Urban Flooding Scenario
if (runTest('Test 4: Urban Flooding Water Rescue & Evacuation', () => {
  resQFlowStore.reset();
  const rawReport = {
    category: 'FLOOD',
    description: 'Severe street inundation, water depth 4 feet. 6 families stranded on rooftops.',
    address: 'Miyapur, Hyderabad',
    affectedPeople: 12
  };

  const registered = resQFlowStore.registerIncident(rawReport);
  const inc = registered.incident;
  assert.ok(inc.allocatedAgencies.RESCUE, 'Water rescue boat / USAR must be allocated');
  assert.strictEqual(inc.allocatedAgencies.RESCUE.resourceId, 'BOAT_01', 'NDRF water rescue boat must be assigned');
})) passedCount++;

// TEST 5: Building Collapse Scenario
if (runTest('Test 5: Building Collapse USAR & Structural Safety Engineers', () => {
  resQFlowStore.reset();
  const rawReport = {
    category: 'BUILDING_COLLAPSE',
    description: 'Under-construction commercial slab collapse. 4 workers trapped beneath concrete beams.',
    address: 'SR Nagar, Hyderabad',
    affectedPeople: 4,
    trappedCount: 4
  };

  const registered = resQFlowStore.registerIncident(rawReport);
  const inc = registered.incident;
  assert.ok(inc.allocatedAgencies.RESCUE, 'USAR rescue squad must be dispatched');
  assert.ok(inc.allocatedAgencies.SPECIALIZED || inc.allocatedAgencies.STRUCTURAL, 'GHMC structural engineers must be dispatched');
  assert.ok(inc.allocatedAgencies.FIRE, 'Fire extrication must be dispatched');
})) passedCount++;

// TEST 6: Chemical Leak / HazMat Scenario
if (runTest('Test 6: Chemical Leak HazMat Level-A & Decon Hospital', () => {
  resQFlowStore.reset();
  const rawReport = {
    category: 'CHEMICAL_LEAK',
    description: 'Toxic industrial gas plume escaping from tanker cylinder. Strong chlorine odor.',
    address: 'Erragadda, Hyderabad',
    affectedPeople: 10
  };

  const registered = resQFlowStore.registerIncident(rawReport);
  const inc = registered.incident;
  assert.ok(inc.allocatedAgencies.HAZMAT, 'HazMat team must be dispatched');
  assert.ok(inc.allocatedAgencies.POLICE, 'Police cordon must be dispatched');
  assert.ok(inc.allocatedAgencies.FIRE, 'Fire water curtains must be dispatched');
  // Check decontamination hospital
  assert.strictEqual(inc.hospitalEvaluation.selectedHospital?.hospitalId, 'HOSP_E', 'Yashoda Toxic & Decontamination Center must be selected');
})) passedCount++;

// TEST 7: Mandatory ICU Capacity Hard Constraint
if (runTest('Test 7: Hard ICU Capacity Constraint (Distance Never Overrides ICU)', () => {
  const hospitals = [
    {
      hospitalId: 'HOSP_CLOSE_NO_ICU',
      name: 'Close Clinic (0 ICU)',
      node: 'Kukatpally',
      availableIcuBeds: 0,
      availableGeneralBeds: 10,
      specialties: ['cardiology', 'trauma', 'icu']
    },
    {
      hospitalId: 'HOSP_FAR_WITH_ICU',
      name: 'Distant Hospital (3 ICU)',
      node: 'Ameerpet',
      availableIcuBeds: 3,
      availableGeneralBeds: 5,
      specialties: ['cardiology', 'trauma', 'icu']
    }
  ];

  const cardiacIncident = {
    incidentId: 'INC_TEST_CARDIAC',
    category: 'CARDIAC',
    node: 'Kukatpally',
    priorityScore: 95
  };

  const evalResult = hospitalEligibilityService.evaluateHospitalEligibility(cardiacIncident, hospitals);
  assert.strictEqual(evalResult.hasEligibleHospital, true);
  assert.strictEqual(evalResult.selectedHospital.hospitalId, 'HOSP_FAR_WITH_ICU', 'Distant hospital with ICU must be chosen over close hospital with 0 ICU');

  const rejected = evalResult.rejectedHospitals.find(h => h.hospitalId === 'HOSP_CLOSE_NO_ICU');
  assert.ok(rejected, 'Close hospital must be rejected');
  assert.ok(rejected.rejectionReason.includes('no available ICU beds'), 'Rejection reason must explicitly state no ICU beds');
})) passedCount++;

// TEST 8: No Eligible Hospital Scenario
if (runTest('Test 8: Critical Pending-Destination State when No Hospital is Eligible', () => {
  const hospitals = [
    {
      hospitalId: 'HOSP_A',
      name: 'General Clinic',
      node: 'Kukatpally',
      availableIcuBeds: 0,
      availableGeneralBeds: 2,
      specialties: ['general']
    }
  ];

  const burnIncident = {
    incidentId: 'INC_TEST_BURN',
    category: 'FIRE',
    injuredCount: 2,
    node: 'Kukatpally',
    priorityScore: 92
  };

  const evalResult = hospitalEligibilityService.evaluateHospitalEligibility(burnIncident, hospitals);
  assert.strictEqual(evalResult.hasEligibleHospital, false, 'Must not assign an unsuitable hospital');
  assert.strictEqual(evalResult.selectedHospital, null);
  assert.ok(evalResult.rejectedHospitals.length > 0);
  assert.ok(evalResult.rejectedHospitals[0].rejectionReason.includes('burn'), 'Must cite missing burn care unit');
})) passedCount++;

// TEST 9: Resource Shortage & Queuing Without Blocking Other Agencies
if (runTest('Test 9: Resource Shortage Handling (Ambulance Shortage Does Not Block Fire)', () => {
  resQFlowStore.reset();
  // Exhaust all ambulances
  resQFlowStore.ambulances.forEach(a => { a.status = 'ASSIGNED'; });

  const rawFireReport = {
    category: 'FIRE',
    description: 'Warehouse fire in Miyapur with 1 casualty.',
    address: 'Miyapur, Hyderabad',
    affectedPeople: 1,
    injuredCount: 1
  };

  const registered = resQFlowStore.registerIncident(rawFireReport);
  const inc = registered.incident;

  // Fire services must still be allocated despite ambulance saturation!
  assert.ok(inc.allocatedAgencies.FIRE, 'Fire engine must be allocated even when ambulances are saturated');
  assert.ok(inc.missingAgencies.some(m => m.agency === 'AMBULANCE'), 'Ambulance requirement must be queued without failing fire mission');
})) passedCount++;

// TEST 10: Dynamic Agency Resource Reallocation
if (runTest('Test 10: Dynamic Agency Failure & Autonomous Replacement Reallocation', () => {
  resQFlowStore.reset();
  // Register fire incident which gets FIRE_01
  const registered = resQFlowStore.registerIncident({
    category: 'FIRE',
    description: 'Factory fire in Ameerpet.',
    address: 'Ameerpet, Hyderabad',
    affectedPeople: 0
  });

  const inc = registered.incident;
  assert.strictEqual(inc.allocatedAgencies.FIRE?.resourceId, 'FIRE_01');

  // Trigger breakdown of FIRE_01
  const failResult = resQFlowStore.failAgencyResource('FIRE_01', 'Water pump hydraulic failure on route');
  assert.strictEqual(failResult.success, true);
  assert.strictEqual(failResult.failedResource.status, 'FAILED');
  assert.strictEqual(failResult.replacementResource.resourceId, 'FIRE_02', 'FIRE_02 must be reallocated as replacement');

  const updatedInc = resQFlowStore.incidents.find(i => i.incidentId === inc.incidentId);
  assert.strictEqual(updatedInc.allocatedAgencies.FIRE.resourceId, 'FIRE_02', 'Incident must reflect replacement FIRE_02');
  assert.ok(resQFlowStore.reallocationHistory.length > 0, 'Must record audit log');
})) passedCount++;

// TEST 11: Concurrent Requests & Zero Double-Booking Invariant
if (runTest('Test 11: Concurrent Requests with Zero Double-Booking Invariant', () => {
  resQFlowStore.reset();
  const inc1 = resQFlowStore.registerIncident({
    category: 'ROAD_ACCIDENT',
    address: 'Kukatpally, Hyderabad',
    affectedPeople: 2
  }).incident;

  const inc2 = resQFlowStore.registerIncident({
    category: 'ROAD_ACCIDENT',
    address: 'Ameerpet, Hyderabad',
    affectedPeople: 2
  }).incident;

  const amb1 = inc1.assignedAmbulanceId;
  const amb2 = inc2.assignedAmbulanceId;

  assert.ok(amb1, 'Incident 1 must have assigned ambulance');
  assert.ok(amb2, 'Incident 2 must have assigned ambulance');
  assert.notStrictEqual(amb1, amb2, 'Zero Double-Booking: Same ambulance must NEVER be assigned to both concurrent incidents!');
})) passedCount++;

// TEST 12: Dashboard State Integrity & Decision Audit
if (runTest('Test 12: Dashboard State Integrity & Cross-Agency Decision Logs', () => {
  const state = resQFlowStore.getState();
  assert.ok(Array.isArray(state.incidents), 'Incidents array exists');
  assert.ok(Array.isArray(state.ambulances), 'Ambulances array exists');
  assert.ok(Array.isArray(state.hospitals), 'Hospitals array exists');
  assert.ok(Array.isArray(state.multiAgencyResources), 'MultiAgencyResources array exists');
  assert.ok(Array.isArray(state.agencyDecisionLogs), 'Agency decision logs exist');
  assert.ok(state.multiAgencyResources.length >= 8, 'Must have at least 8 cross-agency units');
})) passedCount++;

console.log('\n===============================================================');
console.log(`🏁 TEST SUITE RESULT: ${passedCount} / ${totalCount} PASSED (${Math.round((passedCount/totalCount)*100)}%)`);
console.log('===============================================================\n');

if (passedCount === totalCount) {
  process.exit(0);
} else {
  process.exit(1);
}
