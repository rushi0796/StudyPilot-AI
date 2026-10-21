import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  BookOpen, 
  Languages, 
  Sliders, 
  Award,
  CheckCircle2,
  Clock,
  Target,
  GraduationCap,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Language } from '../../types';
import { getInitials } from '../../utils/profileUtils';
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

  const { currentUser, completeOnboarding } = useAuth();

  const [step, setStep] = useState(1);
  const [isCompleting, setIsCompleting] = useState(false);

  // Student identity confirmed from Signup / Auth
  const studentName = currentUser?.name || studentProfile.name || 'Student';
  const university = currentUser?.university || studentProfile.university || 'Sanjay Ghodawat University';
  const course = currentUser?.course || studentProfile.course || 'B.Tech';
  const branch = currentUser?.branch || studentProfile.branch || 'Artificial Intelligence & Machine Learning';
  const year = currentUser?.year || studentProfile.year || '2nd Year';
  const semester = currentUser?.semester || studentProfile.semester || 'Semester III';

  // Configurable preferences during onboarding
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(subjects.map(s => s.id));
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    (currentUser?.preferredLanguage as Language) || studentProfile.preferredLanguage || 'en'
  );
  
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(60);
  const [primaryFocus, setPrimaryFocus] = useState<'exam_prep' | 'concept_mastery' | 'revision'>('exam_prep');

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

  const handleNextStep = () => {
    setStep(prev => Math.min(prev + 1, 4));
  };

  const handleFinishOnboarding = async () => {
    setIsCompleting(true);
    try {
      if (completeOnboarding) {
        await completeOnboarding({
          preferredLanguage: selectedLanguage
        });
      }

      updateStudentProfile({
        name: studentName,
        university,
        course,
        branch,
        year,
        semester,
        preferredLanguage: selectedLanguage,
        learningPreferences: {
          ...preferences,
          dailyGoalMinutes,
          primaryFocus
        },
        onboardingCompleted: true,
      });

      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore
      }

      setOnboardingOpen(false);
      setActiveView('dashboard');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-[#E5E0D5] rounded-3xl shadow-2xl p-6 lg:p-8 overflow-hidden">
        
        {/* Step Indicator Top Bar */}
        <div className="flex items-center justify-between pb-5 border-b border-[#E5E0D5]">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-forest-100 text-forest-700 font-bold text-xs">
              {step}/4
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
              {step === 1 && "Curriculum Subjects"}
              {step === 2 && "Study Language"}
              {step === 3 && "Goals & Learning Style"}
              {step === 4 && "Workspace Ready"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map(s => (
              <div 
                key={s} 
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  s === step ? 'w-6 bg-forest-600' : s < step ? 'w-3 bg-forest-300' : 'w-3 bg-academic-bg'
                }`}
              />
            ))}
          </div>

          {studentProfile.onboardingCompleted ? (
            <button
              onClick={() => setOnboardingOpen(false)}
              className="text-charcoal-400 hover:text-charcoal-700 p-1 cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-6" />
          )}
        </div>

        {/* Step Content */}
        <div className="py-6 min-h-[350px] flex flex-col justify-center">
          
          {/* STEP 1: CONFIRMED IDENTITY BADGE & SEMESTER SUBJECTS */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              
              {/* Confirmed Student Banner */}
              <div className="p-4 rounded-2xl bg-academic-bg border border-[#E5E0D5] flex items-center justify-between gap-3 shadow-subtle">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-forest-600 text-white font-bold text-sm flex items-center justify-center shadow-subtle flex-shrink-0">
                    {getInitials(studentName)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-charcoal-900">{studentName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Verified Profile
                      </span>
                    </div>
                    <p className="text-[11px] text-charcoal-500 mt-0.5">
                      Welcome! Setting up your <strong className="text-forest-700 font-bold">{course} ({branch})</strong> workspace at {university}.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-charcoal-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-forest-600" />
                  <span>Confirm Your Active Semester III Subjects</span>
                </h3>
                <p className="text-xs text-charcoal-400 mt-0.5">
                  Select the subjects you want StudyPilot AI to organize in your revision planner and question bank.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {subjects.map((sub) => {
                  const isSelected = selectedSubjectIds.includes(sub.id);
                  return (
                    <button
                      key={sub.id}
                      onClick={() => toggleSubject(sub.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-start justify-between cursor-pointer ${
                        isSelected 
                          ? 'bg-sage-100 border-forest-500 text-charcoal-900 shadow-subtle' 
                          : 'bg-academic-bg border-[#E5E0D5] text-charcoal-700 hover:border-forest-300'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-forest-100 text-forest-800 font-mono">
                          {sub.code}
                        </span>
                        <h4 className="text-xs font-bold text-charcoal-900 mt-1">{sub.name}</h4>
                        <p className="text-[10px] text-charcoal-400">{sub.units.length} Units • {sub.totalQuestionsCount} Exam Qs</p>
                      </div>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected ? 'bg-forest-600 text-white' : 'border border-[#E5E0D5]'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: PREFERRED EXPLANATION LANGUAGE */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <h3 className="text-base font-bold text-charcoal-900 flex items-center gap-2">
                  <Languages className="w-5 h-5 text-forest-600" />
                  <span>Choose Your Preferred Explanation Language</span>
                </h3>
                <p className="text-xs text-charcoal-400 mt-0.5">
                  StudyPilot AI tutor adapts conceptual explanations and voice synthesis into your chosen language.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'en' as Language, title: 'English', desc: 'Standard technical terminology & university exam phrasing', icon: 'EN' },
                  { id: 'hi' as Language, title: 'Hindi (हिंदी)', desc: 'सरल हिंदी व्याख्या, दैनिक जीवन के उदाहरण और परीक्षा बिंदु', icon: 'हि' },
                  { id: 'mr' as Language, title: 'Marathi (मराठी)', desc: 'सोप्या मराठीत स्पष्टीकरण, रोजच्या जीवनातील उदाहरणे आणि महत्त्वाचे मुद्दे', icon: 'म' },
                  { id: 'te' as Language, title: 'Telugu (తెలుగు)', desc: 'సులభమైన తెలుగు వివరణ, ఉదాహరణలు మరియు ముఖ్యమైన కాన్సెప్ట్స్', icon: 'తె' },
                ].map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setSelectedLanguage(l.id)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedLanguage === l.id 
                        ? 'bg-sage-100 border-forest-600 shadow-card' 
                        : 'bg-academic-bg border-[#E5E0D5] hover:border-forest-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-forest-100 flex items-center justify-center font-bold text-sm text-forest-700 mb-3 border border-forest-200">
                      {l.icon}
                    </div>
                    <h4 className="font-bold text-sm text-charcoal-900">{l.title}</h4>
                    <p className="text-[11px] text-charcoal-500 mt-1 leading-relaxed">{l.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: DAILY STUDY GOAL & PRIMARY FOCUS */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <h3 className="text-base font-bold text-charcoal-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-forest-600" />
                  <span>Daily Study Goal & Primary Objective</span>
                </h3>
                <p className="text-xs text-charcoal-400 mt-0.5">
                  Set your daily study target and focus area for this semester.
                </p>
              </div>

              {/* Daily Target */}
              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-forest-600" />
                  <span>Daily Study Commitment</span>
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { minutes: 30, label: '30 Mins / day', desc: 'Light pace' },
                    { minutes: 60, label: '1 Hour / day', desc: 'Standard target' },
                    { minutes: 120, label: '2 Hours / day', desc: 'Exam sprint' },
                  ].map((goal) => (
                    <button
                      key={goal.minutes}
                      type="button"
                      onClick={() => setDailyGoalMinutes(goal.minutes)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        dailyGoalMinutes === goal.minutes
                          ? 'bg-forest-50 border-forest-600 text-forest-900 font-bold'
                          : 'bg-academic-bg border-[#E5E0D5] text-charcoal-600 hover:border-forest-300'
                      }`}
                    >
                      <div className="text-xs">{goal.label}</div>
                      <div className="text-[10px] text-charcoal-400 mt-0.5">{goal.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Focus */}
              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1.5 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-forest-600" />
                  <span>Semester Learning Focus</span>
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'exam_prep' as const, label: 'Exam Preparation', desc: 'Marks & rubric focus' },
                    { id: 'concept_mastery' as const, label: 'Concept Mastery', desc: 'Deep understanding' },
                    { id: 'revision' as const, label: 'Quick Revision', desc: 'Bullet summaries' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setPrimaryFocus(f.id)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        primaryFocus === f.id
                          ? 'bg-forest-50 border-forest-600 text-forest-900 font-bold'
                          : 'bg-academic-bg border-[#E5E0D5] text-charcoal-600 hover:border-forest-300'
                      }`}
                    >
                      <div className="text-xs">{f.label}</div>
                      <div className="text-[10px] text-charcoal-400 mt-0.5">{f.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Learning Preferences Toggles */}
              <div className="pt-2 border-t border-[#E5E0D5]">
                <label className="block text-xs font-bold text-charcoal-800 mb-2 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-forest-600" />
                  <span>Tutor Formatting Preferences</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'simpleExplanations', label: 'Simple Explanations (ELI5)', desc: 'Everyday analogies before technical jargon' },
                    { key: 'stepByStep', label: 'Step-by-Step Derivations', desc: 'Numbered sequential steps for proofs & algorithms' },
                    { key: 'examplesBased', label: 'Concrete Code/Examples', desc: 'Include working code snippets and sample diagrams' },
                    { key: 'voiceExplanations', label: 'Voice Narration', desc: 'Enable speech synthesizer for auditory learning' },
                  ].map((item) => {
                    const key = item.key as keyof typeof preferences;
                    const active = preferences[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPreferences(prev => ({ ...prev, [key]: !prev[key] }))}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                          active 
                            ? 'bg-sage-100 border-forest-500 text-charcoal-900 font-semibold' 
                            : 'bg-academic-bg border-[#E5E0D5] text-charcoal-600 hover:border-forest-300'
                        }`}
                      >
                        <div>
                          <span className="text-xs block">{item.label}</span>
                          <span className="text-[10px] text-charcoal-400 block">{item.desc}</span>
                        </div>
                        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ml-2 ${
                          active ? 'bg-forest-600 text-white' : 'border border-[#E5E0D5]'
                        }`}>
                          {active && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SUMMARY & LAUNCH */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-forest-100 text-forest-700 flex items-center justify-center mx-auto mb-2 border border-forest-200">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-charcoal-900">
                  Your Personalized Academic Dashboard is Ready!
                </h3>
                <p className="text-xs text-charcoal-400 mt-1">
                  We've configured your study environment based on your verified credentials and choices.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-academic-bg border border-[#E5E0D5] text-xs space-y-2.5 max-w-lg mx-auto">
                <div className="flex items-center gap-3 pb-3 border-b border-[#E5E0D5]">
                  <div className="w-10 h-10 rounded-xl bg-forest-600 text-white flex items-center justify-center font-bold text-sm shadow-subtle flex-shrink-0">
                    {getInitials(studentName)}
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-charcoal-400 uppercase font-bold tracking-wider block">Student Identity</span>
                    <span className="font-bold text-charcoal-900 text-sm">{studentName}</span>
                  </div>
                </div>
                <div className="flex justify-between pb-2 border-b border-[#E5E0D5]">
                  <span className="text-charcoal-400">University & Program:</span>
                  <span className="font-bold text-charcoal-900">{university} • {course} ({semester})</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-[#E5E0D5]">
                  <span className="text-charcoal-400">Branch:</span>
                  <span className="font-bold text-forest-700">{branch}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-[#E5E0D5]">
                  <span className="text-charcoal-400">Active Syllabus Subjects:</span>
                  <span className="font-bold text-charcoal-900">{selectedSubjectIds.length} Subjects Configured</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-[#E5E0D5]">
                  <span className="text-charcoal-400">Explanation Language:</span>
                  <span className="font-bold text-forest-800 uppercase">
                    {selectedLanguage === 'en' ? 'English' : selectedLanguage === 'hi' ? 'Hindi' : selectedLanguage === 'mr' ? 'Marathi' : 'Telugu'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-400">Daily Study Target:</span>
                  <span className="font-bold text-forest-700">{dailyGoalMinutes} Minutes / Day • {primaryFocus === 'exam_prep' ? 'Exam Preparation' : primaryFocus === 'concept_mastery' ? 'Concept Mastery' : 'Revision'}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation Buttons */}
        <div className="pt-4 border-t border-[#E5E0D5] flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-charcoal-700 hover:text-charcoal-900 bg-academic-bg hover:bg-sage-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={handleNextStep}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-forest-600 hover:bg-forest-700 shadow-md shadow-forest-600/20 transition-all cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinishOnboarding}
              disabled={isCompleting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-forest-600 hover:bg-forest-700 shadow-md shadow-forest-600/20 transition-all cursor-pointer disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isCompleting ? 'Finalizing Setup...' : 'Complete Setup & Launch Dashboard'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
