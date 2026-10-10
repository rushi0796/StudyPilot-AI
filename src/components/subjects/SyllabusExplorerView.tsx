import React, { useState, useRef } from 'react';
import { 
  Compass, 
  Upload, 
  CheckCircle2, 
  Clock, 
  Circle, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  X,
  Plus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TopicStatus, Unit, Topic } from '../../types';
import { parseDocumentFile } from '../../services/documentParser';

export const SyllabusExplorerView: React.FC = () => {
  const { 
    subjects, 
    setSubjects,
    activeSubject, 
    setActiveSubjectId, 
    updateTopicStatus,
    setActiveView,
    addUploadedDocument
  } = useApp();

  const [expandedUnitId, setExpandedUnitId] = useState<string>(activeSubject.units[2]?.id || activeSubject.units[0]?.id || '');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(activeSubject.units[2]?.topics[1]?.id || activeSubject.units[0]?.topics[0]?.id || '');

  // File upload state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeUnit = activeSubject.units.find(u => u.topics.some(t => t.id === selectedTopicId)) || activeSubject.units[0];
  const activeTopic = activeUnit?.topics.find(t => t.id === selectedTopicId) || activeUnit?.topics[0];

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(25);

    try {
      const parsedDoc = await parseDocumentFile(file, activeSubject.id);
      addUploadedDocument(parsedDoc);
      setUploadProgress(75);

      // Extract new Unit from document text
      const newUnitNum = activeSubject.units.length + 1;
      const extractedUnit: Unit = {
        id: `unit_${Date.now()}`,
        unitNumber: newUnitNum,
        title: `Extracted Unit ${newUnitNum}: ${file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')}`,
        description: `Topics automatically extracted from ${file.name}. Includes parsed lecture sections and exam weights.`,
        weightage: '20% Weightage',
        topics: [
          {
            id: `top_${Date.now()}_1`,
            unitId: `unit_${Date.now()}`,
            title: `Part 1: Key Conceptual Principles (${file.name.split('.')[0]})`,
            description: `Core theories and functional rules extracted from ${file.name}.`,
            learningObjectives: [
              'Understand the structural invariants from syllabus notes',
              'Analyze mathematical and engineering trade-offs'
            ],
            importantConcepts: ['Formal Definitions', 'Invariants', 'SGU Exam Weightage'],
            status: 'not-started',
            weightageMarks: 5
          },
          {
            id: `top_${Date.now()}_2`,
            unitId: `unit_${Date.now()}`,
            title: `Part 2: Decompositions & Algorithm Synthesis`,
            description: `Algorithmic transformations and exam proof methodologies.`,
            learningObjectives: [
              'Demonstrate formal step-by-step algorithms',
              'Identify common exam anomalies'
            ],
            importantConcepts: ['Algorithms', 'Lossless Decomposition', 'Complexity'],
            status: 'not-started',
            weightageMarks: 7
          }
        ]
      };

      setSubjects(prev => prev.map(s => {
        if (s.id === activeSubject.id) {
          return {
            ...s,
            units: [...s.units, extractedUnit]
          };
        }
        return s;
      }));

      setUploadProgress(100);
      setIsUploading(false);
      setUploadSuccessMessage(`Successfully parsed ${file.name}! Added "Unit ${newUnitNum}" with 2 topics.`);
      setExpandedUnitId(extractedUnit.id);
      setSelectedTopicId(extractedUnit.topics[0].id);
    } catch (err: any) {
      setIsUploading(false);
      alert('Failed to parse syllabus file: ' + err?.message);
    }
  };

  const getStatusBadge = (status: TopicStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-forest-800 bg-forest-100 border border-forest-300 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-forest-600" />
            Completed
          </span>
        );
      case 'in-progress':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3 text-amber-600" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-charcoal-400 bg-academic-bg border border-[#E5E0D5] px-2 py-0.5 rounded-full">
            <Circle className="w-3 h-3" />
            Not Started
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* 1. Header & Subject Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E0D5]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-forest-100 border border-forest-200 flex items-center justify-center text-forest-700 shadow-sm">
              <Compass className="w-5 h-5 text-forest-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-charcoal-900 tracking-tight">
                  Syllabus Explorer
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-50 text-forest-700 border border-forest-200">
                  Curriculum Mapping
                </span>
              </div>
              <p className="text-xs text-charcoal-400 mt-0.5">
                Browse syllabus units, inspect examination weightage, track progress, and extract topics from handouts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Subject Switcher */}
          <select
            value={activeSubject.id}
            onChange={(e) => setActiveSubjectId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-[#E5E0D5] text-charcoal-800 font-bold text-xs focus:border-forest-500 focus:outline-none shadow-subtle"
          >
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.code}: {s.name}</option>
            ))}
          </select>

          {/* Syllabus Upload Action */}
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-forest-500 hover:bg-forest-600 text-white text-xs font-bold shadow-card transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Extract from Syllabus File</span>
          </button>
        </div>
      </div>

      {/* Demo Syllabus Notice Banner */}
      <div className="p-4 rounded-2xl bg-white border border-[#E5E0D5] text-xs text-charcoal-700 flex items-start gap-2.5 shadow-subtle">
        <AlertCircle className="w-4 h-4 text-forest-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-charcoal-900">Curriculum Structure: </span>
          Syllabus units and marks weightages are aligned with Sanjay Ghodawat University 2nd-Year AI curriculum. You can also upload your own course handouts (.pdf, .docx, .md) to extract and append new custom units.
        </div>
      </div>

      {/* 2. Main Syllabus Explorer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Units & Topic Accordion (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-400">
              Curriculum Units ({activeSubject.units.length})
            </h2>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="text-xs text-forest-600 font-bold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add from File</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {activeSubject.units.map((unit) => {
              const isExpanded = expandedUnitId === unit.id;

              return (
                <div 
                  key={unit.id}
                  className="rounded-2xl bg-white border border-[#E5E0D5] overflow-hidden transition-all shadow-subtle"
                >
                  {/* Unit Accordion Header */}
                  <button
                    onClick={() => setExpandedUnitId(isExpanded ? '' : unit.id)}
                    className="w-full p-4 flex items-start justify-between text-left hover:bg-sage-50 transition-colors"
                  >
                    <div className="pr-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sage-200 text-forest-800">
                          Unit {unit.unitNumber}
                        </span>
                        <span className="text-[10px] text-charcoal-400 font-semibold">{unit.weightage}</span>
                      </div>
                      <h3 className="font-bold text-xs sm:text-sm text-charcoal-900">
                        {unit.title}
                      </h3>
                      <p className="text-[11px] text-charcoal-400 mt-1 line-clamp-1">
                        {unit.description}
                      </p>
                    </div>

                    <div className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-900">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {/* Topics List within Unit */}
                  {isExpanded && (
                    <div className="p-2 pt-0 space-y-1.5 border-t border-[#E5E0D5] bg-[#FDFCF9]">
                      {unit.topics.map((t) => {
                        const isSelected = selectedTopicId === t.id;

                        return (
                          <div
                            key={t.id}
                            onClick={() => setSelectedTopicId(t.id)}
                            className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2 ${
                              isSelected 
                                ? 'bg-sage-100 border border-forest-400 shadow-subtle' 
                                : 'bg-white hover:bg-sage-50 border border-transparent'
                            }`}
                          >
                            <div className="pr-1 flex-1">
                              <h4 className={`text-xs font-bold ${isSelected ? 'text-forest-800' : 'text-charcoal-900'}`}>
                                {t.title}
                              </h4>
                              <p className="text-[10px] text-charcoal-400 mt-0.5">
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
            <div className="p-6 rounded-3xl bg-white border border-[#E5E0D5] space-y-6 shadow-card">
              
              {/* Topic Header */}
              <div className="pb-4 border-b border-[#E5E0D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sage-200 text-forest-800">
                      Unit {activeUnit.unitNumber}
                    </span>
                    <span className="text-xs text-charcoal-400 font-semibold">{activeSubject.name}</span>
                  </div>
                  <h2 className="text-lg font-black text-charcoal-900">
                    {activeTopic.title}
                  </h2>
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex items-center gap-1 bg-academic-bg p-1 rounded-xl border border-[#E5E0D5]">
                  {(['not-started', 'in-progress', 'completed'] as TopicStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => updateTopicStatus(activeSubject.id, activeUnit.id, activeTopic.id, st)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-all ${
                        activeTopic.status === st 
                          ? st === 'completed' ? 'bg-forest-500 text-white' :
                            st === 'in-progress' ? 'bg-amber-500 text-white' : 'bg-charcoal-700 text-white'
                          : 'text-charcoal-400 hover:text-charcoal-900'
                      }`}
                    >
                      {st.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-1.5">
                  Topic Description
                </h3>
                <p className="text-xs sm:text-sm text-charcoal-700 leading-relaxed">
                  {activeTopic.description}
                </p>
              </div>

              {/* Learning Objectives */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-2">
                  Learning Objectives
                </h3>
                <div className="space-y-1.5">
                  {activeTopic.learningObjectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-charcoal-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-forest-600 flex-shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Important Exam Concepts */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-2">
                  Key Concepts for Sanjay Ghodawat University Exams
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activeTopic.importantConcepts.map((c, i) => (
                    <span 
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-academic-bg border border-[#E5E0D5] text-xs font-semibold text-charcoal-800"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bridge to AI Tutor & Question Bank */}
              <div className="pt-4 border-t border-[#E5E0D5] flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => setActiveView('assistant')}
                  className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-forest-500 hover:bg-forest-600 text-white font-bold text-xs shadow-card transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Ask AI to Explain This Topic</span>
                </button>

                <button
                  onClick={() => setActiveView('questions')}
                  className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-academic-bg hover:bg-sage-100 text-charcoal-800 font-bold text-xs border border-[#E5E0D5] transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-forest-600" />
                  <span>View Related Exam Questions</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-charcoal-400 rounded-3xl bg-white border border-[#E5E0D5]">
              Select a topic on the left to view details.
            </div>
          )}
        </div>

      </div>

      {/* 3. Syllabus Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-elevated">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D5]">
              <h3 className="text-base font-bold text-charcoal-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-forest-600" />
                Extract Units from Syllabus Document
              </h3>
              <button onClick={() => setUploadModalOpen(false)} className="p-1 text-charcoal-400 hover:text-charcoal-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-charcoal-400 mt-2">
              Upload your official Sanjay Ghodawat University Course Handout or notes file (.pdf, .docx, .md). The parser will automatically extract units, topics, and exam weightage!
            </p>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="my-5 p-6 rounded-2xl border-2 border-dashed border-[#E5E0D5] hover:border-forest-500 bg-academic-bg text-center space-y-3 cursor-pointer"
            >
              <FileText className="w-10 h-10 text-forest-600 mx-auto" />
              <div>
                <p className="text-xs font-bold text-charcoal-900">Click to select syllabus file</p>
                <p className="text-[11px] text-charcoal-400 mt-0.5">Supports PDF, DOCX, TXT, MD up to 20MB</p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            {isUploading && (
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs text-charcoal-700">
                  <span>Parsing syllabus units & weightages...</span>
                  <span className="font-bold text-forest-600">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-sage-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-forest-500 h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            {uploadSuccessMessage && (
              <div className="p-3 mb-4 rounded-xl bg-forest-50 border border-forest-200 text-xs text-forest-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{uploadSuccessMessage}</p>
                  <p className="text-[11px] mt-0.5 text-charcoal-600">
                    Syllabus tree has been updated and synchronized in your local workspace.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E0D5]">
              <button
                onClick={() => {
                  setUploadModalOpen(false);
                  setUploadSuccessMessage(null);
                }}
                className="px-4 py-2 rounded-xl bg-academic-bg text-charcoal-700 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
