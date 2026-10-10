import React from 'react';
import { ShieldCheck, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AcademicHeaderBanner: React.FC = () => {
  const { setTeamModalOpen } = useApp();

  return (
    <div className="w-full bg-[#EAF0E8] border-b border-[#E5E0D5] px-4 lg:px-6 py-1.5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 max-w-7xl mx-auto">
        
        {/* Left: Academic Credentials */}
        <div className="flex items-center gap-2 text-charcoal-700">
          <span className="flex items-center gap-1.5 font-bold text-forest-800">
            <ShieldCheck className="w-4 h-4 text-forest-600" />
            Sanjay Ghodawat University
          </span>
          <span className="text-charcoal-400">•</span>
          <span className="text-charcoal-400 hidden sm:inline">
            2nd-Year Artificial Intelligence Project
          </span>
          <span className="text-charcoal-400 hidden sm:inline">•</span>
          <span className="text-forest-700 font-semibold hidden md:inline">
            Team Codex
          </span>
        </div>

        {/* Right: Demo notice and Team Details Trigger */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-[#E5E0D5] text-[11px] text-forest-700 shadow-subtle">
            <span className="w-1.5 h-1.5 rounded-full bg-forest-500 animate-pulse" />
            <span>Interactive Academic Prototype</span>
          </div>

          <button
            onClick={() => setTeamModalOpen(true)}
            className="flex items-center gap-1 text-[11px] font-semibold text-charcoal-700 hover:text-charcoal-900 bg-white hover:bg-sage-100 px-2.5 py-0.5 rounded-md border border-[#E5E0D5] transition-colors shadow-subtle"
          >
            <Users className="w-3 h-3 text-forest-600" />
            <span>Team Codex</span>
          </button>
        </div>

      </div>
    </div>
  );
};
