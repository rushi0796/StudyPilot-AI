import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { AcademicHeaderBanner } from './components/layout/AcademicHeaderBanner';
import { Footer } from './components/layout/Footer';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { TeamCodexModal } from './components/layout/TeamCodexModal';
import { OnboardingModal } from './components/onboarding/OnboardingModal';

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
import { Menu } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeView } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

      {/* Modals */}
      <GlobalSearchModal />
      <TeamCodexModal />
      <OnboardingModal />

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
