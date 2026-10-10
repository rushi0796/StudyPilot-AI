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
  Check, 
  AlertTriangle,
  Award,
  Plus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { QuestionItem, QuestionMarks } from '../../types';

export const QuestionBankView: React.FC = () => {
  const { 
    questionBank, 
    setQuestionBank,
    toggleBookmarkQuestion, 
    activeSubject, 
    setSelectedQuestionForEvaluation, 
    setActiveView,
    uploadedDocuments 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarks, setSelectedMarks] = useState<number | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);

  const [expandedAnswerId, setExpandedAnswerId] = useState<string | null>('q_norm_5m');
  const [selectedForPractice, setSelectedForPractice] = useState<string[]>([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateTopic, setGenerateTopic] = useState('Transaction Concurrency & 2PL');
  const [generateMarks, setGenerateMarks] = useState<QuestionMarks>(5);
  const [isGenerating, setIsGenerating] = useState(false);

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

  const handleGenerateQuestion = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const newQuestion: QuestionItem = {
        id: `gen_q_${Date.now()}`,
        subjectId: activeSubject.id,
        subjectCode: activeSubject.code,
        unitNumber: 3,
        topic: generateTopic,
        text: `Explain ${generateTopic} in detail with formal mathematical rules, diagrams, and industrial applications for ${generateMarks} marks.`,
        marks: generateMarks,
        difficulty: generateMarks >= 7 ? 'Hard' : generateMarks >= 4 ? 'Medium' : 'Easy',
        type: 'Theory',
        isBookmarked: true,
        markingCriteria: [
          `Definition and invariant principles (${Math.round(generateMarks * 0.3)} Marks)`,
          `Mathematical/Relational schema representation (${Math.round(generateMarks * 0.4)} Marks)`,
          `Industrial case study & error handling (${Math.round(generateMarks * 0.3)} Marks)`
        ],
        modelAnswer: `${generateTopic} operates by ensuring correctness according to university specifications. All state invariants are verified against concurrent transaction schedules.`,
        keyPoints: [
          'State invariants verified strictly',
          'Lock acquisition and shrinking phases obeyed',
          'Serializability schedule maintained'
        ],
        commonMistakes: [
          'Failing to distinguish between shared and exclusive lock transitions'
        ]
      };

      setQuestionBank(prev => [newQuestion, ...prev]);
      setIsGenerating(false);
      setShowGenerateModal(false);
      setExpandedAnswerId(newQuestion.id);
    }, 800);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E0D5]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-forest-100 border border-forest-200 flex items-center justify-center text-forest-700 shadow-sm">
              <FileQuestion className="w-5 h-5 text-forest-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-charcoal-900 tracking-tight">
                Marks-Wise Question Bank
              </h1>
              <p className="text-xs text-charcoal-400 mt-0.5">
                University exam preparation library categorized by marks (2, 3, 4, 5, 7, 10M) with rubrics & model answers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-800 border border-forest-200 text-xs font-bold transition-colors"
          >
            <Sparkles className="w-4 h-4 text-forest-600" />
            <span>Generate Questions with AI</span>
          </button>

          {selectedForPractice.length > 0 && (
            <button
              onClick={() => {
                const firstQ = questionBank.find(q => q.id === selectedForPractice[0]);
                if (firstQ) setSelectedQuestionForEvaluation(firstQ);
                setActiveView('evaluator');
              }}
              className="px-4 py-2.5 rounded-xl bg-forest-500 hover:bg-forest-600 text-white font-bold text-xs shadow-card transition-colors"
            >
              Start Practice ({selectedForPractice.length} Selected)
            </button>
          )}
        </div>
      </div>

      {/* 2. Marks Tabs & Filter Controls */}
      <div className="space-y-3">
        {/* Marks Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-charcoal-400 mr-2 flex-shrink-0">Weightage:</span>
          {(['all', 2, 3, 4, 5, 7, 10] as (number | 'all')[]).map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMarks(m)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                selectedMarks === m 
                  ? 'bg-forest-500 text-white shadow-card' 
                  : 'bg-white text-charcoal-700 hover:text-charcoal-900 border border-[#E5E0D5]'
              }`}
            >
              {m === 'all' ? 'All Marks' : `${m} Marks`}
            </button>
          ))}

          <button
            onClick={() => setBookmarkedOnly(!bookmarkedOnly)}
            className={`ml-auto px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all flex-shrink-0 ${
              bookmarkedOnly 
                ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                : 'bg-white text-charcoal-700 border border-[#E5E0D5]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Bookmarked Only</span>
          </button>
        </div>

        {/* Search & Dropdown Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keywords (e.g. Normalization, ACID, Armstrong, Candidate Key)..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[#E5E0D5] text-xs text-charcoal-900 placeholder-charcoal-400 focus:border-forest-500 focus:outline-none shadow-subtle"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E0D5] text-xs text-charcoal-700 focus:border-forest-500 focus:outline-none shadow-subtle font-medium"
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
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E0D5] text-xs text-charcoal-700 focus:border-forest-500 focus:outline-none shadow-subtle font-medium"
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
          <div className="p-12 text-center text-charcoal-400 rounded-3xl bg-white border border-[#E5E0D5] shadow-subtle">
            <p className="font-bold text-charcoal-700">No questions found matching your filter criteria.</p>
            <p className="text-xs text-charcoal-400 mt-1">Try switching marks tabs or clearing the search query.</p>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const isExpanded = expandedAnswerId === q.id;
            const isSelected = selectedForPractice.includes(q.id);

            return (
              <div
                key={q.id}
                className="rounded-3xl bg-white border border-[#E5E0D5] hover:border-forest-300 transition-all overflow-hidden shadow-card"
              >
                {/* Question Card Top Row */}
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    
                    <div className="flex items-start gap-3.5">
                      {/* Selection Checkbox */}
                      <button
                        onClick={() => toggleSelectForPractice(q.id)}
                        className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center transition-colors flex-shrink-0 ${
                          isSelected ? 'bg-forest-500 text-white' : 'border border-[#E5E0D5] hover:border-forest-400'
                        }`}
                        title="Select for practice session"
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      {/* Question Details */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sage-200 text-forest-800">
                            {q.marks} Marks
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-academic-bg text-charcoal-700 border border-[#E5E0D5]">
                            {q.subjectCode} • Unit {q.unitNumber}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            q.difficulty === 'Hard' ? 'text-rose-700 bg-rose-50' :
                            q.difficulty === 'Medium' ? 'text-amber-700 bg-amber-50' : 'text-forest-700 bg-forest-50'
                          }`}>
                            {q.difficulty}
                          </span>
                          <span className="text-[10px] text-charcoal-400 font-medium">
                            {q.type}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm sm:text-base text-charcoal-900 leading-snug">
                          {q.text}
                        </h3>

                        <p className="text-xs text-forest-700 font-semibold">
                          Topic: {q.topic}
                        </p>
                      </div>
                    </div>

                    {/* Bookmark Action */}
                    <button
                      onClick={() => toggleBookmarkQuestion(q.id)}
                      className={`p-2 rounded-xl transition-colors flex-shrink-0 ${
                        q.isBookmarked 
                          ? 'text-gold-500 bg-gold-100' 
                          : 'text-charcoal-400 hover:text-charcoal-700 bg-academic-bg'
                      }`}
                      title={q.isBookmarked ? "Remove bookmark" : "Bookmark question"}
                    >
                      {q.isBookmarked ? <BookmarkCheck className="w-4 h-4 fill-gold-500" /> : <Bookmark className="w-4 h-4" />}
                    </button>

                  </div>

                  {/* Action Bar */}
                  <div className="mt-4 pt-3 border-t border-[#E5E0D5] flex flex-wrap items-center justify-between gap-3">
                    <button
                      onClick={() => setExpandedAnswerId(isExpanded ? null : q.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-charcoal-700 hover:text-charcoal-900"
                    >
                      <span>{isExpanded ? "Hide Model Answer & Marking Rubric" : "View Model Answer & Marking Scheme"}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handlePractiseNow(q)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-500 hover:bg-forest-600 text-white text-xs font-bold shadow-subtle transition-all"
                    >
                      <span>Practise in Answer Evaluator</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Model Answer & Rubric Drawer */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 border-t border-[#E5E0D5] bg-[#FDFCF9] space-y-4 text-xs animate-in fade-in duration-150">
                    
                    {/* Official Marking Criteria */}
                    <div className="p-4 rounded-2xl bg-white border border-[#E5E0D5] shadow-subtle">
                      <span className="font-bold text-forest-800 text-xs flex items-center gap-1.5 mb-2">
                        <Award className="w-4 h-4 text-forest-600" />
                        SGU Examination Marking Scheme ({q.marks} Marks Rubric)
                      </span>
                      <ul className="space-y-1.5 text-charcoal-700">
                        {q.markingCriteria.map((crit, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-forest-500 mt-1.5 flex-shrink-0" />
                            <span>{crit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Model Answer Body */}
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-charcoal-400 mb-2">
                        University Model Answer (Highest Marks Reference)
                      </h4>
                      <div className="p-4 rounded-2xl bg-white border border-[#E5E0D5] text-charcoal-900 leading-relaxed whitespace-pre-wrap font-sans text-xs sm:text-sm shadow-subtle">
                        {q.modelAnswer}
                      </div>
                    </div>

                    {/* Common Pitfalls / Mistakes */}
                    {q.commonMistakes.length > 0 && (
                      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
                        <span className="font-bold flex items-center gap-1.5 mb-1 text-xs">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          Common Student Pitfalls (Marks Lost in University Exams)
                        </span>
                        <ul className="space-y-1 text-[11px]">
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

      {/* 4. Generate AI Questions Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D5]">
              <h3 className="font-bold text-base text-charcoal-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-forest-600" />
                Generate Exam Questions with AI
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-charcoal-700 font-bold mb-1">Target Topic</label>
                <input
                  type="text"
                  value={generateTopic}
                  onChange={(e) => setGenerateTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-academic-bg border border-[#E5E0D5] text-charcoal-900 focus:border-forest-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-charcoal-700 font-bold mb-1">Marks Weightage</label>
                <div className="grid grid-cols-6 gap-1 bg-academic-bg p-1 rounded-xl border border-[#E5E0D5]">
                  {([2, 3, 4, 5, 7, 10] as QuestionMarks[]).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setGenerateMarks(m)}
                      className={`py-1.5 rounded-lg font-bold text-xs ${
                        generateMarks === m ? 'bg-forest-500 text-white' : 'text-charcoal-400 hover:text-charcoal-900'
                      }`}
                    >
                      {m}M
                    </button>
                  ))}
                </div>
              </div>

              {uploadedDocuments.length > 0 && (
                <div className="p-3 rounded-xl bg-sage-50 border border-forest-200 text-charcoal-700">
                  <p className="font-bold text-forest-800">Grounding in Active Materials:</p>
                  <p className="text-[11px] mt-0.5 text-charcoal-600">
                    Will extract question patterns from your uploaded syllabus documents.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E0D5]">
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 rounded-xl bg-academic-bg text-charcoal-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGenerateQuestion}
                className="px-5 py-2 rounded-xl bg-forest-500 hover:bg-forest-600 disabled:opacity-50 text-white text-xs font-bold shadow-card"
              >
                {isGenerating ? "Synthesizing Question..." : "Generate Question"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
