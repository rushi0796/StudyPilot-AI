import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RotateCcw, 
  FileText, 
  ArrowRight,
  BookmarkCheck,
  Cpu,
  FolderOpen
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { QuestionMarks, EvaluationResult } from '../../types';
import { evaluateAnswerWithGemini, isLiveAiAvailable } from '../../services/aiProvider';
import { retrieveRelevantChunks } from '../../services/ragEngine';
import confetti from 'canvas-confetti';

export const AnswerEvaluatorView: React.FC = () => {
  const { 
    selectedQuestionForEvaluation, 
    questionBank,
    addRevisionTask,
    uploadedDocuments,
    activeDocumentId,
    recordAnswerEvaluation
  } = useApp();

  const [selectedMarks, setSelectedMarks] = useState<QuestionMarks>(
    selectedQuestionForEvaluation?.marks || 5
  );

  const [selectedQuestion, setSelectedQuestion] = useState(
    selectedQuestionForEvaluation || questionBank.find(q => q.marks === 5) || questionBank[0]
  );

  const [studentAnswerText, setStudentAnswerText] = useState(
    `Database normalization is the process of structuring relational database schemas to eliminate redundancy.
It decomposes tables into normal forms: 1NF, 2NF, and 3NF.
1NF requires atomic values without repeating groups.
2NF removes partial functional dependencies on composite candidate keys.
3NF eliminates transitive dependencies (X -> Y -> Z where Z is a non-prime attribute).
For example, in a student-course relation, we decompose into Student(RollNo, Name, DeptCode) and Department(DeptCode, DeptName, HOD) to prevent insertion and update anomalies.`
  );

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationProgress, setEvaluationProgress] = useState(0);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [useDocContext, setUseDocContext] = useState(true);

  const isLive = isLiveAiAvailable();
  const activeDoc = uploadedDocuments.find(d => d.id === activeDocumentId) || uploadedDocuments[0];

  useEffect(() => {
    if (selectedQuestionForEvaluation) {
      setSelectedQuestion(selectedQuestionForEvaluation);
      setSelectedMarks(selectedQuestionForEvaluation.marks);
    }
  }, [selectedQuestionForEvaluation]);

  const handleSelectMarks = (m: QuestionMarks) => {
    setSelectedMarks(m);
    const match = questionBank.find(q => q.marks === m);
    if (match) setSelectedQuestion(match);
  };

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

  const handleEvaluateAnswer = async () => {
    if (!studentAnswerText.trim()) return;

    setIsEvaluating(true);
    setEvaluationProgress(20);
    setEvaluationResult(null);

    const timer = setInterval(() => {
      setEvaluationProgress(prev => Math.min(prev + 25, 90));
    }, 250);

    try {
      let chunks = undefined;
      if (useDocContext && uploadedDocuments.length > 0) {
        const candidateChunks = activeDoc?.chunks || uploadedDocuments.flatMap(d => d.chunks || []);
        const query = `${selectedQuestion.text} ${selectedQuestion.topic}`;
        const retrieved = retrieveRelevantChunks(query, candidateChunks, 4);
        chunks = retrieved.length > 0 ? retrieved.map(r => r.chunk) : candidateChunks.slice(0, 4);
      }
      const result = await evaluateAnswerWithGemini({
        question: selectedQuestion.text,
        studentAnswer: studentAnswerText,
        maxMarks: selectedMarks,
        markingCriteria: selectedQuestion.markingCriteria,
        documentChunks: chunks
      });

      clearInterval(timer);
      setEvaluationProgress(100);

      setTimeout(() => {
        setIsEvaluating(false);
        setEvaluationResult(result);

        // Record personalized answer evaluation metrics to server
        recordAnswerEvaluation({
          question: selectedQuestion.text,
          subject: selectedQuestion.subjectCode || 'Database Management Systems',
          maxMarks: selectedMarks,
          estimatedMarks: result.estimatedMarks,
          scorePercentage: result.scorePercentage,
          gradeTier: result.gradeTier
        });

        if (result.scorePercentage >= 75) {
          try {
            confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
          } catch (e) { /* ignore */ }
        }
      }, 400);
    } catch (err) {
      clearInterval(timer);
      setIsEvaluating(false);
    }
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E0D5]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-forest-500 text-white flex items-center justify-center shadow-card">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-charcoal-900 tracking-tight">
                  AI Answer Evaluator
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gold-100 text-gold-600 border border-gold-300">
                  Flagship Module
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isLive ? 'bg-forest-100 text-forest-800 border border-forest-300' : 'bg-sage-100 text-charcoal-700'
                }`}>
                  {isLive ? 'Google Gemini Engine' : 'SGU Rubric Engine'}
                </span>
              </div>
              <p className="text-xs text-charcoal-400 mt-0.5">
                Automated student exam answer scoring, partial-credit breakdown, and missing concept detection.
              </p>
            </div>
          </div>
        </div>

        {/* Grounding Status Pill */}
        {activeDoc && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#E5E0D5] text-xs text-charcoal-700 shadow-subtle">
            <FolderOpen className="w-3.5 h-3.5 text-forest-600" />
            <span>Rubric Reference: <strong className="text-forest-700">{activeDoc.name.slice(0, 24)}...</strong></span>
          </div>
        )}
      </div>

      {/* 2. Question Configuration & Marks Selector */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5E0D5] shadow-card space-y-4">
        
        {/* Marks Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-400">
              Select Question Marks:
            </span>
            <div className="flex items-center gap-1 bg-academic-bg p-1 rounded-xl border border-[#E5E0D5]">
              {([2, 3, 4, 5, 7, 10] as QuestionMarks[]).map((m) => (
                <button
                  key={m}
                  onClick={() => handleSelectMarks(m)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedMarks === m 
                      ? 'bg-forest-500 text-white shadow-subtle' 
                      : 'text-charcoal-400 hover:text-charcoal-900'
                  }`}
                >
                  {m}M
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleLoadSampleAnswer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-academic-bg hover:bg-sage-100 text-charcoal-700 text-xs font-bold border border-[#E5E0D5] transition-colors shadow-subtle"
          >
            <Sparkles className="w-3.5 h-3.5 text-gold-500" />
            <span>Load Model Student Answer</span>
          </button>
        </div>

        {/* Selected Question Details */}
        <div className="p-5 rounded-2xl bg-academic-bg border border-[#E5E0D5] space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sage-200 text-forest-800">
                {selectedQuestion.marks} Marks
              </span>
              <span className="text-xs text-charcoal-400">
                {selectedQuestion.subjectCode} • Unit {selectedQuestion.unitNumber}
              </span>
            </div>
            <span className="text-xs text-forest-700 font-bold">
              Topic: {selectedQuestion.topic}
            </span>
          </div>

          <h3 className="font-bold text-sm sm:text-base text-charcoal-900">
            {selectedQuestion.text}
          </h3>

          {/* Evaluation Criteria Checklist Display */}
          <div className="pt-2 border-t border-[#E5E0D5]">
            <span className="text-[11px] font-bold text-charcoal-400 block mb-1">
              University Evaluation Criteria ({selectedQuestion.marks} Marks Total):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-charcoal-700">
              {selectedQuestion.markingCriteria.map((crit, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-forest-500 mt-1.5 flex-shrink-0" />
                  <span>{crit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 3. Student Answer Writing Workspace */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5E0D5] shadow-card space-y-4">
        
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-charcoal-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-forest-600" />
            Type Your Answer Below for AI Evaluation
          </label>
          <div className="flex items-center gap-3 text-xs text-charcoal-400">
            <span>Words: <strong className="text-charcoal-900">{wordCount}</strong></span>
            <span>Chars: <strong className="text-charcoal-900">{charCount}</strong></span>
          </div>
        </div>

        <textarea
          rows={9}
          value={studentAnswerText}
          onChange={(e) => setStudentAnswerText(e.target.value)}
          placeholder="Write your detailed university examination answer here. Mention definitions, properties, diagrams/schemas, and concrete examples..."
          className="w-full p-4 rounded-2xl bg-academic-bg border border-[#E5E0D5] text-charcoal-900 text-xs sm:text-sm leading-relaxed placeholder-charcoal-400 focus:border-forest-500 focus:outline-none font-sans"
        />

        {/* Action Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStudentAnswerText('')}
            className="text-xs text-charcoal-400 hover:text-rose-600 transition-colors"
          >
            Clear Text
          </button>

          <button
            onClick={handleEvaluateAnswer}
            disabled={isEvaluating || !studentAnswerText.trim()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-forest-500 hover:bg-forest-600 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-card transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isEvaluating ? "Analyzing with University Rubrics..." : "Evaluate My Answer"}</span>
          </button>
        </div>

        {/* Evaluation Animation Bar */}
        {isEvaluating && (
          <div className="space-y-2 pt-2 animate-in fade-in">
            <div className="flex justify-between text-xs text-charcoal-700">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-forest-500 animate-ping" />
                Cross-referencing answer against university rubric & model answers...
              </span>
              <span className="font-bold text-forest-600">{evaluationProgress}%</span>
            </div>
            <div className="w-full bg-sage-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-forest-500 h-full rounded-full transition-all duration-300" 
                style={{ width: `${evaluationProgress}%` }} 
              />
            </div>
          </div>
        )}

      </div>

      {/* 4. COMPREHENSIVE EVALUATION RESULT REPORT */}
      {evaluationResult && (
        <div className="p-6 lg:p-8 rounded-3xl bg-white border border-[#E5E0D5] shadow-elevated space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          
          {/* Top Score Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E0D5]">
            <div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-forest-100 text-forest-800 border border-forest-200">
                Evaluation Complete
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-charcoal-900 mt-2">
                Estimated Score: <span className="text-forest-600">{evaluationResult.estimatedMarks}</span> / {evaluationResult.maxMarks} Marks
              </h2>
              <p className="text-xs text-charcoal-400 mt-0.5">
                Grade Assessment: <strong className="text-charcoal-900">{evaluationResult.gradeTier}</strong> ({evaluationResult.scorePercentage}% Score)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddWeaknessesToRevision}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-colors shadow-subtle"
              >
                <BookmarkCheck className="w-4 h-4" />
                <span>Add Missing Concepts to Revision</span>
              </button>
            </div>
          </div>

          {/* SGU Official Disclaimer Alert */}
          <div className="p-3.5 rounded-xl bg-academic-bg border border-[#E5E0D5] text-[11px] text-charcoal-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
            <span>
              <strong>Academic Disclaimer:</strong> Estimated marks are AI-generated based on the model rubric for study practice. They do not represent official Sanjay Ghodawat University grades.
            </span>
          </div>

          {/* Concept Analysis Breakdown: Correct Concepts, Missing Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Correct Concepts Identified */}
            <div className="p-4 rounded-2xl bg-forest-50/60 border border-forest-200 space-y-2.5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-forest-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-forest-600" />
                Correct Concepts Identified ({evaluationResult.correctConcepts.length})
              </h3>
              <ul className="space-y-1.5 text-xs text-charcoal-700">
                {evaluationResult.correctConcepts.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-forest-600 font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Important Missing Points */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2.5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Important Missing Points (Marks Lost)
              </h3>
              <ul className="space-y-1.5 text-xs text-charcoal-700">
                {evaluationResult.missingPoints.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">!</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Conceptual Errors if any */}
          {evaluationResult.conceptualErrors.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-rose-800 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-600" />
                Conceptual Errors / Inconsistencies Detected
              </h3>
              <ul className="space-y-1 text-xs text-rose-800">
                {evaluationResult.conceptualErrors.map((err, idx) => (
                  <li key={idx}>• {err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Structure & Clarity Feedback */}
          <div className="p-4 rounded-2xl bg-academic-bg border border-[#E5E0D5] space-y-1.5 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-charcoal-400">
              Answer Structure & Presentation Feedback
            </h3>
            <p className="text-charcoal-700 leading-relaxed">
              {evaluationResult.structureClarityFeedback}
            </p>
          </div>

          {/* Actionable Suggestions for Exam Improvement */}
          <div className="space-y-2 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-charcoal-400">
              Actionable Exam Tips to Score Full Marks ({selectedMarks}/{selectedMarks})
            </h3>
            <div className="space-y-1.5">
              {evaluationResult.actionableImprovements.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 rounded-xl bg-academic-bg border border-[#E5E0D5] text-charcoal-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-forest-500 mt-1.5 flex-shrink-0" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Improved Model Answer Reference */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-charcoal-400 mb-2">
              Benchmark Model Answer for Full Marks
            </h3>
            <div className="p-5 rounded-2xl bg-academic-bg border border-[#E5E0D5] text-charcoal-900 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
              {evaluationResult.improvedSampleAnswer}
            </div>
          </div>

          {/* Bottom Action: Try Again */}
          <div className="pt-4 border-t border-[#E5E0D5] flex items-center justify-between">
            <span className="text-xs text-charcoal-400">
              Evaluated at: {evaluationResult.evaluatedAt}
            </span>
            <button
              onClick={() => {
                setEvaluationResult(null);
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-forest-500 hover:bg-forest-600 text-white font-bold text-xs shadow-card transition-all"
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
