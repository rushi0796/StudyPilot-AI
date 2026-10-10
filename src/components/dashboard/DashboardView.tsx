import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  Bot, 
  Award, 
  CheckSquare, 
  Clock, 
  Flame, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp,
  FileQuestion,
  GraduationCap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DashboardView: React.FC = () => {
  const { 
    studentProfile, 
    subjects, 
    activeSubject, 
    setActiveSubjectId, 
    setActiveView, 
    revisionTasks,
    toggleRevisionTask
  } = useApp();

  const pendingRevisions = revisionTasks.filter(r => !r.completed);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* 1. Hero Welcome & Quick Study Launcher */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-900 via-navy-850 to-navy-900 border border-navy-700/80 p-6 lg:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-electric-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-32 -mb-12 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-electric-500/15 text-electric-300 border border-electric-500/30">
                <GraduationCap className="w-3.5 h-3.5" />
                {studentProfile.university} • {studentProfile.semester}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                4-Day Study Streak
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="bg-gradient-to-r from-electric-300 to-violet-300 bg-clip-text text-transparent">{studentProfile.name}</span>!
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Your AI study assistant has prepared today’s syllabus goals for <strong className="text-white">{studentProfile.branch}</strong>. You have 2 weak topics recommended for revision before the upcoming unit tests.
            </p>
          </div>

          {/* Prominent "Continue Studying" Call to Action */}
          <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <button
              onClick={() => {
                setActiveSubjectId('cs201');
                setActiveView('assistant');
              }}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-electric-600 via-electric-500 to-violet-600 hover:from-electric-500 hover:to-violet-500 text-white font-bold text-sm shadow-glow hover:shadow-glow-violet transition-all duration-200 group"
            >
              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span>Continue Studying (DBMS Unit 3)</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => setActiveView('evaluator')}
              className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-navy-800/80 hover:bg-navy-700 text-slate-200 hover:text-white font-semibold text-xs border border-navy-700 transition-colors"
            >
              <Award className="w-4 h-4 text-electric-400" />
              <span>Open Answer Evaluator</span>
            </button>
          </div>
        </div>

        {/* Quick Subject Switcher Pills */}
        <div className="relative z-10 mt-6 pt-5 border-t border-navy-800/80 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 mr-1">Active Subjects:</span>
          {subjects.map((sub) => {
            const isSelected = sub.id === activeSubject.id;
            return (
              <button
                key={sub.id}
                onClick={() => setActiveSubjectId(sub.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isSelected 
                    ? 'bg-electric-500/20 text-electric-300 border border-electric-500/40 shadow-sm' 
                    : 'bg-navy-950/60 text-slate-400 hover:text-slate-200 border border-navy-800 hover:border-navy-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.color }} />
                <span>{sub.code}: {sub.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Key Metrics & Learning Progress Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-navy-900/70 border border-navy-800 hover:border-navy-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Syllabus Covered</span>
            <BookOpen className="w-4 h-4 text-electric-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">64%</span>
            <span className="text-[11px] text-emerald-400 font-semibold">+8% this week</span>
          </div>
          <div className="w-full bg-navy-950 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-electric-500 h-full rounded-full" style={{ width: '64%' }} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900/70 border border-navy-800 hover:border-navy-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Questions Attempted</span>
            <FileQuestion className="w-4 h-4 text-violet-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">42</span>
            <span className="text-[11px] text-slate-400">across 2-10 marks</span>
          </div>
          <div className="w-full bg-navy-950 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-violet-500 h-full rounded-full" style={{ width: '55%' }} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900/70 border border-navy-800 hover:border-navy-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Evaluator Avg Score</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">78%</span>
            <span className="text-[11px] text-emerald-400 font-semibold">Good Tier</span>
          </div>
          <div className="w-full bg-navy-950 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '78%' }} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900/70 border border-navy-800 hover:border-navy-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Pending Revisions</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{pendingRevisions.length}</span>
            <span className="text-[11px] text-amber-400 font-semibold">Priority Tasks</span>
          </div>
          <div className="w-full bg-navy-950 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, pendingRevisions.length * 25)}%` }} />
          </div>
        </div>
      </div>

      {/* 3. Quick-Access Cards: Ask AI, Question Bank, Practice Test, Answer Evaluator */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Quick Study Hub
          </h2>
          <span className="text-xs text-slate-500 font-medium">Click any card to start</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Ask AI */}
          <button
            onClick={() => setActiveView('assistant')}
            className="p-5 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-950 border border-navy-800 hover:border-electric-500/50 transition-all text-left group hover:scale-[1.02] shadow-sm hover:shadow-glow"
          >
            <div className="w-10 h-10 rounded-xl bg-electric-500/20 text-electric-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white group-hover:text-electric-300 transition-colors">
              Ask AI Study Assistant
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Clear complex doubts, simplify derivations, or listen to voice audio explanations.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-electric-400 font-medium group-hover:translate-x-1 transition-transform">
              <span>Start session</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Question Bank */}
          <button
            onClick={() => setActiveView('questions')}
            className="p-5 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-950 border border-navy-800 hover:border-violet-500/50 transition-all text-left group hover:scale-[1.02] shadow-sm hover:shadow-glow-violet"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileQuestion className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white group-hover:text-violet-300 transition-colors">
              Marks-Wise Question Bank
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Explore 2, 3, 4, 5, 7, and 10 marks questions with official marking rubrics and model answers.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-violet-400 font-medium group-hover:translate-x-1 transition-transform">
              <span>Browse questions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Practice Test */}
          <button
            onClick={() => setActiveView('practice')}
            className="p-5 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-950 border border-navy-800 hover:border-emerald-500/50 transition-all text-left group hover:scale-[1.02] shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
              Practice Tests & Quizzes
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Timed mock tests, MCQs, short answers, timer, and automated error explanation analysis.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-400 font-medium group-hover:translate-x-1 transition-transform">
              <span>Take timed quiz</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Answer Evaluator */}
          <button
            onClick={() => setActiveView('evaluator')}
            className="p-5 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-950 border border-electric-500/40 hover:border-electric-400 transition-all text-left group hover:scale-[1.02] shadow-glow"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-electric-600 to-violet-600 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-white group-hover:text-electric-300 transition-colors">
                AI Answer Evaluator
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-electric-500/30 text-electric-200">
                Flagship
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Write student exam answers and get instant estimated marks, missing points, and rubrics.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-electric-300 font-medium group-hover:translate-x-1 transition-transform">
              <span>Evaluate answer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

        </div>
      </div>

      {/* 4. Active Topic Progress & Recommended Revisions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Continue Learning & Recently Studied Topics */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Continue Learning Highlight Card */}
          <div className="p-5 rounded-2xl bg-navy-900/80 border border-navy-800">
            <div className="flex items-center justify-between pb-3 border-b border-navy-800">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-electric-400">
                  Continue Learning
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  CS201: Relational Database Normalization
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-navy-800 text-slate-300 border border-navy-700">
                Unit 3 • 26% Weightage
              </span>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Currently studying <strong>3NF vs BCNF decompositions</strong> and transitive functional dependency resolution for university semester exams.
              </p>
              
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Unit 3 Completion</span>
                  <span className="font-semibold text-slate-200">67% (2 of 3 Topics Mastered)</span>
                </div>
                <div className="w-full bg-navy-950 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-electric-500 to-violet-500 h-full rounded-full" style={{ width: '67%' }} />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-navy-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Last studied: Today at 02:30 PM
              </span>
              <button
                onClick={() => {
                  setActiveSubjectId('cs201');
                  setActiveView('assistant');
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-electric-600 hover:bg-electric-500 text-white font-medium text-xs transition-colors"
              >
                <span>Resume Lesson</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Weekly Study Activity Visualization (Clearly Labeled Demo Data) */}
          <div className="p-5 rounded-2xl bg-navy-900/80 border border-navy-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-electric-400" />
                  Weekly Study Activity
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Hours studied and questions solved per day (Demo Data)
                </p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-navy-800 text-slate-400 border border-navy-700">
                Sample Analytics
              </span>
            </div>

            {/* Simulated Activity Bar Graph */}
            <div className="grid grid-cols-7 gap-2 pt-4 items-end h-40">
              {[
                { day: 'Mon', hours: 2.5, questions: 6, height: '55%' },
                { day: 'Tue', hours: 3.2, questions: 9, height: '70%' },
                { day: 'Wed', hours: 1.8, questions: 4, height: '40%' },
                { day: 'Thu', hours: 4.0, questions: 12, height: '90%' },
                { day: 'Fri', hours: 3.5, questions: 8, height: '75%' },
                { day: 'Sat', hours: 4.5, questions: 14, height: '100%', active: true },
                { day: 'Sun', hours: 2.0, questions: 5, height: '45%' },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.hours}h
                  </div>
                  <div className="w-full bg-navy-950 rounded-lg p-0.5 flex flex-col justify-end h-28">
                    <div 
                      className={`w-full rounded-md transition-all duration-300 ${
                        item.active 
                          ? 'bg-gradient-to-t from-electric-600 to-violet-500 shadow-glow' 
                          : 'bg-electric-600/60 group-hover:bg-electric-500'
                      }`}
                      style={{ height: item.height }}
                    />
                  </div>
                  <span className={`text-[11px] font-medium ${item.active ? 'text-electric-300 font-bold' : 'text-slate-400'}`}>
                    {item.day}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-navy-800 flex items-center justify-between text-xs text-slate-400">
              <span>Total This Week: <strong>21.0 hrs</strong></span>
              <span>Total Questions Solved: <strong>58 Qs</strong></span>
            </div>
          </div>

        </div>

        {/* Right Col: Recommended Revision & Upcoming Practice */}
        <div className="space-y-6">
          
          {/* Recommended Revision Topics */}
          <div className="p-5 rounded-2xl bg-navy-900/80 border border-navy-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Recommended Revisions
              </h3>
              <button
                onClick={() => setActiveView('planner')}
                className="text-xs text-electric-400 hover:text-electric-300 font-medium"
              >
                View all
              </button>
            </div>
            
            <p className="text-[11px] text-slate-400 mb-3">
              AI automatically prioritized these from your recent quiz and evaluator results:
            </p>

            <div className="space-y-2.5">
              {pendingRevisions.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-xl bg-navy-950/70 border border-navy-800 hover:border-navy-700 transition-all flex items-start justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        task.priority === 'high' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {task.priority}
                      </span>
                      <span className="text-[10px] text-slate-400">{task.reason}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200">{task.title}</p>
                    <span className="text-[10px] text-slate-500 block">
                      Est. {task.timeEstimateMinutes} mins • {task.dueDate}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleRevisionTask(task.id)}
                    className="p-1 rounded text-slate-400 hover:text-emerald-400 flex-shrink-0"
                    title="Mark task as complete"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveView('planner')}
              className="w-full mt-3 py-2 rounded-xl bg-navy-800/80 hover:bg-navy-750 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
            >
              Open Full Revision Planner
            </button>
          </div>

          {/* Upcoming Practice Sessions Card */}
          <div className="p-5 rounded-2xl bg-navy-900/80 border border-navy-800">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-violet-400" />
              Upcoming Practice Sessions
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-navy-950/60 border border-navy-800">
                <div className="flex justify-between font-semibold text-slate-200">
                  <span>DBMS Unit 3 Midterm Mock</span>
                  <span className="text-electric-400">Tomorrow</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  15 Mins • 20 Marks • Normalization & ACID
                </p>
              </div>

              <div className="p-3 rounded-xl bg-navy-950/60 border border-navy-800">
                <div className="flex justify-between font-semibold text-slate-200">
                  <span>AI Foundations Quiz</span>
                  <span className="text-slate-400">Oct 14</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  20 Mins • 25 Marks • A* & Heuristic Proofs
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
