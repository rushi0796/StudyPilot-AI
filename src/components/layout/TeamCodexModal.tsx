import React from 'react';
import { X, ShieldCheck, Award, Code2, Users, Cpu, BookOpen, Layers, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TEAM_MEMBERS, UNIVERSITY_INFO } from '../../data/mockData';

export const TeamCodexModal: React.FC = () => {
  const { teamModalOpen, setTeamModalOpen } = useApp();

  if (!teamModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-navy-900 border border-navy-700 rounded-2xl shadow-2xl p-6 lg:p-8">
        
        {/* Close Button */}
        <button
          onClick={() => setTeamModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-navy-800 hover:bg-navy-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 pb-6 border-b border-navy-800">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-electric-600 via-electric-500 to-violet-500 flex items-center justify-center shadow-glow">
            <Award className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                StudyPilot AI
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-electric-500/20 text-electric-300 border border-electric-500/30">
                Academic Project
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Team Codex
              </span>
            </div>
            <p className="text-sm text-slate-300 font-medium mt-1">
              AI-Powered Personalized Study Assistant for College Students
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {UNIVERSITY_INFO.name} • {UNIVERSITY_INFO.department} • {UNIVERSITY_INFO.academicYear} ({UNIVERSITY_INFO.semester})
            </p>
          </div>
        </div>

        {/* Team Members Grid */}
        <div className="py-6 border-b border-navy-800">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-electric-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Team Codex Members (AI Batch 2023–2027)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEAM_MEMBERS.map((member, idx) => (
              <div 
                key={idx}
                className="p-4 rounded-xl bg-navy-950/70 border border-navy-800 hover:border-electric-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-electric-700 to-navy-800 border border-navy-700 flex items-center justify-center text-electric-300 font-bold text-sm mb-3 shadow">
                    {member.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <h4 className="font-semibold text-sm text-white">
                    {member.name}
                  </h4>
                  <p className="text-xs text-electric-400 font-medium mt-0.5">
                    {member.role}
                  </p>
                </div>
                <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-navy-850 leading-relaxed">
                  {member.focus}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Project Architecture & Faculty Highlights */}
        <div className="py-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-violet-400" />
              Technical Stack & System Architecture
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-navy-950/60 border border-navy-800">
                <span className="font-semibold text-electric-300 block mb-1">Frontend Engineering</span>
                <p className="text-slate-400 leading-relaxed">
                  React 19 + TypeScript, Tailwind CSS, Lucide Icons, responsive 16:9 dashboard, rich state machine, and browser audio synthesizer.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-navy-950/60 border border-navy-800">
                <span className="font-semibold text-violet-300 block mb-1">AI & Evaluation Engine</span>
                <p className="text-slate-400 leading-relaxed">
                  Deterministic rubric-matching for SGU exams, multi-tier scoring (2, 3, 4, 5, 7, 10 Marks), conceptual gap extraction, and model answer generation.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-navy-950/60 border border-navy-800">
                <span className="font-semibold text-emerald-300 block mb-1">Multilingual & Voice</span>
                <p className="text-slate-400 leading-relaxed">
                  Support for English, Hindi (हिंदी), and Telugu (తెలుగు) with native Web Speech synthesis for auditory learners.
                </p>
              </div>
            </div>
          </div>

          {/* Academic Presentation Checklist */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Faculty Demonstration Checklist
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-navy-950/40 border border-navy-800/80">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>6-Step Interactive Academic Onboarding</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-navy-950/40 border border-navy-800/80">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Conversational AI Assistant with Simplification Loops</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-navy-950/40 border border-navy-800/80">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Marks-Wise Question Bank (2M, 3M, 4M, 5M, 7M, 10M)</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-navy-950/40 border border-navy-800/80">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Flagship Answer Evaluator with University Rubric</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-navy-950/40 border border-navy-800/80">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Spaced-Repetition Revision Task Automation</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-navy-950/40 border border-navy-800/80">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Multilingual English/Hindi/Telugu + TTS Voice Engine</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-navy-800 flex items-center justify-between text-xs text-slate-400">
          <span>Project Repository: Sem 3 AI Capstone Prototype</span>
          <button
            onClick={() => setTeamModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-electric-600 hover:bg-electric-500 text-white font-medium transition-colors"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};
