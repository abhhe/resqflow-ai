import { Hospital, BedDouble, MapPin, Filter, Search, Activity, Stethoscope } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MapComponent from '../components/MapComponent';
import useDemoStore from '../demo/demoStore';

const CITIES = ['All India', 'New Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Lucknow', 'Jaipur', 'Ahmedabad', 'Pune', 'Bhopal', 'Indore', 'Patna', 'Chandigarh', 'Bhubaneswar', 'Guwahati', 'Kochi', 'Dehradun', 'Nagpur', 'Surat'];

const HospitalsList = () => {
  const allHospitals = useDemoStore(state => state.hospitals);
  const activeCityFilter = useDemoStore(state => state.activeCityFilter);
  const setCityFilter = useDemoStore(state => state.setCityFilter);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filteredHospitals = allHospitals.filter(h => {
    if (activeCityFilter !== 'All India' && h.city !== activeCityFilter) return false;
    if (typeFilter !== 'ALL' && h.hospitalType !== typeFilter) return false;
    if (search && !h.name.toLowerCase().includes(search.toLowerCase()) && !h.city.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalICU = filteredHospitals.reduce((sum, h) => sum + (h.icuBeds || 0), 0);
  const trauma1 = filteredHospitals.filter(h => h.traumaLevel === 1).length;
  const totalBeds = filteredHospitals.reduce((sum, h) => sum + (h.availableBeds || 0), 0);

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      
      {/* Editorial Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] tracking-wider uppercase border border-emerald-500/30">
              Healthcare Network
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[10px] tracking-wider uppercase border border-blue-500/30">
              Zero-ICU Protected
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Hospital Facilities Directory <span className="text-sm font-semibold text-slate-400">| Capacity & Clinical Readiness</span>
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-1.5 shadow-sm">
            <Search size={13} className="text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search facility..."
              className="bg-transparent text-xs font-semibold text-slate-200 outline-none border-none w-32 placeholder:text-slate-500"
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-1.5 shadow-sm">
            <Filter size={13} className="text-slate-400" />
            <select value={activeCityFilter} onChange={e => setCityFilter(e.target.value)} className="bg-transparent text-xs font-semibold text-slate-200 uppercase tracking-wider outline-none border-none cursor-pointer">
              {CITIES.map(c => <option key={c} value={c} className="bg-slate-800 text-white">{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-1.5 shadow-sm">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-transparent text-xs font-semibold text-slate-200 uppercase tracking-wider outline-none border-none cursor-pointer">
              <option value="ALL" className="bg-slate-800 text-white">ALL TYPES</option>
              <option value="GOVERNMENT" className="bg-slate-800 text-white">GOVERNMENT</option>
              <option value="PRIVATE" className="bg-slate-800 text-white">PRIVATE</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monitored Facilities</span>
          <span className="text-xl font-black text-white">{filteredHospitals.length} Units</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total ICU Capacity</span>
          <span className="text-xl font-black text-emerald-400">{totalICU} Beds</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trauma Centers (Level 1)</span>
          <span className="text-xl font-black text-rose-400">{trauma1} Centers</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available General Beds</span>
          <span className="text-xl font-black text-cyan-400">{totalBeds} Beds</span>
        </div>
      </div>

      {/* Main Grid: Split Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-hidden">
        
        {/* MAP PANEL */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg relative flex flex-col h-[350px] lg:h-auto">
          <div className="absolute top-3 left-14 z-[400] bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg shadow border border-slate-700 pointer-events-none flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[11px] font-black text-white uppercase tracking-wider">
              Hospital Spatial Nodes
            </span>
          </div>
          <div className="flex-1 w-full h-full relative z-0">
            <MapComponent hospitals={filteredHospitals} ambulances={[]} incidents={[]} />
          </div>
        </div>

        {/* LIST PANEL */}
        <div className="lg:col-span-7 bg-slate-800/80 border border-slate-700 rounded-xl shadow-lg overflow-hidden flex flex-col h-full">
          <div className="p-3 border-b border-slate-700 bg-slate-900/60 flex justify-between items-center shrink-0">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Hospital size={14} className="text-emerald-400" />
              Facility Capacity Matrix
            </h3>
            <span className="text-xs font-mono font-bold text-slate-400">{filteredHospitals.length} Facilities</span>
          </div>
          <div className="flex-1 overflow-y-auto w-full p-3 space-y-2.5 scrollbar-thin">
            <AnimatePresence>
              {filteredHospitals.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-12 text-center text-xs font-semibold text-slate-500">
                  No facilities match current filters.
                </motion.div>
              ) : (
                filteredHospitals.map((hospital) => {
                  const icuTotal = 50;
                  const icuFill = Math.min(100, Math.max(5, ((hospital.availableIcuBeds || hospital.icuBeds || 0) / icuTotal) * 100));
                  
                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      key={hospital._id} 
                      className="group bg-slate-900/60 border border-slate-700/80 hover:border-slate-500 rounded-xl p-3.5 transition-all shadow-sm hover:shadow-md"
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        
                        {/* Info Column */}
                        <div className="flex-1 flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-slate-800 text-slate-300 border-slate-700">
                              {hospital.hospitalType || 'HOSPITAL'}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                              hospital.traumaLevel === 1
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : hospital.traumaLevel === 2
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              Level {hospital.traumaLevel || 1} Trauma
                            </span>
                          </div>
                          
                          <h4 className="text-sm font-bold text-white truncate max-w-[320px]">
                            {hospital.name}
                          </h4>
                          
                          <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-0.5">
                            <MapPin size={12} className="text-emerald-400" /> 
                            {hospital.city || hospital.node}, {hospital.state || 'Telangana'}
                          </div>
                        </div>

                        {/* Capacity Column */}
                        <div className="flex flex-col gap-2.5 md:w-44 shrink-0 md:border-l border-slate-800 md:pl-4">
                          
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              <span className="flex items-center gap-1.5"><Activity size={10} className="text-emerald-400"/> ICU Beds</span>
                              <span className="text-white font-mono font-bold">{hospital.availableIcuBeds !== undefined ? hospital.availableIcuBeds : (hospital.icuBeds || 0)}</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${icuFill}%` }} />
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            <span className="flex items-center gap-1.5"><BedDouble size={10} className="text-cyan-400"/> Ward Beds</span>
                            <span className="text-white font-mono font-bold">{hospital.availableGeneralBeds !== undefined ? hospital.availableGeneralBeds : (hospital.availableBeds || 0)}</span>
                          </div>

                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border text-center ${
                            hospital.status === 'AVAILABLE' || hospital.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          }`}>
                            {hospital.status || 'AVAILABLE'}
                          </span>
                          
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
    </div>
  );
};

export default HospitalsList;
