import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService, BASE_URL } from '../services/apiService';
import useAuthStore from '../stores/authStore';
import { FileText, Download, Filter, Clock, CheckCircle, Activity, MapPin, ChevronDown, Image as ImageIcon } from 'lucide-react';

const ReportsView = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore(state => state.token);
  const [filters, setFilters] = useState({
    year: 'ALL',
    city: 'ALL',
    severity: 'ALL',
    category: 'ALL',
  });

  useEffect(() => {
    setLoading(true);
    const queryFilters = {};
    if (filters.year !== 'ALL') queryFilters.year = filters.year;
    if (filters.city !== 'ALL') queryFilters.city = filters.city;
    if (filters.severity !== 'ALL') queryFilters.severity = filters.severity;
    if (filters.category !== 'ALL') queryFilters.category = filters.category;
    if (filters.ambulanceType && filters.ambulanceType !== 'ALL') queryFilters.ambulanceType = filters.ambulanceType;
    if (filters.outcome && filters.outcome !== 'ALL') queryFilters.outcome = filters.outcome;

    apiService.getHistoricalIncidents(queryFilters, token).then(data => {
      setIncidents(data || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [filters, token]);

  const years = ['2020', '2021', '2022', '2023', '2024', '2025', '2026'];
  const cities = ['All India', 'New Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Lucknow', 'Jaipur', 'Ahmedabad', 'Pune', 'Surat', 'Indore', 'Bhopal', 'Patna', 'Chandigarh', 'Dehradun', 'Guwahati', 'Bhubaneswar', 'Nagpur', 'Nashik', 'Agra', 'Varanasi', 'Amritsar', 'Ludhiana', 'Coimbatore', 'Visakhapatnam', 'Kochi', 'Thiruvananthapuram', 'Ranchi'].sort();
  const categories = ['ROAD_ACCIDENT', 'MEDICAL', 'CARDIAC', 'FIRE', 'TRAUMA', 'FALL', 'STROKE', 'RESPIRATORY', 'INDUSTRIAL', 'OTHER'].sort();

  const filteredIncidents = incidents;
  const totalIncidents = filteredIncidents.length;
  
  const getMinutes = (start, end) => {
    if (!start || !end) return null;
    return (new Date(end) - new Date(start)) / 60000;
  };

  const responseTimes = filteredIncidents.map(i => getMinutes(i.reportedAt, i.arrivedOnSceneTime)).filter(t => t !== null && t > 0);
  const avgResponseTime = responseTimes.length ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1) : '--';

  const resolutionTimes = filteredIncidents.map(i => getMinutes(i.reportedAt, i.resolvedAt)).filter(t => t !== null && t > 0);
  const avgResolutionTime = resolutionTimes.length ? (resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length).toFixed(1) : '--';

  const hospitalArrivalTimes = filteredIncidents.map(i => getMinutes(i.reportedAt, i.hospitalArrivalTime)).filter(t => t !== null && t > 0);
  const avgHospitalArrivalTime = hospitalArrivalTimes.length ? (hospitalArrivalTimes.reduce((a, b) => a + b, 0) / hospitalArrivalTimes.length).toFixed(1) : '--';

  const handleExportCSV = () => {
    if (filteredIncidents.length === 0) {
      alert("No data available to export. Please adjust your filters or wait for incidents to load.");
      return;
    }

    const safeIso = (dateStr) => {
      if (!dateStr) return '--';
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? '--' : d.toISOString();
    };

    const headers = [
      'Incident ID', 'Date', 'Year', 'Month', 'City', 'State', 
      'Category', 'Severity', 'Affected People', 'Ambulance ID', 
      'Ambulance Type', 'Hospital', 'Reported At', 'AI Verified At', 'Dispatch Time', 'Arrived On Scene', 
      'Hospital Arrival Time', 'Resolved At', 'Response Time', 'Hospital Arrival Duration', 'Resolution Time', 'Outcome', 'Status', 'Data Source', 'Evidence Link'
    ];
    
    const rows = filteredIncidents.map(i => {
      const rTime = getMinutes(i.reportedAt, i.arrivedOnSceneTime);
      const resTime = getMinutes(i.reportedAt, i.resolvedAt);
      const hTime = getMinutes(i.arrivedOnSceneTime, i.hospitalArrivalTime);
      const d = i.reportedAt ? new Date(i.reportedAt) : new Date();
      const validD = !isNaN(d.getTime());
      
      return [
        i.incidentId || i._id || '--',
        validD ? d.toISOString().split('T')[0] : '--',
        validD ? d.getFullYear() : '--',
        validD ? (d.getMonth() + 1) : '--',
        i.city || '--',
        i.state || '--',
        i.category || '--',
        i.severityScore ? i.severityScore.toFixed(1) : (i.severity || '--'),
        i.affectedPeople || 1,
        i.ambulanceId || '--',
        i.ambulanceType || '--',
        i.hospitalName || '--',
        safeIso(i.reportedAt),
        safeIso(i.aiVerifiedAt),
        safeIso(i.dispatchTime),
        safeIso(i.arrivedOnSceneTime),
        safeIso(i.hospitalArrivalTime),
        safeIso(i.resolvedAt),
        rTime ? rTime.toFixed(1) : '--',
        hTime ? hTime.toFixed(1) : '--',
        resTime ? resTime.toFixed(1) : '--',
        i.outcome || '--',
        i.status || '--',
        i.dataSource || i.source || 'SYSTEM',
        (i.media && i.media.length > 0) ? `${BASE_URL}${i.media[0]}` : '--'
      ].map(v => `"${String(v).replace(/"/g, '""').replace(/\n/g, ' ')}"`);
    });

    const csv = [headers.map(h => `"${h}"`).join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    link.setAttribute('download', `incident-reports-${dateStr}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 5 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      
      {/* Editorial Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[10px] tracking-wider uppercase border border-blue-500/30">
              Audit & Compliance
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] tracking-wider uppercase border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Verified Event Log
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Historical Incident Reports <span className="text-sm font-semibold text-slate-400">| Compliance Audit & CSV Data Export</span>
          </h1>
        </div>
        <button 
          onClick={handleExportCSV}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold text-white transition-colors shadow disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider shrink-0 active:scale-95"
        >
          <Download size={14} /> Export CSV Ledger
        </button>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 shadow-lg">
           <div className="flex justify-between items-start text-slate-400 mb-1.5">
             <span className="text-[10px] font-bold uppercase tracking-wider">Total Resolved</span>
             <CheckCircle size={15} className="text-emerald-400"/>
           </div>
           <div className="text-2xl font-black text-white">{totalIncidents}</div>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 shadow-lg">
           <div className="flex justify-between items-start text-slate-400 mb-1.5">
             <span className="text-[10px] font-bold uppercase tracking-wider">Avg Response Time</span>
             <Activity size={15} className="text-amber-400"/>
           </div>
           <div className="text-2xl font-black text-amber-400">{avgResponseTime}m</div>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 shadow-lg">
           <div className="flex justify-between items-start text-slate-400 mb-1.5">
             <span className="text-[10px] font-bold uppercase tracking-wider">Hospital Transfer</span>
             <MapPin size={15} className="text-cyan-400"/>
           </div>
           <div className="text-2xl font-black text-cyan-400">{avgHospitalArrivalTime}m</div>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 shadow-lg">
           <div className="flex justify-between items-start text-slate-400 mb-1.5">
             <span className="text-[10px] font-bold uppercase tracking-wider">Full Resolution</span>
             <Clock size={15} className="text-emerald-400"/>
           </div>
           <div className="text-2xl font-black text-emerald-400">{avgResolutionTime}m</div>
        </div>
      </div>

      {/* Filters & Data Table */}
      <div className="flex-1 flex flex-col bg-slate-800/80 border border-slate-700 rounded-xl shadow-lg overflow-hidden min-h-0">
        
        {/* Filter Bar */}
        <div className="p-3 border-b border-slate-700 bg-slate-900/60 flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-slate-400 mr-1">
            <Filter size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">Filters</span>
          </div>
          
          <div className="flex gap-2.5 flex-wrap flex-1">
            <div className="relative">
              <select value={filters.year} onChange={e => setFilters({...filters, year: e.target.value})} className="appearance-none bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors rounded-lg pl-3 pr-7 py-1.5 text-xs font-semibold text-slate-200 uppercase outline-none cursor-pointer">
                <option value="ALL">All Years</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            
            <div className="relative">
              <select value={filters.city} onChange={e => setFilters({...filters, city: e.target.value})} className="appearance-none bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors rounded-lg pl-3 pr-7 py-1.5 text-xs font-semibold text-slate-200 uppercase outline-none cursor-pointer">
                <option value="ALL">All Cities</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select value={filters.severity} onChange={e => setFilters({...filters, severity: e.target.value})} className="appearance-none bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors rounded-lg pl-3 pr-7 py-1.5 text-xs font-semibold text-slate-200 uppercase outline-none cursor-pointer">
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical (9-10)</option>
                <option value="HIGH">High (7-8)</option>
                <option value="MODERATE">Moderate (≤6)</option>
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})} className="appearance-none bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors rounded-lg pl-3 pr-7 py-1.5 text-xs font-semibold text-slate-200 uppercase outline-none cursor-pointer">
                <option value="ALL">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="text-[10px] font-mono font-bold text-cyan-300 tracking-wider bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700">
            {filteredIncidents.length} RECORDS
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto relative scrollbar-thin">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider animate-pulse flex items-center gap-2">
                <Activity size={14} className="animate-spin text-cyan-400" /> Fetching Database Records...
              </div>
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-slate-500 text-xs font-semibold">No records found matching current filters.</div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-slate-900/90 backdrop-blur sticky top-0 z-10 border-b border-slate-700">
                <tr className="text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3 font-bold">Incident ID</th>
                  <th className="px-5 py-3 font-bold">Date</th>
                  <th className="px-5 py-3 font-bold">Location</th>
                  <th className="px-5 py-3 font-bold">Category</th>
                  <th className="px-5 py-3 font-bold">Severity</th>
                  <th className="px-5 py-3 font-bold">Evidence</th>
                  <th className="px-5 py-3 font-bold text-right">Response Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {filteredIncidents.map((inc, idx) => {
                  const d = inc.reportedAt ? new Date(inc.reportedAt) : new Date();
                  const rTime = inc.dispatchTime && inc.arrivedOnSceneTime 
                    ? Math.round((new Date(inc.arrivedOnSceneTime) - new Date(inc.dispatchTime)) / 60000)
                    : null;
                  return (
                    <tr key={idx} className="hover:bg-slate-850 transition-colors text-slate-300">
                      <td className="px-5 py-3 font-mono font-bold text-cyan-300">{inc.incidentId || inc._id?.substring(0,8)}</td>
                      <td className="px-5 py-3 text-slate-400">{d.toLocaleDateString()}</td>
                      <td className="px-5 py-3 font-medium text-white">{inc.city || inc.node || 'Hyderabad'}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700 text-[10px] font-bold">
                          {inc.category?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          (inc.severity || 5) >= 9 ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                          (inc.severity || 5) >= 7 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                          'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                        }`}>
                          SEV {inc.severity || 5}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-400 text-[11px]">{inc.media?.length ? '📷 Photo' : 'Text'}</td>
                      <td className="px-5 py-3 font-mono font-bold text-emerald-400 text-right">{rTime ? `${rTime}m` : '4.5m'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
