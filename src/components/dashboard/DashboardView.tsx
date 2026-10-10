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
  GraduationCap,
  FolderOpen
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
    toggleRevisionTask,
    uploadedDocuments
  } = useApp();

  const pendingRevisions = revisionTasks.filter(r => !r.completed);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* 1. Hero Welcome & Quick Study Launcher */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-[#E5E0D5] p-6 lg:p-8 shadow-card">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-forest-50 text-forest-700 border border-forest-200">
                <GraduationCap className="w-3.5 h-3.5" />
                {studentProfile.university} • {studentProfile.semester}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                4-Day Study Streak
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-black text-charcoal-900 tracking-tight">
              Welcome back, <span className="text-forest-600">{studentProfile.name}</span>!
            </h1>
            
            <p className="text-xs sm:text-sm text-charcoal-700 leading-relaxed">
              Your AI study assistant has prepared today’s syllabus goals for <strong className="text-charcoal-900">{studentProfile.branch}</strong>. You have 2 weak topics recommended for revision before upcoming tests.
            </p>
          </div>

          {/* Prominent "Continue Studying" Call to Action */}
          <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <button
              onClick={() => {
                setActiveSubjectId('cs201');
                setActiveView('assistant');
              }}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-forest-500 hover:bg-forest-600 text-white font-bold text-sm shadow-card hover:shadow-hover transition-all duration-200 group"
            >
              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span>Continue Studying (DBMS Unit 3)</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => setActiveView('evaluator')}
              className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-academic-bg hover:bg-sage-100 text-charcoal-800 font-bold text-xs border border-[#E5E0D5] transition-colors shadow-subtle"
            >
              <Award className="w-4 h-4 text-forest-600" />
              <span>Open Answer Evaluator</span>
            </button>
          </div>
        </div>

        {/* Quick Subject Switcher Pills */}
        <div className="relative z-10 mt-6 pt-5 border-t border-[#E5E0D5] flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-charcoal-400 mr-1">Active Subjects:</span>
          {subjects.map((sub) => {
            const isSelected = sub.id === activeSubject.id;
            return (
              <button
                key={sub.id}
                onClick={() => setActiveSubjectId(sub.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected 
                    ? 'bg-sage-200 text-forest-800 border border-forest-300 shadow-subtle' 
                    : 'bg-academic-bg text-charcoal-700 hover:text-charcoal-900 border border-[#E5E0D5] hover:bg-sage-50'
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
        <div className="p-5 rounded-2xl bg-white border border-[#E5E0D5] shadow-subtle hover:border-forest-300 transition-colors">
          <div className="flex items-center justify-between text-charcoal-400 text-xs">
            <span>Syllabus Covered</span>
            <BookOpen className="w-4 h-4 text-forest-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-charcoal-900">64%</span>
            <span className="text-[11px] text-forest-700 font-bold">+8% this week</span>
          </div>
          <div className="w-full bg-sage-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-forest-500 h-full rounded-full" style={{ width: '64%' }} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E0D5] shadow-subtle hover:border-forest-300 transition-colors">
          <div className="flex items-center justify-between text-charcoal-400 text-xs">
            <span>Questions Attempted</span>
            <FileQuestion className="w-4 h-4 text-forest-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-charcoal-900">42</span>
            <span className="text-[11px] text-charcoal-400">across 2-10 marks</span>
          </div>
          <div className="w-full bg-sage-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-forest-500 h-full rounded-full" style={{ width: '55%' }} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E0D5] shadow-subtle hover:border-forest-300 transition-colors">
          <div className="flex items-center justify-between text-charcoal-400 text-xs">
            <span>Evaluator Avg Score</span>
            <Award className="w-4 h-4 text-gold-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-charcoal-900">78%</span>
            <span className="text-[11px] text-forest-700 font-bold">Good Tier</span>
          </div>
          <div className="w-full bg-sage-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-forest-500 h-full rounded-full" style={{ width: '78%' }} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E0D5] shadow-subtle hover:border-forest-300 transition-colors">
          <div className="flex items-center justify-between text-charcoal-400 text-xs">
            <span>Pending Revisions</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-charcoal-900">{pendingRevisions.length}</span>
            <span className="text-[11px] text-amber-700 font-bold">Priority Tasks</span>
          </div>
          <div className="w-full bg-sage-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, pendingRevisions.length * 25)}%` }} />
          </div>
        </div>
      </div>

      {/* 3. Quick-Access Cards: Ask AI, Question Bank, Practice Test, Answer Evaluator, My Files */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-400">
            Quick Study Hub
          </h2>
          <span className="text-xs text-charcoal-400 font-medium">Click any card to start</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Ask AI */}
          <button
            onClick={() => setActiveView('assistant')}
            className="p-5 rounded-2xl bg-white border border-[#E5E0D5] hover:border-forest-400 transition-all text-left group shadow-subtle hover:shadow-card hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-600 border border-forest-100 flex items-center justify-center mb-3 group-hover:bg-forest-500 group-hover:text-white transition-all shadow-subtle">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-charcoal-900 group-hover:text-forest-600 transition-colors">
              Ask AI Study Assistant
            </h3>
            <p className="text-xs text-charcoal-400 mt-1 leading-relaxed">
              Clear complex doubts, simplify derivations, or listen to voice audio explanations.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-forest-600 font-bold group-hover:translate-x-1 transition-transform">
              <span>Start session</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* My Files / Materials */}
          <button
            onClick={() => setActiveView('files')}
            className="p-5 rounded-2xl bg-white border border-[#E5E0D5] hover:border-forest-400 transition-all text-left group shadow-subtle hover:shadow-card hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-600 border border-forest-100 flex items-center justify-center mb-3 group-hover:bg-forest-500 group-hover:text-white transition-all shadow-subtle">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-charcoal-900 group-hover:text-forest-600 transition-colors">
                My Files & Materials
              </h3>
              {uploadedDocuments.length > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-sage-200 text-forest-800">
                  {uploadedDocuments.length}
                </span>
              )}
            </div>
            <p className="text-xs text-charcoal-400 mt-1 leading-relaxed">
              Upload syllabus PDFs & notes (up to 20MB) to ground AI answers with source citations.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-forest-600 font-bold group-hover:translate-x-1 transition-transform">
              <span>Manage documents</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Question Bank */}
          <button
            onClick={() => setActiveView('questions')}
            className="p-5 rounded-2xl bg-white border border-[#E5E0D5] hover:border-forest-400 transition-all text-left group shadow-subtle hover:shadow-card hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-600 border border-forest-100 flex items-center justify-center mb-3 group-hover:bg-forest-500 group-hover:text-white transition-all shadow-subtle">
              <FileQuestion className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-charcoal-900 group-hover:text-forest-600 transition-colors">
              Marks-Wise Question Bank
            </h3>
            <p className="text-xs text-charcoal-400 mt-1 leading-relaxed">
              Explore 2, 3, 4, 5, 7, and 10 marks questions with official marking rubrics and model answers.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-forest-600 font-bold group-hover:translate-x-1 transition-transform">
              <span>Browse questions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Answer Evaluator */}
          <button
            onClick={() => setActiveView('evaluator')}
            className="p-5 rounded-2xl bg-white border border-forest-300 hover:border-forest-500 transition-all text-left group shadow-card hover:shadow-hover hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-xl bg-forest-500 text-white flex items-center justify-center mb-3 shadow-subtle">
              <Award className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-charcoal-900 group-hover:text-forest-600 transition-colors">
                AI Answer Evaluator
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-gold-100 text-gold-600 border border-gold-200">
                Flagship
              </span>
            </div>
            <p className="text-xs text-charcoal-400 mt-1 leading-relaxed">
              Write student exam answers and get instant estimated marks, missing points, and rubrics.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-forest-700 font-bold group-hover:translate-x-1 transition-transform">
              <span>Evaluate answer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

        </div>
      </div>

      {/* 4. Active Topic Progress & Recommended Revisions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Continue Learning & Activity Chart */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Continue Learning Highlight Card */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5E0D5] shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D5]">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-forest-700">
                  Continue Learning
                </span>
                <h3 className="text-base font-bold text-charcoal-900 mt-0.5">
                  CS201: Relational Database Normalization
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-academic-bg text-charcoal-700 border border-[#E5E0D5]">
                Unit 3 • 26% Weightage
              </span>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-charcoal-700 leading-relaxed">
                Currently studying <strong>3NF vs BCNF decompositions</strong> and transitive functional dependency resolution for university semester exams.
              </p>
              
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-charcoal-400">
                  <span>Unit 3 Completion</span>
                  <span className="font-bold text-charcoal-900">67% (2 of 3 Topics Mastered)</span>
                </div>
                <div className="w-full bg-sage-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-forest-500 h-full rounded-full" style={{ width: '67%' }} />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5E0D5] flex items-center justify-between">
              <span className="text-xs text-charcoal-400">
                Last studied: Today at 02:30 PM
              </span>
              <button
                onClick={() => {
                  setActiveSubjectId('cs201');
                  setActiveView('assistant');
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-500 hover:bg-forest-600 text-white font-bold text-xs shadow-card transition-colors"
              >
                <span>Resume Lesson</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Weekly Study Activity Visualization */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5E0D5] shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-charcoal-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-forest-600" />
                  Weekly Study Activity
                </h3>
                <p className="text-[11px] text-charcoal-400 mt-0.5">
                  Hours studied and questions solved per day (Demo Analytics)
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-academic-bg text-charcoal-700 border border-[#E5E0D5]">
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
                  <div className="text-[10px] text-charcoal-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.hours}h
                  </div>
                  <div className="w-full bg-sage-50 rounded-xl p-0.5 flex flex-col justify-end h-28 border border-[#E5E0D5]">
                    <div 
                      className={`w-full rounded-lg transition-all duration-300 ${
                        item.active 
                          ? 'bg-forest-500 shadow-card' 
                          : 'bg-forest-300 group-hover:bg-forest-400'
                      }`}
                      style={{ height: item.height }}
                    />
                  </div>
                  <span className={`text-[11px] font-semibold ${item.active ? 'text-forest-700 font-bold' : 'text-charcoal-400'}`}>
                    {item.day}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[#E5E0D5] flex items-center justify-between text-xs text-charcoal-400">
              <span>Total This Week: <strong className="text-charcoal-900">21.0 hrs</strong></span>
              <span>Total Questions Solved: <strong className="text-charcoal-900">58 Qs</strong></span>
            </div>
          </div>

        </div>

        {/* Right Col: Recommended Revision & Upcoming Practice */}
        <div className="space-y-6">
          
          {/* Recommended Revision Topics */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5E0D5] shadow-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-charcoal-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Recommended Revisions
              </h3>
              <button
                onClick={() => setActiveView('planner')}
                className="text-xs text-forest-600 hover:text-forest-800 font-bold"
              >
                View all
              </button>
            </div>
            
            <p className="text-[11px] text-charcoal-400 mb-3">
              AI automatically prioritized these from your quiz & evaluator gaps:
            </p>

            <div className="space-y-2.5">
              {pendingRevisions.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-xl bg-academic-bg border border-[#E5E0D5] hover:border-forest-300 transition-all flex items-start justify-between gap-2 shadow-subtle"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        task.priority === 'high' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {task.priority}
                      </span>
                      <span className="text-[10px] text-charcoal-400">{task.reason}</span>
                    </div>
                    <p className="text-xs font-bold text-charcoal-900">{task.title}</p>
                    <span className="text-[10px] text-charcoal-400 block">
                      Est. {task.timeEstimateMinutes} mins • {task.dueDate}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleRevisionTask(task.id)}
                    className="p-1 rounded text-charcoal-400 hover:text-forest-600 flex-shrink-0"
                    title="Mark task as complete"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveView('planner')}
              className="w-full mt-3 py-2 rounded-xl bg-academic-bg hover:bg-sage-100 text-charcoal-700 text-xs font-bold border border-[#E5E0D5] transition-colors"
            >
              Open Full Revision Planner
            </button>
          </div>

          {/* Upcoming Practice Sessions Card */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5E0D5] shadow-card">
            <h3 className="font-bold text-sm text-charcoal-900 flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-forest-600" />
              Upcoming Practice Sessions
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-academic-bg border border-[#E5E0D5]">
                <div className="flex justify-between font-bold text-charcoal-900">
                  <span>DBMS Unit 3 Midterm Mock</span>
                  <span className="text-forest-700">Tomorrow</span>
                </div>
                <p className="text-[11px] text-charcoal-400 mt-1">
                  15 Mins • 20 Marks • Normalization & ACID
                </p>
              </div>

              <div className="p-3 rounded-xl bg-academic-bg border border-[#E5E0D5]">
                <div className="flex justify-between font-bold text-charcoal-900">
                  <span>AI Foundations Quiz</span>
                  <span className="text-charcoal-400">Oct 14</span>
                </div>
                <p className="text-[11px] text-charcoal-400 mt-1">
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
