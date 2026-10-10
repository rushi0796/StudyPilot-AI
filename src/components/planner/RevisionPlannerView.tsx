import React, { useState } from 'react';
import { 
  CalendarClock, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Sparkles, 
  Clock, 
  Check, 
  X,
  Layers,
  Award
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RevisionTask } from '../../types';

export const RevisionPlannerView: React.FC = () => {
  const { 
    revisionTasks, 
    toggleRevisionTask, 
    addRevisionTask, 
    deleteRevisionTask,
    subjects,
    setActiveView 
  } = useApp();

  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState(subjects[0]?.name || 'Database Management Systems');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [newDueDate, setNewDueDate] = useState('Tomorrow');
  const [newEstMinutes, setNewEstMinutes] = useState(25);

  const completedCount = revisionTasks.filter(t => t.completed).length;
  const totalCount = revisionTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredTasks = revisionTasks.filter(t => {
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterStatus === 'pending' && t.completed) return false;
    if (filterStatus === 'completed' && !t.completed) return false;
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addRevisionTask({
      title: newTitle.trim(),
      subject: newSubject,
      priority: newPriority,
      reason: 'User Pinned',
      dueDate: newDueDate,
      timeEstimateMinutes: Number(newEstMinutes)
    });

    setNewTitle('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-navy-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <CalendarClock className="w-6 h-6 text-amber-400" />
              Revision Planner
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Spaced Repetition
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Prioritized review schedule driven by quiz misses and answer evaluation gap analysis.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-500 text-white font-semibold text-xs shadow-glow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Revision Goal</span>
        </button>
      </div>

      {/* 2. Progress & Priority Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Progress Card */}
        <div className="p-5 rounded-2xl bg-navy-900/80 border border-navy-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Weekly Completion</span>
            <span className="font-bold text-white">{completedCount} of {totalCount} Done</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{progressPercent}%</span>
            <span className="text-xs text-emerald-400 font-semibold">On Track</span>
          </div>
          <div className="w-full bg-navy-950 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* High Priority Warning Card */}
        <div className="p-5 rounded-2xl bg-navy-900/80 border border-navy-800 space-y-2">
          <span className="text-xs text-rose-400 font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            Urgent Review Topics
          </span>
          <p className="text-2xl font-black text-white">
            {revisionTasks.filter(t => t.priority === 'high' && !t.completed).length} Concepts
          </p>
          <p className="text-[11px] text-slate-400">
            Missed in recent DBMS normal forms & concurrency quizzes.
          </p>
        </div>

        {/* Study Strategy Tip */}
        <div className="p-5 rounded-2xl bg-navy-900/80 border border-navy-800 space-y-2">
          <span className="text-xs text-electric-400 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            AI Revision Insight
          </span>
          <p className="text-xs text-slate-300 leading-relaxed">
            Allocating 25 minutes to <strong>BCNF Dependency Preservation</strong> today will boost your estimated exam score to 85%+.
          </p>
        </div>

      </div>

      {/* 3. Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        
        {/* Priority Tabs */}
        <div className="flex items-center gap-1 bg-navy-900 p-1 rounded-xl border border-navy-800 text-xs">
          {(['all', 'high', 'medium', 'low'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all ${
                filterPriority === p 
                  ? 'bg-navy-800 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p === 'all' ? 'All Priorities' : `${p} Priority`}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-navy-900 p-1 rounded-xl border border-navy-800 text-xs">
          {(['all', 'pending', 'completed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all ${
                filterStatus === s 
                  ? 'bg-electric-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

      </div>

      {/* 4. Revision Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-400 rounded-2xl bg-navy-900 border border-navy-800">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-60" />
            <p className="font-semibold text-white">No tasks in this view!</p>
            <p className="text-xs text-slate-500 mt-1">All prioritized study items have been completed.</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                task.completed 
                  ? 'bg-navy-950/40 border-navy-850 opacity-60' 
                  : 'bg-navy-900/80 border-navy-800 hover:border-navy-750'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleRevisionTask(task.id)}
                  className={`w-6 h-6 rounded-lg mt-0.5 flex items-center justify-center transition-colors flex-shrink-0 ${
                    task.completed 
                      ? 'bg-emerald-500 text-white' 
                      : 'border-2 border-navy-700 hover:border-emerald-400 text-transparent'
                  }`}
                  title={task.completed ? "Mark pending" : "Mark completed"}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </button>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase ${
                      task.priority === 'high' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      task.priority === 'medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {task.priority} Priority
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Trigger: {task.reason}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      • {task.subject}
                    </span>
                  </div>

                  <h3 className={`text-xs sm:text-sm font-bold ${
                    task.completed ? 'line-through text-slate-400' : 'text-white'
                  }`}>
                    {task.title}
                  </h3>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      Est. {task.timeEstimateMinutes} mins
                    </span>
                    <span>Due: <strong>{task.dueDate}</strong></span>
                    {task.dateCompleted && (
                      <span className="text-emerald-400 font-medium">Completed: {task.dateCompleted}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveView('assistant')}
                  className="px-2.5 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 text-slate-300 hover:text-white text-xs font-semibold"
                  title="Ask AI to review this topic"
                >
                  Study Now
                </button>
                <button
                  onClick={() => deleteRevisionTask(task.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-navy-800 transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* 5. Add Custom Revision Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateTask}
            className="w-full max-w-md bg-navy-900 border border-navy-700 rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-navy-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-electric-400" />
                Add Revision Topic
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Topic Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Master Armstrong Axioms and Transitive FDs"
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-700 text-white focus:border-electric-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Subject</label>
                <select
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-700 text-white focus:border-electric-500 focus:outline-none"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-700 text-white focus:border-electric-500 focus:outline-none"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Estimated Time</label>
                  <input
                    type="number"
                    value={newEstMinutes}
                    onChange={(e) => setNewEstMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-700 text-white focus:border-electric-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Target Date</label>
                <input
                  type="text"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  placeholder="e.g. Tomorrow 08:00 PM or Oct 15"
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-700 text-white focus:border-electric-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-navy-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-navy-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-electric-600 hover:bg-electric-500 text-white text-xs font-bold shadow-glow"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
