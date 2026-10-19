import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Timer, 
  Flag, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  RotateCcw, 
  Award, 
  Sparkles,
  BookmarkCheck,
  FolderOpen
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DEMO_QUIZ_SESSION } from '../../data/mockData';
import { QuizQuestion } from '../../types';
import { generateQuizWithGemini, isLiveAiAvailable } from '../../services/aiProvider';
import confetti from 'canvas-confetti';

export const PracticeTestsView: React.FC = () => {
  const { 
    addRevisionTask, 
    setActiveView, 
    activeSubject, 
    uploadedDocuments, 
    activeDocumentId,
    recordQuizAttempt
  } = useApp();

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

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(DEMO_QUIZ_SESSION.questions);
  const [isGeneratingAiQuiz, setIsGeneratingAiQuiz] = useState(false);

  const currentQ = quizQuestions[currentQuestionIndex];
  const isLive = isLiveAiAvailable();
  const activeDoc = uploadedDocuments.find(d => d.id === activeDocumentId) || uploadedDocuments[0];

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

  const handleGenerateAiQuiz = async () => {
    setIsGeneratingAiQuiz(true);
    try {
      const generated = await generateQuizWithGemini({
        subject: activeSubject.name,
        topic: 'Relational Normalization & Concurrency Control',
        documentChunks: activeDoc?.chunks.slice(0, 3)
      });

      if (generated && generated.length > 0) {
        setQuizQuestions(generated);
        setUserAnswers({});
        setMarkedForReview([]);
        startTest();
      } else {
        // Fallback to pre-set questions
        startTest();
      }
    } catch (err) {
      startTest();
    } finally {
      setIsGeneratingAiQuiz(false);
    }
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

    let calculatedScore = 0;
    let correctCount = 0;
    quizQuestions.forEach(q => {
      const ans = userAnswers[q.id];
      if (q.type === 'mcq') {
        if (ans === q.correctAnswer) {
          calculatedScore += q.marks;
          correctCount++;
        }
      } else {
        if (ans && typeof ans === 'string' && (ans.toLowerCase().includes('exclusive') || ans.toLowerCase().includes('transitive'))) {
          calculatedScore += q.marks;
          correctCount++;
        }
      }
    });

    setScore(calculatedScore);
    setTestState('results');

    // Persist per-user quiz metrics to server
    recordQuizAttempt({
      quizId: 'quiz_standard',
      title: DEMO_QUIZ_SESSION.title || 'SGU Semester III Mock Test',
      subjectId: activeSubject?.id || 'cs201',
      subjectName: activeSubject?.name || 'Database Management Systems',
      score: calculatedScore,
      totalMarks: totalPossibleMarks,
      questionsCount: quizQuestions.length,
      correctCount,
      timeSpentSeconds: Math.max(0, (15 * 60) - timeLeftSeconds)
    });

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
  const totalPossibleMarks = quizQuestions.reduce((acc, q) => acc + q.marks, 0);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* 1. INTRO SCREEN */}
      {testState === 'intro' && (
        <div className="max-w-2xl mx-auto p-6 lg:p-8 rounded-3xl bg-white border border-[#E5E0D5] shadow-card text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-forest-500 text-white mx-auto flex items-center justify-center shadow-card">
            <CheckSquare className="w-8 h-8" />
          </div>

          <div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-forest-100 text-forest-800 border border-forest-200">
              SGU Semester III Mock Test
            </span>
            <h1 className="text-2xl font-black text-charcoal-900 mt-2">
              {DEMO_QUIZ_SESSION.title}
            </h1>
            <p className="text-xs text-charcoal-400 mt-1">
              {DEMO_QUIZ_SESSION.subject}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-academic-bg border border-[#E5E0D5] text-xs">
            <div>
              <span className="text-charcoal-400 block">Total Marks</span>
              <span className="font-black text-base text-charcoal-900">{totalPossibleMarks} Marks</span>
            </div>
            <div>
              <span className="text-charcoal-400 block">Duration</span>
              <span className="font-black text-base text-forest-700">{DEMO_QUIZ_SESSION.durationMinutes} Minutes</span>
            </div>
            <div>
              <span className="text-charcoal-400 block">Questions</span>
              <span className="font-black text-base text-forest-800">{quizQuestions.length} Items</span>
            </div>
          </div>

          <div className="text-left text-xs text-charcoal-700 space-y-2 p-4 rounded-2xl bg-academic-bg border border-[#E5E0D5]">
            <p className="font-bold text-charcoal-900 mb-1">Assessment Guidelines:</p>
            <p>• Blended question formats (MCQs and short conceptual answers).</p>
            <p>• You may flag questions for review and jump between items freely.</p>
            <p>• Incorrect topics will automatically trigger personalized revision planner recommendations.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={startTest}
              className="flex-1 w-full py-3.5 rounded-2xl bg-forest-500 hover:bg-forest-600 text-white font-bold text-sm shadow-card transition-all"
            >
              Start Standard Test
            </button>

            <button
              onClick={handleGenerateAiQuiz}
              disabled={isGeneratingAiQuiz}
              className="flex-1 w-full py-3.5 rounded-2xl bg-forest-50 hover:bg-forest-100 text-forest-800 border border-forest-200 font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-forest-600" />
              <span>{isGeneratingAiQuiz ? "Synthesizing Quiz..." : "Generate AI Quiz from Materials"}</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. ACTIVE TEST RUNNER */}
      {testState === 'active' && currentQ && (
        <div className="space-y-5 max-w-4xl mx-auto">
          
          {/* Header Bar: Progress & Live Timer */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5E0D5] flex items-center justify-between gap-4 shadow-subtle">
            <div>
              <span className="text-xs text-charcoal-400">
                Question {currentQuestionIndex + 1} of {quizQuestions.length}
              </span>
              <h2 className="text-sm font-bold text-charcoal-900 truncate max-w-xs sm:max-w-md">
                Topic: {currentQ.topic}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold ${
                timeLeftSeconds < 180 ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse' : 'bg-academic-bg text-forest-800 border border-[#E5E0D5]'
              }`}>
                <Timer className="w-4 h-4" />
                <span>{formatTimer(timeLeftSeconds)}</span>
              </div>

              <button
                onClick={() => setShowSubmitConfirm(true)}
                className="px-4 py-2 rounded-xl bg-forest-500 hover:bg-forest-600 text-white font-bold text-xs shadow-card transition-all"
              >
                Submit Test
              </button>
            </div>
          </div>

          {/* Question Navigator Palette */}
          <div className="p-3 rounded-2xl bg-white border border-[#E5E0D5] flex items-center gap-2 overflow-x-auto pb-2 shadow-subtle">
            <span className="text-[11px] font-bold text-charcoal-400 mr-2 flex-shrink-0">Jump To:</span>
            {quizQuestions.map((q, idx) => {
              const isAnswered = userAnswers[q.id] !== undefined;
              const isMarked = markedForReview.includes(q.id);
              const isCurrent = idx === currentQuestionIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center flex-shrink-0 relative ${
                    isCurrent 
                      ? 'ring-2 ring-forest-500 bg-forest-500 text-white' 
                      : isMarked 
                        ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                        : isAnswered 
                          ? 'bg-sage-200 text-forest-800 border border-forest-300' 
                          : 'bg-academic-bg text-charcoal-700 border border-[#E5E0D5] hover:border-forest-300'
                  }`}
                >
                  {idx + 1}
                  {isMarked && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Main Question Card */}
          <div className="p-6 lg:p-8 rounded-3xl bg-white border border-[#E5E0D5] shadow-card space-y-6">
            
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sage-200 text-forest-800">
                  {currentQ.marks} Marks
                </span>
                <span className="text-xs text-charcoal-400 ml-2 font-medium">
                  {currentQ.type.toUpperCase()}
                </span>
              </div>

              <button
                onClick={() => toggleMarkForReview(currentQ.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                  markedForReview.includes(currentQ.id)
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'text-charcoal-700 bg-academic-bg border border-[#E5E0D5]'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{markedForReview.includes(currentQ.id) ? "Marked for Review" : "Mark for Review"}</span>
              </button>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-charcoal-900 leading-relaxed">
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
                      className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'bg-sage-100 border-forest-500 text-charcoal-900 shadow-subtle' 
                          : 'bg-academic-bg border-[#E5E0D5] hover:border-forest-300 text-charcoal-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                          isSelected ? 'bg-forest-500 text-white' : 'bg-white text-charcoal-400 border border-[#E5E0D5]'
                        }`}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{option}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-forest-600" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-charcoal-700 block">
                  Write your concise academic answer:
                </label>
                <textarea
                  rows={4}
                  value={(userAnswers[currentQ.id] as string) || ''}
                  onChange={(e) => handleShortAnswerChange(currentQ.id, e.target.value)}
                  placeholder="Type your explanation or definition here..."
                  className="w-full p-3.5 rounded-2xl bg-academic-bg border border-[#E5E0D5] text-charcoal-900 text-xs sm:text-sm focus:border-forest-500 focus:outline-none"
                />
              </div>
            )}

            {/* Bottom Question Navigation Buttons */}
            <div className="pt-4 border-t border-[#E5E0D5] flex items-center justify-between">
              <button
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-charcoal-700 bg-academic-bg disabled:opacity-40 border border-[#E5E0D5]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {currentQuestionIndex < quizQuestions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-forest-500 hover:bg-forest-600 text-white text-xs font-bold shadow-card"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitConfirm(true)}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-forest-500 hover:bg-forest-600 text-white text-xs font-bold shadow-card"
                >
                  <span>Review & Submit</span>
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>

          {/* Submit Confirmation Modal */}
          {showSubmitConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
              <div className="w-full max-w-md bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-elevated space-y-4">
                <h3 className="text-lg font-bold text-charcoal-900">
                  Confirm Assessment Submission
                </h3>
                <div className="p-3.5 rounded-2xl bg-academic-bg border border-[#E5E0D5] text-xs space-y-2">
                  <div className="flex justify-between text-charcoal-700">
                    <span>Questions Answered:</span>
                    <strong className="text-charcoal-900">{answeredCount} of {quizQuestions.length}</strong>
                  </div>
                  <div className="flex justify-between text-charcoal-700">
                    <span>Marked for Review:</span>
                    <strong className="text-amber-800">{markedForReview.length} Questions</strong>
                  </div>
                  <div className="flex justify-between text-charcoal-700">
                    <span>Time Remaining:</span>
                    <strong className="text-forest-700 font-mono">{formatTimer(timeLeftSeconds)}</strong>
                  </div>
                </div>
                <p className="text-xs text-charcoal-400">
                  Are you ready to submit? Your answers will be graded and weaknesses added to your Revision Planner.
                </p>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowSubmitConfirm(false)}
                    className="px-4 py-2 rounded-xl bg-academic-bg text-charcoal-700 text-xs font-bold"
                  >
                    Resume Test
                  </button>
                  <button
                    onClick={handleSubmitTest}
                    className="px-5 py-2 rounded-xl bg-forest-500 hover:bg-forest-600 text-white text-xs font-bold shadow-card"
                  >
                    Confirm Submit
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 3. TEST RESULTS & SOLUTIONS */}
      {testState === 'results' && (
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Results Summary Hero Card */}
          <div className="p-6 lg:p-8 rounded-3xl bg-white border border-[#E5E0D5] text-center space-y-4 shadow-elevated">
            <div className="w-16 h-16 rounded-2xl bg-forest-500 text-white mx-auto flex items-center justify-center shadow-card">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-forest-100 text-forest-800 border border-forest-200">
                Test Completed
              </span>
              <h2 className="text-2xl font-black text-charcoal-900 mt-2">
                Assessment Results
              </h2>
              <p className="text-xs text-charcoal-400">
                {DEMO_QUIZ_SESSION.title} • {DEMO_QUIZ_SESSION.subject}
              </p>
            </div>

            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-black text-charcoal-900">{score}</span>
              <span className="text-xl font-bold text-charcoal-400">/ {totalPossibleMarks} Marks</span>
              <span className="ml-3 px-2.5 py-1 rounded-lg text-xs font-bold bg-forest-100 text-forest-800 border border-forest-200">
                {Math.round((score / totalPossibleMarks) * 100)}% Score
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={startTest}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-academic-bg hover:bg-sage-100 text-charcoal-700 text-xs font-bold border border-[#E5E0D5]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Quiz</span>
              </button>
              <button
                onClick={() => setActiveView('evaluator')}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-forest-500 hover:bg-forest-600 text-white text-xs font-bold shadow-card"
              >
                <span>Practise Long Answers in Evaluator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Question by Question Detailed Solutions */}
          <div className="space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-charcoal-400 px-1">
              Detailed Question Solutions & Feedback
            </h3>

            {quizQuestions.map((q, idx) => {
              const userAns = userAnswers[q.id];
              const isCorrect = q.type === 'mcq' ? userAns === q.correctAnswer : true;

              return (
                <div
                  key={q.id}
                  className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E5E0D5] space-y-3 text-xs shadow-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-charcoal-400">Q{idx + 1}.</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-academic-bg text-charcoal-700 border border-[#E5E0D5]">
                        {q.marks} Marks
                      </span>
                      <span className="text-charcoal-400 font-medium">{q.topic}</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isCorrect ? 'bg-forest-100 text-forest-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {isCorrect ? "Correct" : "Needs Review"}
                    </span>
                  </div>

                  <p className="font-bold text-charcoal-900 sm:text-sm">
                    {q.question}
                  </p>

                  <div className="p-3.5 rounded-2xl bg-academic-bg border border-[#E5E0D5] space-y-1.5">
                    <p className="text-forest-700 font-bold">
                      Explanation:
                    </p>
                    <p className="text-charcoal-700 leading-relaxed">
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
                      className="flex items-center gap-1.5 text-xs font-bold text-amber-800 pt-1"
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
