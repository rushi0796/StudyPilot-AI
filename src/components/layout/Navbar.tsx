import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  Bell, 
  Globe, 
  Moon, 
  Sun, 
  User, 
  ShieldCheck, 
  ExternalLink,
  ChevronDown,
  X,
  Volume2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Language } from '../../types';

export const Navbar: React.FC = () => {
  const { 
    studentProfile, 
    updateStudentProfile, 
    activeView, 
    setActiveView,
    setGlobalSearchOpen,
    setTeamModalOpen,
    setOnboardingOpen,
    theme,
    toggleTheme,
    notifications,
    unreadNotificationsCount,
    dismissNotification,
    isSpeaking,
    stopSpeech
  } = useApp();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages: { code: Language; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English (Indian)' },
    { code: 'hi', label: 'Hindi', native: 'हिंदी (Hindi)' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు (Telugu)' },
  ];

  const currentLangObj = languages.find(l => l.code === studentProfile.preferredLanguage) || languages[0];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B1020]/90 backdrop-blur-md border-b border-navy-700/60 px-4 lg:px-6 py-2.5 transition-colors duration-200">
      <div className="flex items-center justify-between gap-4">
        
        {/* Brand Logo & Academic Identity */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveView('dashboard')}
            className="flex items-center gap-2.5 group text-left focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-electric-600 via-electric-500 to-violet-500 flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-blue-100 to-electric-400 bg-clip-text text-transparent">
                  StudyPilot AI
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-electric-500/15 text-electric-300 border border-electric-500/30">
                  Team Codex
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
                Sanjay Ghodawat University • AI Dept
              </p>
            </div>
          </button>
        </div>

        {/* Global Search Bar (Ctrl + K) */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            onClick={() => setGlobalSearchOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-navy-900/80 hover:bg-navy-800/90 text-slate-400 hover:text-slate-200 border border-navy-700/70 hover:border-electric-500/40 text-xs transition-all shadow-inner group"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-electric-400 group-hover:text-electric-300 transition-colors" />
              <span>Search subjects, syllabus units, question bank...</span>
            </div>
            <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-navy-950 rounded border border-navy-700">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right Action Tools: Audio Status, Language, Notifications, Theme, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Active Audio Speech Pill */}
          {isSpeaking && (
            <button
              onClick={stopSpeech}
              className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40 text-xs animate-pulse hover:bg-violet-500/30"
              title="Speech is playing. Click to stop."
            >
              <Volume2 className="w-3.5 h-3.5 text-violet-400" />
              <span className="hidden sm:inline font-medium">Speaking...</span>
              <X className="w-3 h-3 hover:text-white" />
            </button>
          )}

          {/* Academic Showcase Pill */}
          <button
            onClick={() => setTeamModalOpen(true)}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 bg-navy-800/70 hover:bg-navy-700 hover:text-white border border-navy-700 hover:border-slate-600 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-electric-400" />
            <span>Academic Info</span>
          </button>

          {/* Multilingual Selector */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-navy-800/60 hover:bg-navy-700 border border-navy-700/70 hover:border-electric-500/40 transition-colors"
              title="Change Explanation Language"
            >
              <Globe className="w-3.5 h-3.5 text-electric-400" />
              <span className="font-semibold uppercase">{studentProfile.preferredLanguage}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-navy-900 border border-navy-700/80 shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-navy-800 mb-1">
                  Explanation Language
                </div>
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      updateStudentProfile({ preferredLanguage: l.code });
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                      studentProfile.preferredLanguage === l.code 
                        ? 'bg-electric-500/20 text-electric-300 font-medium border border-electric-500/30' 
                        : 'text-slate-300 hover:bg-navy-800 hover:text-white'
                    }`}
                  >
                    <span>{l.label}</span>
                    <span className="text-[11px] text-slate-400">{l.native}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Popover */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-lg text-slate-300 hover:text-white bg-navy-800/60 hover:bg-navy-700 border border-navy-700/70 hover:border-electric-500/40 transition-colors"
              title="Study Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-electric-500 text-[10px] font-bold text-white shadow">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-navy-900 border border-navy-700/80 shadow-2xl p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-navy-800 mb-2">
                  <span className="font-semibold text-xs text-slate-200">Study Notifications</span>
                  <span className="text-[10px] text-slate-400">{notifications.length} alerts</span>
                </div>
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No active study notifications.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {notifications.map(n => (
                      <div 
                        key={n.id}
                        className="p-2.5 rounded-lg bg-navy-950/60 border border-navy-800 hover:border-navy-700 transition-colors relative group"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className={`text-xs font-semibold ${
                            n.type === 'alert' ? 'text-amber-400' :
                            n.type === 'success' ? 'text-emerald-400' : 'text-electric-400'
                          }`}>
                            {n.title}
                          </span>
                          <button 
                            onClick={() => dismissNotification(n.id)}
                            className="text-slate-500 hover:text-slate-300 p-0.5 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          {n.time}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Student Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl bg-navy-800/80 hover:bg-navy-700 border border-navy-700/80 hover:border-electric-500/40 transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-electric-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow">
                AR
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-semibold text-slate-200 leading-tight">
                  {studentProfile.name.split(' ')[0]} {studentProfile.name.split(' ')[1]?.[0]}.
                </p>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {studentProfile.semester} • AI
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-navy-900 border border-navy-700/80 shadow-2xl p-2 z-50">
                <div className="p-2 border-b border-navy-800">
                  <p className="text-xs font-bold text-slate-100">{studentProfile.name}</p>
                  <p className="text-[11px] text-slate-400">{studentProfile.university}</p>
                  <p className="text-[10px] text-electric-400 mt-0.5 font-medium">
                    {studentProfile.branch} ({studentProfile.year})
                  </p>
                </div>
                <div className="py-1 space-y-0.5 text-xs">
                  <button
                    onClick={() => {
                      setActiveView('settings');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-navy-800 hover:text-white"
                  >
                    <User className="w-3.5 h-3.5 text-electric-400" />
                    <span>Academic Profile & Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setTeamModalOpen(true);
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-navy-800 hover:text-white"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                    <span>About Team Codex (SGU Project)</span>
                  </button>
                  <button
                    onClick={() => {
                      setOnboardingOpen(true);
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-navy-800 hover:text-white"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Restart Onboarding Tour</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
