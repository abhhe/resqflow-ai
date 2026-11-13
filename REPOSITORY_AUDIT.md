# REPOSITORY AUDIT: ResQFlow AI (KMIT YUKTIK 2026 - PS10)

## 1. Executive Summary

This audit assesses three codebases to formulate a unified, production-grade emergency coordination and dynamic resource allocation platform (ResQFlow AI) for Hackathon Problem Statement PS10.

- **Primary Repository:** `ai-ambulance-dispatch-routing` (React 19 + Vite frontend, Express 5 + Mongoose backend, FastAPI AI service).
- **Reference Repository 1:** `DSRS-VANET` (Vite + React client, Express server, Supabase/Python AI service, Chennai-specific static coordinates, explainable scoring rules).
- **Reference Repository 2:** `rural-healthcare-routing-engine` (React Vite client-only simulation, nearest-neighbor selectors with random delays).

---

## 2. Feature Comparison Matrix

| Feature | Primary repository | DSRS-VANET | Rural Healthcare | Final decision |
| :--- | :--- | :--- | :--- | :--- |
| **Emergency reporting** | Existing (Citizen report form + REST API) | Existing (Single hardcoded scenario trigger) | Existing (Dropdown emergency generator) | **REUSE & IMPROVE** (Reuse Primary citizen report & API; improve with Hyderabad scenario support) |
| **Severity estimation** | Existing (Gemini 1.5 Pro AI service with mock fallback) | Existing (Rule-based priority scoring calculation) | Missing (Hardcoded priority by category) | **IMPROVE & REFERENCE** (Extract explainable priority scoring from DSRS-VANET; upgrade NLP parser with deterministic entity extractor) |
| **Ambulance selection** | Existing (Single-incident Haversine heuristic) | Existing (Factor-based scoring with equipment check) | Existing (Simple nearest available ambulance reducer) | **IMPROVE & REFERENCE** (Extract DSRS-VANET capability & positive/negative evaluation factors into unified global allocation engine) |
| **Hospital selection** | Existing (Haversine distance + penalty scoring) | Existing (ICU/Trauma suitability scoring) | Existing (Nearest hospital filtering by doctor type) | **IMPROVE & REFERENCE** (Extract capability matching and strict ICU bed enforcement into backend allocation engine) |
| **Multi-emergency allocation** | Missing (Only handles 1 incident at a time) | Missing (Single mission focus: DSRS-2026-0019) | Missing (Independent sequential dispatch) | **BUILD FROM SCRATCH** (Implement `globalAllocationEngine` resolving simultaneous emergencies globally) |
| **Traffic optimization** | Incomplete (Calls external public OSRM; dummy flat penalty) | Missing (Static waypoints on Marina Beach route) | Missing (Direct straight-line distance) | **BUILD FROM SCRATCH** (Implement offline Hyderabad road graph with Dijkstra/A* optimizing travel time minutes) |
| **Dynamic reallocation** | Missing (Static assignment once dispatched) | Missing (Simulates communication failure, not vehicle reassignment) | Missing (No reallocation mechanism) | **BUILD FROM SCRATCH** (Implement reactive state manager handling ambulance failure, ICU depletion, rain congestion) |
| **Explainable decisions** | Incomplete (Raw distance/score numbers) | Existing (Positive/negative factor arrays and rejection reasons) | Existing (Simple array of log strings) | **IMPROVE & REFERENCE** (Adopt DSRS-VANET explainable factor architecture for both ambulances and hospitals) |
| **Real-time updates** | Existing (Socket.IO client/server events) | Incomplete (Local event bus / Supabase realtime) | Missing (React local component state only) | **REUSE & IMPROVE** (Reuse Primary Socket.IO server/client; broadcast unified state on mutation) |
| **Failure simulation** | Missing (No scenario control triggers) | Incomplete (Simulates network degradation only) | Missing (No mutation endpoints) | **BUILD FROM SCRATCH** (Implement canonical 10:30 AM scenario and 5 mutation endpoints) |

---

## 3. Detailed Component Categorization & Decision Rationale

### A. Primary Repository (`ai-ambulance-dispatch-routing`)
* **Architecture:** Node.js/Express backend with MongoDB/Mongoose models, React 19 / Vite frontend with TailwindCSS and Leaflet, and a Python FastAPI microservice.
* **Backend Models (`Incident`, `Ambulance`, `Hospital`, `Dispatch`, `Route`):**
  - **Category:** **REUSE & IMPROVE**.
  - **Rationale:** Schema design is modular and aligns well with PS10 requirements. We extend schemas to store Hyderabad road nodes, specific capability tags (`als`, `trauma`, `basic_life_support`, `rescue_boat`), ICU capacities, and decision explanation logs.
* **Dispatch Controller (`backend/src/controllers/dispatchController.js`):**
  - **Category:** **IMPROVE**.
  - **Rationale:** Currently only evaluates one incident at a time using Euclidean distance. Needs to integrate the global multi-incident assignment engine.
* **Routing Service (`backend/src/services/routingService.js`):**
  - **Category:** **IMPROVE / BUILD FROM SCRATCH**.
  - **Rationale:** Hard reliance on `http://router.project-osrm.org` makes the app fragile in offline, sandboxed, or intermittent network conditions. We build an internal Hyderabad road graph engine with Dijkstra/A* routing using real travel times and weather congestion multipliers, keeping OSRM as an optional fallback.
* **AI Service (`ai-service/app/services/gemini_service.py`):**
  - **Category:** **IMPROVE**.
  - **Rationale:** Relies on an external Gemini API key. We add a deterministic, offline-capable NLP extractor that extracts emergency type, Hyderabad location, count of affected people (both numerical and word-based like "five"), and capability tags.
* **Frontend Dashboard (`frontend/src/pages/CommandDashboard.jsx` & `MapComponent.jsx`):**
  - **Category:** **REUSE & IMPROVE**.
  - **Rationale:** The React/Leaflet dashboard UI is clean and professional. We enhance it with Hyderabad city center coordinates, live scenario mutation control bar, active multi-incident cards, and an Explainable AI decision panel.

### B. Reference Repository 1 (`DSRS-VANET`)
* **Explainable Priority Scoring (`shared/engine.ts`):**
  - **Category:** **REFERENCE & REIMPLEMENT**.
  - **Rationale:** The mathematical decomposition of incident severity into Severity, Golden Hour Risk, Victim Count, and Resource Pressure points is clean and explainable. We port this logic into the Node.js backend.
* **Ambulance & Hospital Evaluation Factors:**
  - **Category:** **REFERENCE & REIMPLEMENT**.
  - **Rationale:** Evaluating candidates by recording `positiveFactors`, `negativeFactors`, and explicit `rejectionReason` provides genuine transparency for operators. We adapt this into our allocation engine.
* **Chennai Coordinates & Hardcoded Scenario:**
  - **Category:** **DO NOT USE**.
  - **Rationale:** PS10 demonstration requires Hyderabad city nodes (Kukatpally, Ameerpet, Miyapur, etc.).
* **Supabase / Separate Full Backend:**
  - **Category:** **DO NOT USE**.
  - **Rationale:** Introducing Supabase or a second duplicate backend violates the architectural constraint and creates unnecessary operational overhead.

### C. Reference Repository 2 (`rural-healthcare-routing-engine`)
* **Hospital Capability Matching (`src/algorithms/dispatchEngine.js`):**
  - **Category:** **REFERENCE ONLY**.
  - **Rationale:** The concept of verifying specialist care (cardiologist, trauma care) and medicine kits before dispatch is valuable.
* **Nearest-Neighbor Algorithms (`ambulanceSelector.js`, `hospitalSelector.js`):**
  - **Category:** **DO NOT USE**.
  - **Rationale:** Uses naive `.reduce((best, curr) => curr.distance < best.distance ? curr : best)` which causes global resource bottlenecks and ignores travel time and multi-incident priorities.
* **Random Wait Times & Random Progress:**
  - **Category:** **DO NOT USE**.
  - **Rationale:** Hackathon demonstrations require deterministic, reproducible results rather than `Math.random()` delays.

---

## 4. Architectural Integration Blueprint

```
+-----------------------------------------------------------------------------------+
|                           REACT 19 / VITE FRONTEND                                |
|  - Operations Header & Hyderabad Node Dropdown                                    |
|  - Scenario Control Bar (10:30 AM Demo, Fail AMB001, ICU=0, Rain, Add 4th, Reset) |
|  - Leaflet Map (Hyderabad Nodes, Live Ambulances, Dynamic Polylines)              |
|  - Multi-Incident Priority Action Queue                                           |
|  - Explainable AI Decision Log & Performance Metric Comparison                    |
+-----------------------------------------------------------------------------------+
                                   │            ▲
                      HTTP / REST  │            │ Socket.IO Events
                                   ▼            │
+-----------------------------------------------------------------------------------+
|                        EXPRESS 5 NODE.JS BACKEND                                  |
|  Controllers & Services:                                                          |
|  ├── scenarioController.js      -> Orchestrates canonical 10:30 AM scenario       |
|  ├── mutationController.js      -> Handles resource failures, traffic, resets     |
|  ├── globalAllocationEngine.js  -> Multi-incident constraint-aware solver         |
|  ├── hyderabadGraphRouter.js    -> Dijkstra/A* travel-time pathfinder             |
|  └── nlpExtractor.js            -> Deterministic entity & capability parser       |
+-----------------------------------------------------------------------------------+
                                   │            ▲
                 Internal / HTTP   │            │
                                   ▼            │
+-----------------------------------------------------------------------------------+
|                         AI MICROSERVICE (FastAPI)                                 |
|  - Gemini 1.5 Pro Analysis (with offline deterministic NLP fallback)             |
|  - Entity Extraction: Type, Location, Casualty Count, Capability                  |
+-----------------------------------------------------------------------------------+
```

---

## 5. Licensing & Attribution Notice

- All reusable patterns and mathematical logic ported from `DSRS-VANET` (authored by Sashank2006) and `rural-healthcare-routing-engine` (authored by Hritik2545) are credited.
- Original code retains respective open-source licensing compliance with zero proprietary or restricted license infringement.

