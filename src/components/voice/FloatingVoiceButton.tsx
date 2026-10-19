import React, { useState } from 'react';
import { PhoneCall, Sparkles, Volume2 } from 'lucide-react';

interface FloatingVoiceButtonProps {
  onClick: () => void;
  isActive?: boolean;
}

export const FloatingVoiceButton: React.FC<FloatingVoiceButtonProps> = ({ onClick, isActive }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="fixed bottom-6 right-6 z-40 flex items-center gap-3 select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tooltip Pill */}
      <div 
        className={`hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-charcoal-900/90 text-white text-xs font-semibold shadow-xl border border-white/10 backdrop-blur-md transition-all duration-300 transform ${
          isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-3 pointer-events-none'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Voice Call Assistant</span>
        <span className="text-[10px] text-emerald-300 font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
          Live AI
        </span>
      </div>

      {/* Main Circular Floating Action Button */}
      <button
        onClick={onClick}
        aria-label="Start Voice Call with StudyPilot AI Voice Assistant"
        className="relative group w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-gradient-to-tr from-[#1B4332] via-[#245B45] to-[#2D6A4F] text-white shadow-card hover:shadow-hover hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-emerald-300/40 focus:outline-none focus:ring-4 focus:ring-forest-500/40 cursor-pointer"
      >
        {/* Animated Pulsing Outer Ring */}
        <span className="absolute -inset-1.5 rounded-full bg-emerald-500/30 animate-ping opacity-60 pointer-events-none duration-1000" />
        
        {/* Soft Ambient Glow Halo */}
        <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-emerald-400 to-forest-300 opacity-40 blur group-hover:opacity-80 transition duration-300" />

        {/* Central Icon */}
        <div className="relative z-10 flex items-center justify-center">
          <PhoneCall className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
          <Sparkles className="w-3.5 h-3.5 text-gold-300 absolute -top-1.5 -right-1.5 animate-bounce" />
        </div>

        {/* Active Call Indicator Badge */}
        {isActive && (
          <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white animate-pulse" />
        )}
      </button>
    </div>
  );
};
