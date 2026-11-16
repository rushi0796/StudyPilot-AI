import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Cpu,
  Layers,
  Activity,
  Settings,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  Database,
  Lock,
  ArrowUpRight
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminOverviewView } from './views/AdminOverviewView';
import { AdminStudentsView } from './views/AdminStudentsView';
import { AdminStudentDetailsView } from './views/AdminStudentDetailsView';
import { AdminFilesView } from './views/AdminFilesView';
import { AdminProcessingStatusView } from './views/AdminProcessingStatusView';
import { AdminRagInspectionView } from './views/AdminRagInspectionView';
import { AdminActivityLogsView } from './views/AdminActivityLogsView';
import { AdminSettingsView } from './views/AdminSettingsView';

export type AdminSection =
  | 'overview'
  | 'students'
  | 'student-detail'
  | 'files'
  | 'processing'
  | 'rag'
  | 'activity'
  | 'settings';

export const AdminLayout: React.FC = () => {
  const { adminUser, adminLogout } = useAdminAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [inspectDocId, setInspectDocId] = useState<string | undefined>(undefined);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Sync section with browser URL on initial load and route changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path === '/admin/students' || path.startsWith('/admin/students/')) {
        const parts = path.split('/');
        if (parts[3]) {
          setSelectedStudentId(parts[3]);
          setActiveSection('student-detail');
        } else {
          setActiveSection('students');
        }
      } else if (path === '/admin/files') {
        setActiveSection('files');
      } else if (path === '/admin/activity') {
        setActiveSection('activity');
      } else if (path === '/admin/processing') {
        setActiveSection('processing');
      } else if (path === '/admin/rag') {
        setActiveSection('rag');
      } else if (path === '/admin/settings') {
        setActiveSection('settings');
      } else if (path === '/admin' || path === '/admin/') {
        setActiveSection('overview');
      }
    }
  }, []);

  const navigateToSection = (section: AdminSection, meta?: any) => {
    setActiveSection(section);
    setMobileSidebarOpen(false);

    let targetUrl = '/admin';
    if (section === 'students') targetUrl = '/admin/students';
    else if (section === 'student-detail' && meta?.userId) {
      setSelectedStudentId(meta.userId);
      targetUrl = `/admin/students/${meta.userId}`;
    } else if (section === 'files') targetUrl = '/admin/files';
    else if (section === 'activity') targetUrl = '/admin/activity';
    else if (section === 'processing') targetUrl = '/admin/processing';
    else if (section === 'rag') {
      if (meta?.docId) setInspectDocId(meta.docId);
      targetUrl = '/admin/rag';
    } else if (section === 'settings') targetUrl = '/admin/settings';

    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', targetUrl);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out of the Super Admin Control Plane?')) {
      await adminLogout();
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', '/admin-login');
        window.location.href = '/admin-login';
      }
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'students', label: 'All Students', icon: Users },
    { id: 'files', label: 'All Uploaded Files', icon: FolderOpen },
    { id: 'processing', label: 'Processing Status', icon: Cpu },
    { id: 'rag', label: 'RAG Inspection', icon: Layers },
    { id: 'activity', label: 'Activity Logs', icon: Activity },
    { id: 'settings', label: 'Admin Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Mobile Sidebar Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ==========================================================
          DEDICATED SUPER ADMIN SIDEBAR
         ========================================================== */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-[#0F172A] border-r border-slate-800/80 z-50 flex flex-col transition-transform duration-200 ease-in-out ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand & Admin Badge Header */}
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight text-white block">
                  StudyPilot AI
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 block font-mono">
                  Super Admin Console
                </span>
              </div>
            </div>

            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 text-[11px] text-slate-300">
            <Lock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="truncate font-mono">{adminUser?.email || 'admin@studypilot.ai'}</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id || (item.id === 'students' && activeSection === 'student-detail');
            return (
              <button
                key={item.id}
                onClick={() => navigateToSection(item.id as AdminSection)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions: Switch to Student Portal & Terminate Session */}
        <div className="p-3 border-t border-slate-800/80 space-y-1.5">
          <a
            href="/"
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent transition-all"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Student Portal</span>
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
          </a>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>

      {/* ==========================================================
          MAIN ADMIN WORKSPACE & HEADER
         ========================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white bg-slate-800 border border-slate-700"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                  Admin
                </span>
                <span className="text-slate-600">/</span>
                <span className="text-xs font-semibold text-slate-300 capitalize">
                  {activeSection === 'student-detail' ? 'Student Profile' : activeSection.replace('-', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Database Live Health Status Badge */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Neon PostgreSQL: Online</span>
            </div>

            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 font-mono">
              Root Super Admin
            </span>
          </div>
        </header>

        {/* Dynamic Section Workstation */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activeSection === 'overview' && (
            <AdminOverviewView onNavigateTab={navigateToSection} />
          )}

          {activeSection === 'students' && (
            <AdminStudentsView
              onSelectStudent={(studentId) => {
                setSelectedStudentId(studentId);
                navigateToSection('student-detail', { userId: studentId });
              }}
            />
          )}

          {activeSection === 'student-detail' && selectedStudentId && (
            <AdminStudentDetailsView
              studentId={selectedStudentId}
              onBack={() => navigateToSection('students')}
              onInspectDocument={(docId) => {
                setInspectDocId(docId);
                navigateToSection('rag', { docId });
              }}
            />
          )}

          {activeSection === 'files' && (
            <AdminFilesView
              onInspectDocument={(docId) => {
                setInspectDocId(docId);
                navigateToSection('rag', { docId });
              }}
            />
          )}

          {activeSection === 'processing' && (
            <AdminProcessingStatusView />
          )}

          {activeSection === 'rag' && (
            <AdminRagInspectionView initialDocId={inspectDocId} />
          )}

          {activeSection === 'activity' && (
            <AdminActivityLogsView />
          )}

          {activeSection === 'settings' && (
            <AdminSettingsView />
          )}
        </main>
      </div>
    </div>
  );
};
