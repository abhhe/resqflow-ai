/**
 * Automated Verification Suite for Advanced PS10 AI/ML & Architecture Components:
 * 1. Computer Vision Scene Analysis
 * 2. Time-Series Hospital Load & Demand Forecasting
 * 3. Graph Neural Network (GNN) Road Network Modeling
 * 4. Redis Real-Time State Adapter
 * 5. Architecture Verification
 */

const assert = require('assert');
const { computerVisionService } = require('../src/services/computerVisionService');
const { hospitalLoadForecaster } = require('../src/services/hospitalLoadForecaster');
const { gnnRoadNetworkPredictor } = require('../src/services/gnnRoadNetworkPredictor');
const { redisAdapter } = require('../src/services/redisAdapter');
const { getInitialHospitals } = require('../src/seed/hyderabadSeedData');

async function runPs10AdvancedTests() {
  console.log('===============================================================');
  console.log('🧪 RUNNING ADVANCED PS10 AI/ML & ARCHITECTURE TEST SUITE');
  console.log('===============================================================\n');

  // Test 1: Computer Vision on Fire Incident Image
  console.log('[TEST 1] Computer Vision: Fire & Thermal Plume Analysis');
  const fireImageSvg = 'data:image/svg+xml;utf8,<svg><rect fill="red"/><text>FIRE</text></svg>';
  const cvFireResult = await computerVisionService.analyzeEmergencyImage(fireImageSvg, {
    category: 'FIRE',
    description: 'Commercial fire with active flames and dense smoke'
  });
  assert(cvFireResult.success === true, 'CV fire analysis must succeed');
  assert(cvFireResult.damageSeverityScore >= 80, 'Fire visual severity must be high (>=80)');
  assert(cvFireResult.detectedHazards.includes('FIRE'), 'Must detect FIRE hazard');
  assert(cvFireResult.detectedHazards.includes('HEAVY_SMOKE'), 'Must detect HEAVY_SMOKE');
  assert(cvFireResult.detectedObjects.length >= 1, 'Must detect at least 1 object');
  console.log(`✅ PASS: Test 1: Computer Vision Fire Analysis (Score: ${cvFireResult.damageSeverityScore}/100, Hazards: ${cvFireResult.detectedHazards.join(', ')})`);

  // Test 2: Computer Vision on Highway Collision Image
  console.log('\n[TEST 2] Computer Vision: Highway Crash & Vehicular Deformation');
  const crashImageSvg = 'data:image/svg+xml;utf8,<svg><rect fill="gray"/><text>CRASH</text></svg>';
  const cvCrashResult = await computerVisionService.analyzeEmergencyImage(crashImageSvg, {
    category: 'ROAD_ACCIDENT',
    description: 'Two-car head-on collision with chassis crushed'
  });
  assert(cvCrashResult.success === true, 'CV crash analysis must succeed');
  assert(cvCrashResult.detectedHazards.includes('VEHICLE_CRUSH'), 'Must detect VEHICLE_CRUSH');
  assert(cvCrashResult.trappedOccupantsLikelihood === 'HIGH', 'Must detect high trapped likelihood');
  console.log(`✅ PASS: Test 2: Computer Vision Crash Analysis (Detected Objects: ${cvCrashResult.detectedObjects.map(o => o.label).join(', ')})`);

  // Test 3: Time-Series Hospital Load Forecasting (4-Hour Projection)
  console.log('\n[TEST 3] Time-Series Forecasting: Hospital ICU Load & Surge Curve');
  const hospitals = getInitialHospitals();
  const hospB = hospitals.find(h => h.hospitalId === 'HOSP_B' || h._id === 'HOSP_B' || h.name.includes('Ameerpet'));
  assert(hospB !== undefined, 'HOSP_B must be found in initial hospitals');
  const forecastB = hospitalLoadForecaster.forecastHospitalLoad(hospB, [
    { recommendedHospitalId: 'HOSP_B', status: 'ASSIGNED' }
  ]);
  assert(forecastB !== null, 'Forecast must be generated');
  assert(forecastB.projectionCurve.length === 4, 'Must project 4 time intervals (+30m, +60m, +120m, +240m)');
  assert(forecastB.projectionCurve[0].hoursAhead === 0.5, 'First projection interval must be 0.5 hr');
  assert(forecastB.projectionCurve[3].hoursAhead === 4.0, 'Last projection interval must be 4.0 hr');
  assert(typeof forecastB.timeToIcuExhaustionMinutes === 'number', 'Time to exhaustion must be computed');
  console.log(`✅ PASS: Test 3: Time-Series Forecast (Hospital: ${forecastB.hospitalName}, TTE: ${forecastB.timeToIcuExhaustionMinutes}m, Surge: ${forecastB.surgeStatus})`);

  // Test 4: City-Wide Emergency Demand Forecasting
  console.log('\n[TEST 4] Time-Series Demand Forecasting: City-Wide Node Arrivals');
  const cityDemand = hospitalLoadForecaster.forecastCityWideDemand(3, false);
  assert(cityDemand.forecastHorizonHours === 4, 'Forecast horizon must be 4 hours');
  assert(cityDemand.cityWideHourlyForecast.length === 4, 'Must provide 4 hourly projections');
  assert(cityDemand.nodeForecasts.length >= 8, 'Must provide forecasts for all Hyderabad nodes');
  const kukatpallyDemand = cityDemand.nodeForecasts.find(n => n.node === 'Kukatpally');
  assert(kukatpallyDemand.projectedArrivalRatePerHour > 0, 'Arrival rate must be positive');
  console.log(`✅ PASS: Test 4: City-Wide Demand Forecast (Nodes: ${cityDemand.nodeForecasts.length}, 4-Hr Projections: ${cityDemand.cityWideHourlyForecast.map(h => h.expectedEmergencies).join(', ')})`);

  // Test 5: Graph Neural Network (GNN) 2-Layer GCN Road Network Predictor
  console.log('\n[TEST 5] GNN Road Network Modeling: 2-Layer GCN Propagation & Bottlenecks');
  const gnnOutput = gnnRoadNetworkPredictor.predictNetworkCongestion([], false, []);
  assert(gnnOutput.nodeCount === 9, 'Must model 9 road intersection nodes');
  assert(gnnOutput.edgeCount >= 13, 'Must model at least 13 road links');
  assert(gnnOutput.primaryBottlenecks.length === 3, 'Must identify top 3 network bottlenecks');
  assert(gnnOutput.linkPredictions.length >= 13, 'Must predict link travel times for all edges');
  const sampleEdge = gnnOutput.linkPredictions[0];
  assert(typeof sampleEdge.gnnPredictedTravelTimeMin === 'number', 'Predicted travel time must be a number');
  console.log(`✅ PASS: Test 5: GNN GCN Road Network Modeling (Top Bottleneck: ${gnnOutput.primaryBottlenecks[0].node}, Predicted Links: ${gnnOutput.linkPredictions.length})`);

  // Test 6: GNN Monsoon Rain Weather Spillover Penalty
  console.log('\n[TEST 6] GNN Weather Impact: Congestion Propagation under Monsoon Surge');
  const gnnRainOutput = gnnRoadNetworkPredictor.predictNetworkCongestion([], true, ['edge_kukatpally_erragadda']);
  const erragaddaEdge = gnnRainOutput.linkPredictions.find(e => e.edgeId === 'edge_kukatpally_erragadda');
  assert(erragaddaEdge.congestionLevel === 'CLOSED', 'Closed edge must be marked CLOSED');
  assert(erragaddaEdge.gnnPredictedTravelTimeMin >= 900, 'Closed edge travel time must be infinite');
  console.log(`✅ PASS: Test 6: GNN Weather & Road Closure Propagation Verified`);

  // Test 7: Redis Adapter State & PubSub Operations
  console.log('\n[TEST 7] Redis Real-Time State Adapter: Key-Value & Pub/Sub Validation');
  await redisAdapter.set('test_scenario_key', { status: 'ACTIVE', priority: 95 }, 60);
  const fetchedVal = await redisAdapter.get('test_scenario_key');
  assert(fetchedVal.status === 'ACTIVE' && fetchedVal.priority === 95, 'Must read stored value');

  let messageReceived = false;
  redisAdapter.subscribe('emergency_broadcast', (msg) => {
    if (msg.event === 'ALARM') messageReceived = true;
  });
  await redisAdapter.publish('emergency_broadcast', { event: 'ALARM', severity: 'CRITICAL' });
  assert(messageReceived === true, 'PubSub message must be delivered to subscriber');
  console.log(`✅ PASS: Test 7: Redis Real-Time State & PubSub Operations Verified (Mode: ${redisAdapter.getStatus().mode})`);

  console.log('\n===============================================================');
  console.log('🏁 ADVANCED PS10 AI/ML SUITE: 7 / 7 PASSED (100% SUCCESS)');
  console.log('===============================================================\n');
}

runPs10AdvancedTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test suite failed:', err);
    process.exit(1);
  });
