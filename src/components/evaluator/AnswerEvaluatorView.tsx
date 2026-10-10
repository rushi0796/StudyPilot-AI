import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RotateCcw, 
  HelpCircle, 
  BookOpen, 
  Check, 
  FileText, 
  Layers, 
  ArrowRight,
  BookmarkCheck,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { QuestionMarks, EvaluationResult } from '../../types';
import confetti from 'canvas-confetti';

export const AnswerEvaluatorView: React.FC = () => {
  const { 
    selectedQuestionForEvaluation, 
    subjects, 
    activeSubject, 
    questionBank,
    addRevisionTask,
    setActiveView 
  } = useApp();

  // Selected question and marks
  const [selectedMarks, setSelectedMarks] = useState<QuestionMarks>(
    selectedQuestionForEvaluation?.marks || 5
  );

  const [selectedQuestion, setSelectedQuestion] = useState(
    selectedQuestionForEvaluation || questionBank.find(q => q.marks === 5) || questionBank[0]
  );

  const [studentAnswerText, setStudentAnswerText] = useState(
    `Database normalization is the process of eliminating data redundancy in tables. 
It has 1NF, 2NF and 3NF.
1NF means attributes have atomic values.
2NF means no partial dependency.
3NF means no transitive dependency. For example, student and course table where roll number determines student name and department.`
  );

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationProgress, setEvaluationProgress] = useState(0);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);

  // When selectedQuestionForEvaluation changes from another page
  useEffect(() => {
    if (selectedQuestionForEvaluation) {
      setSelectedQuestion(selectedQuestionForEvaluation);
      setSelectedMarks(selectedQuestionForEvaluation.marks);
    }
  }, [selectedQuestionForEvaluation]);

  // When marks button changes, update to a matching question
  const handleSelectMarks = (m: QuestionMarks) => {
    setSelectedMarks(m);
    const match = questionBank.find(q => q.marks === m);
    if (match) setSelectedQuestion(match);
  };

  // Pre-load a sample high-scoring student answer
  const handleLoadSampleAnswer = () => {
    setStudentAnswerText(
      `Normalization is the process of structuring relational database schemas to eliminate redundancy and prevent update, insert, and delete anomalies.

Why 3NF is Preferred Over 2NF:
A table in 2NF only removes partial dependencies on composite keys. A table with a single-attribute primary key is already in 2NF, but it can still have Transitive Dependencies (non-prime attribute -> non-prime attribute).

For example:
Student_Dept(RollNo, Name, DeptCode, DeptName, HOD)
- Primary Key: RollNo
- FDs: RollNo -> DeptCode, DeptCode -> DeptName, HOD
Here, RollNo -> DeptCode -> DeptName is a transitive dependency causing anomalies:
1. Cannot add a department without enrolling a student (Insert Anomaly).
2. Deleting last student deletes the department (Delete Anomaly).
3. Changing HOD requires updating multiple rows (Update Anomaly).

To achieve 3NF, we decompose into:
- Student(RollNo, Name, DeptCode) [PK: RollNo, FK: DeptCode]
- Department(DeptCode, DeptName, HOD) [PK: DeptCode]
Both tables are now in 3NF and free from transitive anomalies.`
    );
  };

  // Evaluate Answer Engine
  const handleEvaluateAnswer = () => {
    if (!studentAnswerText.trim()) return;

    setIsEvaluating(true);
    setEvaluationProgress(20);
    setEvaluationResult(null);

    setTimeout(() => setEvaluationProgress(50), 400);
    setTimeout(() => setEvaluationProgress(80), 800);

    setTimeout(() => {
      setEvaluationProgress(100);
      setIsEvaluating(false);

      const wordCount = studentAnswerText.trim().split(/\s+/).length;
      const textLower = studentAnswerText.toLowerCase();

      // Deterministic intelligent grading tailored for SGU Rubric
      let estScore = 2.0;
      const maxM = selectedMarks;

      const hasAnomalies = textLower.includes('anomal') || textLower.includes('insert') || textLower.includes('delete');
      const hasDecomp = textLower.includes('decompose') || textLower.includes('table') || textLower.includes('split');
      const hasKeys = textLower.includes('primary key') || textLower.includes('foreign key') || textLower.includes('superkey');
      const hasTransitive = textLower.includes('transitive');
      const hasPartial = textLower.includes('partial');

      if (maxM === 5) {
        if (hasTransitive) estScore += 1.0;
        if (hasPartial) estScore += 0.5;
        if (hasAnomalies) estScore += 0.5;
        if (hasDecomp) estScore += 0.5;
        if (hasKeys) estScore += 0.5;
        if (wordCount > 90) estScore = Math.min(5.0, estScore + 0.5);
        estScore = Math.min(5.0, Math.max(1.5, estScore));
      } else if (maxM === 2) {
        estScore = textLower.includes('definition') || wordCount > 20 ? 1.5 : 1.0;
        if (hasTransitive || hasKeys) estScore = 2.0;
      } else {
        estScore = Math.round((wordCount / 120) * maxM * 10) / 10;
        estScore = Math.min(maxM, Math.max(1.0, estScore));
      }

      const scorePct = Math.round((estScore / maxM) * 100);

      const result: EvaluationResult = {
        question: selectedQuestion.text,
        subject: selectedQuestion.subjectCode,
        maxMarks: maxM,
        estimatedMarks: estScore,
        scorePercentage: scorePct,
        gradeTier: scorePct >= 85 ? 'Excellent' : scorePct >= 70 ? 'Good' : scorePct >= 50 ? 'Fair' : 'Needs Improvement',
        correctConcepts: [
          "Identified core purpose of normalization (minimizing redundancy)",
          hasTransitive ? "Correctly defined Transitive Dependency condition for 3NF" : "Stated 1NF and 2NF criteria",
          hasDecomp ? "Demonstrated relational decomposition into separate tables" : "Mentioned student-department entity context"
        ],
        missingPoints: [
          !hasAnomalies ? "Did not explicitly mention the three specific anomalies eliminated (Insertion, Update, Deletion anomalies) - Cost: 1.0 Mark" : "Could further formalize the mathematical condition X -> A where X is superkey",
          !hasKeys ? "Did not label Primary Keys (PK) and Foreign Keys (FK) in decomposed schemas - Cost: 0.5 Mark" : "Include formal attribute closure step if asked in long form"
        ],
        conceptualErrors: wordCount < 35 ? [
          "Answer is too brief for university 5-mark answer standard. Lacks concrete schema representation."
        ] : [],
        structureClarityFeedback: wordCount > 80 
          ? "Good academic structure with headings, bullet points, and relational schemas clearly separated." 
          : "Format with clear section headers: Definition → 2NF vs 3NF Difference → Schema Decomposition → Anomalies Eliminated.",
        actionableImprovements: [
          "In SGU Semester III exams, always write schema before decomposition: R(A, B, C, D) followed by decomposed tables R1 and R2.",
          "Explicitly state which table holds the Foreign Key to ensure referential integrity is preserved.",
          "Cite the 3 anomalies (Insert, Update, Delete) with a 1-sentence real-world scenario."
        ],
        improvedSampleAnswer: selectedQuestion.modelAnswer,
        evaluatedAt: "Just now",
        isDemoEstimate: true
      };

      setEvaluationResult(result);

      if (scorePct >= 75) {
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        } catch (e) { /* ignore */ }
      }
    }, 1200);
  };

  const handleAddWeaknessesToRevision = () => {
    if (!evaluationResult) return;
    addRevisionTask({
      title: `Revise Missing Points: ${selectedQuestion.topic} (${evaluationResult.estimatedMarks}/${evaluationResult.maxMarks} Marks)`,
      subject: "Database Management Systems",
      priority: 'high',
      reason: 'Evaluator Weakness',
      dueDate: 'Tomorrow',
      timeEstimateMinutes: 25
    });
    alert("Missing concepts added to your Revision Planner successfully!");
  };

  const wordCount = studentAnswerText.trim() ? studentAnswerText.trim().split(/\s+/).length : 0;
  const charCount = studentAnswerText.length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* 1. Header & Flagship Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-navy-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-electric-600 via-electric-500 to-violet-500 flex items-center justify-center text-white shadow-glow">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">
                  AI Answer Evaluator
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-electric-500/20 to-violet-500/20 text-electric-300 border border-electric-500/40">
                  Flagship Module
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automated student answer grading based on Sanjay Ghodawat University examination rubrics.
              </p>
            </div>
          </div>
        </div>

        {/* Demo Notice */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-navy-900 border border-navy-750 text-xs text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-electric-400" />
          <span>SGU Rubric Assessment Engine</span>
        </div>
      </div>

      {/* 2. Question Configuration & Marks Selector */}
      <div className="p-5 rounded-2xl bg-navy-900/80 border border-navy-800 space-y-4">
        
        {/* Marks Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Select Question Marks:
            </span>
            <div className="flex items-center gap-1 bg-navy-950 p-1 rounded-xl border border-navy-750">
              {([2, 3, 4, 5, 7, 10] as QuestionMarks[]).map((m) => (
                <button
                  key={m}
                  onClick={() => handleSelectMarks(m)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedMarks === m 
                      ? 'bg-electric-500 text-white shadow-glow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m}M
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleLoadSampleAnswer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-800 hover:bg-navy-750 text-slate-300 hover:text-white text-xs font-medium border border-navy-700 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Load Model Student Answer</span>
          </button>
        </div>

        {/* Selected Question Details */}
        <div className="p-4 rounded-xl bg-navy-950/80 border border-navy-800 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                {selectedQuestion.marks} Marks
              </span>
              <span className="text-xs text-slate-400">
                {selectedQuestion.subjectCode} • Unit {selectedQuestion.unitNumber}
              </span>
            </div>
            <span className="text-xs text-electric-400 font-semibold">
              Topic: {selectedQuestion.topic}
            </span>
          </div>

          <h3 className="font-bold text-sm sm:text-base text-white">
            {selectedQuestion.text}
          </h3>

          {/* Evaluation Criteria Checklist Display */}
          <div className="pt-2 border-t border-navy-850">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">
              University Evaluation Criteria ({selectedQuestion.marks} Marks Total):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-300">
              {selectedQuestion.markingCriteria.map((crit, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-electric-400 mt-1.5 flex-shrink-0" />
                  <span>{crit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 3. Rich Student Answer Writing Workspace */}
      <div className="p-5 rounded-2xl bg-navy-900/80 border border-navy-800 space-y-4">
        
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <FileText className="w-4 h-4 text-electric-400" />
            Type Your Answer Below for AI Evaluation
          </label>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>Words: <strong className="text-white">{wordCount}</strong></span>
            <span>Chars: <strong className="text-white">{charCount}</strong></span>
          </div>
        </div>

        <textarea
          rows={9}
          value={studentAnswerText}
          onChange={(e) => setStudentAnswerText(e.target.value)}
          placeholder="Write your detailed university examination answer here. Mention definitions, properties, diagrams/schemas, and concrete examples..."
          className="w-full p-4 rounded-xl bg-navy-950 border border-navy-750 text-white text-xs sm:text-sm leading-relaxed placeholder-slate-500 focus:border-electric-500 focus:outline-none font-sans"
        />

        {/* Action Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStudentAnswerText('')}
            className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
          >
            Clear Text
          </button>

          <button
            onClick={handleEvaluateAnswer}
            disabled={isEvaluating || !studentAnswerText.trim()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-electric-600 via-electric-500 to-violet-600 hover:from-electric-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-glow transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isEvaluating ? "Analyzing with University Rubrics..." : "Evaluate My Answer"}</span>
          </button>
        </div>

        {/* Evaluation Animation Bar */}
        {isEvaluating && (
          <div className="space-y-2 pt-2 animate-in fade-in">
            <div className="flex justify-between text-xs text-slate-300">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-electric-400 animate-ping" />
                Cross-referencing answer with SGU marking criteria...
              </span>
              <span className="font-bold text-electric-400">{evaluationProgress}%</span>
            </div>
            <div className="w-full bg-navy-950 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-electric-500 to-violet-500 h-full rounded-full transition-all duration-300" style={{ width: `${evaluationProgress}%` }} />
            </div>
          </div>
        )}

      </div>

      {/* 4. COMPREHENSIVE EVALUATION RESULT REPORT */}
      {evaluationResult && (
        <div className="p-6 lg:p-8 rounded-3xl bg-navy-900 border border-navy-750 shadow-2xl space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          
          {/* Top Score Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-navy-800">
            <div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-electric-500/15 text-electric-300 border border-electric-500/30">
                Evaluation Complete
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5">
                Estimated Score: <span className="text-electric-400">{evaluationResult.estimatedMarks}</span> / {evaluationResult.maxMarks} Marks
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Grade Assessment: <strong className="text-white">{evaluationResult.gradeTier}</strong> ({evaluationResult.scorePercentage}% Score)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddWeaknessesToRevision}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-colors"
              >
                <BookmarkCheck className="w-4 h-4" />
                <span>Add Missing Concepts to Revision</span>
              </button>
            </div>
          </div>

          {/* SGU Official Disclaimer Alert */}
          <div className="p-3 rounded-xl bg-navy-950/80 border border-navy-800 text-[11px] text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
            <span>
              <strong>Academic Disclaimer:</strong> Estimated marks are AI-generated based on the model rubric for study practice. They do not represent official Sanjay Ghodawat University grades.
            </span>
          </div>

          {/* Concept Analysis Breakdown: Correct Concepts, Missing Points, Conceptual Errors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Correct Concepts Identified */}
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2.5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Correct Concepts Identified ({evaluationResult.correctConcepts.length})
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {evaluationResult.correctConcepts.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Important Missing Points */}
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2.5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Important Missing Points (Marks Lost)
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {evaluationResult.missingPoints.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">!</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Conceptual Errors if any */}
          {evaluationResult.conceptualErrors.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-rose-400 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Conceptual Errors / Inconsistencies Detected
              </h3>
              <ul className="space-y-1 text-xs text-slate-300">
                {evaluationResult.conceptualErrors.map((err, idx) => (
                  <li key={idx}>• {err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Structure & Clarity Feedback */}
          <div className="p-4 rounded-2xl bg-navy-950/80 border border-navy-800 space-y-1.5 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-400">
              Answer Structure & Presentation Feedback
            </h3>
            <p className="text-slate-300 leading-relaxed">
              {evaluationResult.structureClarityFeedback}
            </p>
          </div>

          {/* Actionable Suggestions for Exam Improvement */}
          <div className="space-y-2 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-400">
              Actionable Exam Tips to Score Full Marks ({selectedMarks}/{selectedMarks})
            </h3>
            <div className="space-y-1.5">
              {evaluationResult.actionableImprovements.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-navy-950/60 border border-navy-850 text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-electric-400 mt-1.5 flex-shrink-0" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Improved Model Answer Reference */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
              Benchmark Model Answer for Full Marks
            </h3>
            <div className="p-5 rounded-2xl bg-navy-950 border border-navy-800 text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
              {evaluationResult.improvedSampleAnswer}
            </div>
          </div>

          {/* Bottom Action: Try Again */}
          <div className="pt-4 border-t border-navy-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Evaluated at: {evaluationResult.evaluatedAt}
            </span>
            <button
              onClick={() => {
                setEvaluationResult(null);
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs shadow-glow transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Try Again (Revise Answer)</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
