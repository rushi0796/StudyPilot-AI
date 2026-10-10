import React from 'react';
import { 
  BookOpen, 
  ArrowRight, 
  Layers, 
  HelpCircle, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  Database,
  BrainCircuit,
  Binary,
  Network,
  Cpu,
  GraduationCap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SubjectsView: React.FC = () => {
  const { subjects, setActiveSubjectId, setActiveView } = useApp();

  const getSubjectIcon = (iconName: string) => {
    switch (iconName) {
      case 'Database': return <Database className="w-5 h-5 text-forest-600" />;
      case 'BrainCircuit': return <BrainCircuit className="w-5 h-5 text-forest-700" />;
      case 'Binary': return <Binary className="w-5 h-5 text-forest-600" />;
      case 'Network': return <Network className="w-5 h-5 text-gold-600" />;
      case 'Cpu': return <Cpu className="w-5 h-5 text-charcoal-700" />;
      default: return <BookOpen className="w-5 h-5 text-forest-600" />;
    }
  };

  const calculateProgress = (sub: typeof subjects[0]) => {
    let total = 0;
    let completed = 0;
    sub.units.forEach(u => {
      u.topics.forEach(t => {
        total++;
        if (t.status === 'completed') completed += 1;
        else if (t.status === 'in-progress') completed += 0.5;
      });
    });
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-academic-border">
        <div>
          <h1 className="text-2xl font-black text-charcoal-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-forest-600" />
            My Subjects
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Enrolled curriculum for Sanjay Ghodawat University • B.Tech Artificial Intelligence (Semester III)
          </p>
        </div>

        <button
          onClick={() => setActiveView('syllabus')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-semibold text-xs shadow-sm transition-all"
        >
          <Layers className="w-4 h-4" />
          <span>Open Full Syllabus Explorer</span>
        </button>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {subjects.map((sub) => {
          const progress = calculateProgress(sub);

          return (
            <div
              key={sub.id}
              className="rounded-2xl bg-white border border-academic-border hover:border-forest-600/40 hover:shadow-md transition-all p-5 flex flex-col justify-between group"
            >
              <div>
                {/* Subject Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-sage-50 border border-sage-200 flex items-center justify-center">
                    {getSubjectIcon(sub.iconName)}
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-sage-100 text-forest-700 border border-sage-200">
                      {sub.code}
                    </span>
                    <p className="text-[10px] text-charcoal-400 mt-0.5 font-medium">{sub.semester}</p>
                  </div>
                </div>

                {/* Name */}
                <h3 className="font-bold text-base text-charcoal-900 group-hover:text-forest-700 transition-colors">
                  {sub.name}
                </h3>

                {/* Progress bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-charcoal-500 font-medium">Syllabus Completion</span>
                    <span className="font-bold text-forest-700">{progress}%</span>
                  </div>
                  <div className="w-full bg-sage-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-forest-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>
                </div>

                {/* Subject stats */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-academic-border text-xs text-charcoal-500">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Layers className="w-3.5 h-3.5 text-forest-600" />
                    <span>{sub.units.length} Units Total</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <HelpCircle className="w-3.5 h-3.5 text-forest-600" />
                    <span>{sub.totalQuestionsCount} Exam Qs</span>
                  </div>
                </div>

                {/* Recently Studied */}
                {sub.recentlyStudiedTopic && (
                  <div className="mt-3 p-2.5 rounded-xl bg-sage-50 border border-sage-200 text-[11px] text-charcoal-700">
                    <span className="text-[10px] text-charcoal-400 block font-bold uppercase tracking-wider">Recently Studied</span>
                    <p className="truncate font-semibold text-charcoal-900 mt-0.5">{sub.recentlyStudiedTopic}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-5 pt-4 border-t border-academic-border flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setActiveSubjectId(sub.id);
                    setActiveView('syllabus');
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-sage-50 hover:bg-sage-100 text-charcoal-700 hover:text-charcoal-900 text-xs font-semibold text-center border border-academic-border transition-colors"
                >
                  Syllabus
                </button>
                <button
                  onClick={() => {
                    setActiveSubjectId(sub.id);
                    setActiveView('assistant');
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-forest-600 hover:bg-forest-700 text-white text-xs font-semibold transition-colors shadow-sm"
                >
                  <span>Study</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
