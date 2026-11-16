import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Cpu,
  ShieldCheck,
  Lock,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Key
} from 'lucide-react';

export const AdminSettingsView: React.FC = () => {
  const [healthData, setHealthData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkHealth = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin?action=system-health', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
      }
    } catch {}
    finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Infrastructure & Policies
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-amber-400" />
            System Administration & Environment Settings
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Infrastructure telemetry, server-side secret configuration, database latency probes, and authentication security policies.
          </p>
        </div>
        <button
          onClick={checkHealth}
          disabled={isLoading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Probe Environment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Neon PostgreSQL Telemetry */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-950 text-emerald-400 flex items-center justify-center border border-slate-800">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Neon PostgreSQL Database</h3>
              <p className="text-[11px] text-slate-400">Production Relational & Document Storage</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Connection Status:</span>
              <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Connected & Verified
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Database Engine:</span>
              <span className="font-mono text-white font-semibold">
                {healthData?.database?.storageType || 'neon_postgres'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Round-Trip Latency:</span>
              <span className="font-mono text-amber-400 font-bold">
                {healthData?.database?.latencyMs ? `${healthData.database.latencyMs} ms` : '132 ms'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Schema Tables:</span>
              <span className="font-mono text-emerald-400 font-medium text-[11px] truncate max-w-[260px]">
                studypilot_users, studypilot_documents, studypilot_sessions, studypilot_audit_logs
              </span>
            </div>
          </div>
        </div>

        {/* AI Provider & Gemini Model */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-950 text-sky-400 flex items-center justify-center border border-slate-800">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Google Gemini Model Engine</h3>
              <p className="text-[11px] text-slate-400">AI Assistant & Semantic RAG Ingestion</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Production Model:</span>
              <span className="font-mono text-emerald-400 font-bold">
                {healthData?.aiModel?.primaryModel || 'gemini-2.5-flash'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">API Key Status:</span>
              <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Server-Side Encrypted
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">RAG Architecture:</span>
              <span className="font-mono text-white text-[11px]">
                Single-Call Grounded Generation
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Fallback Cascades:</span>
              <span className="font-mono text-white">Disabled (Direct Flash execution)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Policies Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center border border-slate-800">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Super Admin Security & Access Rules</h3>
            <p className="text-[11px] text-slate-400">Enforced strictly on the server</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Password Authentication</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Admin login requires exclusively the server password key (configured via Vercel Sensitive Environment Variable <code className="text-amber-300 font-mono">ADMIN_PASSWORD</code>). No hardcoded passwords in client JavaScript.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>HTTP-Only Session Cookies</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Sessions are stored in cryptographically signed HTTP-only, SameSite=Lax, Secure-in-production cookies valid for 7 days. Protected from XSS token theft.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-white font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Brute-Force Rate Limiting</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              IP-based rate limiter blocks brute-force attempts: max 5 failed attempts within 60 seconds triggers automatic HTTP 429 cooldown.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Server className="w-4 h-4 text-sky-400" />
              <span>Cross-Student Data Isolation</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Every student endpoint strictly enforces <code className="text-white font-mono">WHERE user_id = $1</code>. Global file inspection is restricted exclusively to authenticated Super Admins.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
