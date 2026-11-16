import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { AcademicHeaderBanner } from './components/layout/AcademicHeaderBanner';
import { Footer } from './components/layout/Footer';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { TeamCodexModal } from './components/layout/TeamCodexModal';
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
import { Menu, ShieldAlert } from 'lucide-react';
import { StudyPilotLoader } from './components/common/StudyPilotLoader';
import { FloatingVoiceButton } from './components/voice/FloatingVoiceButton';
import { VoiceCallModal } from './components/voice/VoiceCallModal';

const AppContent: React.FC = () => {
  const { activeView } = useApp();
  const { currentUser, isLoading, bypassLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [voiceCallOpen, setVoiceCallOpen] = useState(false);
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

  if (isLoading) {
    return (
      <StudyPilotLoader
        message="Preparing your learning workspace…"
        subMessage="Sanjay Ghodawat University • Team Codex"
        onBypass={bypassLoading}
      />
    );
  }

  // 1. Dedicated Admin Login Route (/admin-login)
  if (currentPath === '/admin-login') {
    if (currentUser?.role === 'super_admin') {
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/admin');
      }
      return <AdminLayout />;
    }
    return (
      <AdminLoginView
        onSuccess={() => {
          setCurrentPath('/admin');
        }}
        onBackToStudent={() => {
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', '/');
          }
          setCurrentPath('/');
        }}
      />
    );
  }

  // 2. Protected Administration Routes (/admin, /admin/*)
  if (currentPath.startsWith('/admin')) {
    // Authenticated Super Admin -> render dedicated AdminLayout
    if (currentUser?.role === 'super_admin') {
      return <AdminLayout />;
    }

    // Authenticated Student -> block access with clear error
    if (currentUser?.role === 'student') {
      return (
        <div className="min-h-screen bg-[#F7F5EF] flex flex-col justify-center items-center p-6 text-center">
          <div className="bg-white p-8 rounded-3xl border border-[#E5E0D5] shadow-xl max-w-md space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-extrabold text-charcoal-900 tracking-tight">Access Restricted</h2>
            <p className="text-xs text-charcoal-600 leading-relaxed">
              Super Admin authorization is required to access this control plane. Your account (<span className="font-mono font-bold text-charcoal-800">{currentUser.email}</span>) has student privileges.
            </p>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '/');
                }
                setCurrentPath('/');
              }}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-forest-600 text-white hover:bg-forest-700 transition-colors cursor-pointer"
            >
              Return to Student Dashboard
            </button>
          </div>
        </div>
      );
    }

    // Unauthenticated visitor -> show dedicated Admin Login
    return (
      <AdminLoginView
        onSuccess={() => {
          setCurrentPath('/admin');
        }}
        onBackToStudent={() => {
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', '/');
          }
          setCurrentPath('/');
        }}
      />
    );
  }

  // 3. If authenticated as Super Admin on any route -> render AdminLayout exclusively!
  if (currentUser?.role === 'super_admin') {
    return <AdminLayout />;
  }

  // 4. Standard Student Application Layout
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

      {/* University & Team Codex Footer */}
      <Footer />

      {/* Real-time AI Voice Call Launcher & Modal */}
      <FloatingVoiceButton onClick={() => setVoiceCallOpen(true)} isActive={voiceCallOpen} />
      <VoiceCallModal isOpen={voiceCallOpen} onClose={() => setVoiceCallOpen(false)} />

      {/* Modals */}
      <GlobalSearchModal />
      <TeamCodexModal />
      <OnboardingModal />
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
