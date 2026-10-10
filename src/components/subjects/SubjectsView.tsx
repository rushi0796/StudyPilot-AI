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
  Cpu
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SubjectsView: React.FC = () => {
  const { subjects, setActiveSubjectId, setActiveView } = useApp();

  const getSubjectIcon = (iconName: string) => {
    switch (iconName) {
      case 'Database': return <Database className="w-5 h-5 text-electric-400" />;
      case 'BrainCircuit': return <BrainCircuit className="w-5 h-5 text-violet-400" />;
      case 'Binary': return <Binary className="w-5 h-5 text-emerald-400" />;
      case 'Network': return <Network className="w-5 h-5 text-amber-400" />;
      case 'Cpu': return <Cpu className="w-5 h-5 text-pink-400" />;
      default: return <BookOpen className="w-5 h-5 text-electric-400" />;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-navy-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-electric-400" />
            My Subjects
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enrolled curriculum for Sanjay Ghodawat University • B.Tech Artificial Intelligence (Semester III)
          </p>
        </div>

        <button
          onClick={() => setActiveView('syllabus')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-500 text-white font-semibold text-xs shadow-glow transition-all"
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
              className="rounded-2xl bg-navy-900/80 border border-navy-800 hover:border-navy-700 transition-all p-5 flex flex-col justify-between group hover:shadow-xl"
            >
              <div>
                {/* Subject Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-navy-950 border border-navy-750 flex items-center justify-center shadow-inner">
                    {getSubjectIcon(sub.iconName)}
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-navy-800 text-electric-300 border border-navy-700">
                      {sub.code}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">{sub.semester}</p>
                  </div>
                </div>

                {/* Name */}
                <h3 className="font-bold text-base text-white group-hover:text-electric-300 transition-colors">
                  {sub.name}
                </h3>

                {/* Progress bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Syllabus Completion</span>
                    <span className="font-bold text-slate-200">{progress}%</span>
                  </div>
                  <div className="w-full bg-navy-950 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-electric-500 to-violet-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>
                </div>

                {/* Subject stats */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-navy-800/80 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    <span>{sub.units.length} Units Total</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                    <span>{sub.totalQuestionsCount} Exam Qs</span>
                  </div>
                </div>

                {/* Recently Studied */}
                {sub.recentlyStudiedTopic && (
                  <div className="mt-3 p-2.5 rounded-xl bg-navy-950/60 border border-navy-850 text-[11px] text-slate-300">
                    <span className="text-[10px] text-slate-500 block font-semibold uppercase">Recently Studied</span>
                    <p className="truncate font-medium text-slate-200 mt-0.5">{sub.recentlyStudiedTopic}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-5 pt-4 border-t border-navy-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setActiveSubjectId(sub.id);
                    setActiveView('syllabus');
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-navy-800 hover:bg-navy-750 text-slate-200 hover:text-white text-xs font-semibold text-center transition-colors"
                >
                  Syllabus
                </button>
                <button
                  onClick={() => {
                    setActiveSubjectId(sub.id);
                    setActiveView('assistant');
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-electric-600 hover:bg-electric-500 text-white text-xs font-semibold transition-colors"
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
