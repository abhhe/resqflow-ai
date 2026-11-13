/**
 * Scenario Controller: Canonical 10:30 AM Scenario & Demonstration Resets
 * Problem Statement: PS10 - ResQFlow AI (Section 8 & 13)
 */

const { resQFlowStore } = require('../services/resQFlowStore');

const trigger1030Am = (req, res) => {
  try {
    const state = resQFlowStore.trigger1030AmScenario();
    
    // Broadcast real-time update to all connected Socket.IO clients
    if (req.io) {
      req.io.emit('scenario:update', {
        event: 'SCENARIO_1030AM_TRIGGERED',
        state
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Canonical 10:30 AM Emergency Scenario Triggered Successfully',
      data: state
    });
  } catch (error) {
    console.error('Error triggering 10:30 AM scenario:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

const resetScenario = (req, res) => {
  try {
    resQFlowStore.reset();
    const state = resQFlowStore.getState();

    if (req.io) {
      req.io.emit('scenario:update', {
        event: 'SCENARIO_RESET',
        state
      });
    }

    return res.status(200).json({
      success: true,
      message: 'ResQFlow AI Demonstration State Reset Successfully',
      data: state
    });
  } catch (error) {
    console.error('Error resetting scenario:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

const getScenarioState = (req, res) => {
  try {
    const state = resQFlowStore.getState();
    return res.status(200).json({
      success: true,
      data: state
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  trigger1030Am,
  resetScenario,
  getScenarioState
};

