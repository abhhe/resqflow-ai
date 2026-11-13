import { AlertCircle, Clock, MapPin, Filter, ShieldAlert, Activity, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MapComponent from '../components/MapComponent';
import IncidentDetailsPanel from '../components/IncidentDetailsPanel';
import useDemoStore from '../demo/demoStore';
import { apiService } from '../services/apiService';
import useAuthStore from '../stores/authStore';

const CITIES = ['All India', 'New Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Lucknow', 'Jaipur', 'Ahmedabad', 'Pune', 'Bhopal', 'Indore', 'Patna', 'Chandigarh', 'Bhubaneswar', 'Guwahati', 'Kochi', 'Dehradun', 'Nagpur', 'Surat'];

const SEV_STYLE = (sev) =>
  sev >= 9 ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
  : sev >= 7 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';

const STATUS_STYLE = (status) => ({
  ACTIVE:       'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse',
  PENDING:      'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse',
  ASSIGNED:     'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  EN_ROUTE:     'bg-blue-500/20 text-blue-300 border-blue-500/40',
  ON_SCENE:     'bg-purple-500/20 text-purple-300 border-purple-500/40',
  TRANSPORTING: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  RESOLVED:     'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  CANCELLED:    'bg-slate-800 text-slate-400 border-slate-700',
}[status] || 'bg-slate-800 text-slate-400 border-slate-700');

const STATUS_ICON = (status) => ({
  ACTIVE:       <Activity size={12} className="text-rose-400" />,
  PENDING:      <Clock size={12} className="text-amber-400" />,
  ASSIGNED:     <Clock size={12} className="text-cyan-400" />,
  EN_ROUTE:     <Clock size={12} className="text-blue-400" />,
  ON_SCENE:     <MapPin size={12} className="text-purple-400" />,
  TRANSPORTING: <Activity size={12} className="text-indigo-400" />,
  RESOLVED:     <CheckCircle2 size={12} className="text-emerald-400" />,
  CANCELLED:    <AlertCircle size={12} className="text-slate-400" />,
}[status] || <AlertCircle size={12} className="text-slate-400" />);

const IncidentsList = () => {
  const allIncidents = useDemoStore(state => state.incidents);
  const allAmbulances = useDemoStore(state => state.ambulances);
  const activeCityFilter = useDemoStore(state => state.activeCityFilter);
  const setCityFilter = useDemoStore(state => state.setCityFilter);
  const globalSelectedId = useDemoStore(state => state.selectedIncidentId);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [selectedIncident, setSelectedIncident] = useState(null);

  const handleDispatch = async (incidentId, ambulanceId, e) => {
    e.stopPropagation();
    try {
      await apiService.assignAmbulance(incidentId, ambulanceId, useAuthStore.getState().token);
    } catch (error) {
      console.error(error);
      alert("Failed to assign ambulance.");
    }
  };

  useEffect(() => {
    if (globalSelectedId) {
      const inc = allIncidents.find(i => i._id === globalSelectedId || i.incidentId === globalSelectedId);
      if (inc) setSelectedIncident(inc);
      useDemoStore.getState().setSelectedIncidentId(null);
    }
  }, [globalSelectedId, allIncidents]);

  const filteredIncidents = allIncidents.filter(i => {
    if (activeCityFilter !== 'All India' && i.city !== activeCityFilter) return false;
    if (statusFilter !== 'ALL' && i.status !== statusFilter) return false;
    if (severityFilter === 'CRITICAL' && i.severity < 9) return false;
    if (severityFilter === 'HIGH' && (i.severity < 7 || i.severity >= 9)) return false;
    if (severityFilter === 'MODERATE' && i.severity >= 7) return false;
    return true;
  });

  const criticalCount = filteredIncidents.filter(i => i.severity >= 9).length;
  const activeCount = filteredIncidents.filter(i => !['RESOLVED', 'CANCELLED'].includes(i.status)).length;

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      
      {/* Operations Header & Metrics Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px] tracking-wider uppercase border border-rose-500/30">
              PS10 • KMIT YUKTIK 2026
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[10px] tracking-wider uppercase border border-blue-500/30">
              Hyderabad Incident Registry
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] tracking-wider uppercase border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Feed
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Incident Operations <span className="text-sm font-semibold text-slate-400">| Emergency Records & Clinical Triage Log</span>
          </h1>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-1.5 shadow-sm">
            <Filter size={13} className="text-slate-400" />
            <select 
              value={activeCityFilter} 
              onChange={e => setCityFilter(e.target.value)} 
              className="bg-transparent text-xs font-semibold text-slate-200 uppercase tracking-wider outline-none border-none cursor-pointer"
            >
              {CITIES.map(c => <option key={c} value={c} className="bg-slate-800 text-white">{c}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-1.5 shadow-sm">
            <select 
              value={severityFilter} 
              onChange={e => setSeverityFilter(e.target.value)} 
              className="bg-transparent text-xs font-semibold text-slate-200 uppercase tracking-wider outline-none border-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-800 text-white">ALL SEVERITY</option>
              <option value="CRITICAL" className="bg-slate-800 text-white">CRITICAL (9-10)</option>
              <option value="HIGH" className="bg-slate-800 text-white">HIGH (7-8)</option>
              <option value="MODERATE" className="bg-slate-800 text-white">MODERATE (&lt;7)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-1.5 shadow-sm">
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)} 
              className="bg-transparent text-xs font-semibold text-slate-200 uppercase tracking-wider outline-none border-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-800 text-white">ALL STATUSES</option>
              <option value="ACTIVE" className="bg-slate-800 text-white">ACTIVE</option>
              <option value="PENDING" className="bg-slate-800 text-white">PENDING</option>
              <option value="ASSIGNED" className="bg-slate-800 text-white">ASSIGNED</option>
              <option value="EN_ROUTE" className="bg-slate-800 text-white">EN ROUTE</option>
              <option value="ON_SCENE" className="bg-slate-800 text-white">ON SCENE</option>
              <option value="TRANSPORTING" className="bg-slate-800 text-white">TRANSPORTING</option>
              <option value="RESOLVED" className="bg-slate-800 text-white">RESOLVED</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Incidents</span>
          <span className="text-xl font-black text-white">{filteredIncidents.length}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Missions</span>
          <span className="text-xl font-black text-amber-400">{activeCount}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Critical (Priority &gt; 85)</span>
          <span className="text-xl font-black text-rose-400">{criticalCount}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Triage Latency</span>
          <span className="text-xl font-black text-cyan-400">1.8s</span>
        </div>
      </div>

      {/* Main Grid: Split Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-hidden">

        {/* MAP PANEL */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg relative flex flex-col h-[350px] lg:h-auto">
          <div className="absolute top-3 left-14 z-[400] bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg shadow border border-slate-700 pointer-events-none flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-black text-white uppercase tracking-wider">
              Live Operations Map
            </span>
          </div>
          <div className="flex-1 w-full h-full relative z-0">
            <MapComponent incidents={filteredIncidents} ambulances={[]} />
          </div>
        </div>

        {/* LIST PANEL */}
        <div className="lg:col-span-7 bg-slate-800/80 border border-slate-700 rounded-xl shadow-lg overflow-hidden flex flex-col h-full">
          <div className="p-3 border-b border-slate-700 bg-slate-900/60 flex justify-between items-center shrink-0">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert size={14} className="text-rose-400" />
              Event Stream
            </h3>
            <span className="text-xs font-mono font-bold text-slate-400">{filteredIncidents.length} Records</span>
          </div>

          <div className="flex-1 overflow-y-auto w-full p-3 space-y-2.5 scrollbar-thin">
            <AnimatePresence>
              {filteredIncidents.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-12 text-center text-xs font-semibold text-slate-500">
                  No incidents match the selected filter criteria.
                </motion.div>
              ) : (
                filteredIncidents.map((incident) => {
                  const timeStr = incident.timestamp || incident.createdAt;
                  const isCritical = incident.severity >= 9 || incident.priorityScore >= 85;
                  
                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      key={incident._id} 
                      onClick={() => setSelectedIncident(incident)}
                      className={`group bg-slate-900/60 border rounded-xl p-3.5 cursor-pointer transition-all shadow-sm hover:shadow-md ${
                        isCritical 
                          ? 'border-l-4 border-l-rose-500 border-t-slate-700/80 border-r-slate-700/80 border-b-slate-700/80 hover:border-slate-600' 
                          : 'border-slate-700/80 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        
                        {/* Info Block */}
                        <div className="flex-1 flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${SEV_STYLE(incident.severity)}`}>
                              SEV: {incident.severity}
                            </span>
                            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                              <Clock size={11} />
                              {timeStr ? new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono ml-1 hidden sm:block">
                              {incident.incidentId || incident._id.substring(0,8)}
                            </span>
                          </div>
                          
                          <h4 className="text-sm font-bold text-white leading-tight">
                            {incident.category.replace(/_/g, ' ')}
                          </h4>
                          
                          <div className="flex items-center gap-4 text-xs text-slate-300 mt-0.5">
                            <span className="flex items-center gap-1">
                              <MapPin size={12} className="text-emerald-400" /> {incident.city || incident.node}, {incident.state || 'Telangana'}
                            </span>
                            {incident.aiConfidence && (
                              <span className="flex items-center gap-1 text-cyan-300 font-semibold">
                                <Activity size={12} /> AI Match: {(incident.aiConfidence * 100).toFixed(0)}%
                              </span>
                            )}
                          </div>
                          
                          {['ACTIVE', 'PENDING'].includes(incident.status) && (
                            <div className="mt-2">
                              <button
                                onClick={(e) => {
                                  const nearest = allAmbulances.find(a => a.status === 'AVAILABLE' && a.city === incident.city) || allAmbulances.find(a => a.status === 'AVAILABLE');
                                  if (nearest) handleDispatch(incident._id, nearest._id, e);
                                  else { e.stopPropagation(); alert("No units available"); }
                                }}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors shadow active:scale-95 w-max"
                              >
                                Quick Assign Unit
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Status Block */}
                        <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0">
                          <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${STATUS_STYLE(incident.status)}`}>
                            {STATUS_ICON(incident.status)}
                            {incident.status.replace('_', ' ')}
                          </div>
                          
                          <div className="flex items-center text-slate-400 group-hover:text-cyan-300 transition-colors">
                            <span className="text-[11px] font-semibold mr-1 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">Details</span>
                            <ChevronRight size={16} />
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <IncidentDetailsPanel incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
    </div>
  );
};

export default IncidentsList;
