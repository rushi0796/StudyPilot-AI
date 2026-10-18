import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Building2, 
  Languages, 
  Volume2, 
  RotateCcw, 
  Save, 
  Check, 
  Sparkles, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Cpu,
  Eye,
  EyeOff
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Language } from '../../types';
import { testGeminiConnection } from '../../services/aiProvider';

export const SettingsView: React.FC = () => {
  const { 
    studentProfile, 
    updateStudentProfile, 
    setOnboardingOpen,
    geminiApiKey,
    setGeminiApiKey,
    aiModel,
    setAiModel
  } = useApp();

  const [name, setName] = useState(studentProfile.name);
  const [university, setUniversity] = useState(studentProfile.university);
  const [course, setCourse] = useState(studentProfile.course);
  const [branch, setBranch] = useState(studentProfile.branch);
  const [year, setYear] = useState(studentProfile.year);
  const [semester, setSemester] = useState(studentProfile.semester);
  const [language, setLanguage] = useState<Language>(studentProfile.preferredLanguage);

  // Gemini state
  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState(aiModel || 'gemini-1.5-flash');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestStatus, setKeyTestStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
  }>({
    tested: Boolean(geminiApiKey),
    success: Boolean(geminiApiKey),
    message: geminiApiKey ? 'API Key saved and active in browser session.' : 'No API key configured. Operating in local academic demo mode.'
  });

  // Learning preferences
  const [simpleExplanations, setSimpleExplanations] = useState(studentProfile.learningPreferences.simpleExplanations);
  const [stepByStep, setStepByStep] = useState(studentProfile.learningPreferences.stepByStep);
  const [examplesBased, setExamplesBased] = useState(studentProfile.learningPreferences.examplesBased);
  const [voiceExplanations, setVoiceExplanations] = useState(studentProfile.learningPreferences.voiceExplanations);

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state whenever studentProfile changes in AppContext
  useEffect(() => {
    if (studentProfile) {
      setName(studentProfile.name || '');
      setUniversity(studentProfile.university || '');
      setCourse(studentProfile.course || '');
      setBranch(studentProfile.branch || '');
      setYear(studentProfile.year || '');
      setSemester(studentProfile.semester || '');
      setLanguage(studentProfile.preferredLanguage || 'en');
      if (studentProfile.learningPreferences) {
        setSimpleExplanations(studentProfile.learningPreferences.simpleExplanations ?? true);
        setStepByStep(studentProfile.learningPreferences.stepByStep ?? true);
        setExamplesBased(studentProfile.learningPreferences.examplesBased ?? true);
        setVoiceExplanations(studentProfile.learningPreferences.voiceExplanations ?? true);
      }
    }
  }, [studentProfile]);

  const handleTestConnection = async () => {
    setIsTestingKey(true);
    const res = await testGeminiConnection();
    setIsTestingKey(false);
    setKeyTestStatus({
      tested: true,
      success: res.success,
      message: res.message
    });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      alert("Please enter a valid student name.");
      return;
    }

    updateStudentProfile({
      name: cleanName,
      university,
      course,
      branch,
      year,
      semester,
      preferredLanguage: language,
      onboardingCompleted: true,
      geminiApiKey: apiKeyInput.trim(),
      aiModel: selectedModel,
      learningPreferences: {
        simpleExplanations,
        stepByStep,
        examplesBased,
        voiceExplanations,
      }
    });

    setGeminiApiKey(apiKeyInput.trim());
    setAiModel(selectedModel);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E0D5]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-forest-100 border border-forest-200 flex items-center justify-center text-forest-700 shadow-sm">
              <Settings className="w-5 h-5 text-forest-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-charcoal-900 tracking-tight">
                Application Settings
              </h1>
              <p className="text-xs text-charcoal-400 mt-0.5">
                Manage your student profile, academic parameters, explanation language, and Google Gemini API keys.
              </p>
            </div>
          </div>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest-100 text-forest-800 border border-forest-200 text-xs font-bold animate-in fade-in">
            <Check className="w-4 h-4 text-forest-600" />
            <span>Preferences Saved!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        
        {/* 2. Google Gemini Generative AI Configuration */}
        <div className="p-6 rounded-2xl bg-white border border-[#E5E0D5] shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D5]">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-forest-600" />
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-charcoal-900">
                  Google Gemini AI Engine Configuration
                </h2>
                <p className="text-[11px] text-charcoal-400">
                  Power real-time engineering explanations, live answer evaluations, and quiz generation.
                </p>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              keyTestStatus.success 
                ? 'bg-forest-100 text-forest-800 border border-forest-300' 
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${keyTestStatus.success ? 'bg-forest-600 animate-pulse' : 'bg-amber-500'}`} />
              <span>{keyTestStatus.success ? 'Live Gemini Active' : 'Demo Mode (Local Engine)'}</span>
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-sage-50 border border-sage-200 text-charcoal-700 leading-relaxed space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-forest-800">
                <Key className="w-4 h-4 text-forest-600" />
                <span>Server-Side Environment Security</span>
              </div>
              <p className="text-[11px] text-charcoal-600">
                To protect credentials according to security standards, <code>GEMINI_API_KEY</code> is loaded strictly on the server (via Vercel environment variables or local <code>.env.local</code>). Client-side keys are never leaked to browser networks or logs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-charcoal-700 font-bold mb-1">Model Engine</label>
                <div className="px-3.5 py-2 rounded-xl bg-white border border-[#E5E0D5] text-charcoal-900 font-medium">
                  Gemini 2.5 Flash (Production Reasoning)
                </div>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  disabled={isTestingKey}
                  onClick={async () => {
                    setIsTestingKey(true);
                    const res = await testGeminiConnection();
                    setIsTestingKey(false);
                    setKeyTestStatus({
                      tested: true,
                      success: res.success,
                      message: res.message
                    });
                  }}
                  className="w-full py-2 px-4 rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-800 font-bold border border-forest-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-forest-600" />
                  <span>{isTestingKey ? 'Checking Server...' : 'Check Server Connection'}</span>
                </button>
              </div>
            </div>

            {keyTestStatus.tested && (
              <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
                keyTestStatus.success 
                  ? 'bg-forest-50 border-forest-200 text-forest-800' 
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                {keyTestStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                )}
                <span>{keyTestStatus.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. Academic Information Section */}
        <div className="p-6 rounded-2xl bg-white border border-[#E5E0D5] shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E5E0D5]">
            <Building2 className="w-4 h-4 text-forest-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-charcoal-900">
              Student & Academic Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-charcoal-400 font-semibold mb-1">Student Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-academic-bg border border-[#E5E0D5] text-charcoal-900 focus:border-forest-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-charcoal-400 font-semibold mb-1">University / Institute</label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-academic-bg border border-[#E5E0D5] text-charcoal-900 focus:border-forest-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-charcoal-400 font-semibold mb-1">Degree Course</label>
              <input
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-academic-bg border border-[#E5E0D5] text-charcoal-900 focus:border-forest-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-charcoal-400 font-semibold mb-1">Department / Branch</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-academic-bg border border-[#E5E0D5] text-charcoal-900 focus:border-forest-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-charcoal-400 font-semibold mb-1">Academic Year</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-academic-bg border border-[#E5E0D5] text-charcoal-900 focus:border-forest-500 focus:outline-none"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year (Sophomore)</option>
                <option value="3rd Year">3rd Year (Junior)</option>
                <option value="4th Year">4th Year (Senior)</option>
              </select>
            </div>

            <div>
              <label className="block text-charcoal-400 font-semibold mb-1">Current Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-academic-bg border border-[#E5E0D5] text-charcoal-900 focus:border-forest-500 focus:outline-none"
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

        {/* 4. Explanation Language & AI Voice Settings */}
        <div className="p-6 rounded-2xl bg-white border border-[#E5E0D5] shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E5E0D5]">
            <Languages className="w-4 h-4 text-forest-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-charcoal-900">
              Multilingual & Voice Synthesis Engine
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-charcoal-400 font-semibold mb-1">
                Default Explanation Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-academic-bg border border-[#E5E0D5] text-charcoal-900 focus:border-forest-500 focus:outline-none font-medium"
              >
                <option value="en">English (Official University Phrasing)</option>
                <option value="hi">Hindi (हिंदी - सरल व्याख्या एवं उदाहरण)</option>
                <option value="mr">Marathi (मराठी - सोप्या भाषेत स्पष्टीकरण)</option>
                <option value="te">Telugu (తెలుగు - కాన్సెప్ట్స్ మరియు వివరణ)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-charcoal-400 font-semibold">
                Voice Narration Features
              </label>
              <label className="flex items-center gap-2.5 text-charcoal-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={voiceExplanations}
                  onChange={(e) => setVoiceExplanations(e.target.checked)}
                  className="rounded border-[#E5E0D5] text-forest-600 focus:ring-0"
                />
                <span>Enable Web Speech Audio Synthesizer Controls</span>
              </label>
              <label className="flex items-center gap-2.5 text-charcoal-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simpleExplanations}
                  onChange={(e) => setSimpleExplanations(e.target.checked)}
                  className="rounded border-[#E5E0D5] text-forest-600 focus:ring-0"
                />
                <span>Default to Plain English / Intuitive Analogies (ELI5)</span>
              </label>
            </div>
          </div>
        </div>

        {/* 5. Save & Maintenance Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOnboardingOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-sage-100 text-charcoal-700 text-xs font-semibold border border-[#E5E0D5] transition-colors shadow-subtle"
            >
              <Sparkles className="w-4 h-4 text-gold-500" />
              <span>Relaunch Onboarding Flow</span>
            </button>

            <button
              type="button"
              onClick={handleResetDemoData}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Demo Data</span>
            </button>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-forest-500 hover:bg-forest-600 text-white font-bold text-xs shadow-card transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save All Preferences</span>
          </button>
        </div>

      </form>

    </div>
  );
};
