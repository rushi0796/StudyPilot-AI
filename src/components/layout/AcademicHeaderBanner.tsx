import React from 'react';
import { ShieldCheck, Info, Users, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AcademicHeaderBanner: React.FC = () => {
  const { setTeamModalOpen } = useApp();

  return (
    <div className="w-full bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 border-b border-navy-700/60 px-4 lg:px-6 py-2 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 max-w-7xl mx-auto">
        
        {/* Left: Academic Credentials */}
        <div className="flex items-center gap-2 text-slate-300">
          <span className="flex items-center gap-1 font-semibold text-white">
            <ShieldCheck className="w-4 h-4 text-electric-400" />
            Sanjay Ghodawat University
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 hidden sm:inline">
            2nd-Year Artificial Intelligence Project
          </span>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <span className="text-electric-300 font-medium hidden md:inline">
            Team Codex
          </span>
        </div>

        {/* Right: Demo notice and Team Details Trigger */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-electric-500/10 border border-electric-500/25 text-[11px] text-electric-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Interactive Demo Mode (Preloaded Curriculum)</span>
          </div>

          <button
            onClick={() => setTeamModalOpen(true)}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-300 hover:text-white bg-navy-700/80 hover:bg-navy-600 px-2 py-0.5 rounded-md border border-navy-600 transition-colors"
          >
            <Users className="w-3 h-3 text-violet-400" />
            <span>View Team Members</span>
          </button>
        </div>

      </div>
    </div>
  );
};
