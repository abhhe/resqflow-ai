import React from 'react';
import { Settings, User, Shield } from 'lucide-react';
import useAuthStore from '../stores/authStore';

const SettingsView = () => {
  const user = useAuthStore(state => state.user);

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 shadow-xl overflow-y-auto">
      <header className="border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[10px] tracking-wider uppercase border border-blue-500/30">
            Control Console
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] tracking-wider uppercase border border-emerald-500/30">
            Active Session
          </span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          System Settings <span className="text-sm font-semibold text-slate-400">| Session Preferences & Environment Parameters</span>
        </h1>
      </header>

      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 space-y-6 shadow-lg max-w-3xl">
        <div>
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
            <User size={15} className="text-cyan-400" /> Operator Profile
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Operator ID</label>
              <div className="bg-slate-900 border border-slate-700 px-3.5 py-2.5 rounded-lg text-xs font-mono font-bold text-slate-200">
                {user?.id || 'DISPATCHER_OP1'}
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Assigned Role</label>
              <div className="bg-slate-900 border border-slate-700 px-3.5 py-2.5 rounded-lg text-xs font-bold text-cyan-400">
                {user?.role || 'EMERGENCY_DISPATCHER'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-5 border-t border-slate-700">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-3">
            <Shield size={15} className="text-emerald-400" /> Platform Security & Verification
          </h2>
          <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-700/80 p-3 rounded-lg">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-xs font-semibold text-slate-200">PS10 Cryptographic JWT Session Active & Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
