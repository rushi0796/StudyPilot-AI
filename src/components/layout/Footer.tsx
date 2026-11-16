import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-[#E5E0D5] py-6 px-4 lg:px-8 text-xs text-charcoal-400">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Left: Branding & Tagline */}
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="font-extrabold text-sm text-charcoal-900 tracking-tight">StudyPilot AI</span>
            <span className="text-charcoal-300">•</span>
            <span className="text-forest-700 font-semibold">AI-Powered Personalized Learning Platform</span>
          </div>
          <p className="text-[11px] text-charcoal-400">
            Learn Smarter. Score Higher. &copy; {new Date().getFullYear()} StudyPilot AI. All rights reserved.
          </p>
        </div>

        {/* Right: Operational Status */}
        <div className="flex items-center gap-3 text-center sm:text-right text-[11px]">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>AI Knowledge Engine Active</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
