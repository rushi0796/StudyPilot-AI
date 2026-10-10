import React, { useState } from 'react';
import { 
  Compass, 
  Upload, 
  CheckCircle2, 
  Clock, 
  Circle, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  FileText, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TopicStatus } from '../../types';

export const SyllabusExplorerView: React.FC = () => {
  const { 
    subjects, 
    activeSubject, 
    setActiveSubjectId, 
    updateTopicStatus,
    setActiveView,
    setSelectedQuestionForEvaluation,
    questionBank
  } = useApp();

  const [expandedUnitId, setExpandedUnitId] = useState<string>(activeSubject.units[2]?.id || activeSubject.units[0]?.id || '');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(activeSubject.units[2]?.topics[1]?.id || activeSubject.units[0]?.topics[0]?.id || '');

  // File upload state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const activeUnit = activeSubject.units.find(u => u.topics.some(t => t.id === selectedTopicId)) || activeSubject.units[0];
  const activeTopic = activeUnit?.topics.find(t => t.id === selectedTopicId) || activeUnit?.topics[0];

  const handleSimulateUpload = () => {
    setIsUploading(true);
    setUploadProgress(15);
    setTimeout(() => setUploadProgress(45), 400);
    setTimeout(() => setUploadProgress(85), 900);
    setTimeout(() => {
      setUploadProgress(100);
      setIsUploading(false);
      setUploadSuccess(true);
    }, 1400);
  };

  const getStatusBadge = (status: TopicStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case 'in-progress':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-navy-800 border border-navy-700 px-2 py-0.5 rounded-full">
            <Circle className="w-3 h-3" />
            Not Started
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* 1. Header & Subject Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-navy-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Compass className="w-6 h-6 text-electric-400" />
              Syllabus Explorer
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-navy-800 text-slate-300 border border-navy-700">
              Demo Content
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Browse units, inspect university examination weightage, mark progress, and link directly to questions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Subject Switcher */}
          <select
            value={activeSubject.id}
            onChange={(e) => setActiveSubjectId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-navy-900 border border-navy-700 text-slate-200 font-semibold text-xs focus:border-electric-500 focus:outline-none"
          >
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.code}: {s.name}</option>
            ))}
          </select>

          {/* Syllabus Upload Action */}
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-navy-800 hover:bg-navy-750 text-slate-200 hover:text-white border border-navy-700 text-xs font-semibold transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-electric-400" />
            <span>Upload Syllabus PDF</span>
          </button>
        </div>
      </div>

      {/* Demo Syllabus Notice Banner */}
      <div className="p-3.5 rounded-xl bg-navy-900/60 border border-navy-800 text-xs text-slate-400 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-electric-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-300">Curriculum Disclaimer: </span>
          The syllabus content below is structured for demonstration as a high-fidelity 2nd-Year AI curriculum reference and does not replace official Sanjay Ghodawat University course documents.
        </div>
      </div>

      {/* 2. Main Syllabus Explorer Layout: Units Accordion on Left, Detailed Topic Deep Dive on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Units & Topic Accordion (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Curriculum Units ({activeSubject.units.length})
          </h2>

          <div className="space-y-2.5">
            {activeSubject.units.map((unit) => {
              const isExpanded = expandedUnitId === unit.id;

              return (
                <div 
                  key={unit.id}
                  className="rounded-2xl bg-navy-900/80 border border-navy-800 overflow-hidden transition-all"
                >
                  {/* Unit Accordion Header */}
                  <button
                    onClick={() => setExpandedUnitId(isExpanded ? '' : unit.id)}
                    className="w-full p-4 flex items-start justify-between text-left hover:bg-navy-850/60 transition-colors"
                  >
                    <div className="pr-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-electric-500/20 text-electric-300">
                          Unit {unit.unitNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">{unit.weightage}</span>
                      </div>
                      <h3 className="font-bold text-xs sm:text-sm text-white">
                        {unit.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                        {unit.description}
                      </p>
                    </div>

                    <div className="p-1 rounded-lg text-slate-400 hover:text-white">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {/* Topics List within Unit */}
                  {isExpanded && (
                    <div className="p-2 pt-0 space-y-1.5 border-t border-navy-850 bg-navy-950/40">
                      {unit.topics.map((t) => {
                        const isSelected = selectedTopicId === t.id;

                        return (
                          <div
                            key={t.id}
                            onClick={() => setSelectedTopicId(t.id)}
                            className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2 ${
                              isSelected 
                                ? 'bg-electric-600/20 border border-electric-500/50 shadow-sm' 
                                : 'bg-navy-900/50 hover:bg-navy-800/60 border border-transparent'
                            }`}
                          >
                            <div className="pr-1 flex-1">
                              <h4 className={`text-xs font-semibold ${isSelected ? 'text-electric-200' : 'text-slate-300'}`}>
                                {t.title}
                              </h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Weightage: {t.weightageMarks} Marks
                              </p>
                            </div>

                            <div className="flex-shrink-0">
                              {getStatusBadge(t.status)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Topic Deep Dive & Study Bridge (7 cols) */}
        <div className="lg:col-span-7">
          {activeTopic ? (
            <div className="p-6 rounded-2xl bg-navy-900/80 border border-navy-800 space-y-6">
              
              {/* Topic Header */}
              <div className="pb-4 border-b border-navy-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-electric-500/20 text-electric-300">
                      Unit {activeUnit.unitNumber}
                    </span>
                    <span className="text-xs text-slate-400">{activeSubject.name}</span>
                  </div>
                  <h2 className="text-lg font-extrabold text-white">
                    {activeTopic.title}
                  </h2>
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex items-center gap-1 bg-navy-950 p-1 rounded-xl border border-navy-700">
                  {(['not-started', 'in-progress', 'completed'] as TopicStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => updateTopicStatus(activeSubject.id, activeUnit.id, activeTopic.id, st)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-all ${
                        activeTopic.status === st 
                          ? st === 'completed' ? 'bg-emerald-500 text-white' :
                            st === 'in-progress' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {st.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Topic Description
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {activeTopic.description}
                </p>
              </div>

              {/* Learning Objectives */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Learning Objectives
                </h3>
                <div className="space-y-1.5">
                  {activeTopic.learningObjectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-electric-400 flex-shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Important Exam Concepts */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Key Concepts for Sanjay Ghodawat University Exams
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activeTopic.importantConcepts.map((c, i) => (
                    <span 
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-navy-950 border border-navy-750 text-xs font-medium text-slate-300"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bridge to AI Tutor & Question Bank */}
              <div className="pt-4 border-t border-navy-800 flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => setActiveView('assistant')}
                  className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs shadow-glow transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Ask AI to Explain This Topic</span>
                </button>

                <button
                  onClick={() => setActiveView('questions')}
                  className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-navy-800 hover:bg-navy-750 text-slate-200 hover:text-white font-bold text-xs border border-navy-700 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-violet-400" />
                  <span>View Related Questions</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 rounded-2xl bg-navy-900 border border-navy-800">
              Select a topic on the left to view details.
            </div>
          )}
        </div>

      </div>

      {/* 3. Syllabus Upload Simulation Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-navy-900 border border-navy-700 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-electric-400" />
              Upload University Syllabus Document
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Supports official Sanjay Ghodawat University Course Handouts (.pdf, .docx).
            </p>

            <div className="my-5 p-6 rounded-2xl border-2 border-dashed border-navy-700 hover:border-electric-500/60 bg-navy-950/60 text-center space-y-3">
              <FileText className="w-10 h-10 text-electric-400 mx-auto" />
              <div>
                <p className="text-xs font-semibold text-white">Drag and drop your syllabus file here</p>
                <p className="text-[11px] text-slate-400 mt-0.5">or browse from your local device</p>
              </div>
              <span className="inline-block text-[10px] text-slate-500">
                Sample: "SGU_BTech_AI_Sem3_DBMS_Syllabus_2026.pdf"
              </span>
            </div>

            {isUploading && (
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Parsing syllabus units & weightages...</span>
                  <span className="font-bold text-electric-400">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-navy-950 h-2 rounded-full overflow-hidden">
                  <div className="bg-electric-500 h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Syllabus Parsed Successfully!</p>
                  <p className="text-[11px] mt-0.5 text-slate-300">
                    5 Units, 14 Topics, and 28 Examination Questions mapped to your study plan.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setUploadModalOpen(false);
                  setUploadSuccess(false);
                  setIsUploading(false);
                }}
                className="px-4 py-2 rounded-xl bg-navy-800 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
              {!uploadSuccess && (
                <button
                  onClick={handleSimulateUpload}
                  disabled={isUploading}
                  className="px-5 py-2 rounded-xl bg-electric-600 hover:bg-electric-500 disabled:opacity-50 text-white text-xs font-bold shadow-glow"
                >
                  {isUploading ? "Processing..." : "Process Syllabus"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
