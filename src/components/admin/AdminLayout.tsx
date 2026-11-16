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
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
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
  const { currentUser, adminLogout } = useAuth();
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
    <div className="min-h-screen bg-[#1A1F1B] text-[#F7F5EF] flex font-sans selection:bg-[#C59B52] selection:text-charcoal-900">
      {/* Mobile Sidebar Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ==========================================================
          DEDICATED SUPER ADMIN SIDEBAR (No Student Items)
         ========================================================== */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-[#1E231F] border-r border-[#2F3830] z-50 flex flex-col transition-transform duration-200 ease-in-out ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand & Admin Badge Header */}
        <div className="p-6 border-b border-[#2F3830]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#245B45] to-[#15382B] border border-[#2F6B52] flex items-center justify-center shadow-lg shadow-black/40">
                <ShieldCheck className="w-5 h-5 text-[#E2C785]" />
              </div>
              <div>
                <span className="text-sm font-extrabold tracking-tight text-white block">
                  StudyPilot AI
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E2C785] block font-mono">
                  Admin Console v2.5
                </span>
              </div>
            </div>

            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-xl text-[#A0A89C] hover:text-white hover:bg-[#2A322B] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 p-2.5 rounded-xl bg-[#283229] border border-[#3A473C] flex items-center gap-2 text-[11px] text-[#D5DCD2]">
            <Lock className="w-3.5 h-3.5 text-[#E2C785] flex-shrink-0" />
            <span className="truncate font-mono">Super Admin: {currentUser?.email || 'admin@studypilot.ai'}</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id || (item.id === 'students' && activeSection === 'student-detail');
            return (
              <button
                key={item.id}
                onClick={() => navigateToSection(item.id as AdminSection)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#2E362F] text-[#E2C785] border border-[#3E4A3F] shadow-sm'
                    : 'text-[#A0A89C] hover:text-white hover:bg-[#252C26]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#E2C785]' : 'text-[#859180]'}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#E2C785]" />}
              </button>
            );
          })}
        </nav>

        {/* Logout Bottom Footer */}
        <div className="p-4 border-t border-[#2F3830]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#2A2323] hover:bg-rose-950/60 text-rose-300 border border-rose-900/60 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Terminate Admin Session</span>
          </button>
        </div>
      </aside>

      {/* ==========================================================
          MAIN ADMIN WORKSPACE & HEADER
         ========================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-[#1E231F]/90 backdrop-blur-md border-b border-[#2F3830] px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#A0A89C] hover:text-white bg-[#2A322B] border border-[#374138]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#859180] block font-mono">
                System Administration
              </span>
              <span className="text-sm font-extrabold text-white capitalize">
                {activeSection === 'student-detail' ? 'Student Profile & Documents' : activeSection.replace('-', ' ')}
              </span>
            </div>
          </div>

          {/* Database Live Health Status Badge */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#242A25] border border-[#374138] text-[11px] font-mono text-[#A0A89C]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Neon PostgreSQL: Online</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden md:inline-block text-xs font-bold text-[#E2C785] bg-[#2E362F] px-3 py-1 rounded-full border border-[#3E4A3F]">
                Root Admin
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Section Workstation */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
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
