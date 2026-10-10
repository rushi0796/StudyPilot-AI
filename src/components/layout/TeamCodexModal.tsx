import React from 'react';
import { X, Award, Users, Cpu, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TEAM_MEMBERS, UNIVERSITY_INFO } from '../../data/mockData';

export const TeamCodexModal: React.FC = () => {
  const { teamModalOpen, setTeamModalOpen } = useApp();

  if (!teamModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-[#E5E0D5] rounded-3xl shadow-elevated p-6 lg:p-8">
        
        {/* Close Button */}
        <button
          onClick={() => setTeamModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-xl text-charcoal-400 hover:text-charcoal-700 bg-academic-bg hover:bg-sage-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 pb-6 border-b border-[#E5E0D5]">
          <div className="w-14 h-14 rounded-2xl bg-forest-500 text-white flex items-center justify-center shadow-card">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black text-charcoal-900 tracking-tight">
                StudyPilot AI
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-forest-100 text-forest-800 border border-forest-200">
                Academic Project
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gold-100 text-gold-600 border border-gold-300">
                Team Codex
              </span>
            </div>
            <p className="text-sm text-charcoal-700 font-medium mt-1">
              AI-Powered Personalized Study Assistant for College Students
            </p>
            <p className="text-xs text-charcoal-400 mt-0.5">
              {UNIVERSITY_INFO.name} • {UNIVERSITY_INFO.department} • {UNIVERSITY_INFO.academicYear} ({UNIVERSITY_INFO.semester})
            </p>
          </div>
        </div>

        {/* Team Members Grid */}
        <div className="py-6 border-b border-[#E5E0D5]">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-forest-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-400">
              Team Codex Members (AI Batch 2023–2027)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEAM_MEMBERS.map((member, idx) => (
              <div 
                key={idx}
                className="p-4 rounded-2xl bg-academic-bg border border-[#E5E0D5] hover:border-forest-400 transition-all flex flex-col justify-between shadow-subtle"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-forest-100 border border-forest-200 flex items-center justify-center text-forest-700 font-bold text-sm mb-3">
                    {member.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <h4 className="font-bold text-sm text-charcoal-900">
                    {member.name}
                  </h4>
                  <p className="text-xs text-forest-600 font-semibold mt-0.5">
                    {member.role}
                  </p>
                </div>
                <p className="text-[11px] text-charcoal-400 mt-3 pt-2 border-t border-[#E5E0D5] leading-relaxed">
                  {member.focus}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Project Architecture & Stack */}
        <div className="py-6 space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-400 flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-forest-600" />
              Technical Stack & System Architecture
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-academic-bg border border-[#E5E0D5]">
                <span className="font-bold text-forest-800 block mb-1">Frontend Engineering</span>
                <p className="text-charcoal-400 leading-relaxed">
                  React 19 + TypeScript, Tailwind CSS with custom academic palette, responsive 16:9 dashboard, and Web Speech API.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-academic-bg border border-[#E5E0D5]">
                <span className="font-bold text-forest-800 block mb-1">AI & Evaluation Engine</span>
                <p className="text-charcoal-400 leading-relaxed">
                  Google Gemini 1.5/2.5 Flash API integration with in-browser document RAG retrieval and SGU exam rubrics.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-academic-bg border border-[#E5E0D5]">
                <span className="font-bold text-forest-800 block mb-1">Multilingual & Voice</span>
                <p className="text-charcoal-400 leading-relaxed">
                  Support for English, Hindi (हिंदी), and Telugu (తెలుగు) with native Web Speech synthesis for auditory learners.
                </p>
              </div>
            </div>
          </div>

          {/* Academic Checklist */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-400 flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-forest-600" />
              Academic Feature Showcase
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-charcoal-700">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-academic-bg border border-[#E5E0D5]">
                <span className="w-2 h-2 rounded-full bg-forest-500" />
                <span>6-Step Interactive Academic Onboarding</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-academic-bg border border-[#E5E0D5]">
                <span className="w-2 h-2 rounded-full bg-forest-500" />
                <span>Study Materials Center (PDF, DOCX, TXT, MD parser)</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-academic-bg border border-[#E5E0D5]">
                <span className="w-2 h-2 rounded-full bg-forest-500" />
                <span>Google Gemini AI Grounded Doubt Solving with Citations</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-academic-bg border border-[#E5E0D5]">
                <span className="w-2 h-2 rounded-full bg-forest-500" />
                <span>Flagship Answer Evaluator with University Rubric</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-academic-bg border border-[#E5E0D5]">
                <span className="w-2 h-2 rounded-full bg-forest-500" />
                <span>Marks-Wise Question Bank (2M to 10M) with Model Answers</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-academic-bg border border-[#E5E0D5]">
                <span className="w-2 h-2 rounded-full bg-forest-500" />
                <span>Multilingual English/Hindi/Telugu + TTS Audio Engine</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-[#E5E0D5] flex items-center justify-between text-xs text-charcoal-400">
          <span>Sanjay Ghodawat University • Sem 3 AI Capstone</span>
          <button
            onClick={() => setTeamModalOpen(false)}
            className="px-5 py-2 rounded-xl bg-forest-500 hover:bg-forest-600 text-white font-bold transition-colors shadow-subtle"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};
