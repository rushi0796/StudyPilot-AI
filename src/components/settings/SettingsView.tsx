import React, { useState } from 'react';
import { 
  Settings, 
  User, 
  Building2, 
  Languages, 
  Volume2, 
  Moon, 
  Sun, 
  Bell, 
  RotateCcw, 
  Save, 
  Check, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Language } from '../../types';

export const SettingsView: React.FC = () => {
  const { 
    studentProfile, 
    updateStudentProfile, 
    setOnboardingOpen,
    theme,
    toggleTheme,
    subjects,
    setTheme
  } = useApp();

  const [name, setName] = useState(studentProfile.name);
  const [university, setUniversity] = useState(studentProfile.university);
  const [course, setCourse] = useState(studentProfile.course);
  const [branch, setBranch] = useState(studentProfile.branch);
  const [year, setYear] = useState(studentProfile.year);
  const [semester, setSemester] = useState(studentProfile.semester);
  const [language, setLanguage] = useState<Language>(studentProfile.preferredLanguage);

  // Learning preferences
  const [simpleExplanations, setSimpleExplanations] = useState(studentProfile.learningPreferences.simpleExplanations);
  const [stepByStep, setStepByStep] = useState(studentProfile.learningPreferences.stepByStep);
  const [examplesBased, setExamplesBased] = useState(studentProfile.learningPreferences.examplesBased);
  const [voiceExplanations, setVoiceExplanations] = useState(studentProfile.learningPreferences.voiceExplanations);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateStudentProfile({
      name,
      university,
      course,
      branch,
      year,
      semester,
      preferredLanguage: language,
      learningPreferences: {
        simpleExplanations,
        stepByStep,
        examplesBased,
        voiceExplanations,
      }
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetDemoData = () => {
    if (confirm("Reset local storage and reload demo data?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200 max-w-4xl">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-navy-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-electric-400" />
            Application Settings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your student profile, academic curriculum parameters, explanation language, and audio preferences.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>Preferences Saved!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        
        {/* 2. Academic Information Section */}
        <div className="p-6 rounded-2xl bg-navy-900/80 border border-navy-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-navy-800">
            <Building2 className="w-4 h-4 text-electric-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Student & Academic Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Student Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-navy-950 border border-navy-700 text-white focus:border-electric-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">University / Institute</label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-navy-950 border border-navy-700 text-white focus:border-electric-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Degree Course</label>
              <input
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-navy-950 border border-navy-700 text-white focus:border-electric-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Department / Branch</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-navy-950 border border-navy-700 text-white focus:border-electric-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Academic Year</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-navy-950 border border-navy-700 text-white focus:border-electric-500 focus:outline-none"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year (Sophomore)</option>
                <option value="3rd Year">3rd Year (Junior)</option>
                <option value="4th Year">4th Year (Senior)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Current Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-navy-950 border border-navy-700 text-white focus:border-electric-500 focus:outline-none"
              >
                <option value="Semester I">Semester I</option>
                <option value="Semester II">Semester II</option>
                <option value="Semester III">Semester III (Active)</option>
                <option value="Semester IV">Semester IV</option>
                <option value="Semester V">Semester V</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Explanation Language & AI Voice Settings */}
        <div className="p-6 rounded-2xl bg-navy-900/80 border border-navy-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-navy-800">
            <Languages className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Multilingual & Voice Synthesis Engine
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Default Explanation Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-navy-950 border border-navy-700 text-white focus:border-electric-500 focus:outline-none font-medium"
              >
                <option value="en">English (Official University Phrasing)</option>
                <option value="hi">Hindi (हिंदी - सरल व्याख्या एवं उदाहरण)</option>
                <option value="te">Telugu (తెలుగు - కాన్సెప్ట్స్ మరియు వివరణ)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-slate-400 font-semibold">
                Voice Narration Features
              </label>
              <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={voiceExplanations}
                  onChange={(e) => setVoiceExplanations(e.target.checked)}
                  className="rounded bg-navy-950 border-navy-700 text-electric-600 focus:ring-0"
                />
                <span>Enable Web Speech Audio Synthesizer Controls</span>
              </label>
              <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simpleExplanations}
                  onChange={(e) => setSimpleExplanations(e.target.checked)}
                  className="rounded bg-navy-950 border-navy-700 text-electric-600 focus:ring-0"
                />
                <span>Default to Plain English / Intuitive Analogies (ELI5)</span>
              </label>
            </div>
          </div>
        </div>

        {/* 4. Appearance & Theme Selection */}
        <div className="p-6 rounded-2xl bg-navy-900/80 border border-navy-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-navy-800">
            <Moon className="w-4 h-4 text-electric-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Appearance & Theme Palette
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <button
              type="button"
              onClick={() => {
                setTheme('dark');
                document.documentElement.classList.add('dark');
              }}
              className={`p-4 rounded-xl border text-left flex items-center justify-between ${
                theme === 'dark' 
                  ? 'bg-electric-600/20 border-electric-500 text-white shadow-glow' 
                  : 'bg-navy-950/60 border-navy-800 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0B1020] border border-navy-700 flex items-center justify-center text-electric-400">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block">Deep Navy (Default)</span>
                  <span className="text-[10px] text-slate-400">#0B1020 + Electric Blue</span>
                </div>
              </div>
              {theme === 'dark' && <Check className="w-4 h-4 text-electric-400" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setTheme('light');
                document.documentElement.classList.remove('dark');
              }}
              className={`p-4 rounded-xl border text-left flex items-center justify-between ${
                theme === 'light' 
                  ? 'bg-electric-600/20 border-electric-500 text-white shadow-glow' 
                  : 'bg-navy-950/60 border-navy-800 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-200 border border-slate-300 flex items-center justify-center text-amber-500">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block">Light Clean Surface</span>
                  <span className="text-[10px] text-slate-400">#F5F7FA + Electric Blue</span>
                </div>
              </div>
              {theme === 'light' && <Check className="w-4 h-4 text-electric-400" />}
            </button>
          </div>
        </div>

        {/* 5. Save & Maintenance Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOnboardingOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-750 text-slate-300 hover:text-white text-xs font-semibold border border-navy-700 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Relaunch Onboarding Flow</span>
            </button>

            <button
              type="button"
              onClick={handleResetDemoData}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Demo Data</span>
            </button>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs shadow-glow transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>

      </form>

    </div>
  );
};
