import React, { useState } from 'react';
import { Search, X, BookOpen, HelpCircle, CalendarClock, ArrowRight, FolderOpen } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const GlobalSearchModal: React.FC = () => {
  const { 
    globalSearchOpen, 
    setGlobalSearchOpen, 
    subjects, 
    questionBank, 
    revisionTasks, 
    uploadedDocuments,
    setActiveView,
    setActiveSubjectId,
    setSelectedQuestionForEvaluation,
    setActiveDocumentId
  } = useApp();

  const [query, setQuery] = useState('');

  if (!globalSearchOpen) return null;

  const filteredTopics = subjects.flatMap(s => 
    s.units.flatMap(u => 
      u.topics
        .filter(t => t.title.toLowerCase().includes(query.toLowerCase()) || t.description.toLowerCase().includes(query.toLowerCase()))
        .map(t => ({ ...t, subjectName: s.name, subjectId: s.id, unitTitle: u.title }))
    )
  );

  const filteredQuestions = questionBank.filter(q => 
    q.text.toLowerCase().includes(query.toLowerCase()) || 
    q.topic.toLowerCase().includes(query.toLowerCase()) ||
    q.marks.toString() === query.trim()
  );

  const filteredDocs = uploadedDocuments.filter(d => 
    d.name.toLowerCase().includes(query.toLowerCase()) || 
    d.text.toLowerCase().includes(query.toLowerCase())
  );

  const filteredRevisions = revisionTasks.filter(r => 
    r.title.toLowerCase().includes(query.toLowerCase()) ||
    r.subject.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectTopic = (subjectId: string) => {
    setActiveSubjectId(subjectId);
    setActiveView('syllabus');
    setGlobalSearchOpen(false);
  };

  const handleSelectQuestion = (q: typeof questionBank[0]) => {
    setSelectedQuestionForEvaluation(q);
    setActiveView('evaluator');
    setGlobalSearchOpen(false);
  };

  const handleSelectDoc = (docId: string) => {
    setActiveDocumentId(docId);
    setActiveView('files');
    setGlobalSearchOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white border border-[#E5E0D5] rounded-3xl shadow-elevated overflow-hidden">
        
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#E5E0D5] gap-3 bg-[#FDFCF9]">
          <Search className="w-5 h-5 text-forest-600" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search concepts, questions, syllabus, or study materials..."
            className="flex-1 bg-transparent text-sm text-charcoal-900 placeholder-charcoal-400 focus:outline-none"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 rounded text-charcoal-400 hover:text-charcoal-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd 
            onClick={() => setGlobalSearchOpen(false)}
            className="px-2 py-0.5 rounded text-[10px] font-mono bg-academic-bg text-charcoal-400 border border-[#E5E0D5] cursor-pointer"
          >
            ESC
          </kbd>
        </div>

        {/* Search Results Container */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4 text-xs">
          
          {/* Quick Suggestions when Query is Empty */}
          {!query.trim() && (
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-charcoal-400 uppercase tracking-wider block">
                Popular Searches for SGU Semester III
              </span>
              <div className="flex flex-wrap gap-2">
                {['Database Normalization', 'ACID Properties', '3NF vs BCNF', 'Candidate Keys', 'Conflict Serializability', 'A* Search'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-3 py-1.5 rounded-xl bg-academic-bg hover:bg-sage-100 text-charcoal-700 border border-[#E5E0D5] transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Topics Results */}
          {filteredTopics.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-charcoal-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-forest-600" />
                Syllabus Topics ({filteredTopics.length})
              </span>
              <div className="space-y-1.5">
                {filteredTopics.slice(0, 4).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTopic(t.subjectId)}
                    className="w-full text-left p-2.5 rounded-xl bg-academic-bg hover:bg-sage-100 border border-[#E5E0D5] hover:border-forest-400 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <p className="font-bold text-charcoal-900 group-hover:text-forest-700">{t.title}</p>
                      <p className="text-[11px] text-charcoal-400">{t.subjectName} • {t.unitTitle}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-charcoal-400 group-hover:text-forest-600 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Uploaded Documents Results */}
          {filteredDocs.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-charcoal-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <FolderOpen className="w-3.5 h-3.5 text-forest-600" />
                Study Materials ({filteredDocs.length})
              </span>
              <div className="space-y-1.5">
                {filteredDocs.slice(0, 3).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleSelectDoc(d.id)}
                    className="w-full text-left p-2.5 rounded-xl bg-academic-bg hover:bg-sage-100 border border-[#E5E0D5] hover:border-forest-400 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <p className="font-bold text-charcoal-900 group-hover:text-forest-700">{d.name}</p>
                      <p className="text-[11px] text-charcoal-400">{d.chunks.length} Chunks • {d.wordCount} Words</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-charcoal-400 group-hover:text-forest-600 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Questions Results */}
          {filteredQuestions.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-charcoal-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <HelpCircle className="w-3.5 h-3.5 text-forest-600" />
                Exam Questions ({filteredQuestions.length})
              </span>
              <div className="space-y-1.5">
                {filteredQuestions.slice(0, 4).map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handleSelectQuestion(q)}
                    className="w-full text-left p-2.5 rounded-xl bg-academic-bg hover:bg-sage-100 border border-[#E5E0D5] hover:border-forest-400 transition-all flex items-center justify-between group"
                  >
                    <div className="pr-3">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sage-200 text-forest-800">
                          {q.marks} Marks
                        </span>
                        <span className="text-[10px] text-charcoal-400">{q.subjectCode} • {q.topic}</span>
                      </div>
                      <p className="font-medium text-charcoal-900 line-clamp-1">{q.text}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-charcoal-400 group-hover:text-forest-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {query.trim() && filteredTopics.length === 0 && filteredQuestions.length === 0 && filteredDocs.length === 0 && (
            <div className="text-center py-8 text-charcoal-400">
              <p>No results found matching "{query}"</p>
              <p className="text-[11px] text-charcoal-400 mt-1">
                Try searching for "Normalization", "ACID", or marks like "5".
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
