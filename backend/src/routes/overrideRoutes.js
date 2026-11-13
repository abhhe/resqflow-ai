const express = require('express');
const router = express.Router();
const {
  overrideAmbulance,
  overrideHospital,
  overrideSeverity,
  getAuditLog
} = require('../controllers/overrideController');

router.post('/ambulance', overrideAmbulance);
router.post('/hospital', overrideHospital);
router.post('/severity', overrideSeverity);
router.get('/audit-log', getAuditLog);

module.exports = router;

