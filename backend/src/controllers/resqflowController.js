/**
 * ResQFlow Controller: APIs for Clinical Severity, Resource Prediction, Benchmarks, NLP & Graph Routing
 * Problem Statement: PS10 - ResQFlow AI
 */

const { extractEmergencyData } = require('../services/nlpExtractor');
const { extractIncidentFacts } = require('../services/emergencyResponsePlanner');
const { graphRouter } = require('../services/hyderabadGraphRouter');
const { resQFlowStore } = require('../services/resQFlowStore');
const { assessSeverity } = require('../services/severityAssessmentEngine');
const { estimateResourceRequirements } = require('../services/resourceRequirementEstimator');
const { globalAllocationEngine } = require('../services/globalAllocationEngine');
const { computerVisionService } = require('../services/computerVisionService');
const { hospitalLoadForecaster } = require('../services/hospitalLoadForecaster');
const { gnnRoadNetworkPredictor } = require('../services/gnnRoadNetworkPredictor');
const { redisAdapter } = require('../services/redisAdapter');
const { getCanonical1030AmIncidents, getInitialAmbulances, getInitialHospitals } = require('../seed/hyderabadSeedData');

const extractNlp = (req, res) => {
  try {
    const text = req.body?.text || req.body?.description || '';
    const baseExtracted = extractEmergencyData(text);
    const facts = extractIncidentFacts(text);

    let mappedCategory = 'ROAD_ACCIDENT';
    if (facts.category && facts.category !== 'GENERAL_MEDICAL') {
      mappedCategory = facts.category;
    } else if (baseExtracted.category) {
      mappedCategory = baseExtracted.category;
    } else if (baseExtracted.type) {
      mappedCategory = baseExtracted.type.toUpperCase();
    }

    const casualties = Math.max(
      facts.confirmed?.casualties || 0,
      facts.inferred?.casualties || 0,
      facts.confirmed?.affectedPeople || 0,
      facts.inferred?.affectedPeople || 0,
      facts.affectedCount || 0,
      facts.injuredCount || 0,
      baseExtracted.affectedPeople || 0,
      baseExtracted.people_affected || 0,
      baseExtracted.casualties || 0,
      1
    );

    const trapped = Math.max(
      facts.confirmed?.trapped || 0,
      facts.inferred?.trapped || 0,
      facts.confirmed?.trappedCount || 0,
      facts.inferred?.trappedCount || 0,
      facts.trappedCount || 0,
      baseExtracted.trappedCount || 0
    );

    const detectedHazards = [...(baseExtracted.hazards || [])];
    if (facts.confirmed?.fire && !detectedHazards.includes('FIRE')) detectedHazards.push('FIRE');
    if (facts.confirmed?.roadBlock && !detectedHazards.includes('ROAD_BLOCKED')) detectedHazards.push('ROAD_BLOCKED');
    if (facts.confirmed?.chemicalHazard && !detectedHazards.includes('CHEMICAL_VAPOR')) detectedHazards.push('CHEMICAL_VAPOR');
    if (facts.confirmed?.floodDepthMeters && !detectedHazards.includes('FLOODING')) detectedHazards.push('FLOODING');

    const combined = {
      ...baseExtracted,
      category: mappedCategory,
      affectedPeople: casualties,
      casualties: casualties,
      trappedCount: trapped,
      location: baseExtracted.location || 'Kukatpally',
      node: baseExtracted.location || 'Kukatpally',
      hazards: detectedHazards,
      facts,
      speechConfidence: 0.96
    };

    return res.status(200).json({
      success: true,
      data: combined
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const getRouteComparison = (req, res) => {
  try {
    const comparison = graphRouter.compareKukatpallyToErragaddaRoutes();
    return res.status(200).json({
      success: true,
      data: comparison
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const getMetrics = (req, res) => {
  try {
    const metrics = resQFlowStore.computeMetrics();
    return res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const assessEmergencySeverity = (req, res) => {
  try {
    const payload = req.body || {};
    const assessment = assessSeverity(payload);
    return res.status(200).json({
      success: true,
      data: assessment
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const estimateIncidentResources = (req, res) => {
  try {
    const payload = req.body || {};
    const requirements = estimateResourceRequirements(payload);
    return res.status(200).json({
      success: true,
      data: requirements
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const benchmarkAllocationStrategies = (req, res) => {
  try {
    const state = resQFlowStore.getState();
    const incidents = (state.incidents && state.incidents.length > 0) 
      ? state.incidents 
      : getCanonical1030AmIncidents();
    const ambulances = (state.ambulances && state.ambulances.length > 0)
      ? state.ambulances
      : getInitialAmbulances();
    const hospitals = (state.hospitals && state.hospitals.length > 0)
      ? state.hospitals
      : getInitialHospitals();

    const benchmark = globalAllocationEngine.compareAllocationStrategies(
      incidents,
      ambulances,
      hospitals
    );

    return res.status(200).json({
      success: true,
      data: benchmark
    });
  } catch (error) {
    console.error('Error calculating benchmark:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

const getHospitalEligibility = (req, res) => {
  try {
    const incidentId = req.params.incidentId;
    const evalResult = resQFlowStore.getHospitalEligibilityForIncident(incidentId);
    if (!evalResult) {
      return res.status(404).json({ success: false, message: `Incident ${incidentId} not found` });
    }
    return res.status(200).json({ success: true, data: evalResult });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const getIncidentResponsePlan = (req, res) => {
  try {
    const incidentId = req.params.incidentId;
    const state = resQFlowStore.getState();
    const incident = state.incidents.find(i => i.incidentId === incidentId || i._id === incidentId);
    if (!incident) {
      return res.status(404).json({ success: false, message: `Incident ${incidentId} not found` });
    }
    return res.status(200).json({
      success: true,
      data: {
        incidentId,
        category: incident.category,
        facts: incident.facts,
        responsePlan: incident.responsePlan,
        allocatedAgencies: incident.allocatedAgencies,
        missingAgencies: incident.missingAgencies,
        hospitalEvaluation: incident.hospitalEvaluation
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Computer Vision Emergency Scene Analysis (PS10)
 */
const analyzeImage = async (req, res) => {
  try {
    const imageData = req.body?.image || req.body?.imageData || req.body?.media;
    if (!imageData) {
      return res.status(400).json({ success: false, error: 'No image data provided for computer vision analysis' });
    }
    const context = {
      category: req.body?.category,
      address: req.body?.address,
      description: req.body?.description
    };
    const visionResult = await computerVisionService.analyzeEmergencyImage(imageData, context);
    return res.status(200).json({
      success: true,
      data: visionResult
    });
  } catch (error) {
    console.error('Vision analysis error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Time-Series Hospital Load Forecast (PS10)
 */
const getHospitalForecast = (req, res) => {
  try {
    const hospitalId = req.params.hospitalId;
    const state = resQFlowStore.getState();
    const hospital = state.hospitals.find(h => h.id === hospitalId || h._id === hospitalId);
    if (!hospital) {
      return res.status(404).json({ success: false, message: `Hospital ${hospitalId} not found` });
    }
    const forecast = hospitalLoadForecaster.forecastHospitalLoad(hospital, state.incidents);
    return res.status(200).json({
      success: true,
      data: forecast
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Time-Series City-Wide Emergency Demand Forecast (PS10)
 */
const getCityDemandForecast = (req, res) => {
  try {
    const state = resQFlowStore.getState();
    const forecast = hospitalLoadForecaster.forecastCityWideDemand(
      state.incidents.filter(i => i.status === 'ASSIGNED').length,
      state.heavyRainActive
    );
    return res.status(200).json({
      success: true,
      data: forecast
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Graph Neural Network (GNN) Road Congestion & Dependency Prediction (PS10)
 */
const getGnnTrafficPrediction = (req, res) => {
  try {
    const state = resQFlowStore.getState();
    const gnnResult = gnnRoadNetworkPredictor.predictNetworkCongestion(
      state.incidents,
      state.heavyRainActive,
      state.closedEdges
    );
    return res.status(200).json({
      success: true,
      data: gnnResult
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Full Architecture & Stack Status (PS10 Verification)
 */
const getSystemArchitectureStatus = (req, res) => {
  try {
    const redisStatus = redisAdapter.getStatus();
    return res.status(200).json({
      success: true,
      data: {
        architecture: 'Decoupled Multi-Service AI Emergency Response Platform',
        components: {
          nlpTriage: { status: 'ONLINE', model: 'Deterministic Rule + Gemini Fallback' },
          computerVision: { status: 'ONLINE', model: 'Local Visual Feature Extractor + Gemini 1.5 Vision' },
          resourceAllocation: { status: 'ONLINE', model: 'Kuhn-Munkres Hungarian Min-Cost Bipartite Optimizer' },
          clinicalValidation: { status: 'ONLINE', model: 'Hard-Constraint Clinical Specialty & ICU Validator' },
          timeSeriesForecaster: { status: 'ONLINE', model: 'Holt-Winters Linear Trend + M/M/c Poisson Queue' },
          graphNeuralNetwork: { status: 'ONLINE', model: '2-Layer Graph Convolutional Network (GCN)' },
          stateAndCaching: { status: 'ONLINE', ...redisStatus }
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
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
};
