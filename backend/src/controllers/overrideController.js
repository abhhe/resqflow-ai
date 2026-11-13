/**
 * Operator Override Controller
 * Problem Statement: PS10 - ResQFlow AI (Feature 7 - Human Oversight & Audit Trails)
 * 
 * Provides dispatchers and medical supervisors manual override authority over:
 * 1. Assigned ambulance
 * 2. Recommended hospital
 * 3. Priority/severity score
 * 
 * Captures comprehensive audit log with operator rationale and downstream recalculation impacts.
 */

const { resQFlowStore } = require('../services/resQFlowStore');

const overrideAmbulance = (req, res) => {
  try {
    const { incidentId, ambulanceId, reason, operatorId } = req.body;
    if (!incidentId || !ambulanceId) {
      return res.status(400).json({ success: false, error: 'incidentId and ambulanceId are required.' });
    }

    const result = resQFlowStore.overrideAmbulance(
      incidentId, 
      ambulanceId, 
      reason || 'Operator manual intervention', 
      operatorId || 'OPERATOR_1'
    );

    if (req.io) {
      req.io.emit('scenario:update', {
        event: 'OPERATOR_OVERRIDE_AMBULANCE',
        auditEntry: result.auditEntry,
        state: result.state
      });
    }

    return res.status(200).json({
      success: true,
      message: `Ambulance override successful: ${incidentId} assigned to ${ambulanceId}.`,
      data: result
    });
  } catch (error) {
    console.error('Error in overrideAmbulance:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

const overrideHospital = (req, res) => {
  try {
    const { incidentId, hospitalId, reason, operatorId } = req.body;
    if (!incidentId || !hospitalId) {
      return res.status(400).json({ success: false, error: 'incidentId and hospitalId are required.' });
    }

    const result = resQFlowStore.overrideHospital(
      incidentId, 
      hospitalId, 
      reason || 'Operator medical transfer diversion', 
      operatorId || 'OPERATOR_1'
    );

    if (req.io) {
      req.io.emit('scenario:update', {
        event: 'OPERATOR_OVERRIDE_HOSPITAL',
        auditEntry: result.auditEntry,
        state: result.state
      });
    }

    return res.status(200).json({
      success: true,
      message: `Hospital override successful: ${incidentId} diverted to ${hospitalId}.`,
      data: result
    });
  } catch (error) {
    console.error('Error in overrideHospital:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

const overrideSeverity = (req, res) => {
  try {
    const { incidentId, severityScore, reason, operatorId } = req.body;
    if (!incidentId || severityScore === undefined) {
      return res.status(400).json({ success: false, error: 'incidentId and severityScore are required.' });
    }

    const result = resQFlowStore.overrideSeverity(
      incidentId, 
      Number(severityScore), 
      reason || 'Clinical triage reassessment', 
      operatorId || 'OPERATOR_1'
    );

    if (req.io) {
      req.io.emit('scenario:update', {
        event: 'OPERATOR_OVERRIDE_SEVERITY',
        auditEntry: result.auditEntry,
        state: result.state
      });
    }

    return res.status(200).json({
      success: true,
      message: `Severity override successful: ${incidentId} priority updated to ${severityScore}.`,
      data: result
    });
  } catch (error) {
    console.error('Error in overrideSeverity:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

const getAuditLog = (req, res) => {
  try {
    const log = resQFlowStore.getOverrideAuditLog();
    return res.status(200).json({
      success: true,
      count: log.length,
      data: log
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  overrideAmbulance,
  overrideHospital,
  overrideSeverity,
  getAuditLog
};

