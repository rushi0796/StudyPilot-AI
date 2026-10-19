import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, ArrowRight } from 'lucide-react';

interface StudyPilotLoaderProps {
  message?: string;
  subMessage?: string;
  fullScreen?: boolean;
  onRetry?: () => void;
  onBypass?: () => void;
}

export const StudyPilotLoader: React.FC<StudyPilotLoaderProps> = ({
  message = 'Preparing your learning workspace…',
  subMessage = 'Sanjay Ghodawat University • Team Codex',
  fullScreen = true,
  onRetry,
  onBypass
}) => {
  const [showSlowWarning, setShowSlowWarning] = useState(false);

  // Fallback timer: if loading takes longer than 7 seconds, give student actionable options
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSlowWarning(true);
    }, 7000);
    return () => clearTimeout(timer);
  }, []);

  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-[#F7F5EF] text-[#252923] p-4 selection:bg-[#245B45] selection:text-white'
    : 'w-full py-16 flex items-center justify-center text-[#252923] p-4';

  return (
    <div 
      className={containerClasses} 
      role="status" 
      aria-live="polite"
      aria-label="Loading StudyPilot AI"
    >
      {/* Ambient background glow */}
      <div 
        className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-[#0088FF]/15 via-[#245B45]/15 to-[#00B4D8]/10 blur-3xl pointer-events-none -z-10 animate-pulse"
        style={{ animationDuration: '4s' }}
      />

      <div className="flex flex-col items-center max-w-sm w-full text-center">
        {/* Animated Brand Emblem & Logo Container */}
        <div className="relative mb-6">
          {/* Outer rotating decorative orbit ring */}
          <div 
            className="absolute -inset-3.5 rounded-full border-2 border-dashed border-[#245B45]/30 animate-spin"
            style={{ animationDuration: '16s' }}
          />

          {/* Glowing pulse ring */}
          <div 
            className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#245B45] via-[#0088FF] to-[#245B45] opacity-25 blur-sm animate-pulse" 
            style={{ animationDuration: '2.5s' }}
          />

          {/* Logo Card with subtle hover/breath */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white p-2.5 shadow-xl shadow-[#245B45]/10 border border-[#E5E0D5] flex items-center justify-center overflow-hidden transition-transform duration-700 ease-out">
            <img 
              src="/logo.png" 
              alt="StudyPilot AI Logo" 
              className="w-full h-full object-contain rounded-2xl animate-pulse"
              style={{ animationDuration: '3s' }}
              onError={(e) => {
                // Graceful fallback to SVG monogram if image is unavailable
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.parentElement?.querySelector('.sp-monogram-fallback') as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />

            {/* Fallback SP monogram if image cannot load */}
            <div className="sp-monogram-fallback hidden flex-col items-center justify-center w-full h-full bg-[#245B45] text-white rounded-2xl">
              <Sparkles className="w-6 h-6 text-[#70E000] mb-0.5" />
              <span className="font-extrabold text-lg tracking-wider">SP</span>
            </div>
          </div>
        </div>

        {/* Brand Title */}
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-charcoal-900 mb-1 flex items-center justify-center gap-1.5">
          <span>StudyPilot</span>
          <span className="text-[#0088FF]">AI</span>
        </h1>

        {/* Subtitle / Status message */}
        <p className="text-xs sm:text-sm font-semibold text-[#245B45] mb-1">
          {message}
        </p>
        <p className="text-[11px] text-charcoal-500 font-medium mb-6">
          {subMessage}
        </p>

        {/* Shimmering Progress Bar */}
        <div className="w-48 sm:w-56 h-1.5 bg-[#E5E0D5] rounded-full overflow-hidden relative mb-4">
          <div 
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#245B45] via-[#0088FF] to-[#245B45] w-full rounded-full"
            style={{
              animation: 'studyPilotSweep 1.8s infinite ease-in-out',
            }}
          />
        </div>

        {/* Actionable Fallback if loading is taking unusually long */}
        {showSlowWarning && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 mt-2 p-3 rounded-2xl bg-white border border-[#E5E0D5] shadow-sm w-full">
            <p className="text-[11px] text-charcoal-600 mb-2.5">
              Taking longer than usual to connect?
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => onRetry ? onRetry() : window.location.reload()}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-sage-50 text-charcoal-700 hover:bg-sage-100 border border-[#E5E0D5] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-forest-600" />
                <span>Retry</span>
              </button>
              {onBypass && (
                <button
                  type="button"
                  onClick={onBypass}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-forest-600 text-white hover:bg-forest-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-forest-600/20"
                >
                  <span>Continue as Guest</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Embedded CSS for smooth shimmering sweep */}
      <style>{`
        @keyframes studyPilotSweep {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-spin,
          .animate-pulse {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};
