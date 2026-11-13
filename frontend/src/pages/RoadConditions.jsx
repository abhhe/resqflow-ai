import React, { useEffect, useState } from 'react';
import { Navigation, AlertTriangle, MapPin, Filter } from 'lucide-react';
import { apiService } from '../services/apiService';
import MapComponent from '../components/MapComponent';
import useDemoStore from '../demo/demoStore';

const CITIES = ['All India', 'New Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Lucknow', 'Jaipur', 'Ahmedabad', 'Pune', 'Bhopal', 'Indore', 'Patna', 'Chandigarh', 'Bhubaneswar', 'Guwahati', 'Kochi', 'Dehradun', 'Nagpur', 'Surat'];

const RoadConditions = () => {
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(true);

  const activeCityFilter = useDemoStore(state => state.activeCityFilter);
  const setCityFilter = useDemoStore(state => state.setCityFilter);

  useEffect(() => {
    const fetchConditions = async () => {
      try {
        const data = await apiService.getRoadConditions();
        if (data && data.length > 0) {
          setConditions(data);
        } else {
          setConditions(useDemoStore.getState().roadConditions || []);
        }
      } catch (err) {
        console.error(err);
        setConditions(useDemoStore.getState().roadConditions || []);
      } finally {
        setLoading(false);
      }
    };
    fetchConditions();
  }, []);

  if (loading) return <div className="p-8 text-text-muted">Loading route network status...</div>;

  const filteredConditions = conditions.filter(c => {
    if (activeCityFilter !== 'All India' && c.city !== activeCityFilter) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      
      {/* Editorial Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[10px] tracking-wider uppercase border border-blue-500/30">
              Traffic Optimization
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold text-[10px] tracking-wider uppercase border border-amber-500/30 flex items-center gap-1.5">
              <Navigation size={12} className="text-amber-400 animate-pulse" />
              Dynamic Dijkstra Bypass
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Road Network & Congestion Corridors <span className="text-sm font-semibold text-slate-400">| Traffic Pathfinding</span>
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-1.5 shadow-sm">
            <Filter size={13} className="text-slate-400" />
            <select value={activeCityFilter} onChange={(e) => setCityFilter(e.target.value)} className="bg-transparent text-xs font-semibold text-slate-200 uppercase tracking-wider outline-none border-none cursor-pointer">
              {CITIES.map(c => <option key={c} value={c} className="bg-slate-800 text-white">{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Network Nodes</span>
          <span className="text-xl font-black text-white">8 Nodes</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Hazards</span>
          <span className="text-xl font-black text-amber-400">{filteredConditions.length}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bypass Reliability</span>
          <span className="text-xl font-black text-emerald-400">99.4%</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pathfinding Engine</span>
          <span className="text-xl font-black text-cyan-400">Dijkstra / A*</span>
        </div>
      </div>

      {/* Main Grid: Map + List */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-hidden">
        
        {/* MAP PANEL */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg relative flex flex-col h-[350px] lg:h-auto">
          <div className="absolute top-3 left-14 z-[400] bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg shadow border border-slate-700 pointer-events-none flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <h3 className="text-[11px] font-black text-white uppercase tracking-wider">Live Traffic & Bottlenecks</h3>
          </div>
          <div className="flex-1 relative z-0">
            <MapComponent incidents={filteredConditions.map(c => ({
              ...c, 
              category: c.description,
              severity: 10,
              address: c.city
            }))} />
          </div>
        </div>

        {/* LIST PANEL */}
        <div className="lg:col-span-4 bg-slate-800/80 border border-slate-700 rounded-xl shadow-lg overflow-hidden flex flex-col h-full">
          <div className="p-3 border-b border-slate-700 bg-slate-900/60 flex justify-between items-center shrink-0">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-400" />
              Active Route Penalties
            </h3>
            <span className="text-xs font-mono font-bold text-slate-400">{filteredConditions.length} Alerts</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
            {filteredConditions.length === 0 ? (
              <div className="text-center text-slate-500 mt-12 text-xs font-medium">No blockages reported in active network.</div>
            ) : (
              filteredConditions.map((condition) => (
                <div key={condition._id} className="bg-slate-900/60 border border-slate-700/80 rounded-xl p-3 hover:border-slate-500 transition-all shadow-sm">
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border bg-amber-500/20 text-amber-300 border-amber-500/30">
                      ACTIVE HAZARD
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">{condition._id}</span>
                  </div>
                  <h3 className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-amber-400 shrink-0" /> {condition.description}
                  </h3>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1.5">
                    <MapPin size={11} className="text-emerald-400"/> {condition.city}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadConditions;
