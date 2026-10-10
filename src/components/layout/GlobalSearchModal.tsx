import React, { useState } from 'react';
import { Search, X, BookOpen, HelpCircle, CalendarClock, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const GlobalSearchModal: React.FC = () => {
  const { 
    globalSearchOpen, 
    setGlobalSearchOpen, 
    subjects, 
    questionBank, 
    revisionTasks, 
    setActiveView,
    setActiveSubjectId,
    setSelectedQuestionForEvaluation
  } = useApp();

  const [query, setQuery] = useState('');

  if (!globalSearchOpen) return null;

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(query.toLowerCase()) || 
    s.code.toLowerCase().includes(query.toLowerCase())
  );

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

  const handleSelectRevision = () => {
    setActiveView('planner');
    setGlobalSearchOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-navy-900 border border-navy-700/80 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-navy-800 gap-3">
          <Search className="w-5 h-5 text-electric-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a concept, question, subject, or marks (e.g. Normalization, ACID, 5)..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd 
            onClick={() => setGlobalSearchOpen(false)}
            className="px-2 py-0.5 rounded text-[10px] font-mono bg-navy-800 text-slate-400 border border-navy-700 cursor-pointer"
          >
            ESC
          </kbd>
        </div>

        {/* Search Results Container */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4 text-xs">
          
          {/* Quick Suggestions when Query is Empty */}
          {!query.trim() && (
            <div className="space-y-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Popular Searches for SGU Semester III
              </span>
              <div className="flex flex-wrap gap-2">
                {['Database Normalization', 'ACID Properties', 'B+ Trees', 'Candidate Keys', 'Conflict Serializability', 'A* Search'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 text-slate-300 hover:text-white border border-navy-700 hover:border-electric-500/40 transition-colors"
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
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-electric-400" />
                Syllabus Topics ({filteredTopics.length})
              </span>
              <div className="space-y-1.5">
                {filteredTopics.slice(0, 4).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTopic(t.subjectId)}
                    className="w-full text-left p-2.5 rounded-xl bg-navy-950/60 hover:bg-navy-800/80 border border-navy-800 hover:border-electric-500/30 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <p className="font-semibold text-slate-200 group-hover:text-white">{t.title}</p>
                      <p className="text-[11px] text-slate-400">{t.subjectName} • {t.unitTitle}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-electric-400 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Questions Results */}
          {filteredQuestions.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <HelpCircle className="w-3.5 h-3.5 text-violet-400" />
                Questions ({filteredQuestions.length})
              </span>
              <div className="space-y-1.5">
                {filteredQuestions.slice(0, 4).map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handleSelectQuestion(q)}
                    className="w-full text-left p-2.5 rounded-xl bg-navy-950/60 hover:bg-navy-800/80 border border-navy-800 hover:border-violet-500/30 transition-all flex items-center justify-between group"
                  >
                    <div className="pr-3">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                          {q.marks} Marks
                        </span>
                        <span className="text-[10px] text-slate-400">{q.subjectCode} • {q.topic}</span>
                      </div>
                      <p className="font-medium text-slate-200 line-clamp-1">{q.text}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Revision Tasks Results */}
          {filteredRevisions.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <CalendarClock className="w-3.5 h-3.5 text-amber-400" />
                Revision Tasks ({filteredRevisions.length})
              </span>
              <div className="space-y-1.5">
                {filteredRevisions.slice(0, 3).map((r) => (
                  <button
                    key={r.id}
                    onClick={handleSelectRevision}
                    className="w-full text-left p-2.5 rounded-xl bg-navy-950/60 hover:bg-navy-800/80 border border-navy-800 hover:border-amber-500/30 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <p className="font-semibold text-slate-200">{r.title}</p>
                      <p className="text-[11px] text-slate-400">{r.subject} • Priority: {r.priority.toUpperCase()}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {query.trim() && filteredTopics.length === 0 && filteredQuestions.length === 0 && filteredRevisions.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <p>No results found matching "{query}"</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Try searching for "Normalization", "ACID", or marks like "5".
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
