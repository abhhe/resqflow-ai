const express = require('express');
const router = express.Router();
const { trigger1030Am, resetScenario, getScenarioState } = require('../controllers/scenarioController');

router.post('/1030am', trigger1030Am);
router.post('/reset', resetScenario);
router.get('/state', getScenarioState);

module.exports = router;

