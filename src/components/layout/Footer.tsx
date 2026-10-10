import React from 'react';
import { Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UNIVERSITY_INFO } from '../../data/mockData';

export const Footer: React.FC = () => {
  const { setTeamModalOpen } = useApp();

  return (
    <footer className="w-full bg-white border-t border-[#E5E0D5] py-6 px-4 lg:px-8 text-xs text-charcoal-400">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Branding & Academic Info */}
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="font-extrabold text-sm text-charcoal-900">StudyPilot AI</span>
            <span className="text-charcoal-300">•</span>
            <span className="text-forest-700 font-semibold">{UNIVERSITY_INFO.name}</span>
          </div>
          <p className="text-[11px] text-charcoal-400">
            {UNIVERSITY_INFO.department} • {UNIVERSITY_INFO.academicYear} ({UNIVERSITY_INFO.semester}) • Capstone Project
          </p>
        </div>

        {/* Center: Team Codex Members Roll Call */}
        <div className="text-center">
          <button
            onClick={() => setTeamModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-academic-bg hover:bg-sage-100 text-charcoal-700 hover:text-charcoal-900 border border-[#E5E0D5] transition-colors shadow-subtle text-xs"
          >
            <Users className="w-3.5 h-3.5 text-forest-600" />
            <span className="font-bold text-forest-800">Team Codex:</span>
            <span>Aken Rushikesh Gopal (Lead) • Shaik Imam Hussain • Dasari Aswan Kumar • Lajaree Ashish Deorkar</span>
          </button>
        </div>

        {/* Right: Prototype badge */}
        <div className="text-center md:text-right text-[11px] text-charcoal-400">
          <p>Academic AI Learning Prototype</p>
          <p className="text-forest-600 font-semibold">● Google Gemini + SGU Curriculum Engine</p>
        </div>

      </div>
    </footer>
  );
};
