import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Building2, 
  GraduationCap, 
  BookOpen, 
  Languages, 
  Sliders, 
  Award,
  CheckCircle2,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Language } from '../../types';
import confetti from 'canvas-confetti';

export const OnboardingModal: React.FC = () => {
  const { 
    onboardingOpen, 
    setOnboardingOpen, 
    studentProfile, 
    updateStudentProfile,
    subjects,
    setActiveView
  } = useApp();

  const [step, setStep] = useState(1);

  // Form states
  const [university, setUniversity] = useState(studentProfile.university || "Sanjay Ghodawat University");
  const [course, setCourse] = useState(studentProfile.course || "B.Tech (Four-Year Degree)");
  const [branch, setBranch] = useState(studentProfile.branch || "Artificial Intelligence & Machine Learning");
  const [year, setYear] = useState(studentProfile.year || "2nd Year");
  const [semester, setSemester] = useState(studentProfile.semester || "Semester III");

  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(subjects.map(s => s.id));
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(studentProfile.preferredLanguage || 'en');
  
  const [preferences, setPreferences] = useState({
    simpleExplanations: studentProfile.learningPreferences.simpleExplanations ?? true,
    stepByStep: studentProfile.learningPreferences.stepByStep ?? true,
    examplesBased: studentProfile.learningPreferences.examplesBased ?? true,
    voiceExplanations: studentProfile.learningPreferences.voiceExplanations ?? true,
  });

  if (!onboardingOpen) return null;

  const toggleSubject = (id: string) => {
    setSelectedSubjectIds(prev => 
      prev.includes(id) ? (prev.length > 1 ? prev.filter(s => s !== id) : prev) : [...prev, id]
    );
  };

  const handleFinishOnboarding = () => {
    updateStudentProfile({
      university,
      course,
      branch,
      year,
      semester,
      preferredLanguage: selectedLanguage,
      learningPreferences: preferences,
      onboardingCompleted: true,
    });

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }

    setOnboardingOpen(false);
    setActiveView('dashboard');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-navy-900 border border-navy-700 rounded-3xl shadow-2xl p-6 lg:p-8 overflow-hidden">
        
        {/* Step Indicator Top Bar */}
        <div className="flex items-center justify-between pb-5 border-b border-navy-800">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-electric-500/20 text-electric-400 font-bold text-xs">
              {step}/6
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {step === 1 && "Welcome"}
              {step === 2 && "Academic Details"}
              {step === 3 && "Course Subjects"}
              {step === 4 && "Explanation Language"}
              {step === 5 && "Learning Preferences"}
              {step === 6 && "Personalized Profile"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5, 6].map(s => (
              <div 
                key={s} 
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  s === step ? 'w-6 bg-electric-500' : s < step ? 'w-3 bg-emerald-500' : 'w-3 bg-navy-800'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setOnboardingOpen(false)}
            className="text-slate-500 hover:text-slate-300 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Content */}
        <div className="py-6 min-h-[340px] flex flex-col justify-center">
          
          {/* STEP 1: WELCOME */}
          {step === 1 && (
            <div className="text-center space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-electric-600 via-electric-500 to-violet-500 mx-auto flex items-center justify-center shadow-glow">
                <Sparkles className="w-8 h-8 text-white animate-spin-slow" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-white">
                  Welcome to StudyPilot AI
                </h2>
                <p className="text-sm text-electric-400 font-medium mt-1">
                  AI-Powered Personalized Study Assistant
                </p>
              </div>
              <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
                An academic innovation by <strong className="text-white">Team Codex</strong>, 2nd-Year Artificial Intelligence students at <strong className="text-white">Sanjay Ghodawat University</strong>.
                Designed to help college students conquer complex engineering concepts, master university syllabi, and practice marks-wise exam questions with targeted feedback.
              </p>
              <div className="p-3 bg-navy-950/70 border border-navy-800 rounded-xl max-w-md mx-auto text-left text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Syllabus-aligned concepts and university marking rubrics</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Interactive AI tutor with progressive "Teach Until I Understand"</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Multilingual support in English, Hindi, and Telugu with voice TTS</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ACADEMIC DETAILS */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="text-left">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-electric-400" />
                  Select Academic Details
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pre-configured for Sanjay Ghodawat University 2nd-Year AI curriculum.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">University</label>
                  <input
                    type="text"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-700 text-white focus:border-electric-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Degree Course</label>
                  <select
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-700 text-white focus:border-electric-500 focus:outline-none"
                  >
                    <option value="B.Tech (Four-Year Degree)">B.Tech (Four-Year Degree)</option>
                    <option value="B.Sc Artificial Intelligence">B.Sc Artificial Intelligence</option>
                    <option value="M.Tech AI & Data Science">M.Tech AI & Data Science</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Department / Branch</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-700 text-white focus:border-electric-500 focus:outline-none"
                  >
                    <option value="Artificial Intelligence & Machine Learning">Artificial Intelligence & Machine Learning</option>
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Data Science & Analytics">Data Science & Analytics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Academic Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-700 text-white focus:border-electric-500 focus:outline-none"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year (Sophomore)</option>
                    <option value="3rd Year">3rd Year (Junior)</option>
                    <option value="4th Year">4th Year (Senior)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-medium mb-1">Current Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-700 text-white focus:border-electric-500 focus:outline-none"
                  >
                    <option value="Semester III">Semester III (Active SGU AI Term)</option>
                    <option value="Semester IV">Semester IV</option>
                    <option value="Semester V">Semester V</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SELECT SUBJECTS */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-electric-400" />
                  Select Your Active Subjects
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pick the subjects you want StudyPilot AI to organize in your dashboard.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {subjects.map((sub) => {
                  const isSelected = selectedSubjectIds.includes(sub.id);
                  return (
                    <button
                      key={sub.id}
                      onClick={() => toggleSubject(sub.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-start justify-between ${
                        isSelected 
                          ? 'bg-electric-600/15 border-electric-500 text-white' 
                          : 'bg-navy-950/60 border-navy-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-navy-800 text-electric-300">
                          {sub.code}
                        </span>
                        <h4 className="text-xs font-semibold text-slate-200 mt-1">{sub.name}</h4>
                        <p className="text-[10px] text-slate-400">{sub.units.length} Units • {sub.totalQuestionsCount} Qs</p>
                      </div>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                        isSelected ? 'bg-electric-500 text-white' : 'border border-navy-700'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: PREFERRED LANGUAGE */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Languages className="w-5 h-5 text-electric-400" />
                  Choose Preferred Explanation Language
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  StudyPilot AI adapts explanations and voice synthesis into your chosen language.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'en' as Language, title: 'English', desc: 'Standard technical terminology & university exam phrasing', icon: 'EN' },
                  { id: 'hi' as Language, title: 'Hindi (हिंदी)', desc: 'सरल हिंदी व्याख्या, दैनिक जीवन के उदाहरण और परीक्षा बिंदु', icon: 'हि' },
                  { id: 'te' as Language, title: 'Telugu (తెలుగు)', desc: 'సులభమైన తెలుగు వివరణ, ఉదాహరణలు మరియు ముఖ్యమైన కాన్సెప్ట్స్', icon: 'తె' },
                ].map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setSelectedLanguage(l.id)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      selectedLanguage === l.id 
                        ? 'bg-electric-600/20 border-electric-500 shadow-glow' 
                        : 'bg-navy-950/60 border-navy-800 hover:border-navy-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-navy-800 flex items-center justify-center font-bold text-sm text-electric-400 mb-3 border border-navy-700">
                      {l.icon}
                    </div>
                    <h4 className="font-bold text-sm text-white">{l.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{l.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: LEARNING PREFERENCES */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-electric-400" />
                  Select Your Learning Preferences
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Customize how the AI tutor formats conceptual answers for you.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { key: 'simpleExplanations', label: 'Simple Explanations (ELI5)', desc: 'Prioritize plain non-jargon language before deep technical terms' },
                  { key: 'stepByStep', label: 'Step-by-Step Derivations', desc: 'Break algorithms and proofs into clear sequential numbered steps' },
                  { key: 'examplesBased', label: 'Examples & Analogies', desc: 'Illustrate concepts with real-world everyday analogies' },
                  { key: 'voiceExplanations', label: 'Voice Audio Explanations', desc: 'Enable speech narration controls for auditory revision' },
                ].map((item) => {
                  const key = item.key as keyof typeof preferences;
                  const active = preferences[key];
                  return (
                    <button
                      key={key}
                      onClick={() => setPreferences(prev => ({ ...prev, [key]: !prev[key] }))}
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-start justify-between ${
                        active 
                          ? 'bg-violet-600/15 border-violet-500 text-white' 
                          : 'bg-navy-950/60 border-navy-800 text-slate-400 hover:border-navy-700'
                      }`}
                    >
                      <div className="pr-2">
                        <span className="font-semibold text-slate-200 block">{item.label}</span>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">{item.desc}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                        active ? 'bg-violet-500 text-white' : 'border border-navy-700'
                      }`}>
                        {active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 6: SUMMARY & LAUNCH */}
          {step === 6 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-500/30">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Your Personalized Academic Dashboard is Ready!
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  We've configured your study environment based on your selections.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-navy-950/80 border border-navy-800 text-xs space-y-2.5 max-w-lg mx-auto">
                <div className="flex justify-between pb-2 border-b border-navy-850">
                  <span className="text-slate-400">University & Program:</span>
                  <span className="font-semibold text-white">{university} • {year} ({semester})</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-navy-850">
                  <span className="text-slate-400">Branch:</span>
                  <span className="font-semibold text-electric-300">{branch}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-navy-850">
                  <span className="text-slate-400">Enrolled Subjects:</span>
                  <span className="font-semibold text-white">{selectedSubjectIds.length} Subjects Active</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-navy-850">
                  <span className="text-slate-400">Explanation Language:</span>
                  <span className="font-semibold text-violet-300 uppercase">{selectedLanguage === 'en' ? 'English' : selectedLanguage === 'hi' ? 'Hindi' : 'Telugu'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Learning Mode:</span>
                  <span className="font-semibold text-emerald-300">Simple + Step-by-Step + Audio</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation Buttons */}
        <div className="pt-4 border-t border-navy-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-navy-800 hover:bg-navy-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 6 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-electric-600 hover:bg-electric-500 shadow-glow transition-all"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinishOnboarding}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-electric-600 to-violet-600 hover:from-electric-500 hover:to-violet-500 shadow-glow transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Dashboard</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
