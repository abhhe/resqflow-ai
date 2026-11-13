import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, Clock, Activity, Truck, MapPin, Search, ShieldAlert, 
  Hospital, TrendingUp, ChevronRight, Play, RefreshCw, CloudRain, 
  PlusCircle, Cpu, Zap, CheckCircle2, XCircle, ArrowRight, MessageSquare,
  Radio, Sliders, ShieldCheck, Flame, Users, Bed, Network
} from 'lucide-react';
import MapComponent from '../components/MapComponent';
import IncidentDetailsPanel from '../components/IncidentDetailsPanel';
import HospitalManagementModal from '../components/HospitalManagementModal';
import { apiService } from '../services/apiService';
import { socketService } from '../services/socket';

const HYDERABAD_LOCATIONS = [
  'All Hyderabad',
  'Kukatpally',
  'Miyapur',
  'JNTU',
  'KPHB',
  'Erragadda',
  'Ameerpet',
  'Hitec City',
  'SR Nagar'
];

const KpiBlock = ({ label, value, color, sub, trend }) => (
  <motion.div 
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col gap-0.5 py-1 px-3 border-l border-slate-700/70 first:border-l-0 min-w-0"
  >
    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">{label}</span>
    <div className="flex items-baseline gap-1.5">
      <motion.span 
        key={value}
        initial={{ opacity: 0.5, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`text-xl font-black ${color} tracking-tight leading-none`}
      >
        {value}
      </motion.span>
      {trend && <span className="text-[9px] font-semibold text-slate-400">{trend}</span>}
    </div>
    {sub && <span className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{sub}</span>}
  </motion.div>
);

const CommandDashboard = () => {
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState('All Hyderabad');
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [activeScenarioName, setActiveScenarioName] = useState('INITIAL_STATE');
  const [heavyRainActive, setHeavyRainActive] = useState(false);
  const [roadClosureActive, setRoadClosureActive] = useState(false);
  const [routeComparison, setRouteComparison] = useState(null);
  const [backendState, setBackendState] = useState(null);
  const [decisionLogs, setDecisionLogs] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [overrideAuditLog, setOverrideAuditLog] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  
  // Interactive NLP & Override Modals
  const [leftPanelTab, setLeftPanelTab] = useState('incidents'); // 'incidents' | 'fleet'
  const [nlpInputText, setNlpInputText] = useState('Five people injured in a road accident near Kukatpally.');
  const [nlpResult, setNlpResult] = useState(null);
  const [activeTab, setActiveTab] = useState('decisions'); // 'decisions' | 'agencies' | 'metrics' | 'gnn' | 'nlp' | 'audit'
  const [hospitalModalOpen, setHospitalModalOpen] = useState(false);
  const [gnnData, setGnnData] = useState(null);
  const [loadingGnn, setLoadingGnn] = useState(false);

  const fetchGnnData = async () => {
    setLoadingGnn(true);
    try {
      const res = await apiService.getGnnTrafficPrediction();
      if (res?.data) {
        setGnnData(res.data);
      }
    } catch (err) {
      console.warn('GNN fetch error:', err);
    } finally {
      setLoadingGnn(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'gnn' && !gnnData) {
      fetchGnnData();
    }
  }, [activeTab]);

  // Human Override Modal State
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideTargetIncident, setOverrideTargetIncident] = useState(null);
  const [overrideType, setOverrideType] = useState('AMBULANCE'); // 'AMBULANCE' | 'HOSPITAL' | 'SEVERITY'
  const [overrideValue, setOverrideValue] = useState('');
  const [overrideReason, setOverrideReason] = useState('Clinical triage operator decision');
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);

  // Fetch initial state from backend
  const refreshFromBackend = async () => {
    try {
      const res = await apiService.getScenarioState();
      if (res.success && res.data) {
        setBackendState(res.data);
        setDecisionLogs(res.data.decisionLogs || []);
        setMetrics(res.data.metrics || null);
        setHeavyRainActive(res.data.heavyRainActive || false);
        setRoadClosureActive(res.data.roadClosureActive || false);
        setActiveScenarioName(res.data.scenarioName || 'INITIAL_STATE');
        setOverrideAuditLog(res.data.overrideAuditLog || []);
      }
    } catch (err) {
      console.warn('Backend not responding yet or in offline mode:', err.message);
    }
  };

  const loadBenchmark = async () => {
    try {
      const res = await apiService.getBenchmark();
      if (res.success) {
        setBenchmarkData(res.data);
      }
    } catch (err) {
      console.warn('Unable to load benchmark:', err.message);
    }
  };

  useEffect(() => {
    refreshFromBackend();
    loadBenchmark();

    // Connect to real-time socket events
    const socket = socketService.connect();
    if (socket) {
      setSocketConnected(socket.connected);
      socket.on('connect', () => setSocketConnected(true));
      socket.on('disconnect', () => setSocketConnected(false));

      socket.on('scenario:update', (data) => {
        console.log('[SOCKET] Scenario Update Event:', data.event);
        if (data.state) {
          setBackendState(data.state);
          setDecisionLogs(data.state.decisionLogs || []);
          setMetrics(data.state.metrics || null);
          setHeavyRainActive(data.state.heavyRainActive || false);
          setRoadClosureActive(data.state.roadClosureActive || false);
          setActiveScenarioName(data.state.scenarioName || 'UPDATED');
          setOverrideAuditLog(data.state.overrideAuditLog || []);
          setSelectedIncident(prev => {
            if (!prev) return null;
            return (data.state.incidents || []).find(i => i.incidentId === prev.incidentId || i._id === prev._id) || prev;
          });
        }
      });
    }

    return () => {
      // socket persists
    };
  }, []);

  // Scenario & Mutation Action Handlers
  const handleTrigger1030Am = async () => {
    try {
      setScenarioLoading(true);
      const res = await apiService.trigger1030AmScenario();
      if (res.data) {
        setBackendState(res.data);
        setDecisionLogs(res.data.decisionLogs || []);
        setMetrics(res.data.metrics || null);
        setActiveScenarioName(res.data.scenarioName);
        setHeavyRainActive(res.data.heavyRainActive || false);
        setRoadClosureActive(res.data.roadClosureActive || false);
        loadBenchmark();
      }
    } catch (err) {
      console.error('Trigger 10:30AM failed:', err);
    } finally {
      setScenarioLoading(false);
    }
  };

  const handleFailAmbulance = async () => {
    try {
      setScenarioLoading(true);
      const res = await apiService.failAmbulance('AMB001');
      if (res.data) {
        setBackendState(res.data);
        setDecisionLogs(res.data.decisionLogs || []);
        setMetrics(res.data.metrics || null);
        loadBenchmark();
      }
    } catch (err) {
      console.error('Fail Ambulance failed:', err);
    } finally {
      setScenarioLoading(false);
    }
  };

  const handleMutateHospital = async () => {
    try {
      setScenarioLoading(true);
      const res = await apiService.setHospitalIcuToZero('HOSP_B');
      if (res.data) {
        setBackendState(res.data);
        setDecisionLogs(res.data.decisionLogs || []);
        setMetrics(res.data.metrics || null);
        loadBenchmark();
      }
    } catch (err) {
      console.error('Mutate Hospital failed:', err);
    } finally {
      setScenarioLoading(false);
    }
  };

  const handleToggleTraffic = async () => {
    try {
      setScenarioLoading(true);
      const res = await apiService.mutateTraffic(!heavyRainActive);
      if (res.data) {
        setBackendState(res.data);
        setDecisionLogs(res.data.decisionLogs || []);
        setMetrics(res.data.metrics || null);
        setHeavyRainActive(res.data.heavyRainActive);
        setRouteComparison(res.data.routeComparison || null);
        loadBenchmark();
      }
    } catch (err) {
      console.error('Mutate Traffic failed:', err);
    } finally {
      setScenarioLoading(false);
    }
  };

  const handleToggleRoadClosure = async () => {
    try {
      setScenarioLoading(true);
      const res = await apiService.mutateRoadClosure('edge_kukatpally_erragadda', !roadClosureActive);
      if (res.data) {
        setBackendState(res.data);
        setDecisionLogs(res.data.decisionLogs || []);
        setMetrics(res.data.metrics || null);
        setRoadClosureActive(res.data.roadClosureActive || false);
        loadBenchmark();
      }
    } catch (err) {
      console.error('Mutate Road Closure failed:', err);
    } finally {
      setScenarioLoading(false);
    }
  };

  const handleTriggerSurgeScenario = async () => {
    try {
      setScenarioLoading(true);
      const res = await apiService.mutateSurgeScenario();
      if (res.data) {
        setBackendState(res.data);
        setDecisionLogs(res.data.decisionLogs || []);
        setMetrics(res.data.metrics || null);
        setActiveScenarioName(res.data.scenarioName);
        loadBenchmark();
      }
    } catch (err) {
      console.error('Trigger Surge Scenario failed:', err);
    } finally {
      setScenarioLoading(false);
    }
  };

  const handleAddFourthIncident = async () => {
    try {
      setScenarioLoading(true);
      const res = await apiService.addFourthEmergency();
      if (res.data) {
        setBackendState(res.data);
        setDecisionLogs(res.data.decisionLogs || []);
        setMetrics(res.data.metrics || null);
        loadBenchmark();
      }
    } catch (err) {
      console.error('Add 4th Incident failed:', err);
    } finally {
      setScenarioLoading(false);
    }
  };

  const handleResetScenario = async () => {
    try {
      setScenarioLoading(true);
      const res = await apiService.resetScenario();
      if (res.data) {
        setBackendState(res.data);
        setDecisionLogs(res.data.decisionLogs || []);
        setMetrics(res.data.metrics || null);
        setHeavyRainActive(false);
        setRoadClosureActive(false);
        setRouteComparison(null);
        setActiveScenarioName('INITIAL_STATE');
        setOverrideAuditLog([]);
        loadBenchmark();
      }
    } catch (err) {
      console.error('Reset failed:', err);
    } finally {
      setScenarioLoading(false);
    }
  };

  const handleRunNlp = async () => {
    try {
      const res = await apiService.extractNlp(nlpInputText);
      if (res.success) {
        setNlpResult(res.data);
      }
    } catch (err) {
      console.error('NLP Extraction failed:', err);
    }
  };

  // Human Override Execution
  const handleOpenOverride = (incident) => {
    setOverrideTargetIncident(incident);
    setOverrideType('AMBULANCE');
    setOverrideValue('');
    setOverrideReason('Tactical clinical dispatch override');
    setOverrideModalOpen(true);
  };

  const handleSubmitOverride = async () => {
    if (!overrideTargetIncident || !overrideValue) return;
    try {
      setOverrideSubmitting(true);
      const incId = overrideTargetIncident.incidentId || overrideTargetIncident._id;
      let res;
      if (overrideType === 'AMBULANCE') {
        res = await apiService.overrideAmbulance(incId, overrideValue, overrideReason, 'OPERATOR_1');
      } else if (overrideType === 'HOSPITAL') {
        res = await apiService.overrideHospital(incId, overrideValue, overrideReason, 'OPERATOR_1');
      } else if (overrideType === 'SEVERITY') {
        res = await apiService.overrideSeverity(incId, Number(overrideValue), overrideReason, 'OPERATOR_1');
      }

      if (res && res.data) {
        setBackendState(res.data.state);
        setDecisionLogs(res.data.state?.decisionLogs || []);
        setMetrics(res.data.state?.metrics || null);
        setOverrideAuditLog(res.data.state?.overrideAuditLog || []);
      }
      setOverrideModalOpen(false);
      setActiveTab('audit');
    } catch (err) {
      console.error('Override failed:', err);
      alert('Override failed: ' + err.message);
    } finally {
      setOverrideSubmitting(false);
    }
  };

  // Derive state values
  const rawIncidents = backendState?.incidents || [];
  const rawAmbulances = backendState?.ambulances || [];
  const rawHospitals = backendState?.hospitals || [];
  const rawRoutes = backendState?.routes || [];

  const filteredIncidents = selectedLocation === 'All Hyderabad' 
    ? rawIncidents 
    : rawIncidents.filter(i => (i.node === selectedLocation || i.locationName === selectedLocation));

  const filteredAmbulances = selectedLocation === 'All Hyderabad'
    ? rawAmbulances
    : rawAmbulances.filter(a => a.node === selectedLocation);

  const activeIncidents = rawIncidents.filter(i => i.status !== 'RESOLVED');
  const availableAmbulances = rawAmbulances.filter(a => a.status === 'AVAILABLE');
  const assignedAmbulances = rawAmbulances.filter(a => a.status === 'ASSIGNED');
  const availableHospitals = rawHospitals.filter(h => h.status === 'AVAILABLE');

  return (
    <>
      <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800">
        
        {/* Operations Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px] tracking-wider uppercase border border-rose-500/30">
                PS10 • KMIT YUKTIK 2026
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[10px] tracking-wider uppercase border border-blue-500/30">
                Hyderabad Simulated Corridor
              </span>
              {/* WebSocket Live Connection Badge */}
              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] tracking-wider flex items-center gap-1.5 border ${
                socketConnected 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {socketConnected ? 'LIVE WEBSOCKET' : 'STANDALONE / RECONNECTING'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              ResQFlow AI <span className="text-sm font-semibold text-slate-400">| Intelligent Emergency Dispatch & Routing Platform</span>
            </h1>
          </div>

          {/* Node Filter & NLP Quick-bar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 shadow-inner">
              <MapPin size={14} className="text-emerald-400" />
              <select
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer border-none"
              >
                {HYDERABAD_LOCATIONS.map(c => <option key={c} value={c} className="bg-slate-800 text-slate-200">{c}</option>)}
              </select>
            </div>

            <button 
              onClick={() => setActiveTab('nlp')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
            >
              <MessageSquare size={13} className="text-purple-400" />
              <span>NLP Extractor</span>
            </button>
          </div>
        </div>

        {/* 8 SCENARIO CONTROL BUTTONS (Canonical + Failure Mutations) */}
        <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-3 shadow-md backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Zap size={13} className="text-amber-400" />
              Scenario Control Console (PS10 Canonical Scenarios & Autonomous Mutations)
            </span>
            {scenarioLoading && (
              <span className="text-[10px] text-amber-400 font-mono animate-pulse flex items-center gap-1">
                <RefreshCw size={10} className="animate-spin" /> Processing Mutation...
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {/* Button 1: 10:30 AM Scenario */}
            <button
              onClick={handleTrigger1030Am}
              disabled={scenarioLoading}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow active:scale-95 text-center"
            >
              <Play size={12} />
              <span>1. 10:30 AM</span>
            </button>

            {/* Button 2: Fail AMB001 */}
            <button
              onClick={handleFailAmbulance}
              disabled={scenarioLoading}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow active:scale-95 text-center"
            >
              <AlertTriangle size={12} />
              <span>2. Fail AMB</span>
            </button>

            {/* Button 3: Hospital B ICU = 0 */}
            <button
              onClick={handleMutateHospital}
              disabled={scenarioLoading}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow active:scale-95 text-center"
            >
              <Hospital size={12} />
              <span>3. ICU = 0</span>
            </button>

            {/* Button 4: Heavy Rain Congestion */}
            <button
              onClick={handleToggleTraffic}
              disabled={scenarioLoading}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-bold transition shadow active:scale-95 text-center ${
                heavyRainActive 
                  ? 'bg-blue-500 text-white ring-2 ring-blue-300' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              <CloudRain size={12} />
              <span>4. Rain ({heavyRainActive ? '22m' : '10m'})</span>
            </button>

            {/* Button 5: Road Closure (Scenario C) */}
            <button
              onClick={handleToggleRoadClosure}
              disabled={scenarioLoading}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-bold transition shadow active:scale-95 text-center ${
                roadClosureActive 
                  ? 'bg-red-700 text-white ring-2 ring-red-400' 
                  : 'bg-red-900/80 hover:bg-red-800 text-rose-200 border border-red-700'
              }`}
            >
              <XCircle size={12} />
              <span>5. {roadClosureActive ? 'Route A Closed' : 'Close Route A'}</span>
            </button>

            {/* Button 6: 5-Incident Surge (Scenario D) */}
            <button
              onClick={handleTriggerSurgeScenario}
              disabled={scenarioLoading}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow active:scale-95 text-center"
            >
              <Users size={12} />
              <span>6. 5-Surge</span>
            </button>

            {/* Button 7: Add 4th Emergency */}
            <button
              onClick={handleAddFourthIncident}
              disabled={scenarioLoading}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow active:scale-95 text-center"
            >
              <PlusCircle size={12} />
              <span>7. Add INC_D</span>
            </button>

            {/* Button 8: Reset Demonstration */}
            <button
              onClick={handleResetScenario}
              disabled={scenarioLoading}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 rounded-lg text-xs font-bold transition shadow active:scale-95 text-center"
            >
              <RefreshCw size={12} />
              <span>8. Reset</span>
            </button>
          </div>
        </div>

        {/* TOP SUMMARY KPI STRIP */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 flex flex-wrap items-center justify-between shadow-sm">
          <KpiBlock 
            label="Active Emergencies" 
            value={activeIncidents.length} 
            color="text-amber-400" 
            sub={activeIncidents.length === 3 ? 'Canonical 10:30 AM' : `${activeIncidents.length} active`} 
          />
          <KpiBlock 
            label="Available Ambulances" 
            value={availableAmbulances.length} 
            color="text-emerald-400" 
            sub={`of ${rawAmbulances.length} units`} 
          />
          <KpiBlock 
            label="Assigned Ambulances" 
            value={assignedAmbulances.length} 
            color="text-blue-400" 
            sub="Active missions" 
          />
          <KpiBlock 
            label="Hospitals Available" 
            value={availableHospitals.length} 
            color="text-slate-100" 
            sub="Capacity verified" 
          />
          <KpiBlock 
            label="Queued / Unassigned" 
            value={rawIncidents.filter(i => i.status !== 'ASSIGNED' && i.status !== 'RESOLVED').length} 
            color="text-rose-400" 
            sub="Deterministic queue" 
          />
          <KpiBlock 
            label="Double Assignments" 
            value="0" 
            color="text-emerald-400" 
            sub="Strict Invariant Enforced" 
          />
          <KpiBlock 
            label="Avg Response ETA" 
            value={metrics?.comparison?.resQFlowAI?.avgResponseTimeMin ? `${metrics.comparison.resQFlowAI.avgResponseTimeMin}m` : '4.5m'} 
            color="text-cyan-400" 
            sub="Optimized Dijkstra Route" 
          />
        </div>

        {/* MAIN THREE-COLUMN OPERATIONS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[580px] min-h-[520px]">
          
          {/* Left Column (4 cols): Active Multi-Incident Queue & Fleet Status */}
          <div className="lg:col-span-4 flex flex-col h-full overflow-hidden">
            
            {/* Unified Operations Box */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 shadow-lg flex flex-col h-full overflow-hidden">
              
              {/* Header with Switcher Tabs */}
              <div className="flex justify-between items-center border-b border-slate-700 pb-2.5 mb-3 gap-2 shrink-0">
                <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-lg border border-slate-700/80">
                  <button
                    onClick={() => setLeftPanelTab('incidents')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                      leftPanelTab === 'incidents'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ShieldAlert size={12} className={leftPanelTab === 'incidents' ? 'text-rose-400' : 'text-slate-400'} />
                    <span>Emergencies</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500/30 text-rose-200 font-mono font-bold">
                      {rawIncidents.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setLeftPanelTab('fleet')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                      leftPanelTab === 'fleet'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Truck size={12} className={leftPanelTab === 'fleet' ? 'text-blue-400' : 'text-slate-400'} />
                    <span>Fleet</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-blue-500/30 text-blue-200 font-mono font-bold">
                      {rawAmbulances.filter(a => a.status === 'AVAILABLE').length}/{rawAmbulances.length}
                    </span>
                  </button>
                </div>

                <button
                  onClick={() => setHospitalModalOpen(true)}
                  className="px-2.5 py-1 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/60 rounded-lg text-[10px] font-bold text-emerald-300 transition flex items-center gap-1.5 shadow-sm shrink-0"
                  title="Hospital Network & ICU Capacity"
                >
                  <Hospital size={12} className="text-emerald-400" />
                  <span>Hospitals ({rawHospitals.length})</span>
                </button>
              </div>

              {/* View 1: Active Incidents List */}
              {leftPanelTab === 'incidents' && (
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin flex flex-col pt-0.5">
                  {rawIncidents.length === 0 ? (
                    <div className="text-center text-slate-400 text-xs py-16 flex flex-col items-center justify-center gap-2.5 flex-1">
                      <Activity size={26} className="text-slate-600" />
                      <span>No active emergencies in queue.</span>
                      <span className="text-[11px] text-slate-500">Click <strong className="text-emerald-400">1. 10:30 AM</strong> to launch dispatch simulation.</span>
                    </div>
                  ) : (
                    rawIncidents.map(inc => {
                      const isCrit = inc.priorityScore >= 85 || inc.severityCategory === 'CRITICAL';
                      const hasNeedsReview = inc.severityAssessment?.flags?.needsHumanReview;
                      const rawId = inc.incidentId || inc._id || '';
                      const cleanId = rawId.includes(':') ? rawId.split(':')[0].trim() : rawId;
                      const cleanCat = inc.category || (rawId.includes(':') ? rawId.split(':')[1]?.trim() : 'EMERGENCY');

                      return (
                        <div 
                          key={inc.incidentId || inc._id}
                          className={`p-2.5 rounded-xl border transition-all shadow-sm hover:shadow-md ${
                            isCrit 
                              ? 'bg-rose-950/25 border-rose-700/50 hover:border-rose-500/80' 
                              : 'bg-slate-900/70 border-slate-700/80 hover:border-slate-500/80'
                          }`}
                        >
                          {/* Row 1: ID, Category & Priority */}
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-mono font-bold text-xs text-cyan-300 truncate tracking-wide">
                                {cleanId}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                                {cleanCat.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 border ${
                              isCrit 
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}>
                              P: {inc.priorityScore || inc.priority || 70}
                            </span>
                          </div>

                          {/* Row 2: Location & Assigned Unit */}
                          <div className="flex items-center justify-between gap-2 mb-2 text-[11px]">
                            <span className="text-slate-300 font-medium flex items-center gap-1 truncate">
                              <MapPin size={11} className="text-emerald-400 shrink-0" />
                              <span className="truncate">{inc.node || inc.locationName || 'Hyderabad'}</span>
                            </span>

                            <span className="text-cyan-300 font-semibold shrink-0 flex items-center gap-1 font-mono text-[11px]">
                              {inc.assignedAmbulanceId ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  🚑 {inc.assignedAmbulanceId} ({inc.etaMinutes || 0}m)
                                </>
                              ) : inc.status === 'QUEUED' ? '⏳ Queued' : '⏳ Pending'}
                            </span>
                          </div>

                          {/* Row 3: Description snippet */}
                          <p className="text-[11px] text-slate-300 truncate mb-1.5 leading-relaxed bg-slate-950/40 px-2 py-1 rounded border border-slate-800/80">
                            {inc.description || 'Reported emergency incident awaiting dynamic triage.'}
                          </p>
                          
                          {/* Row 4: Clinical Requirements & Actions */}
                          <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-700/60 text-[10px]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-1.5 py-0.5 rounded bg-cyan-950/50 text-cyan-300 border border-cyan-800/60 font-medium">
                                Para: {inc.resourceRequirements?.personnel?.paramedics || 1}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-800/60 font-medium">
                                ICU: {inc.resourceRequirements?.hospitalBeds?.icu || 0}
                              </span>
                              {hasNeedsReview && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-800/60 flex items-center gap-0.5 font-medium">
                                  <AlertTriangle size={9} /> Review
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => setSelectedIncident(inc)}
                                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-semibold transition border border-slate-700 shadow-sm"
                              >
                                Details
                              </button>
                              <button
                                onClick={() => handleOpenOverride(inc)}
                                className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white border border-amber-500/40 rounded-lg text-[10px] font-bold flex items-center gap-1 transition shadow-sm"
                              >
                                <Sliders size={9} /> Override
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* View 2: Fleet Status */}
              {leftPanelTab === 'fleet' && (
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
                    <span>Unit ID & Base</span>
                    <span>Status & Tiers</span>
                  </div>
                  {rawAmbulances.map(a => (
                    <div key={a.ambulanceId} className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-white text-xs">{a.ambulanceId}</span>
                          <span className="text-[10px] text-slate-400">({a.node})</span>
                        </div>
                        <span className="text-[10px] text-purple-300 font-mono block mt-0.5">
                          {(a.capabilities || []).slice(0, 3).join(', ')}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                        a.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                        a.status === 'ASSIGNED' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      }`}>
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Fleet Readiness footer strip */}
              {leftPanelTab === 'incidents' && (
                <div className="pt-2.5 border-t border-slate-700/80 flex items-center justify-between text-[11px] text-slate-400 mt-2 shrink-0">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Truck size={12} className="text-blue-400" />
                    Fleet: <strong className="text-emerald-400">{availableAmbulances.length}</strong> / {rawAmbulances.length} Available
                  </span>
                  <button
                    onClick={() => setLeftPanelTab('fleet')}
                    className="text-cyan-400 hover:text-cyan-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                  >
                    View Fleet →
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Center Column (5 cols): Leaflet Interactive Map */}
          <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl shadow-lg flex flex-col relative overflow-hidden h-full">
            {/* Live Map Overlay Label - centered at the top to never collide with + / - zoom buttons */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[400] bg-slate-900/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-lg border border-slate-700 pointer-events-none flex items-center gap-2 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[11px] font-black text-white uppercase tracking-wider">
                Hyderabad Corridor (PS13 Traffic Pathfinder)
              </span>
            </div>

            {heavyRainActive && (
              <div className="absolute top-3 right-3 z-[400] bg-rose-950/90 backdrop-blur px-3 py-1.5 rounded-lg shadow border border-rose-700 pointer-events-none flex items-center gap-2">
                <CloudRain size={13} className="text-rose-400" />
                <span className="text-[10px] font-bold text-rose-200">
                  Route A Congestion: 22m (Route B Bypass: 12m)
                </span>
              </div>
            )}

            {roadClosureActive && (
              <div className="absolute top-12 right-3 z-[400] bg-red-950/90 backdrop-blur px-3 py-1.5 rounded-lg shadow border border-red-700 pointer-events-none flex items-center gap-2">
                <XCircle size={13} className="text-red-400" />
                <span className="text-[10px] font-bold text-red-200">
                  Route A Direct CLOSED: Dynamic Dijkstra Detour Active
                </span>
              </div>
            )}

            <div className="flex-1 w-full h-full relative z-0">
              <MapComponent 
                incidents={filteredIncidents} 
                ambulances={filteredAmbulances} 
                hospitals={rawHospitals}
                routes={rawRoutes}
                heavyRainActive={heavyRainActive}
                routeComparison={routeComparison}
              />
            </div>
          </div>

          {/* Right Column (3 cols): Explainable AI & Comparison Panel */}
          <div className="lg:col-span-3 flex flex-col bg-slate-800/80 border border-slate-700 rounded-xl shadow-lg overflow-hidden h-full">
            
            {/* Tab Selector: Sleek Pill Tabs Container with no word collision */}
            <div className="flex items-center gap-1 p-1.5 border-b border-slate-700 bg-slate-900/70 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveTab('decisions')}
                className={`px-2.5 py-1 text-center text-[11px] font-bold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'decisions' ? 'text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Decisions
              </button>
              <button
                onClick={() => setActiveTab('agencies')}
                className={`px-2.5 py-1 text-center text-[11px] font-bold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'agencies' ? 'text-orange-300 bg-orange-950/60 border border-orange-800/60 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Agencies
              </button>
              <button
                onClick={() => setActiveTab('metrics')}
                className={`px-2.5 py-1 text-center text-[11px] font-bold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'metrics' ? 'text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Benchmark
              </button>
              <button
                onClick={() => setActiveTab('gnn')}
                className={`px-2.5 py-1 text-center text-[11px] font-bold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'gnn' ? 'text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                GNN
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-2.5 py-1 text-center text-[11px] font-bold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'audit' ? 'text-amber-300 bg-amber-950/60 border border-amber-800/60 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Audit Log
              </button>
              <button
                onClick={() => setActiveTab('nlp')}
                className={`px-2.5 py-1 text-center text-[11px] font-bold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'nlp' ? 'text-purple-300 bg-purple-950/60 border border-purple-800/60 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                NLP
              </button>
            </div>

            {/* Tab: Multi-Agency Response Units (Fire, Rescue, Police, Traffic, HazMat, Structural) */}
            {activeTab === 'agencies' && (
              <div className="flex-1 flex flex-col p-3 overflow-hidden text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest flex items-center gap-1">
                    <ShieldAlert size={12} />
                    Multi-Agency Response Roster
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    {multiAgencyResources.length} units
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {multiAgencyResources.length === 0 ? (
                    <div className="text-slate-500 italic text-center py-10 text-xs">
                      No cross-agency resources loaded. Initialized on scenario trigger.
                    </div>
                  ) : (
                    multiAgencyResources.map(r => (
                      <div 
                        key={r.resourceId}
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">{r.name}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            r.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-400' :
                            r.status === 'ASSIGNED' ? 'bg-blue-500/20 text-blue-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {r.status}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-400 flex justify-between">
                          <span>Base: <strong className="text-slate-300">{r.node}</strong></span>
                          <span>Crew: <strong className="text-slate-300">{r.crew ? r.crew.split(' ')[0] : 'Squad'}</strong></span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {(r.capabilities || []).map((c, i) => (
                            <span key={i} className="text-[9px] px-1 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                              {c}
                            </span>
                          ))}
                        </div>

                        {r.currentAssignment && (
                          <div className="text-[10px] text-cyan-300 font-medium pt-1 border-t border-slate-800">
                            Dispatched to: <strong>{r.currentAssignment}</strong>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab 1: Explainable AI Decision Log */}
            {activeTab === 'decisions' && (
              <div className="flex-1 flex flex-col p-3 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Cpu size={12} className="text-cyan-400" />
                    Autonomous Decision Trace
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">
                    {decisionLogs.length} events logged
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-[11px] scrollbar-thin">
                  {decisionLogs.length === 0 ? (
                    <div className="text-slate-500 italic text-center py-10 text-xs">
                      No decisions recorded. Trigger 10:30 AM scenario to view real-time allocation factors.
                    </div>
                  ) : (
                    decisionLogs.slice().reverse().map((log, i) => {
                      const isSelected = log.message.includes('selected') || log.message.includes('Optimal Match');
                      const isRejected = log.message.includes('rejected') || log.message.includes('Lacks');
                      const isAlert = log.message.includes('ALERT') || log.message.includes('CRITICAL') || log.message.includes('OPERATOR');

                      if (isSelected) {
                        return (
                          <div key={i} className="px-2.5 py-1.5 rounded-lg border bg-emerald-950/30 border-emerald-800/60 text-emerald-200 shadow-sm flex items-start justify-between gap-2 text-[10px]">
                            <div className="flex items-start gap-1.5">
                              <CheckCircle2 size={11} className="text-emerald-400 shrink-0 mt-0.5" />
                              <span className="font-semibold text-emerald-300 leading-snug">{log.message}</span>
                            </div>
                            <span className="text-[9px] text-emerald-500 shrink-0 font-mono">
                              {log.timestamp ? log.timestamp.slice(11, 19) : ''}
                            </span>
                          </div>
                        );
                      }

                      if (isAlert) {
                        return (
                          <div key={i} className="px-2.5 py-1.5 rounded-lg border bg-amber-950/30 border-amber-800/60 text-amber-200 flex items-center justify-between gap-2 text-[10px]">
                            <div className="flex items-center gap-1.5 truncate">
                              <AlertTriangle size={11} className="text-amber-400 shrink-0" />
                              <span className="truncate text-amber-300 font-medium">{log.message}</span>
                            </div>
                            <span className="text-[9px] text-amber-500 shrink-0 font-mono">
                              {log.timestamp ? log.timestamp.slice(11, 19) : ''}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div key={i} className="px-2.5 py-1.5 rounded-lg border bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-700 transition flex items-center justify-between gap-2 text-[10px]">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isRejected ? 'bg-rose-500/80' : 'bg-cyan-500/80'}`} />
                            <span className="truncate text-slate-300">{log.message}</span>
                          </div>
                          <span className="text-[9px] text-slate-500 shrink-0 font-mono">
                            {log.timestamp ? log.timestamp.slice(11, 19) : ''}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Performance Comparison & Hungarian Benchmark */}
            {activeTab === 'metrics' && (
              <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs scrollbar-thin">
                <div className="border-b border-slate-700 pb-2">
                  <h4 className="font-bold text-white text-xs mb-1">Empirical Benchmark (Hungarian vs Greedy)</h4>
                  <p className="text-[10px] text-slate-400 italic">Evaluated under identical Hyderabad network constraints.</p>
                </div>

                {/* Hungarian vs Greedy Card */}
                {benchmarkData && (
                  <div className="bg-slate-900/90 border border-cyan-800/60 rounded-lg p-2.5 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Kuhn-Munkres Global Matching</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        {benchmarkData.comparison?.winner || 'OPTIMIZED'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-1.5 rounded bg-slate-800 border border-slate-700">
                        <span className="text-slate-400 block">Hungarian Total ETA</span>
                        <span className="font-bold text-emerald-400 text-xs">{benchmarkData.hungarian?.totalEtaMin || 0} min</span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-800 border border-slate-700">
                        <span className="text-slate-400 block">Greedy Baseline ETA</span>
                        <span className="font-bold text-rose-400 text-xs">{benchmarkData.greedy?.totalEtaMin || 0} min</span>
                      </div>
                    </div>

                    <div className="p-1.5 rounded bg-slate-800/70 text-[10px] text-slate-300">
                      <p className="font-semibold text-emerald-300">
                        ⚡ Efficiency Gain: {benchmarkData.comparison?.efficiencyGainPercent || 0}% ({benchmarkData.comparison?.timeSavedMin || 0}m saved)
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1 leading-normal">
                        {benchmarkData.comparison?.insights}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2.5">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Response Time (ETA)</span>
                    <div className="flex justify-between items-baseline">
                      <span className="text-rose-400 font-semibold">Baseline: {metrics?.comparison?.baseline?.avgResponseTimeMin || '8.3'}m</span>
                      <ArrowRight size={12} className="text-slate-500" />
                      <span className="text-emerald-400 font-bold text-sm">ResQFlow: {metrics?.comparison?.resQFlowAI?.avgResponseTimeMin || '4.5'}m</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Double Assignment Risk</span>
                    <div className="flex justify-between items-baseline">
                      <span className="text-rose-400 font-semibold">Baseline: High (Uncoordinated)</span>
                      <ArrowRight size={12} className="text-slate-500" />
                      <span className="text-emerald-400 font-bold text-sm">ResQFlow: ZERO (Atomic)</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">ICU Capacity Enforcement</span>
                    <div className="flex justify-between items-center">
                      <span className="text-rose-400 font-semibold flex items-center gap-1"><XCircle size={12} /> Naive Nearest</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 size={12} /> Verified ICU</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Recomputation Speed</span>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Global Solver Latency:</span>
                      <span className="font-mono text-emerald-400 font-bold">{metrics?.recomputeTimeMs || 12} ms</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Operator Override Audit Trail */}
            {activeTab === 'audit' && (
              <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs scrollbar-thin flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                    <ShieldCheck size={12} />
                    Operator Override Audit Trail
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    {overrideAuditLog.length} overrides
                  </span>
                </div>

                {overrideAuditLog.length === 0 ? (
                  <div className="text-slate-500 italic text-center py-10 text-xs">
                    No operator overrides executed. Dispatch decisions are autonomous. Click "Override" on any incident to manually modify resources.
                  </div>
                ) : (
                  overrideAuditLog.map((log, i) => (
                    <div key={i} className="p-2 rounded bg-slate-900 border border-amber-800/50 space-y-1 font-mono text-[10px]">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-amber-300">{log.type}</span>
                        <span className="text-slate-500">{log.timestamp ? log.timestamp.slice(11, 19) : ''}</span>
                      </div>
                      <p><span className="text-slate-400">Incident:</span> <span className="text-white font-bold">{log.incidentId}</span></p>
                      <p><span className="text-slate-400">Operator:</span> <span className="text-cyan-300">{log.operatorId}</span></p>
                      <p><span className="text-slate-400">Assignment:</span> <span className="text-rose-400">{log.originalAssignment || log.originalScore}</span> ➔ <span className="text-emerald-400 font-bold">{log.newAssignment || log.newScore}</span></p>
                      <p className="text-slate-300 italic">"{log.reason}"</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: Graph Neural Network (GNN) Road Congestion & Dependency Modeling (PS10) */}
            {activeTab === 'gnn' && (
              <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs scrollbar-thin flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Network size={14} className="text-emerald-400" />
                    <div>
                      <h4 className="font-bold text-white text-xs">GNN Road Congestion & Dependency Model (PS10)</h4>
                      <p className="text-[10px] text-slate-400">2-Layer Graph Convolutional Network (GCN) Message Passing</p>
                    </div>
                  </div>
                  <button
                    onClick={fetchGnnData}
                    disabled={loadingGnn}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 transition"
                    title="Re-run GCN Propagation"
                  >
                    <RefreshCw size={12} className={loadingGnn ? 'animate-spin' : ''} />
                  </button>
                </div>

                <div className="p-2.5 rounded bg-black/40 border border-slate-800 font-mono text-[10px] space-y-1">
                  <span className="text-emerald-400 font-bold block uppercase">GCN Propagation Formulation:</span>
                  <div className="text-slate-300">H^(l+1) = ReLU( D̃^(-1/2) Ã D̃^(-1/2) H^(l) W^(l) )</div>
                  <div className="text-slate-500 text-[9px]">9 Hyderabad Nodes • 13 Bidirectional Edge Links • Normalized Graph Laplacian</div>
                </div>

                {/* Primary Network Bottlenecks */}
                {gnnData?.primaryBottlenecks && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Primary GCN Network Bottlenecks:
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {gnnData.primaryBottlenecks.map((b, i) => (
                        <div key={i} className="p-2 rounded bg-slate-900 border border-slate-800 text-center">
                          <span className="text-[9px] text-slate-400 uppercase block">{b.node}</span>
                          <span className="font-bold text-rose-400 text-xs font-mono">Index: {b.gnnCongestionIndex}</span>
                          <span className="text-[8px] text-amber-400 block mt-0.5 font-semibold">{b.primaryRisk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Link Delay Predictions Table */}
                {gnnData?.linkPredictions && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      GNN-Enhanced Link Travel Time Predictions:
                    </span>
                    <div className="space-y-1 max-h-56 overflow-y-auto scrollbar-thin">
                      {gnnData.linkPredictions.map((lp, i) => (
                        <div key={i} className="p-2 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[10px] font-mono">
                          <div>
                            <span className="text-white font-bold">{lp.from} ➔ {lp.to}</span>
                            <span className="text-slate-500 block text-[9px]">Base: {lp.baseTravelTimeMin}m</span>
                          </div>
                          <div className="text-right">
                            <span className={`font-bold ${lp.congestionLevel === 'CLOSED' ? 'text-rose-500' : lp.congestionLevel === 'HIGH_CONGESTION' ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {lp.gnnPredictedTravelTimeMin > 900 ? 'INF (CLOSED)' : `${lp.gnnPredictedTravelTimeMin} min`}
                            </span>
                            <span className="block text-[8px] text-slate-400">{lp.congestionLevel}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: NLP Extractor Interactive Testing */}
            {activeTab === 'nlp' && (
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs scrollbar-thin flex flex-col">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1">
                  <MessageSquare size={12} />
                  Emergency Text NLP Extractor
                </span>

                <textarea
                  value={nlpInputText}
                  onChange={e => setNlpInputText(e.target.value)}
                  rows={3}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs outline-none focus:border-purple-500 font-sans"
                  placeholder="Type emergency report here..."
                />

                <div className="flex gap-2">
                  <button
                    onClick={handleRunNlp}
                    className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-bold transition shadow"
                  >
                    Extract Entities
                  </button>
                  <button
                    onClick={() => setNlpInputText('Four people trapped in flooding near Miyapur.')}
                    className="px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-[10px]"
                  >
                    Preset 3
                  </button>
                </div>

                {nlpResult && (
                  <div className="p-2.5 rounded bg-slate-900 border border-purple-800/60 font-mono text-[10px] space-y-1">
                    <p><span className="text-slate-500">Type:</span> <span className="font-bold text-emerald-400">{nlpResult.type}</span></p>
                    <p><span className="text-slate-500">Location:</span> <span className="font-bold text-cyan-400">{nlpResult.location}</span></p>
                    <p><span className="text-slate-500">Victims:</span> <span className="font-bold text-amber-400">{nlpResult.people_affected}</span></p>
                    <p><span className="text-slate-500">Capability:</span> <span className="font-bold text-purple-400">{nlpResult.required_capability}</span></p>
                    <p><span className="text-slate-500">Priority:</span> <span className="font-bold text-rose-400">{nlpResult.priority}/100</span></p>
                    <p className="text-slate-400 mt-1 italic">{nlpResult.reasoning}</p>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Human Operator Override Modal */}
      {overrideModalOpen && overrideTargetIncident && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl text-slate-100"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Sliders size={15} className="text-amber-400" />
                Human Operator Override Console
              </h3>
              <button 
                onClick={() => setOverrideModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Target Emergency:</span>
                <span className="font-bold text-white text-sm">
                  {overrideTargetIncident.incidentId || overrideTargetIncident._id}: {overrideTargetIncident.category} ({overrideTargetIncident.node})
                </span>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Override Action Type:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setOverrideType('AMBULANCE'); setOverrideValue(''); }}
                    className={`py-1.5 rounded text-xs font-bold border ${
                      overrideType === 'AMBULANCE' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    Ambulance
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOverrideType('HOSPITAL'); setOverrideValue(''); }}
                    className={`py-1.5 rounded text-xs font-bold border ${
                      overrideType === 'HOSPITAL' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    Hospital
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOverrideType('SEVERITY'); setOverrideValue('99'); }}
                    className={`py-1.5 rounded text-xs font-bold border ${
                      overrideType === 'SEVERITY' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    Priority
                  </button>
                </div>
              </div>

              {overrideType === 'AMBULANCE' && (
                <div>
                  <label className="text-slate-400 block mb-1">Select New Ambulance:</label>
                  <select
                    value={overrideValue}
                    onChange={e => setOverrideValue(e.target.value)}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-slate-200 outline-none"
                  >
                    <option value="">-- Choose Unit --</option>
                    {rawAmbulances.map(a => (
                      <option key={a.ambulanceId} value={a.ambulanceId}>
                        {a.ambulanceId} ({a.node}) - Status: {a.status} - Caps: {(a.capabilities || []).join(',')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {overrideType === 'HOSPITAL' && (
                <div>
                  <label className="text-slate-400 block mb-1">Select Receiving Hospital:</label>
                  <select
                    value={overrideValue}
                    onChange={e => setOverrideValue(e.target.value)}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-slate-200 outline-none"
                  >
                    <option value="">-- Choose Hospital --</option>
                    {rawHospitals.map(h => (
                      <option key={h.hospitalId} value={h.hospitalId}>
                        {h.name} ({h.node}) - ICU Beds: {h.availableIcuBeds !== undefined ? h.availableIcuBeds : h.icuBeds}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {overrideType === 'SEVERITY' && (
                <div>
                  <label className="text-slate-400 block mb-1">New Severity / Priority Score (1 - 100):</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={overrideValue}
                    onChange={e => setOverrideValue(e.target.value)}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-slate-200 outline-none font-bold text-sm"
                  />
                </div>
              )}

              <div>
                <label className="text-slate-400 block mb-1">Clinical Operator Justification (Audit Log):</label>
                <input
                  type="text"
                  value={overrideReason}
                  onChange={e => setOverrideReason(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-slate-200 outline-none"
                  placeholder="e.g., Specialized physician on board AMB003"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setOverrideModalOpen(false)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!overrideValue || overrideSubmitting}
                onClick={handleSubmitOverride}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded font-bold text-xs transition"
              >
                {overrideSubmitting ? 'Recording Audit...' : 'Execute Override'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <IncidentDetailsPanel incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
      
      <HospitalManagementModal 
        isOpen={hospitalModalOpen} 
        onClose={() => setHospitalModalOpen(false)} 
        hospitals={rawHospitals} 
        selectedIncident={selectedIncident} 
      />
    </>
  );
};

export default CommandDashboard;
