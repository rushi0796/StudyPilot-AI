import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { AcademicHeaderBanner } from './components/layout/AcademicHeaderBanner';
import { Footer } from './components/layout/Footer';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { AuthModal } from './components/auth/AuthModal';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { AIAssistantView } from './components/assistant/AIAssistantView';
import { MyFilesView } from './components/files/MyFilesView';
import { SubjectsView } from './components/subjects/SubjectsView';
import { SyllabusExplorerView } from './components/subjects/SyllabusExplorerView';
import { QuestionBankView } from './components/questions/QuestionBankView';
import { PracticeTestsView } from './components/practice/PracticeTestsView';
import { AnswerEvaluatorView } from './components/evaluator/AnswerEvaluatorView';
import { RevisionPlannerView } from './components/planner/RevisionPlannerView';
import { LearningProgressView } from './components/progress/LearningProgressView';
import { SettingsView } from './components/settings/SettingsView';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminLoginView } from './components/admin/AdminLoginView';
import { Menu, ShieldCheck } from 'lucide-react';
import { StudyPilotLoader } from './components/common/StudyPilotLoader';
import { FloatingVoiceButton } from './components/voice/FloatingVoiceButton';
import { VoiceCallModal } from './components/voice/VoiceCallModal';

/**
 * 1. Dedicated Super Admin Portal
 * Completely isolated from Student context, state, and cookies.
 */
const AdminPortal: React.FC<{ currentPath: string; onNavigate: (path: string) => void }> = ({
  currentPath,
  onNavigate
}) => {
  const { adminUser, isAdminLoading } = useAdminAuth();

  if (isAdminLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-slate-200 flex flex-col justify-center items-center p-6 font-sans">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center animate-pulse mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">
          Authenticating Super Admin Console…
        </div>
      </div>
    );
  }

  // Handle /admin-login
  if (currentPath === '/admin-login') {
    if (adminUser) {
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/admin');
      }
      return <AdminLayout />;
    }
    return (
      <AdminLoginView
        onSuccess={() => onNavigate('/admin')}
        onBackToStudent={() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
        }}
      />
    );
  }

  // Handle /admin and /admin/*
  if (adminUser) {
    return <AdminLayout />;
  }

  // If unauthenticated on /admin, display Admin Login View
  return (
    <AdminLoginView
      onSuccess={() => onNavigate('/admin')}
      onBackToStudent={() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }}
    />
  );
};

/**
 * 2. Dedicated Student Learning Portal
 * Completely isolated from Admin context, state, and cookies.
 */
const StudentPortalContent: React.FC = () => {
  const { activeView } = useApp();
  const { isLoading, bypassLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [voiceCallOpen, setVoiceCallOpen] = useState(false);

  if (isLoading) {
    return (
      <StudyPilotLoader
        message="Preparing your learning workspace…"
        subMessage="AI-Powered Personalized Learning Platform"
        onBypass={bypassLoading}
      />
    );
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardView />;
      case 'assistant': return <AIAssistantView />;
      case 'files': return <MyFilesView />;
      case 'subjects': return <SubjectsView />;
      case 'syllabus': return <SyllabusExplorerView />;
      case 'questions': return <QuestionBankView />;
      case 'practice': return <PracticeTestsView />;
      case 'evaluator': return <AnswerEvaluatorView />;
      case 'planner': return <RevisionPlannerView />;
      case 'progress': return <LearningProgressView />;
      case 'settings': return <SettingsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#252923] flex flex-col font-sans selection:bg-[#245B45] selection:text-white">
      {/* Top Academic Context Header */}
      <AcademicHeaderBanner />

      {/* Main Top Navbar */}
      <Navbar />

      {/* Mobile Sidebar Menu Toggle Trigger */}
      <div className="lg:hidden bg-white border-b border-[#E5E0D5] px-4 py-2 flex items-center justify-between">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex items-center gap-2 text-xs font-semibold text-charcoal-700 hover:text-charcoal-900 bg-sage-50 px-3 py-1.5 rounded-lg border border-[#E5E0D5]"
        >
          <Menu className="w-4 h-4 text-forest-600" />
          <span>Navigation Menu</span>
        </button>

        <span className="text-[11px] font-bold text-forest-700 uppercase tracking-wider">
          {activeView.replace('-', ' ')}
        </span>
      </div>

      {/* App Body: Sidebar + Main Dynamic Workstation */}
      <div className="flex-1 flex w-full">
        <Sidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          mobileOpen={mobileMenuOpen}
          setMobileOpen={setMobileMenuOpen}
        />

        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
          {renderActiveView()}
        </main>
      </div>

      {/* Professional SaaS Product Footer */}
      <Footer />

      {/* Real-time AI Voice Call Launcher & Modal */}
      <FloatingVoiceButton onClick={() => setVoiceCallOpen(true)} isActive={voiceCallOpen} />
      <VoiceCallModal isOpen={voiceCallOpen} onClose={() => setVoiceCallOpen(false)} />

      {/* Modals */}
      <GlobalSearchModal />
      <OnboardingModal />
      <AuthModal />
    </div>
  );
};

/**
 * 3. Root Application Router
 * Provides strict separation of contexts based on URL pathname.
 */
export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '/'
  );

  useEffect(() => {
    const handleLocationChange = () => {
      if (typeof window !== 'undefined') {
        setCurrentPath(window.location.pathname.toLowerCase());
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const isAdminRoute = currentPath === '/admin-login' || currentPath.startsWith('/admin');

  if (isAdminRoute) {
    return (
      <AdminAuthProvider>
        <AdminPortal
          currentPath={currentPath}
          onNavigate={(path) => {
            if (typeof window !== 'undefined') {
              window.history.pushState({}, '', path);
            }
            setCurrentPath(path);
          }}
        />
      </AdminAuthProvider>
    );
  }

  return (
    <AuthProvider>
      <AppProvider>
        <StudentPortalContent />
      </AppProvider>
    </AuthProvider>
  );
}
