import { Truck, Phone, MapPin, Activity, Filter, Clock, Map, Navigation } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MapComponent from '../components/MapComponent';
import useDemoStore from '../demo/demoStore';

const CITIES = ['All India', 'New Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Lucknow', 'Jaipur', 'Ahmedabad', 'Pune', 'Bhopal', 'Indore', 'Patna', 'Chandigarh', 'Bhubaneswar', 'Guwahati', 'Kochi', 'Dehradun', 'Nagpur', 'Surat'];

const STATUS_STYLES = {
  AVAILABLE:    'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  EN_ROUTE:     'bg-blue-500/20 text-blue-300 border-blue-500/40',
  ON_SCENE:     'bg-amber-500/20 text-amber-300 border-amber-500/40',
  TRANSPORTING: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  UNAVAILABLE:  'bg-slate-800 text-slate-400 border-slate-700',
  RETURNING:    'bg-slate-800 text-slate-400 border-slate-700',
};

const AmbulancesList = () => {
  const allAmbulances = useDemoStore(state => state.ambulances);
  const activeCityFilter = useDemoStore(state => state.activeCityFilter);
  const setCityFilter = useDemoStore(state => state.setCityFilter);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredAmbulances = allAmbulances.filter(a => {
    if (activeCityFilter !== 'All India' && a.city !== activeCityFilter) return false;
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    return true;
  });

  const statusCounts = allAmbulances.reduce((acc, amb) => {
    acc[amb.status] = (acc[amb.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      
      {/* Editorial Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[10px] tracking-wider uppercase border border-blue-500/30">
              Fleet Operations
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] tracking-wider uppercase border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Ambulance Fleet Console <span className="text-sm font-semibold text-slate-400">| Active Units & Corridor Tracking</span>
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-1.5 shadow-sm">
            <Filter size={13} className="text-slate-400" />
            <select value={activeCityFilter} onChange={e => setCityFilter(e.target.value)} className="bg-transparent text-xs font-semibold text-slate-200 uppercase tracking-wider outline-none border-none cursor-pointer">
              {CITIES.map(c => <option key={c} value={c} className="bg-slate-800 text-white">{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-1.5 shadow-sm">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-transparent text-xs font-semibold text-slate-200 uppercase tracking-wider outline-none border-none cursor-pointer">
              <option value="ALL" className="bg-slate-800 text-white">ALL STATUSES</option>
              <option value="AVAILABLE" className="bg-slate-800 text-white">AVAILABLE</option>
              <option value="EN_ROUTE" className="bg-slate-800 text-white">EN ROUTE</option>
              <option value="ON_SCENE" className="bg-slate-800 text-white">ON SCENE</option>
              <option value="TRANSPORTING" className="bg-slate-800 text-white">TRANSPORTING</option>
              <option value="UNAVAILABLE" className="bg-slate-800 text-white">UNAVAILABLE</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Fleet</span>
          <span className="text-xl font-black text-white">{filteredAmbulances.length} Units</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available</span>
          <span className="text-xl font-black text-emerald-400">{statusCounts['AVAILABLE'] || 0}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">En Route (Dispatched)</span>
          <span className="text-xl font-black text-cyan-400">{statusCounts['EN_ROUTE'] || 0}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">On Scene</span>
          <span className="text-xl font-black text-amber-400">{statusCounts['ON_SCENE'] || 0}</span>
        </div>
      </div>

      {/* Main Grid: Split Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-hidden">
        
        {/* MAP PANEL */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg relative flex flex-col h-[350px] lg:h-auto">
          <div className="absolute top-3 left-14 z-[400] bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg shadow border border-slate-700 pointer-events-none flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-black text-white uppercase tracking-wider">
              Live Fleet Coordinates
            </span>
          </div>
          <div className="flex-1 w-full h-full relative z-0">
            <MapComponent incidents={[]} ambulances={filteredAmbulances} />
          </div>
        </div>

        {/* LIST PANEL */}
        <div className="lg:col-span-7 bg-slate-800/80 border border-slate-700 rounded-xl shadow-lg overflow-hidden flex flex-col h-full">
          <div className="p-3 border-b border-slate-700 bg-slate-900/60 flex justify-between items-center shrink-0">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Truck size={14} className="text-cyan-400" />
              Active Fleet Log
            </h3>
            <span className="text-xs font-mono font-bold text-slate-400">{filteredAmbulances.length} Units</span>
          </div>
          <div className="flex-1 overflow-y-auto w-full p-3 space-y-2.5 scrollbar-thin">
            <AnimatePresence>
              {filteredAmbulances.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-12 text-center text-xs font-semibold text-slate-500">
                  No units match current filters.
                </motion.div>
              ) : (
                filteredAmbulances.map((amb) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    key={amb._id} 
                    className="group bg-slate-900/60 border border-slate-700/80 hover:border-slate-500 rounded-xl p-3.5 transition-all shadow-sm hover:shadow-md"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      
                      <div className="flex-1 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40">
                            {amb.capability || 'ALS'}
                          </span>
                          <span className="text-sm font-bold text-white">
                            Unit {amb._id.replace('AMB-', '')}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-slate-300 mt-0.5">
                          <span className="flex items-center gap-1 font-medium">
                            <Phone size={12} className="text-slate-400" /> {amb.driverName} ({amb.driverPhone})
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin size={11} className="text-emerald-400" /> {amb.city || amb.node}
                          </span>
                          {amb.speed > 0 && (
                            <span className="flex items-center gap-1 text-amber-300 font-semibold">
                              <Activity size={11} /> {amb.speed} km/h
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-800 pt-2.5 md:pt-0 md:pl-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border text-center w-full md:w-auto ${STATUS_STYLES[amb.status] || STATUS_STYLES.UNAVAILABLE}`}>
                          {amb.status.replace('_', ' ')}
                        </span>
                        
                        {amb.currentIncident ? (
                          <div className="text-[9px] font-bold text-rose-400 uppercase tracking-wider mt-1 text-right">
                            Assigned: {amb.currentIncident.substring(0,8)}
                          </div>
                        ) : (
                          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1 text-right">
                            Standby
                          </div>
                        )}
                      </div>

                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmbulancesList;
