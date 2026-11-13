# ResQFlow AI 🚑

**KMIT YUKTIK 2026 — Problem Statement PS10**  
*Intelligent Real-Time Emergency Coordination and Dynamic Resource Allocation Platform*

---

## 🚨 Problem Statement & Solution

Emergency ambulances can lose critical time during urban crises due to uncoordinated dispatching, heavy traffic, and mismatched hospital facilities.

**ResQFlow AI** coordinates multiple simultaneous emergencies across a city, matching resource capabilities (ALS, Trauma, Rescue Boat), calculating traffic-aware routes using Dijkstra pathfinding on travel time, and dynamically adapting when ambulances fail, ICU beds deplete, or heavy rains cause flash traffic congestion.

> **Key Demonstration Region:** Simulated Hyderabad Metropolitan Corridor (Kukatpally, Miyapur, JNTU, KPHB, Erragadda, Ameerpet, Hitec City, SR Nagar).

---

## ⚡ Quick Start (Run in Under 2 Minutes)

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)
- **MongoDB** *(Optional — ResQFlow AI features a built-in hybrid in-memory store so it runs instantly without any external database setup!)*

---

### 1. Start the Backend API Server
```bash
cd backend
npm install
npm start
```
*Backend runs on `http://localhost:5000` with WebSocket support on the same port.*

---

### 2. Start the Frontend Command Center
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173` (or the port Vite reports).*  
*Open your browser to `http://localhost:5173` and click **Launch Command Center**.*

---

### 3. (Optional) Start the FastAPI AI Microservice
```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
*Note: ResQFlow AI includes an internal deterministic NLP entity extraction engine in the backend, so the system is 100% operational even without running the Python microservice or having a Gemini API key!*

---

## 🧪 Run Automated Verification Tests

ResQFlow AI includes an automated test suite verifying all 15 PS10 Acceptance Requirements:

```bash
cd backend
npm test
```

### Verified Test Results (100% Success)
- ✅ **Test 1:** Three simultaneous emergencies processed in 10:30 AM scenario
- ✅ **Test 2:** Incidents sorted by priority (Cardiac: 97 -> Accident: 90 -> Flood: 85)
- ✅ **Test 3:** Invariant enforced: No ambulance assigned to two active missions
- ✅ **Test 4:** Unavailable ambulances excluded from allocation
- ✅ **Test 5:** Ambulance capability matching (ALS for Cardiac, Trauma for Accident, Boat for Flood)
- ✅ **Test 6:** Hospital ICU capacity enforced for critical emergencies
- ✅ **Test 7:** No hospital receives an invalid capacity reservation
- ✅ **Test 8:** Ambulance failure causes dynamic reallocation without interrupting patient care
- ✅ **Test 9:** Hospital B ICU = 0 results in suitable alternative hospital (Hospital C Medicover Hitec City)
- ✅ **Test 10:** Heavy rain causes traffic-aware route recalculation
- ✅ **Test 11:** 7 km / 12 minute route beats 5 km / 22 minute route via Dijkstra
- ✅ **Test 12:** 4th emergency added without invalidating existing missions
- ✅ **Test 13:** Map data reflects backend routes and assignments
- ✅ **Test 14:** Transparent explainable decision logging
- ✅ **Test 15:** Clean reset returns all demo resources to initial state
- ✅ **Test 16:** NLP Emergency Text Extraction parses categories, casualties, and capabilities

---

## 🎮 Hackathon Live Demonstration Walkthrough

From the top **Scenario Control Console**, judges and operators can trigger the 6 core scenarios with instant feedback:

1. **Trigger 10:30 AM (`POST /api/scenario/1030am`):**
   - Creates the 3 canonical emergencies: Cardiac in Ameerpet (97), Accident in Kukatpally (90), Flood in Miyapur (85).
   - Global allocation engine coordinates all 3 simultaneously with zero double assignments.
2. **Fail AMB001 (`PATCH /api/mutate/ambulance`):**
   - Marks AMB001 offline. Detects affected mission (Incident A) and dynamically reallocates to AMB003 with trauma capability.
3. **Hosp B ICU = 0 (`PATCH /api/mutate/hospital`):**
   - Sets Hospital B ICU capacity to 0. Excludes Hospital B and reallocates critical Incident B to Hospital C (Medicover Hitec City).
4. **Heavy Rain Congestion (`PATCH /api/mutate/traffic`):**
   - Penalizes Route A direct corridor (+12 min -> 22 min). Dijkstra pathfinder switches to Route B bypass (7.0 km, 12 min).
5. **Add 4th Emergency (`POST /api/mutate/incident`):**
   - Injects Incident D (Fall at JNTU, Priority 78) into the active operations queue without invalidating active missions.
6. **Reset Demo (`POST /api/scenario/reset`):**
   - Cleans the state and restores all ambulances and hospital capacities to baseline.

---

## 📚 Deliverable Documents

1. [REPOSITORY_AUDIT.md](file:///c:/Users/Racharla%20Abhinavteja/OneDrive/Desktop/kmit/REPOSITORY_AUDIT.md) — Inspection matrix and component categorization.
2. [IMPLEMENTATION_SUMMARY.md](file:///c:/Users/Racharla%20Abhinavteja/OneDrive/Desktop/kmit/IMPLEMENTATION_SUMMARY.md) — Complete overview of modified and added features.
3. [ARCHITECTURE.md](file:///c:/Users/Racharla%20Abhinavteja/OneDrive/Desktop/kmit/ARCHITECTURE.md) — System architecture, sequence flows, and invariant guards.
4. [API_DOCUMENTATION.md](file:///c:/Users/Racharla%20Abhinavteja/OneDrive/Desktop/kmit/API_DOCUMENTATION.md) — Endpoints, payloads, and response structures.
5. [TEST_REPORT.md](file:///c:/Users/Racharla%20Abhinavteja/OneDrive/Desktop/kmit/TEST_REPORT.md) — Test logs and empirical verification.

---

## ⚖️ Attribution & Licensing

- **Primary Repository:** `ai-ambulance-dispatch-routing` by *tarushivishwakarma* (ISC License).
- **Reference 1:** `DSRS-VANET` by *Sashank2006* (Explainable factor concepts & scoring models).
- **Reference 2:** `rural-healthcare-routing-engine` by *Hritik2545* (Specialist matching concepts).
- All simulated demonstration data is explicitly labeled as simulated data.
