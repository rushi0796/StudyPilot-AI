import React from 'react';
import { ShieldCheck, Users, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TEAM_MEMBERS, UNIVERSITY_INFO } from '../../data/mockData';

export const Footer: React.FC = () => {
  const { setTeamModalOpen } = useApp();

  return (
    <footer className="w-full bg-[#0B1020] border-t border-navy-800/80 py-6 px-4 lg:px-8 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Branding & Academic Info */}
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="font-extrabold text-sm text-white">StudyPilot AI</span>
            <span className="text-slate-600">•</span>
            <span className="text-electric-400 font-semibold">{UNIVERSITY_INFO.name}</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {UNIVERSITY_INFO.department} • {UNIVERSITY_INFO.academicYear} ({UNIVERSITY_INFO.semester}) • Capstone Prototype
          </p>
        </div>

        {/* Center: Team Codex Members Roll Call */}
        <div className="text-center">
          <button
            onClick={() => setTeamModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-navy-900 hover:bg-navy-850 text-slate-300 hover:text-white border border-navy-800 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-electric-400" />
            <span className="font-bold text-white">Team Codex:</span>
            <span>Aken Rushikesh Gopal (Lead) • Shaik Imam Hussain • Dasari Aswan Kumar • Lajaree Ashish Deorkar</span>
          </button>
        </div>

        {/* Right: Prototype badge */}
        <div className="text-center md:text-right text-[11px] text-slate-500">
          <p>Interactive Academic Demonstration</p>
          <p className="text-emerald-400 font-medium">● Local Offline SGU Engine Ready</p>
        </div>

      </div>
    </footer>
  );
};
