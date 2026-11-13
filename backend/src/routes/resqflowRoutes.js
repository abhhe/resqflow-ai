const express = require('express');
const router = express.Router();
const { 
  extractNlp, 
  getRouteComparison, 
  getMetrics,
  assessEmergencySeverity,
  estimateIncidentResources,
  benchmarkAllocationStrategies,
  getHospitalEligibility,
  getIncidentResponsePlan,
  analyzeImage,
  getHospitalForecast,
  getCityDemandForecast,
  getGnnTrafficPrediction,
  getSystemArchitectureStatus
} = require('../controllers/resqflowController');

router.post('/extract-nlp', extractNlp);
router.post('/analyze-image', analyzeImage);
router.get('/route-comparison', getRouteComparison);
router.get('/metrics', getMetrics);
router.post('/assess-severity', assessEmergencySeverity);
router.post('/estimate-resources', estimateIncidentResources);
router.get('/benchmark', benchmarkAllocationStrategies);
router.get('/hospital-eligibility/:incidentId', getHospitalEligibility);
router.get('/response-plan/:incidentId', getIncidentResponsePlan);
router.get('/hospital-forecast/:hospitalId', getHospitalForecast);
router.get('/city-demand-forecast', getCityDemandForecast);
router.get('/gnn-traffic-prediction', getGnnTrafficPrediction);
router.get('/system-architecture-status', getSystemArchitectureStatus);

module.exports = router;
