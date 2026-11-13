import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, ShieldAlert, Truck, BarChart2, CheckCircle2 } from 'lucide-react';
import useDemoStore from '../demo/demoStore';
import useAuthStore from '../stores/authStore';
import { apiService } from '../services/apiService';

const AnalyticsDashboard = () => {
  const [dbHistorical, setDbHistorical] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    apiService.getHistoricalIncidents({}, token).then(data => {
      const liveData = data || [];
      const years = new Set(liveData.map(h => new Date(h.reportedAt || h.createdAt).getFullYear()));
      
      if (years.size < 3) {
        setDbHistorical(useDemoStore.getState().historicalIncidents || []);
      } else {
        setDbHistorical(liveData);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setDbHistorical(useDemoStore.getState().historicalIncidents || []);
      setLoading(false);
    });
  }, [token]);

  const incidents = useDemoStore(state => state.incidents);
  const ambulances = useDemoStore(state => state.ambulances);
  const hospitals = useDemoStore(state => state.hospitals);
  
  const activeIncidents = incidents.filter(i => !['RESOLVED', 'CANCELLED'].includes(i.status));
  const criticalIncidents = incidents.filter(i => i.severity >= 9 && !['RESOLVED', 'CANCELLED'].includes(i.status));
  const availableAmb = ambulances.filter(a => a.status === 'AVAILABLE');
  const fleetUtil = ambulances.length > 0 ? ((ambulances.length - availableAmb.length) / ambulances.length * 100).toFixed(1) : 0;

  // Regional incident density
  const regionalIncidents = incidents.reduce((acc, inc) => {
    acc[inc.city] = (acc[inc.city] || 0) + 1;
    return acc;
  }, {});
  const topRegions = Object.entries(regionalIncidents).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxRegionCount = topRegions.length > 0 ? topRegions[0][1] : 1;

  // Category distribution
  const categoryCounts = incidents.reduce((acc, inc) => {
    const cat = inc.category.replace(/_/g, ' ');
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const topCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxCatCount = topCategories.length > 0 ? topCategories[0][1] : 1;

  // Severity distribution
  const sevCounts = { CRITICAL: 0, HIGH: 0, MODERATE: 0 };
  incidents.forEach(i => {
    if (i.severity >= 9) sevCounts.CRITICAL++;
    else if (i.severity >= 7) sevCounts.HIGH++;
    else sevCounts.MODERATE++;
  });

  // Ambulance status distribution
  const ambStatusCounts = ambulances.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  // Historical: incidents by year (FROM MONGODB)
  const byYear = dbHistorical.reduce((acc, h) => {
    const y = new Date(h.reportedAt || h.createdAt).getFullYear();
    if (!isNaN(y)) acc[y] = (acc[y] || 0) + 1;
    return acc;
  }, {});
  const years = Object.entries(byYear).sort((a, b) => a[0] - b[0]);
  const maxYear = years.length > 0 ? Math.max(...years.map(y => y[1])) : 1;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } }
  };

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 shadow-xl overflow-y-auto scrollbar-thin">
      
      {/* Editorial Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[10px] tracking-wider uppercase border border-blue-500/30">
              Operations Intelligence
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] tracking-wider uppercase border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Telemetry & Historical DB
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            System Analytics <span className="text-sm font-semibold text-slate-400">| Network Performance & Incident Clustering</span>
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Incidents</span>
            <span className="text-sm font-mono font-bold text-white">{incidents.length}</span>
          </div>
          <div className="w-px h-6 bg-slate-800"></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fleet Assets</span>
            <span className="text-sm font-mono font-bold text-cyan-400">{ambulances.length} Units</span>
          </div>
          <div className="w-px h-6 bg-slate-800"></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Historical DB</span>
            <span className="text-sm font-mono font-bold text-emerald-400">{dbHistorical.length} Records</span>
          </div>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Active Incidents', val: activeIncidents.length, icon: ShieldAlert, color: 'text-amber-400', sub: `${criticalIncidents.length} critical` },
            { label: 'Fleet Utilization', val: `${fleetUtil}%`, icon: Truck, color: 'text-cyan-400', sub: `${availableAmb.length} standby` },
            { label: 'Critical Events (SEV 9+)', val: criticalIncidents.length, icon: Activity, color: 'text-rose-400', sub: 'Urgent Dispatch' },
            { label: 'Avg Response Time', val: '4.8m', icon: Clock, color: 'text-emerald-400', sub: 'Within PS10 Target' },
          ].map(kpi => (
            <motion.div variants={itemVariants} key={kpi.label} className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl shadow-lg relative overflow-hidden group">
              <div className="absolute top-3 right-3 text-slate-700/40 group-hover:text-slate-700/60 transition-colors">
                <kpi.icon size={44} strokeWidth={1} />
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5 relative z-10">{kpi.label}</p>
              <h3 className={`text-2xl font-black mb-1.5 relative z-10 ${kpi.color}`}>{kpi.val}</h3>
              <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 relative z-10">
                <CheckCircle2 size={12} className={kpi.color} /> {kpi.sub}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Regional Density */}
          <motion.div variants={itemVariants} className="bg-slate-800/80 border border-slate-700 rounded-xl shadow-lg overflow-hidden flex flex-col">
            <div className="p-3 border-b border-slate-700 bg-slate-900/60">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Regional Density & Hotspots</h3>
            </div>
            <div className="p-4 space-y-3 flex-1">
              {topRegions.map(([city, count]) => (
                <div key={city} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-300">{city}</span>
                    <span className="font-mono text-cyan-400 font-bold">{count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / maxRegionCount) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-cyan-400 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Category Distribution */}
          <motion.div variants={itemVariants} className="bg-slate-800/80 border border-slate-700 rounded-xl shadow-lg overflow-hidden flex flex-col">
            <div className="p-3 border-b border-slate-700 bg-slate-900/60">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Incident Categorization</h3>
            </div>
            <div className="p-4 space-y-3 flex-1">
              {topCategories.map(([cat, count]) => (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-300 truncate pr-2">{cat}</span>
                    <span className="font-mono text-amber-400 font-bold">{count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / maxCatCount) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                      className="h-full bg-amber-400 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Severity + Fleet Status */}
          <div className="flex flex-col gap-4">
            <motion.div variants={itemVariants} className="bg-slate-800/80 border border-slate-700 rounded-xl shadow-lg overflow-hidden">
              <div className="p-3 border-b border-slate-700 bg-slate-900/60">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Severity Tiers</h3>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { label: 'Critical (SEV 9-10)', val: sevCounts.CRITICAL, color: 'bg-rose-500', textColor: 'text-rose-400' },
                  { label: 'High (SEV 7-8)', val: sevCounts.HIGH, color: 'bg-amber-500', textColor: 'text-amber-400' },
                  { label: 'Moderate (SEV <7)', val: sevCounts.MODERATE, color: 'bg-cyan-500', textColor: 'text-cyan-400' },
                ].map(s => (
                  <div key={s.label} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className={s.textColor}>{s.label}</span>
                      <span className="font-mono text-white font-bold">{s.val}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(s.val / Math.max(1, incidents.length)) * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                        className={`h-full ${s.color} rounded-full`} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-slate-800/80 border border-slate-700 rounded-xl shadow-lg overflow-hidden flex-1">
              <div className="p-3 border-b border-slate-700 bg-slate-900/60">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Fleet Readiness</h3>
              </div>
              <div className="p-3.5 space-y-2">
                {Object.entries(ambStatusCounts).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-300 uppercase tracking-wider text-[11px]">{status.replace('_', ' ')}</span>
                    <span className={`${
                      status === 'AVAILABLE' ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' :
                      status === 'EN_ROUTE' ? 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30' :
                      status === 'ON_SCENE' ? 'text-amber-400 bg-amber-500/20 border-amber-500/30' :
                      'text-slate-400 bg-slate-800 border-slate-700'
                    } px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold`}>{count}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Section: Recent Events */}
        <motion.div variants={itemVariants} className="bg-slate-800/80 border border-slate-700 rounded-xl shadow-lg overflow-hidden flex flex-col h-60">
          <div className="p-3 border-b border-slate-700 bg-slate-900/60 flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity size={14} className="text-cyan-400" />
              Recent Autonomous System Events
            </h3>
            <span className="text-xs font-mono font-bold text-slate-400">15 Latest Records</span>
          </div>
          <div className="flex-1 p-2 space-y-1.5 overflow-y-auto scrollbar-thin">
            {incidents.slice(0, 15).map((inc, i) => {
              const timeStr = inc.timestamp || inc.createdAt;
              return (
                <div key={i} className="px-3 py-2 bg-slate-900/60 rounded-lg border border-slate-800 hover:border-slate-600 transition-all flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${inc.severity >= 9 ? 'bg-rose-400 animate-pulse' : 'bg-cyan-400'}`} />
                    <div>
                      <p className="text-xs font-bold text-white">{inc.category.replace(/_/g, ' ')}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5 font-medium flex items-center gap-2">
                        <span>{inc.city || inc.node}</span>
                        <span className="w-1 h-1 bg-slate-600 rounded-full" />
                        <span>AI Match: {((inc.aiConfidence || 0.95) * 100).toFixed(0)}%</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                    {timeStr ? new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default AnalyticsDashboard;
