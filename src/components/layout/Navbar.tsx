import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  Bell, 
  Globe, 
  User, 
  ShieldCheck, 
  ChevronDown, 
  X, 
  Volume2,
  FolderOpen,
  LogIn,
  LogOut,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Language } from '../../types';
import { getInitials, formatDisplayName } from '../../utils/profileUtils';

export const Navbar: React.FC = () => {
  const { 
    studentProfile, 
    updateStudentProfile, 
    activeView, 
    setActiveView,
    setGlobalSearchOpen,
    setTeamModalOpen,
    setOnboardingOpen,
    notifications,
    unreadNotificationsCount,
    dismissNotification,
    isSpeaking,
    stopSpeech,
    uploadedDocuments
  } = useApp();

  const { currentUser, openAuthModal, logout, isLoading: authLoading } = useAuth();

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
    { code: 'mr', label: 'Marathi', native: 'मराठी (Marathi)' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు (Telugu)' },
  ];

  const currentLangObj = languages.find(l => l.code === studentProfile.preferredLanguage) || languages[0];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E0D5] px-4 lg:px-6 py-2.5 transition-colors duration-200 shadow-subtle">
      <div className="flex items-center justify-between gap-4">
        
        {/* Brand Logo & Academic Identity */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveView('dashboard')}
            className="flex items-center gap-2.5 group text-left focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-forest-500 text-white flex items-center justify-center shadow-card group-hover:bg-forest-600 transition-all duration-200 overflow-hidden">
              <img src="/logo.png" alt="StudyPilot AI" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-charcoal-900 group-hover:text-forest-600 transition-colors">
                  StudyPilot AI
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-forest-50 text-forest-700 border border-forest-200">
                  Team Codex
                </span>
              </div>
              <p className="text-[11px] text-charcoal-400 hidden sm:block font-medium">
                Sanjay Ghodawat University • AI Dept
              </p>
            </div>
          </button>
        </div>

        {/* Global Search Bar (Ctrl + K) */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            onClick={() => setGlobalSearchOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-academic-bg hover:bg-sage-100 text-charcoal-400 hover:text-charcoal-700 border border-[#E5E0D5] text-xs transition-all shadow-subtle group"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-forest-600 group-hover:text-forest-700 transition-colors" />
              <span>Search subjects, syllabus units, question bank...</span>
            </div>
            <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-medium text-charcoal-400 bg-white rounded border border-[#E5E0D5]">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right Action Tools: Audio Status, Language, Notifications, Files, Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* Active Audio Speech Pill */}
          {isSpeaking && (
            <button
              onClick={stopSpeech}
              className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-forest-100 text-forest-700 border border-forest-300 text-xs animate-pulse hover:bg-forest-200"
              title="Speech is playing. Click to stop."
            >
              <Volume2 className="w-3.5 h-3.5 text-forest-600" />
              <span className="hidden sm:inline font-semibold">Speaking...</span>
              <X className="w-3 h-3 hover:text-charcoal-900" />
            </button>
          )}

          {/* Quick Files Hub Shortcut */}
          <button
            onClick={() => setActiveView('files')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-charcoal-700 bg-academic-bg hover:bg-sage-100 border border-[#E5E0D5] transition-colors"
            title="My Files & Study Materials"
          >
            <FolderOpen className="w-3.5 h-3.5 text-forest-600" />
            <span className="hidden md:inline">Materials</span>
            {uploadedDocuments.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-forest-500 text-white font-bold">
                {uploadedDocuments.length}
              </span>
            )}
          </button>

          {/* Academic Showcase Pill */}
          <button
            onClick={() => setTeamModalOpen(true)}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-charcoal-700 bg-academic-bg hover:bg-sage-100 border border-[#E5E0D5] transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-forest-600" />
            <span>Academic Info</span>
          </button>

          {/* Multilingual Selector */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-charcoal-700 bg-academic-bg hover:bg-sage-100 border border-[#E5E0D5] transition-colors"
              title="Change Explanation Language"
            >
              <Globe className="w-3.5 h-3.5 text-forest-600" />
              <span className="uppercase">{studentProfile.preferredLanguage}</span>
              <ChevronDown className="w-3 h-3 text-charcoal-400" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-[#E5E0D5] shadow-elevated p-1.5 z-50 animate-in fade-in duration-150">
                <div className="px-2 py-1 text-[11px] font-bold text-charcoal-400 uppercase tracking-wider border-b border-[#E5E0D5] mb-1">
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
                        ? 'bg-sage-200 text-forest-800 font-bold' 
                        : 'text-charcoal-700 hover:bg-sage-50 hover:text-charcoal-900'
                    }`}
                  >
                    <span>{l.label}</span>
                    <span className="text-[11px] text-charcoal-400">{l.native}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Popover */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-lg text-charcoal-700 hover:text-charcoal-900 bg-academic-bg hover:bg-sage-100 border border-[#E5E0D5] transition-colors"
              title="Study Notifications"
            >
              <Bell className="w-4 h-4 text-charcoal-600" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-forest-600 text-[10px] font-bold text-white shadow-subtle">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-[#E5E0D5] shadow-elevated p-3.5 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E0D5] mb-2">
                  <span className="font-bold text-xs text-charcoal-900">Study Notifications</span>
                  <span className="text-[10px] text-charcoal-400">{notifications.length} alerts</span>
                </div>
                {notifications.length === 0 ? (
                  <div className="text-center py-7 px-4 text-xs text-charcoal-500">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-2 border border-emerald-200">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-charcoal-800">You're all caught up!</p>
                    <p className="text-[11px] text-charcoal-400 mt-0.5">No new study alerts.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {notifications.map(n => (
                      <div 
                        key={n.id}
                        className="p-2.5 rounded-xl bg-academic-bg border border-[#E5E0D5] hover:border-forest-300 transition-colors relative group"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className={`text-xs font-bold ${
                            n.type === 'alert' ? 'text-amber-700' :
                            n.type === 'success' ? 'text-forest-700' : 'text-forest-600'
                          }`}>
                            {n.title}
                          </span>
                          <button 
                            onClick={() => dismissNotification(n.id)}
                            className="text-charcoal-400 hover:text-charcoal-700 p-0.5 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-[11px] text-charcoal-700 mt-1 leading-snug">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-charcoal-400 mt-1 block">
                          {n.time}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Direct Sign In CTA Button (when unauthenticated) */}
          {!currentUser && !authLoading && (
            <button
              onClick={() => openAuthModal('signin')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-bold text-xs shadow-sm shadow-forest-600/20 transition-all cursor-pointer"
              title="Sign in to your persistent student account"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Student Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl bg-academic-bg hover:bg-sage-100 border border-[#E5E0D5] transition-colors group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-forest-500 text-white flex items-center justify-center text-xs font-bold shadow-subtle relative overflow-hidden">
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                  getInitials(currentUser ? currentUser.name : 'Guest Student')
                )}
                {currentUser && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white" title="Account active" />
                )}
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-bold text-charcoal-900 leading-tight">
                  {currentUser ? formatDisplayName(currentUser.name) : 'Guest Student'}
                </p>
                <p className="text-[10px] text-charcoal-400 leading-tight flex items-center gap-1">
                  <span>{currentUser ? currentUser.semester : studentProfile.semester}</span>
                  <span>•</span>
                  <span className={currentUser ? 'text-forest-700 font-semibold' : 'text-amber-700 font-semibold'}>
                    {currentUser ? 'Logged In' : 'Guest Mode'}
                  </span>
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-charcoal-400 group-hover:text-charcoal-700" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-[#E5E0D5] shadow-elevated p-2 z-50 animate-in fade-in duration-150">
                {/* Account Header */}
                <div className="p-2.5 border-b border-[#E5E0D5] flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-forest-500 text-white flex items-center justify-center text-sm font-bold shadow-subtle flex-shrink-0 overflow-hidden">
                    {currentUser?.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    ) : (
                      getInitials(currentUser ? currentUser.name : 'Guest Student')
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-charcoal-900 truncate">
                        {currentUser ? currentUser.name : 'Guest Student'}
                      </p>
                      {currentUser ? (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-forest-100 text-forest-800 border border-forest-200">
                          Active
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Guest Mode
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-charcoal-400 truncate">
                      {currentUser ? currentUser.email : 'Explore as guest or sign in below'}
                    </p>
                    <p className="text-[10px] text-forest-700 mt-0.5 font-semibold truncate">
                      {currentUser ? `${currentUser.branch} (${currentUser.year})` : `${studentProfile.branch} (${studentProfile.year})`}
                    </p>
                  </div>
                </div>

                {/* Guest Callout (if not logged in) */}
                {!currentUser && (
                  <div className="my-2 p-2.5 rounded-xl bg-sage-50 border border-sage-200 text-xs">
                    <p className="text-[11px] font-bold text-forest-800">Save Your Progress</p>
                    <p className="text-[10px] text-charcoal-600 mt-0.5 leading-snug">
                      Sign in with your student credentials to persist study history and evaluations across devices.
                    </p>
                    <button
                      onClick={() => {
                        openAuthModal('signin');
                        setProfileDropdownOpen(false);
                      }}
                      className="mt-2 w-full py-1.5 rounded-lg text-xs font-bold bg-forest-600 hover:bg-forest-700 text-white flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sign In / Create Account</span>
                    </button>
                  </div>
                )}

                <div className="py-1 space-y-0.5 text-xs">
                  <button
                    onClick={() => {
                      setActiveView('settings');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-charcoal-700 hover:bg-sage-50 hover:text-charcoal-900 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-forest-600" />
                    <span>Academic Profile & Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setTeamModalOpen(true);
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-charcoal-700 hover:bg-sage-50 hover:text-charcoal-900 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-forest-600" />
                    <span>About Team Codex (SGU Project)</span>
                  </button>
                  <button
                    onClick={() => {
                      setOnboardingOpen(true);
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-charcoal-700 hover:bg-sage-50 hover:text-charcoal-900 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-gold-500" />
                    <span>Restart Onboarding Tour</span>
                  </button>

                  {/* Log Out button if authenticated */}
                  {currentUser && (
                    <div className="pt-1 mt-1 border-t border-[#E5E0D5]">
                      <button
                        onClick={async () => {
                          await logout();
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        <span>Sign Out of Account</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
