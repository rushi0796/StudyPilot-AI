import React, { useState } from 'react';
import { 
  FileQuestion, 
  Search, 
  Bookmark, 
  BookmarkCheck, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  Sparkles, 
  Filter, 
  Check, 
  AlertTriangle,
  Award,
  Layers
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { QuestionItem, QuestionMarks } from '../../types';

export const QuestionBankView: React.FC = () => {
  const { 
    questionBank, 
    toggleBookmarkQuestion, 
    subjects, 
    activeSubject, 
    setSelectedQuestionForEvaluation, 
    setActiveView 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarks, setSelectedMarks] = useState<number | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);

  const [expandedAnswerId, setExpandedAnswerId] = useState<string | null>('q_norm_5m');
  const [selectedForPractice, setSelectedForPractice] = useState<string[]>([]);

  // Filter logic
  const filteredQuestions = questionBank.filter(q => {
    if (selectedMarks !== 'all' && q.marks !== selectedMarks) return false;
    if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) return false;
    if (selectedType !== 'all' && q.type !== selectedType) return false;
    if (bookmarkedOnly && !q.isBookmarked) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchText = q.text.toLowerCase().includes(query);
      const matchTopic = q.topic.toLowerCase().includes(query);
      const matchSubject = q.subjectCode.toLowerCase().includes(query);
      if (!matchText && !matchTopic && !matchSubject) return false;
    }
    return true;
  });

  const toggleSelectForPractice = (id: string) => {
    setSelectedForPractice(prev => 
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    );
  };

  const handlePractiseNow = (q: QuestionItem) => {
    setSelectedQuestionForEvaluation(q);
    setActiveView('evaluator');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-navy-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <FileQuestion className="w-6 h-6 text-violet-400" />
            Marks-Wise Question Bank
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Exam preparation library categorized by marks (2, 3, 4, 5, 7, 10M) with marking rubrics & model answers.
          </p>
        </div>

        {selectedForPractice.length > 0 && (
          <div className="flex items-center gap-3 p-2 px-3 rounded-xl bg-electric-500/20 border border-electric-500/40 text-xs text-electric-300">
            <span className="font-semibold">{selectedForPractice.length} Questions Selected</span>
            <button
              onClick={() => {
                const firstQ = questionBank.find(q => q.id === selectedForPractice[0]);
                if (firstQ) setSelectedQuestionForEvaluation(firstQ);
                setActiveView('evaluator');
              }}
              className="px-3 py-1.5 rounded-lg bg-electric-500 text-white font-bold text-xs shadow-glow hover:bg-electric-400 transition-colors"
            >
              Start Practice Session
            </button>
          </div>
        )}
      </div>

      {/* 2. Marks Tabs & Filter Controls */}
      <div className="space-y-3">
        {/* Marks Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 mr-2 flex-shrink-0">Exam Weightage:</span>
          {(['all', 2, 3, 4, 5, 7, 10] as (number | 'all')[]).map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMarks(m)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                selectedMarks === m 
                  ? 'bg-electric-600 text-white shadow-glow' 
                  : 'bg-navy-900 text-slate-400 hover:text-white hover:bg-navy-800 border border-navy-800'
              }`}
            >
              {m === 'all' ? 'All Marks' : `${m} Marks`}
            </button>
          ))}

          <button
            onClick={() => setBookmarkedOnly(!bookmarkedOnly)}
            className={`ml-auto px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all flex-shrink-0 ${
              bookmarkedOnly 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                : 'bg-navy-900 text-slate-400 hover:text-white border border-navy-800'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Bookmarked Only</span>
          </button>
        </div>

        {/* Search & Dropdown Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keywords (e.g. Normalization, ACID, Armstrong, Candidate Key)..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-navy-900 border border-navy-750 text-xs text-white placeholder-slate-500 focus:border-electric-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-navy-750 text-xs text-slate-300 focus:border-electric-500 focus:outline-none"
            >
              <option value="all">All Difficulties</option>
              <option value="Easy">Easy (Conceptual)</option>
              <option value="Medium">Medium (Application)</option>
              <option value="Hard">Hard (Proofs / Design)</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-navy-750 text-xs text-slate-300 focus:border-electric-500 focus:outline-none"
            >
              <option value="all">All Question Types</option>
              <option value="Theory">Theory & Concepts</option>
              <option value="Numerical">Numerical / Algorithm</option>
              <option value="Query">Query / SQL</option>
              <option value="Design">Schema Design</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Question Cards Feed */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 rounded-2xl bg-navy-900 border border-navy-800">
            <p className="font-semibold">No questions found matching your filter criteria.</p>
            <p className="text-xs text-slate-500 mt-1">Try switching marks tabs or clearing the search query.</p>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const isExpanded = expandedAnswerId === q.id;
            const isSelected = selectedForPractice.includes(q.id);

            return (
              <div
                key={q.id}
                className="rounded-2xl bg-navy-900/80 border border-navy-800 hover:border-navy-700/90 transition-all overflow-hidden"
              >
                {/* Question Card Top Row */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    
                    <div className="flex items-start gap-3">
                      {/* Selection Checkbox */}
                      <button
                        onClick={() => toggleSelectForPractice(q.id)}
                        className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center transition-colors flex-shrink-0 ${
                          isSelected ? 'bg-electric-500 text-white' : 'border border-navy-700 hover:border-slate-500'
                        }`}
                        title="Select for practice session"
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      {/* Question Details */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                            {q.marks} Marks
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-navy-800 text-slate-300">
                            {q.subjectCode} • Unit {q.unitNumber}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            q.difficulty === 'Hard' ? 'text-rose-400 bg-rose-500/10' :
                            q.difficulty === 'Medium' ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10'
                          }`}>
                            {q.difficulty}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {q.type}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm sm:text-base text-white leading-snug">
                          {q.text}
                        </h3>

                        <p className="text-xs text-electric-400 font-medium">
                          Topic: {q.topic}
                        </p>
                      </div>
                    </div>

                    {/* Bookmark Action */}
                    <button
                      onClick={() => toggleBookmarkQuestion(q.id)}
                      className={`p-2 rounded-xl transition-colors flex-shrink-0 ${
                        q.isBookmarked 
                          ? 'text-amber-400 bg-amber-500/15' 
                          : 'text-slate-400 hover:text-white bg-navy-800 hover:bg-navy-750'
                      }`}
                      title={q.isBookmarked ? "Remove bookmark" : "Bookmark question"}
                    >
                      {q.isBookmarked ? <BookmarkCheck className="w-4 h-4 fill-amber-400" /> : <Bookmark className="w-4 h-4" />}
                    </button>

                  </div>

                  {/* Action Bar */}
                  <div className="mt-4 pt-3 border-t border-navy-800/80 flex flex-wrap items-center justify-between gap-3">
                    <button
                      onClick={() => setExpandedAnswerId(isExpanded ? null : q.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white"
                    >
                      <span>{isExpanded ? "Hide Model Answer & Marking Rubric" : "View Model Answer & Marking Scheme"}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handlePractiseNow(q)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-electric-600 hover:bg-electric-500 text-white text-xs font-bold shadow-glow transition-all"
                    >
                      <span>Practise in Answer Evaluator</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Model Answer & Rubric Drawer */}
                {isExpanded && (
                  <div className="p-5 border-t border-navy-800 bg-navy-950/70 space-y-4 text-xs animate-in fade-in duration-150">
                    
                    {/* Official Marking Criteria */}
                    <div className="p-3.5 rounded-xl bg-navy-900 border border-navy-800">
                      <span className="font-bold text-electric-300 text-xs flex items-center gap-1.5 mb-2">
                        <Award className="w-4 h-4" />
                        SGU Examination Marking Scheme ({q.marks} Marks Rubric)
                      </span>
                      <ul className="space-y-1.5 text-slate-300">
                        {q.markingCriteria.map((crit, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-electric-400 mt-1.5 flex-shrink-0" />
                            <span>{crit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Model Answer Body */}
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
                        University Model Answer (Highest Marks Reference)
                      </h4>
                      <div className="p-4 rounded-xl bg-navy-900 border border-navy-800 text-slate-200 leading-relaxed whitespace-pre-wrap font-sans text-xs sm:text-sm">
                        {q.modelAnswer}
                      </div>
                    </div>

                    {/* Common Pitfalls / Mistakes */}
                    {q.commonMistakes.length > 0 && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300">
                        <span className="font-bold flex items-center gap-1.5 mb-1 text-xs">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                          Common Student Pitfalls (Marks Lost in University Exams)
                        </span>
                        <ul className="space-y-1 text-[11px] text-slate-300">
                          {q.commonMistakes.map((mistake, mIdx) => (
                            <li key={mIdx}>• {mistake}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
