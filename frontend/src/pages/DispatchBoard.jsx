import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, MapPin, ArrowRight, ShieldAlert, Truck, Crosshair, Filter, Activity, Clock } from 'lucide-react';
import MapComponent from '../components/MapComponent';
import useDemoStore from '../demo/demoStore';
import { apiService } from '../services/apiService';
import useAuthStore from '../stores/authStore';

const CITIES = ['All India', 'New Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Lucknow', 'Jaipur', 'Ahmedabad', 'Pune', 'Bhopal', 'Indore', 'Patna', 'Chandigarh', 'Bhubaneswar', 'Guwahati', 'Kochi', 'Dehradun', 'Nagpur', 'Surat'];

const DispatchBoard = () => {
  const allIncidents = useDemoStore(state => state.incidents);
  const allAmbulances = useDemoStore(state => state.ambulances);
  const allDispatches = useDemoStore(state => state.dispatches);
  const allHospitals = useDemoStore(state => state.hospitals);
  const assignAmbulance = useDemoStore(state => state.assignAmbulance);

  const activeCityFilter = useDemoStore(state => state.activeCityFilter);
  const setCityFilter = useDemoStore(state => state.setCityFilter);

  // Pending = needs dispatch (ACTIVE status with no ambulance)
  const pendingIncidents = allIncidents.filter(i =>
    ['ACTIVE', 'PENDING'].includes(i.status) && !i.assignedAmbulanceId &&
    (activeCityFilter === 'All India' || i.city === activeCityFilter)
  );

  // Available ambulances
  const availableAmbulances = allAmbulances.filter(a =>
    a.status === 'AVAILABLE' &&
    (activeCityFilter === 'All India' || a.city === activeCityFilter)
  );

  // Active dispatches
  const activeDispatches = allDispatches.filter(d =>
    d.status === 'ACTIVE'
  ).map(d => {
    const inc = allIncidents.find(i => i._id === d.incidentId);
    const amb = allAmbulances.find(a => a._id === d.ambulanceId);
    const hosp = allHospitals.find(h => h._id === d.hospitalId);
    return { ...d, incident: inc, ambulance: amb, hospital: hosp };
  }).filter(d => activeCityFilter === 'All India' || d.incident?.city === activeCityFilter);

  const handleDispatch = async (incidentId, ambulanceId) => {
    try {
      await apiService.assignAmbulance(incidentId, ambulanceId, useAuthStore.getState().token);
    } catch (error) {
      console.error(error);
      alert("Failed to assign ambulance.");
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      
      {/* Editorial Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[10px] tracking-wider uppercase border border-blue-500/30">
              Operations Center
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] tracking-wider uppercase border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Real-Time Dispatch
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Dynamic Dispatch Board <span className="text-sm font-semibold text-slate-400">| Incident-to-Resource Assignment</span>
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-1.5 shadow-sm">
            <Filter size={13} className="text-slate-400" />
            <select value={activeCityFilter} onChange={e => setCityFilter(e.target.value)} className="bg-transparent text-xs font-semibold text-slate-200 uppercase tracking-wider outline-none border-none cursor-pointer">
              {CITIES.map(c => <option key={c} value={c} className="bg-slate-800 text-white">{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Actions</span>
          <span className="text-xl font-black text-rose-400">{pendingIncidents.length}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Units</span>
          <span className="text-xl font-black text-emerald-400">{availableAmbulances.length}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Dispatches</span>
          <span className="text-xl font-black text-cyan-400">{activeDispatches.length}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Solver Latency</span>
          <span className="text-xl font-black text-white">2ms</span>
        </div>
      </div>

      {/* Active Dispatches Timeline Strip */}
      <AnimatePresence>
        {activeDispatches.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-2.5">
              <Activity size={14} className="text-cyan-400" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-200">Active Transit & Dispatched Units</p>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 snap-x scrollbar-thin">
              {activeDispatches.map(d => (
                <div key={d._id} className="flex-shrink-0 bg-slate-900/80 border border-slate-700/80 rounded-xl p-3 min-w-[280px] max-w-[320px] snap-start shadow-sm">
                  
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">ID: {d._id.substring(0,8)}</span>
                    <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                      <Clock size={11} /> {d.eta}m ETA
                    </span>
                  </div>
                  
                  <h4 className="text-xs font-bold text-white truncate mb-2.5">
                    {d.incident?.category?.replace(/_/g, ' ')}
                  </h4>
                  
                  {/* Timeline Visual */}
                  <div className="flex items-center justify-between text-[10px] font-medium text-slate-300 px-1">
                    <div className="flex flex-col items-center gap-1 w-1/3">
                      <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center border border-rose-500/30">
                        <ShieldAlert size={10} />
                      </div>
                      <span className="truncate w-full text-center">{d.incident?.city}</span>
                    </div>
                    
                    <div className="flex-1 h-px bg-slate-700 relative mx-2">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-400 bg-slate-900 px-1">
                        <ArrowRight size={12} />
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center gap-1 w-1/3">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center border border-blue-500/30">
                        <Truck size={10} />
                      </div>
                      <span className="truncate w-full text-center">{d.ambulance?._id.replace('AMB-','U-')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-hidden">

        {/* LEFT: Pending Incidents */}
        <div className="lg:col-span-3 flex flex-col bg-slate-800/80 border border-slate-700 rounded-xl shadow-lg overflow-hidden h-[350px] lg:h-auto order-2 lg:order-1">
          <div className="p-3 border-b border-slate-700 bg-slate-900/60 flex justify-between items-center shrink-0">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert size={14} className="text-rose-400" /> Action Required
            </h3>
            <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full">{pendingIncidents.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
            <AnimatePresence>
              {pendingIncidents.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-slate-500 mt-8 text-xs font-medium">
                  {activeCityFilter === 'All India' ? 'All emergencies assigned' : `No pending in ${activeCityFilter}`}
                </motion.div>
              ) : (
                pendingIncidents.map(inc => {
                  const isCritical = inc.severity >= 9;
                  const nearestAmb = allAmbulances.find(a => a.status === 'AVAILABLE' && a.city === inc.city) ||
                                     allAmbulances.find(a => a.status === 'AVAILABLE');

                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={inc._id} 
                      className={`bg-slate-900/60 border rounded-xl p-3 shadow-sm transition-all hover:border-slate-500 ${
                        isCritical ? 'border-l-4 border-l-rose-500 border-slate-700' : 'border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                          isCritical ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          SEV {inc.severity}
                        </span>
                        {inc.aiConfidence && (
                          <span className="text-[9px] text-cyan-300 font-bold tracking-wider uppercase">
                            {(inc.aiConfidence * 100).toFixed(0)}% AI Match
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-xs font-bold text-white mb-1 truncate pr-2">
                        {inc.category.replace(/_/g, ' ')}
                      </h3>
                      
                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-2.5">
                        <MapPin size={11} className="text-emerald-400"/> {inc.city}
                      </p>
                      
                      {nearestAmb ? (
                        <button
                          onClick={() => handleDispatch(inc._id, nearestAmb._id)}
                          className="w-full flex items-center justify-between px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors shadow active:scale-95"
                        >
                          <span>Dispatch {nearestAmb._id.replace('AMB-','U-')}</span>
                          <ArrowRight size={12} />
                        </button>
                      ) : (
                        <div className="w-full text-center py-1.5 bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-bold uppercase tracking-wider rounded-lg">
                          No Units Available
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* CENTER: Tactical Map */}
        <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg relative flex flex-col h-[350px] lg:h-auto order-1 lg:order-2">
          <div className="absolute top-3 left-14 z-[400] bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg shadow border border-slate-700 pointer-events-none flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <h3 className="text-[11px] font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Crosshair size={12} className="text-cyan-400" /> Tactical Dispatch Map
            </h3>
          </div>
          <div className="flex-1 relative z-0">
            <MapComponent incidents={pendingIncidents} ambulances={availableAmbulances} />
          </div>
        </div>

        {/* RIGHT: Available Units */}
        <div className="lg:col-span-3 flex flex-col bg-slate-800/80 border border-slate-700 rounded-xl shadow-lg overflow-hidden h-[350px] lg:h-auto order-3">
          <div className="p-3 border-b border-slate-700 bg-slate-900/60 flex justify-between items-center shrink-0">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Truck size={14} className="text-emerald-400" /> Ready Fleet
            </h3>
            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">{availableAmbulances.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
            {availableAmbulances.length === 0 ? (
              <div className="text-center text-slate-500 mt-8 text-xs font-medium">No units available in region</div>
            ) : (
              availableAmbulances.map(amb => (
                <div key={amb._id} className="bg-slate-900/60 border border-slate-700/80 rounded-xl p-3 transition-colors hover:border-slate-500 shadow-sm">
                  <div className="flex justify-between items-start mb-1.5">
                    <h3 className="text-xs font-bold text-white truncate">{amb._id.replace('AMB-','Unit ')}</h3>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[9px] font-bold uppercase tracking-wider">
                      Ready
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 text-xs text-slate-300">
                    <span className="flex items-center gap-2">
                      <span className="text-cyan-300 font-bold tracking-wider uppercase text-[9px] bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-800/40">{amb.capability || 'ALS'}</span>
                      <span className="truncate">{amb.driverName}</span>
                    </span>
                    <span className="flex items-center gap-1.5 mt-0.5 text-slate-400">
                      <MapPin size={11} className="text-emerald-400"/> {amb.city}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DispatchBoard;
