import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, Activity, Truck, Hospital, Navigation, 
  ArrowRight, ChevronRight, Radio, ShieldCheck 
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col relative selection:bg-blue-100 selection:text-blue-900">
      
      {/* Top Navbar */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 sm:px-10 flex items-center justify-between z-30 sticky top-0 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <ShieldAlert size={18} />
          </div>
          <span className="font-black text-sm tracking-widest uppercase text-slate-900">
            AI Dispatch
          </span>
        </div>

        <div className="flex items-center gap-6">
          <Link 
            to="/report" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-blue-600 transition-colors"
          >
            Citizen Report
          </Link>
          <Link
            to="/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm hover:shadow flex items-center gap-1.5"
          >
            <span>Command Center</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12 lg:py-16 overflow-hidden">
        {/* Subtle background image gradient overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <img 
            src="/images/landing-bg.jpg" 
            alt="Emergency Operations" 
            className="w-full h-full object-cover object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-slate-50/90 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headlines & Action Buttons */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Active Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              Emergency Operations Center • Active
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-blue-900 tracking-tight leading-[1.05] uppercase">
              AI Emergency<br />
              Dispatch
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed font-normal">
              Intelligent Real-Time Emergency Coordination, Ambulance Dispatch, and Dynamic Hospital Resource Allocation across Hyderabad and India.
            </p>

            {/* 4 Action Buttons - All open in new tabs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* Button 1: Command Dashboard */}
              <Link
                to="/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2 active:scale-95"
              >
                <span>Command Dashboard</span>
                <ArrowRight size={14} />
              </Link>

              {/* Button 2: Hospitals Network */}
              <Link
                to="/dashboard/hospitals"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2 active:scale-95"
              >
                <Hospital size={15} className="text-blue-600" />
                <span>Hospitals Network</span>
              </Link>

              {/* Button 3: Fleet Management */}
              <Link
                to="/dashboard/ambulances"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2 active:scale-95"
              >
                <Truck size={15} className="text-emerald-600" />
                <span>Fleet Management</span>
              </Link>

              {/* Button 4: Report Emergency */}
              <Link
                to="/report"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-600 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2 active:scale-95"
              >
                <Radio size={15} className="text-rose-600 animate-pulse" />
                <span>Report Emergency</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Floating Status Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xl max-w-md w-full space-y-4">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Hyderabad EMS Status
                </span>
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Network
                </span>
              </div>

              {/* Status Items */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Monitored Hospitals</span>
                  <span className="font-bold text-slate-900">20 Facilities</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Ambulance Fleet</span>
                  <span className="font-bold text-emerald-600">28 Units Active</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Optimization Engine</span>
                  <span className="font-bold text-blue-600">Hungarian Global Solver</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Hard Constraint</span>
                  <span className="font-bold text-rose-600">Zero-ICU Protected</span>
                </div>
              </div>

              {/* Launch Simulator Button - Opens in new tab */}
              <Link
                to="/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 mt-4 shadow-inner"
              >
                <span>Launch PS10 Simulator</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Feature Strip (4 Cards) */}
        <div className="max-w-7xl mx-auto w-full relative z-10 mt-14 pt-8 border-t border-slate-200/80">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Global Optimization */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1.5">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Activity size={16} />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  Global Optimization
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Multi-incident Hungarian solver minimizing total response latency.
              </p>
            </div>

            {/* Card 2: Zero-ICU Hard Constraint */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1.5">
              <div className="flex items-center gap-2 text-rose-600 mb-1">
                <Hospital size={16} />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  Zero-ICU Hard Constraint
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Guarantees critical patients are never routed to hospitals with 0 ICU beds.
              </p>
            </div>

            {/* Card 3: Capability Matching */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1.5">
              <div className="flex items-center gap-2 text-amber-600 mb-1">
                <ShieldCheck size={16} />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  Capability Matching
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Matches ALS, ICU ambulances, Fire Tenders, and Rescue Boats to incident demands.
              </p>
            </div>

            {/* Card 4: Dynamic Traffic Routing */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <Navigation size={16} />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  Dynamic Traffic Routing
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Live bypass around traffic bottlenecks, weather hazards, and flooded roads.
              </p>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;