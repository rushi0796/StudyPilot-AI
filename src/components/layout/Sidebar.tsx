import React from 'react';
import { 
  LayoutDashboard, 
  Bot, 
  BookOpen, 
  Compass, 
  HelpCircle, 
  CheckSquare, 
  Award, 
  CalendarClock, 
  TrendingUp, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  GraduationCap
} from 'lucide-react';
import { useApp, ActiveView } from '../../context/AppContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  collapsed, 
  setCollapsed,
  mobileOpen,
  setMobileOpen
}) => {
  const { activeView, setActiveView, revisionTasks } = useApp();

  const pendingRevisions = revisionTasks.filter(r => !r.completed).length;

  const navItems: { id: ActiveView; label: string; icon: React.ElementType; badge?: string | number; badgeColor?: string; flagship?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assistant', label: 'AI Study Assistant', icon: Bot, badge: 'Ask AI', badgeColor: 'bg-electric-500/20 text-electric-300' },
    { id: 'subjects', label: 'My Subjects', icon: BookOpen },
    { id: 'syllabus', label: 'Syllabus Explorer', icon: Compass },
    { id: 'questions', label: 'Question Bank', icon: HelpCircle, badge: '2-10M', badgeColor: 'bg-navy-700 text-slate-300' },
    { id: 'practice', label: 'Practice Tests', icon: CheckSquare },
    { id: 'evaluator', label: 'Answer Evaluator', icon: Award, badge: 'Flagship', badgeColor: 'bg-gradient-to-r from-electric-500/30 to-violet-500/30 text-electric-200 border border-electric-400/40', flagship: true },
    { id: 'planner', label: 'Revision Planner', icon: CalendarClock, badge: pendingRevisions > 0 ? pendingRevisions : undefined, badgeColor: 'bg-amber-500/20 text-amber-300' },
    { id: 'progress', label: 'Learning Progress', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (viewId: ActiveView) => {
    setActiveView(viewId);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside className={`
        fixed lg:sticky top-0 lg:top-[57px] left-0 z-50 lg:z-30 h-screen lg:h-[calc(100vh-57px)]
        bg-[#0B1020] border-r border-navy-700/60 transition-all duration-300 ease-in-out flex flex-col justify-between
        ${collapsed ? 'w-20' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Navigation Header / Toggle */}
        <div className="p-3 border-b border-navy-800/80 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2 px-2">
              <GraduationCap className="w-4 h-4 text-electric-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Navigation
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors mx-auto"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group relative
                  ${isActive 
                    ? 'bg-electric-600/20 text-electric-300 border border-electric-500/40 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-navy-800/60 border border-transparent'
                  }
                  ${collapsed ? 'justify-center px-0' : ''}
                `}
                title={collapsed ? item.label : undefined}
              >
                <div className={`p-1 rounded-lg ${isActive ? 'text-electric-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  <Icon className="w-4 h-4" />
                </div>

                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between truncate">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${item.badgeColor || 'bg-navy-800 text-slate-400'}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}

                {/* Active Indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-electric-500 rounded-r" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Academic Project Watermark */}
        <div className="p-3 border-t border-navy-800/80 bg-navy-950/40">
          {!collapsed ? (
            <div className="p-2.5 rounded-xl bg-navy-900/60 border border-navy-800 text-[11px]">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                <Shield className="w-3.5 h-3.5 text-electric-400" />
                <span>Sanjay Ghodawat Univ.</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Team Codex • 2nd Yr AI
              </p>
              <div className="mt-2 pt-1.5 border-t border-navy-800/60 flex items-center justify-between text-[10px] text-slate-400">
                <span className="text-emerald-400 font-medium">● Local Demo</span>
                <span>v1.0.0</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center text-slate-500" title="SGU • Team Codex">
              <Shield className="w-4 h-4 text-electric-400" />
            </div>
          )}
        </div>

      </aside>
    </>
  );
};
