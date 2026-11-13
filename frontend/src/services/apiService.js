import axios from 'axios';
import useDemoStore from '../demo/demoStore';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const BASE_URL = API_URL.replace(/\/api$/, '');
// We determine if we are strictly in demo mode at startup based on missing critical env vars
// For simplicity in this codebase, if VITE_API_URL is missing, we assume local dev, 
// but we can look for a specific VITE_USE_DEMO_MODE flag or MONGODB presence.
// Let's use a dedicated local storage flag or env variable.
export const isSystemDemoMode = import.meta.env.VITE_FORCE_DEMO === 'true' || !import.meta.env.VITE_API_URL;

class ApiService {
  constructor() {
    this.demoStore = useDemoStore.getState();
    // Subscribe to store changes so our local reference is always fresh
    useDemoStore.subscribe((state) => {
      this.demoStore = state;
    });
  }

  // --- Helper to enforce Live vs Demo separation ---
  async execute(requestFn, demoFn) {
    if (isSystemDemoMode) {
      // Simulate network delay for realism
      await new Promise(resolve => setTimeout(resolve, 600));
      return demoFn();
    }

    try {
      const response = await requestFn();
      return response.data.data;
    } catch (error) {
      // If we are in Live Mode but the API fails, we DO NOT fallback to demo data.
      // We throw the error so the UI can catch it and show a Retry button.
      console.error("Live API Error:", error);
      throw new Error(error.response?.data?.message || 'Failed to connect to live operational services. Please retry.');
    }
  }

  // --- Incidents ---
  async getIncidents(token) {
    return this.execute(
      () => axios.get(`${API_URL}/incidents`, { headers: { Authorization: `Bearer ${token}` } }),
      () => {
        // Return active incidents from demo store
        return this.demoStore.incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CANCELLED');
      }
    );
  }

  async createIncident(data, token) {
    const headers = { Authorization: `Bearer ${token}` };
    if (data instanceof FormData) {
      headers['Content-Type'] = 'multipart/form-data';
    }
    try {
      const res = await axios.post(`${API_URL}/incidents`, data, { headers });
      const newIncident = res.data.data;
      useDemoStore.setState(state => ({ incidents: [newIncident, ...state.incidents] }));
      return res;
    } catch (error) {
      console.error("Live API Error (Create):", error);
      throw new Error(error.response?.data?.message || 'Failed to create incident on live server.');
    }
  }

  // --- Ambulances ---
  async getAmbulances(token) {
    return this.execute(
      () => axios.get(`${API_URL}/ambulances`, { headers: { Authorization: `Bearer ${token}` } }),
      () => this.demoStore.ambulances
    );
  }

  // --- Hospitals ---
  async getHospitals(token) {
    return this.execute(
      () => axios.get(`${API_URL}/hospitals`, { headers: { Authorization: `Bearer ${token}` } }),
      () => this.demoStore.hospitals
    );
  }

  async assignAmbulance(incidentId, ambulanceId, token) {
    try {
      const res = await axios.post(`${API_URL}/dispatch/assign`, { incidentId, ambulanceId }, { headers: { Authorization: `Bearer ${token}` } });
      useDemoStore.getState().assignAmbulance(incidentId, ambulanceId);
      return res;
    } catch (error) {
      console.error("Live API Error (Assign):", error);
      throw new Error(error.response?.data?.message || 'Failed to assign ambulance on live server.');
    }
  }

  async updateIncidentStatus(incidentId, status, token) {
    try {
      const res = await axios.patch(`${API_URL}/incidents/${incidentId}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      useDemoStore.getState().updateIncidentStatus(incidentId, status);
      return res;
    } catch (error) {
      console.error("Live API Error (Status):", error);
      throw error;
    }
  }

  // --- ResQFlow AI Scenario & Mutation Endpoints ---
  async trigger1030AmScenario() {
    try {
      const res = await axios.post(`${API_URL}/scenario/1030am`);
      return res.data;
    } catch (error) {
      console.error("Scenario 10:30AM API Error:", error);
      throw error;
    }
  }

  async failAgencyResource(resourceId = 'FIRE_01', reason = 'Mechanical Breakdown / Engine Failure') {
    try {
      const res = await axios.patch(`${API_URL}/mutate/agency-resource`, { resourceId, reason });
      return res.data;
    } catch (error) {
      console.error("Mutate Agency Resource API Error:", error);
      throw error;
    }
  }

  async failAmbulance(ambulanceId = 'AMB001', reason = 'On-road breakdown reported by field crew') {
    try {
      if (ambulanceId && (
        ambulanceId.startsWith('FIRE_') || 
        ambulanceId.startsWith('RESCUE_') || 
        ambulanceId.startsWith('BOAT_') || 
        ambulanceId.startsWith('POLICE_') || 
        ambulanceId.startsWith('TRAFFIC_') || 
        ambulanceId.startsWith('HAZMAT_') || 
        ambulanceId.startsWith('STRUCT_')
      )) {
        return await this.failAgencyResource(ambulanceId, reason);
      }
      const res = await axios.patch(`${API_URL}/mutate/ambulance`, { ambulanceId, reason });
      return res.data;
    } catch (error) {
      console.error("Mutate Ambulance API Error:", error);
      throw error;
    }
  }

  async setHospitalIcuToZero(hospitalId = 'HOSP_B') {
    try {
      const res = await axios.patch(`${API_URL}/mutate/hospital`, { hospitalId });
      return res.data;
    } catch (error) {
      console.error("Mutate Hospital API Error:", error);
      throw error;
    }
  }

  async mutateTraffic(enabled = true) {
    try {
      const res = await axios.patch(`${API_URL}/mutate/traffic`, { enabled });
      return res.data;
    } catch (error) {
      console.error("Mutate Traffic API Error:", error);
      throw error;
    }
  }

  async addFourthEmergency() {
    try {
      const res = await axios.post(`${API_URL}/mutate/incident`);
      return res.data;
    } catch (error) {
      console.error("Mutate Incident API Error:", error);
      throw error;
    }
  }

  async resetScenario() {
    try {
      const res = await axios.post(`${API_URL}/scenario/reset`);
      return res.data;
    } catch (error) {
      console.error("Reset Scenario API Error:", error);
      throw error;
    }
  }

  async getScenarioState() {
    try {
      const res = await axios.get(`${API_URL}/scenario/state`);
      return res.data;
    } catch (error) {
      console.error("Get Scenario State API Error:", error);
      throw error;
    }
  }

  async extractNlp(text) {
    try {
      const res = await axios.post(`${API_URL}/resqflow/extract-nlp`, { text });
      return res.data;
    } catch (error) {
      console.error("NLP Extraction API Error:", error);
      throw error;
    }
  }

  async getRouteComparison() {
    try {
      const res = await axios.get(`${API_URL}/resqflow/route-comparison`);
      return res.data;
    } catch (error) {
      console.error("Route Comparison API Error:", error);
      throw error;
    }
  }

  async getMetrics() {
    try {
      const res = await axios.get(`${API_URL}/resqflow/metrics`);
      return res.data;
    } catch (error) {
      console.error("Metrics API Error:", error);
      throw error;
    }
  }

  async getBenchmark() {
    try {
      const res = await axios.get(`${API_URL}/resqflow/benchmark`);
      return res.data;
    } catch (error) {
      console.error("Benchmark API Error:", error);
      throw error;
    }
  }

  async assessSeverity(payload) {
    try {
      const res = await axios.post(`${API_URL}/resqflow/assess-severity`, payload);
      return res.data;
    } catch (error) {
      console.error("Assess Severity API Error:", error);
      throw error;
    }
  }

  async estimateResources(payload) {
    try {
      const res = await axios.post(`${API_URL}/resqflow/estimate-resources`, payload);
      return res.data;
    } catch (error) {
      console.error("Estimate Resources API Error:", error);
      throw error;
    }
  }

  async mutateRoadClosure(edgeId = 'edge_kukatpally_erragadda', closed = true) {
    try {
      const res = await axios.patch(`${API_URL}/mutate/road-closure`, { edgeId, closed });
      return res.data;
    } catch (error) {
      console.error("Mutate Road Closure API Error:", error);
      throw error;
    }
  }

  async mutateSurgeScenario() {
    try {
      const res = await axios.post(`${API_URL}/mutate/surge-scenario`);
      return res.data;
    } catch (error) {
      console.error("Mutate Surge Scenario API Error:", error);
      throw error;
    }
  }

  async overrideAmbulance(incidentId, ambulanceId, reason, operatorId) {
    try {
      const res = await axios.post(`${API_URL}/override/ambulance`, { incidentId, ambulanceId, reason, operatorId });
      return res.data;
    } catch (error) {
      console.error("Override Ambulance API Error:", error);
      throw error;
    }
  }

  async overrideHospital(incidentId, hospitalId, reason, operatorId) {
    try {
      const res = await axios.post(`${API_URL}/override/hospital`, { incidentId, hospitalId, reason, operatorId });
      return res.data;
    } catch (error) {
      console.error("Override Hospital API Error:", error);
      throw error;
    }
  }

  async overrideSeverity(incidentId, severityScore, reason, operatorId) {
    try {
      const res = await axios.post(`${API_URL}/override/severity`, { incidentId, severityScore, reason, operatorId });
      return res.data;
    } catch (error) {
      console.error("Override Severity API Error:", error);
      throw error;
    }
  }

  async getOverrideAuditLog() {
    try {
      const res = await axios.get(`${API_URL}/override/audit-log`);
      return res.data;
    } catch (error) {
      console.error("Get Audit Log API Error:", error);
      throw error;
    }
  }

  // --- Analytics & Historical Data ---
  async getHistoricalIncidents(filters = {}, token) {
    const query = new URLSearchParams(filters).toString();
    try {
      const response = await axios.get(`${API_URL}/incidents/historical?${query}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = response.data.data || [];
      if (data.length === 0) {
        return this.demoStore.historicalIncidents || [];
      }
      return data;
    } catch (error) {
      console.error("Failed to fetch backend historical data, falling back to demo", error);
      return this.demoStore.historicalIncidents || [];
    }
  }

  async getAnalytics(token) {
    try {
      const response = await axios.get(`${API_URL}/analytics/overview`, { headers: { Authorization: `Bearer ${token}` } });
      const data = response.data.data;
      if (!data || Object.keys(data).length === 0 || (data.activeIncidents === 0 && data.totalResolved === 0)) {
        return this.demoStore.getAnalytics();
      }
      return data;
    } catch (error) {
      console.error("Failed to fetch backend analytics, falling back to demo", error);
      return this.demoStore.getAnalytics();
    }
  }

  // --- Road Conditions ---
  async getRoadConditions(token) {
    if (isSystemDemoMode) {
      await new Promise(resolve => setTimeout(resolve, 600));
      return this.demoStore.roadConditions || [];
    }
    try {
      const response = await axios.get(`${API_URL}/roads`, { headers: { Authorization: `Bearer ${token}` } });
      const data = response.data.data;
      if (!data || data.length === 0) {
        return this.demoStore.roadConditions || [];
      }
      return data;
    } catch (error) {
      console.error("Live API Error:", error);
      return this.demoStore.roadConditions || [];
    }
  }

  // --- Advanced PS10 AI Endpoints ---
  async analyzeImage(image, context = {}) {
    try {
      const res = await axios.post(`${API_URL}/resqflow/analyze-image`, { image, ...context });
      return res.data;
    } catch (error) {
      console.error("Computer Vision API Error:", error);
      throw error;
    }
  }

  async getHospitalForecast(hospitalId) {
    try {
      const res = await axios.get(`${API_URL}/resqflow/hospital-forecast/${hospitalId}`);
      return res.data;
    } catch (error) {
      console.error("Hospital Forecast API Error:", error);
      throw error;
    }
  }

  async getCityDemandForecast() {
    try {
      const res = await axios.get(`${API_URL}/resqflow/city-demand-forecast`);
      return res.data;
    } catch (error) {
      console.error("City Demand Forecast API Error:", error);
      throw error;
    }
  }

  async getGnnTrafficPrediction() {
    try {
      const res = await axios.get(`${API_URL}/resqflow/gnn-traffic-prediction`);
      return res.data;
    } catch (error) {
      console.error("GNN Traffic Prediction API Error:", error);
      throw error;
    }
  }

  async getSystemArchitectureStatus() {
    try {
      const res = await axios.get(`${API_URL}/resqflow/system-architecture-status`);
      return res.data;
    } catch (error) {
      console.error("System Architecture Status API Error:", error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
