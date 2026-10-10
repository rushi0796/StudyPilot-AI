import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Timer, 
  Flag, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  X, 
  AlertCircle, 
  RotateCcw, 
  Award, 
  Sparkles,
  TrendingUp,
  BookmarkCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DEMO_QUIZ_SESSION } from '../../data/mockData';
import { QuizQuestion } from '../../types';
import confetti from 'canvas-confetti';

export const PracticeTestsView: React.FC = () => {
  const { addRevisionTask, setActiveView } = useApp();

  const [testState, setTestState] = useState<'intro' | 'active' | 'results'>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [qId: string]: string | number }>({
    qz_1: 1, // sample pre-filled
  });
  const [markedForReview, setMarkedForReview] = useState<string[]>([]);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(15 * 60); // 15 mins
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [score, setScore] = useState(0);

  const questions: QuizQuestion[] = DEMO_QUIZ_SESSION.questions;
  const currentQ = questions[currentQuestionIndex];

  // Timer effect
  useEffect(() => {
    let interval: any = null;
    if (testState === 'active' && isTimerRunning && timeLeftSeconds > 0) {
      interval = setInterval(() => {
        setTimeLeftSeconds(prev => prev - 1);
      }, 1000);
    } else if (timeLeftSeconds === 0 && testState === 'active') {
      handleSubmitTest();
    }
    return () => clearInterval(interval);
  }, [testState, isTimerRunning, timeLeftSeconds]);

  const startTest = () => {
    setTestState('active');
    setIsTimerRunning(true);
    setTimeLeftSeconds(DEMO_QUIZ_SESSION.durationMinutes * 60);
    setCurrentQuestionIndex(0);
  };

  const toggleMarkForReview = (qId: string) => {
    setMarkedForReview(prev => 
      prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
    );
  };

  const handleSelectOption = (qId: string, optIdx: number) => {
    setUserAnswers(prev => ({ ...prev, [qId]: optIdx }));
  };

  const handleShortAnswerChange = (qId: string, val: string) => {
    setUserAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const handleSubmitTest = () => {
    setIsTimerRunning(false);
    setShowSubmitConfirm(false);

    // Calculate score
    let calculatedScore = 0;
    questions.forEach(q => {
      const ans = userAnswers[q.id];
      if (q.type === 'mcq') {
        if (ans === q.correctAnswer) calculatedScore += q.marks;
      } else {
        // Simple deterministic partial credit check
        if (ans && typeof ans === 'string' && ans.toLowerCase().includes('exclusive')) {
          calculatedScore += q.marks;
        } else if (ans && typeof ans === 'string' && ans.toLowerCase().includes('transitive')) {
          calculatedScore += q.marks;
        }
      }
    });

    setScore(calculatedScore);
    setTestState('results');

    if (calculatedScore >= 14) {
      try {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      } catch (e) { /* ignore */ }
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* 1. INTRO SCREEN */}
      {testState === 'intro' && (
        <div className="max-w-2xl mx-auto p-6 lg:p-8 rounded-3xl bg-navy-900 border border-navy-800 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-electric-600 via-electric-500 to-violet-500 mx-auto flex items-center justify-center shadow-glow">
            <CheckSquare className="w-8 h-8 text-white" />
          </div>

          <div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-electric-500/15 text-electric-300 border border-electric-500/30">
              SGU Semester III Mock Test
            </span>
            <h1 className="text-2xl font-black text-white mt-2">
              {DEMO_QUIZ_SESSION.title}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {DEMO_QUIZ_SESSION.subject}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-navy-950/70 border border-navy-850 text-xs">
            <div>
              <span className="text-slate-400 block">Total Marks</span>
              <span className="font-extrabold text-base text-white">{DEMO_QUIZ_SESSION.totalMarks} Marks</span>
            </div>
            <div>
              <span className="text-slate-400 block">Duration</span>
              <span className="font-extrabold text-base text-electric-400">{DEMO_QUIZ_SESSION.durationMinutes} Minutes</span>
            </div>
            <div>
              <span className="text-slate-400 block">Questions</span>
              <span className="font-extrabold text-base text-violet-400">{questions.length} Items</span>
            </div>
          </div>

          <div className="text-left text-xs text-slate-300 space-y-2 p-4 rounded-xl bg-navy-950/40 border border-navy-800">
            <p className="font-bold text-white mb-1">Instructions:</p>
            <p>• Contains a blend of Multiple-Choice and Short Conceptual Questions.</p>
            <p>• You may mark questions for review and jump across questions freely.</p>
            <p>• Incorrect topics will automatically trigger personalized revision planner recommendations.</p>
          </div>

          <button
            onClick={startTest}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-electric-600 to-violet-600 hover:from-electric-500 hover:to-violet-500 text-white font-bold text-sm shadow-glow transition-all"
          >
            Start Timed Assessment
          </button>
        </div>
      )}

      {/* 2. ACTIVE TEST RUNNER */}
      {testState === 'active' && currentQ && (
        <div className="space-y-5 max-w-4xl mx-auto">
          
          {/* Header Bar: Progress & Live Timer */}
          <div className="p-4 rounded-2xl bg-navy-900 border border-navy-800 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <h2 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                Topic: {currentQ.topic}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold ${
                timeLeftSeconds < 180 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' : 'bg-navy-950 text-electric-300 border border-navy-700'
              }`}>
                <Timer className="w-4 h-4" />
                <span>{formatTimer(timeLeftSeconds)}</span>
              </div>

              <button
                onClick={() => setShowSubmitConfirm(true)}
                className="px-4 py-2 rounded-xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs shadow-glow transition-all"
              >
                Submit Test
              </button>
            </div>
          </div>

          {/* Question Navigator Palette */}
          <div className="p-3 rounded-2xl bg-navy-900/60 border border-navy-800 flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-[11px] font-semibold text-slate-400 mr-2 flex-shrink-0">Jump To:</span>
            {questions.map((q, idx) => {
              const isAnswered = userAnswers[q.id] !== undefined;
              const isMarked = markedForReview.includes(q.id);
              const isCurrent = idx === currentQuestionIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center flex-shrink-0 relative ${
                    isCurrent 
                      ? 'ring-2 ring-electric-400 bg-electric-600 text-white' 
                      : isMarked 
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                        : isAnswered 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                          : 'bg-navy-950 text-slate-400 border border-navy-800 hover:text-white'
                  }`}
                >
                  {idx + 1}
                  {isMarked && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Main Question Card */}
          <div className="p-6 lg:p-8 rounded-3xl bg-navy-900 border border-navy-800 shadow-xl space-y-6">
            
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {currentQ.marks} Marks
                </span>
                <span className="text-xs text-slate-400 ml-2 font-medium">
                  {currentQ.type.toUpperCase()}
                </span>
              </div>

              <button
                onClick={() => toggleMarkForReview(currentQ.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                  markedForReview.includes(currentQ.id)
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white bg-navy-950 border border-navy-800'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{markedForReview.includes(currentQ.id) ? "Marked for Review" : "Mark for Review"}</span>
              </button>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
              {currentQ.question}
            </h3>

            {/* Answer Input Area: MCQs vs Short Answer */}
            {currentQ.type === 'mcq' && currentQ.options ? (
              <div className="space-y-3">
                {currentQ.options.map((option, optIdx) => {
                  const isSelected = userAnswers[currentQ.id] === optIdx;

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(currentQ.id, optIdx)}
                      className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'bg-electric-600/20 border-electric-500 text-white shadow-sm' 
                          : 'bg-navy-950/60 border-navy-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                          isSelected ? 'bg-electric-500 text-white' : 'bg-navy-900 text-slate-400'
                        }`}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{option}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-electric-400" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 block">
                  Write your concise academic answer:
                </label>
                <textarea
                  rows={4}
                  value={(userAnswers[currentQ.id] as string) || ''}
                  onChange={(e) => handleShortAnswerChange(currentQ.id, e.target.value)}
                  placeholder="Type your explanation or definition here..."
                  className="w-full p-3.5 rounded-xl bg-navy-950 border border-navy-750 text-white text-xs sm:text-sm focus:border-electric-500 focus:outline-none"
                />
              </div>
            )}

            {/* Bottom Question Navigation Buttons */}
            <div className="pt-4 border-t border-navy-800 flex items-center justify-between">
              <button
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-navy-950 disabled:opacity-40 border border-navy-800"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-500 text-white text-xs font-bold shadow-glow"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitConfirm(true)}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
                >
                  <span>Review & Submit</span>
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>

          {/* Submit Confirmation Modal */}
          {showSubmitConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
              <div className="w-full max-w-md bg-navy-900 border border-navy-700 rounded-2xl p-6 shadow-2xl space-y-4">
                <h3 className="text-lg font-bold text-white">
                  Confirm Assessment Submission
                </h3>
                <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-800 text-xs space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span>Questions Answered:</span>
                    <strong className="text-white">{answeredCount} of {questions.length}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Marked for Review:</span>
                    <strong className="text-amber-400">{markedForReview.length} Questions</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Time Remaining:</span>
                    <strong className="text-electric-400">{formatTimer(timeLeftSeconds)}</strong>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Are you ready to submit? Your answers will be graded and weaknesses added to your Revision Planner.
                </p>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowSubmitConfirm(false)}
                    className="px-4 py-2 rounded-xl bg-navy-800 text-slate-300 text-xs font-semibold"
                  >
                    Resume Test
                  </button>
                  <button
                    onClick={handleSubmitTest}
                    className="px-5 py-2 rounded-xl bg-electric-600 hover:bg-electric-500 text-white text-xs font-bold shadow-glow"
                  >
                    Confirm Submit
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 3. TEST RESULTS & DETAILED EXPLANATIONS */}
      {testState === 'results' && (
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Results Summary Hero Card */}
          <div className="p-6 lg:p-8 rounded-3xl bg-navy-900 border border-navy-800 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-electric-600 to-violet-600 mx-auto flex items-center justify-center text-white shadow-glow">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Test Completed
              </span>
              <h2 className="text-2xl font-black text-white mt-2">
                Assessment Results
              </h2>
              <p className="text-xs text-slate-400">
                {DEMO_QUIZ_SESSION.title} • {DEMO_QUIZ_SESSION.subject}
              </p>
            </div>

            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-black text-white">{score}</span>
              <span className="text-xl font-bold text-slate-400">/ {DEMO_QUIZ_SESSION.totalMarks} Marks</span>
              <span className="ml-3 px-2.5 py-1 rounded-lg text-xs font-bold bg-electric-500/20 text-electric-300 border border-electric-500/30">
                {Math.round((score / DEMO_QUIZ_SESSION.totalMarks) * 100)}% Score
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={startTest}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-750 text-slate-200 text-xs font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Quiz</span>
              </button>
              <button
                onClick={() => setActiveView('evaluator')}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-500 text-white text-xs font-bold shadow-glow"
              >
                <span>Practise Long Answers in Evaluator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Question by Question Detailed Solutions */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-300 px-1">
              Detailed Question Solutions & AI Feedback
            </h3>

            {questions.map((q, idx) => {
              const userAns = userAnswers[q.id];
              const isCorrect = q.type === 'mcq' ? userAns === q.correctAnswer : true;

              return (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl bg-navy-900/80 border border-navy-800 space-y-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-400">Q{idx + 1}.</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-navy-800 text-slate-300">
                        {q.marks} Marks
                      </span>
                      <span className="text-slate-400 font-medium">{q.topic}</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isCorrect ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
                    }`}>
                      {isCorrect ? "Correct" : "Needs Review"}
                    </span>
                  </div>

                  <p className="font-semibold text-white sm:text-sm">
                    {q.question}
                  </p>

                  <div className="p-3 rounded-xl bg-navy-950 border border-navy-850 space-y-1.5">
                    <p className="text-emerald-400 font-semibold">
                      Explanation:
                    </p>
                    <p className="text-slate-300 leading-relaxed">
                      {q.explanation}
                    </p>
                  </div>

                  {!isCorrect && (
                    <button
                      onClick={() => addRevisionTask({
                        title: `Revise: ${q.topic}`,
                        subject: DEMO_QUIZ_SESSION.subject,
                        priority: 'high',
                        reason: 'Quiz Miss',
                        dueDate: 'Tomorrow',
                        timeEstimateMinutes: 20
                      })}
                      className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 pt-1"
                    >
                      <BookmarkCheck className="w-3.5 h-3.5" />
                      <span>Add this concept to Revision Planner</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
};
