import React from 'react';
import { Sparkles, UserCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AcademicHeaderBanner: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div className="w-full bg-[#EAF0E8] border-b border-[#E5E0D5] px-4 lg:px-6 py-1.5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 max-w-7xl mx-auto">
        
        {/* Left: Product Identity & Positioning */}
        <div className="flex items-center gap-2 text-charcoal-700">
          <span className="flex items-center gap-1.5 font-bold text-forest-800">
            <Sparkles className="w-4 h-4 text-forest-600" />
            StudyPilot AI
          </span>
          <span className="text-charcoal-400">•</span>
          <span className="text-charcoal-600 font-medium hidden sm:inline">
            AI-Powered Personalized Learning Platform
          </span>
        </div>

        {/* Right: Authenticated Student vs Guest Status */}
        <div className="flex items-center gap-2.5">
          {currentUser ? (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-[11px] text-emerald-800 font-bold shadow-subtle">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <UserCheck className="w-3 h-3 text-emerald-700" />
              <span>Student Account: {currentUser.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-[11px] text-amber-800 font-bold shadow-subtle">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Guest Mode • Sign in to save progress</span>
            </div>
          )}

          <div className="hidden md:flex items-center gap-1 text-[11px] font-semibold text-forest-800 bg-white px-2.5 py-0.5 rounded-md border border-[#E5E0D5] shadow-subtle">
            <CheckCircle2 className="w-3 h-3 text-forest-600" />
            <span>Interactive RAG Engine</span>
          </div>
        </div>

      </div>
    </div>
  );
};
