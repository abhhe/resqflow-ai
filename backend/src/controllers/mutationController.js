/**
 * Mutation Controller: Dynamic Reallocations & Scenario Disruptions
 * Problem Statement: PS10 - ResQFlow AI (Section 9 & 13)
 * 
 * Endpoints:
 * - PATCH /api/mutate/ambulance (Fail AMB001)
 * - PATCH /api/mutate/hospital  (Hospital B ICU = 0)
 * - PATCH /api/mutate/traffic   (Heavy rain traffic congestion)
 * - POST  /api/mutate/incident  (Add 4th emergency)
 */

const { resQFlowStore } = require('../services/resQFlowStore');

const mutateAmbulance = (req, res) => {
  try {
    const ambulanceId = req.body?.ambulanceId || 'AMB001';

    if (ambulanceId && (
      ambulanceId.startsWith('FIRE_') || 
      ambulanceId.startsWith('RESCUE_') || 
      ambulanceId.startsWith('BOAT_') || 
      ambulanceId.startsWith('POLICE_') || 
      ambulanceId.startsWith('TRAFFIC_') || 
      ambulanceId.startsWith('HAZMAT_') || 
      ambulanceId.startsWith('STRUCT_')
    )) {
      req.body.resourceId = ambulanceId;
      return mutateAgencyResource(req, res);
    }

    const state = resQFlowStore.failAmbulance(ambulanceId);

    if (req.io) {
      req.io.emit('scenario:update', {
        event: 'AMBULANCE_MUTATED',
        ambulanceId,
        state
      });
      req.io.emit('ambulance:breakdown', {
        ambulanceId,
        reason: req.body?.reason || 'On-road mechanical stall'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Ambulance ${ambulanceId} failed. Dynamic reallocation completed.`,
      data: state
    });
  } catch (error) {
    console.error('Error mutating ambulance:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

const mutateHospital = (req, res) => {
  try {
    const hospitalId = req.body?.hospitalId || 'HOSP_B';
    const state = resQFlowStore.setHospitalIcuToZero(hospitalId);

    if (req.io) {
      req.io.emit('scenario:update', {
        event: 'HOSPITAL_MUTATED',
        hospitalId,
        state
      });
    }

    return res.status(200).json({
      success: true,
      message: `${hospitalId} ICU capacity set to 0. Patients requiring ICU reallocated.`,
      data: state
    });
  } catch (error) {
    console.error('Error mutating hospital:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

const mutateTraffic = (req, res) => {
  try {
    const enabled = req.body?.enabled !== undefined ? req.body.enabled : !resQFlowStore.heavyRainActive;
    const result = resQFlowStore.toggleHeavyRain(enabled);

    if (req.io) {
      req.io.emit('scenario:update', {
        event: 'TRAFFIC_MUTATED',
        heavyRainActive: enabled,
        state: result
      });
    }

    return res.status(200).json({
      success: true,
      message: enabled 
        ? 'Heavy rain traffic congestion applied. Routes dynamically recalculated via Dijkstra.'
        : 'Heavy rain congestion cleared. Standard routes restored.',
      data: result
    });
  } catch (error) {
    console.error('Error mutating traffic:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

const mutateIncident = (req, res) => {
  try {
    const state = resQFlowStore.addFourthEmergency();

    if (req.io) {
      req.io.emit('scenario:update', {
        event: 'INCIDENT_ADDED',
        incidentId: 'INC_D',
        state
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Fourth emergency (Incident D) injected and prioritized.',
      data: state
    });
  } catch (error) {
    console.error('Error adding incident:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

const mutateRoadClosure = (req, res) => {
  try {
    const edgeId = req.body?.edgeId || 'edge_kukatpally_erragadda';
    const closed = req.body?.closed !== undefined ? req.body.closed : !resQFlowStore.roadClosureActive;
    const state = resQFlowStore.toggleRoadClosure(edgeId, closed);

    if (req.io) {
      req.io.emit('scenario:update', {
        event: 'ROAD_CLOSURE_MUTATED',
        edgeId,
        closed,
        state
      });
    }

    return res.status(200).json({
      success: true,
      message: closed
        ? `Road edge '${edgeId}' closed. Routes dynamically rerouted via Dijkstra bypass.`
        : `Road edge '${edgeId}' reopened. Normal network routes restored.`,
      data: state
    });
  } catch (error) {
    console.error('Error mutating road closure:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

const mutateSurgeScenario = (req, res) => {
  try {
    const state = resQFlowStore.triggerSurgeScenario();

    if (req.io) {
      req.io.emit('scenario:update', {
        event: 'SURGE_SCENARIO_TRIGGERED',
        state
      });
    }

    return res.status(200).json({
      success: true,
      message: '5-Incident surge scenario triggered with 4 available ambulances. Priority dispatch queued.',
      data: state
    });
  } catch (error) {
    console.error('Error triggering surge scenario:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

const mutateAgencyResource = (req, res) => {
  try {
    const resourceId = req.body?.resourceId || 'FIRE_01';
    const reason = req.body?.reason || 'Engine Breakdown / Mechanical Failure reported by crew';
    const result = resQFlowStore.failAgencyResource(resourceId, reason);

    if (req.io) {
      req.io.emit('scenario:update', {
        event: 'AGENCY_RESOURCE_MUTATED',
        resourceId,
        reason,
        state: result.state
      });
      req.io.emit('ambulance:breakdown', {
        ambulanceId: resourceId,
        reason
      });
    }

    return res.status(200).json({
      success: true,
      message: `Agency resource ${resourceId} failed. Dynamic replacement reallocation computed.`,
      data: result
    });
  } catch (error) {
    console.error('Error mutating agency resource:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  mutateAmbulance,
  mutateHospital,
  mutateTraffic,
  mutateIncident,
  mutateRoadClosure,
  mutateSurgeScenario,
  mutateAgencyResource
};

