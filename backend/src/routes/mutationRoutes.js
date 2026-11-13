const express = require('express');
const router = express.Router();
const { 
  mutateAmbulance, 
  mutateHospital, 
  mutateTraffic, 
  mutateIncident,
  mutateRoadClosure,
  mutateSurgeScenario,
  mutateAgencyResource
} = require('../controllers/mutationController');

router.patch('/ambulance', mutateAmbulance);
router.patch('/hospital', mutateHospital);
router.patch('/traffic', mutateTraffic);
router.post('/incident', mutateIncident);
router.patch('/road-closure', mutateRoadClosure);
router.post('/surge-scenario', mutateSurgeScenario);
router.patch('/agency-resource', mutateAgencyResource);

module.exports = router;

