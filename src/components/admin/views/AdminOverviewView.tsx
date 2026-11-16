import React, { useState, useEffect } from 'react';
import {
  Users,
  FolderOpen,
  Database,
  FileCheck2,
  Clock,
  AlertTriangle,
  RefreshCw,
  HardDrive,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  FileText
} from 'lucide-react';

interface OverviewMetrics {
  totalStudents: number;
  totalSuperAdmins: number;
  totalUploadedDocuments: number;
  totalStorageConsumed: number;
  totalActiveStudents: number;
  totalDocumentsProcessed: number;
  totalDocumentsPending: number;
  totalDocumentsFailed: number;
  serverTime: string;
}

interface AdminOverviewViewProps {
  onNavigateTab: (tab: any, meta?: any) => void;
}

export const AdminOverviewView: React.FC<AdminOverviewViewProps> = ({ onNavigateTab }) => {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverviewData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin?action=overview', { credentials: 'include' });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `HTTP error ${res.status}`);
      }
      const data = await res.json();
      setMetrics(data.metrics || null);
      setRecentStudents(data.recentStudents || []);
      setRecentDocuments(data.recentDocuments || []);
      setRecentActivity(data.recentActivity || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load system overview statistics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              System Telemetry & Metrics
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Platform Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Live telemetry, database records, active students, and global document ingestion monitoring.
          </p>
        </div>

        <button
          onClick={fetchOverviewData}
          disabled={isLoading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchOverviewData}
            className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* 8 Real Database Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div 
          onClick={() => onNavigateTab('students')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Users className="w-4 h-4" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {isLoading ? '...' : (metrics?.totalStudents ?? 0)}
          </div>
          <div className="text-xs font-medium text-slate-400 mt-1">
            Registered Students
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Active: <span className="text-emerald-400 font-semibold">{metrics?.totalActiveStudents ?? 0}</span> in last 7 days
          </div>
        </div>

        {/* Total Uploaded Documents */}
        <div 
          onClick={() => onNavigateTab('files')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <FolderOpen className="w-4 h-4" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {isLoading ? '...' : (metrics?.totalUploadedDocuments ?? 0)}
          </div>
          <div className="text-xs font-medium text-slate-400 mt-1">
            Uploaded Documents
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Across all student accounts
          </div>
        </div>

        {/* Total Storage Consumed */}
        <div 
          onClick={() => onNavigateTab('files')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <HardDrive className="w-4 h-4" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {isLoading ? '...' : formatBytes(metrics?.totalStorageConsumed ?? 0)}
          </div>
          <div className="text-xs font-medium text-slate-400 mt-1">
            Storage Consumed
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            PostgreSQL byte store
          </div>
        </div>

        {/* Ingestion Success */}
        <div 
          onClick={() => onNavigateTab('processing')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {isLoading ? '...' : (metrics?.totalDocumentsProcessed ?? 0)}
          </div>
          <div className="text-xs font-medium text-slate-400 mt-1">
            Indexed & Grounded
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Ready for RAG inference
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Processing Pending</div>
            <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
              {metrics?.totalDocumentsPending ?? 0}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Ingestion Errors</div>
            <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">
              {metrics?.totalDocumentsFailed ?? 0}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Super Admins Configured</div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
              {metrics?.totalSuperAdmins ?? 1}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Tables: Recent Registrations & Ingested Files */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Students Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-100">Recent Student Signups</h3>
            </div>
            <button
              onClick={() => onNavigateTab('students')}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              View All &rarr;
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {recentStudents.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No registered students found in database.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800/60">
                    <th className="pb-2 font-medium">Student</th>
                    <th className="pb-2 font-medium">Branch</th>
                    <th className="pb-2 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {recentStudents.map((s) => (
                    <tr 
                      key={s.id} 
                      onClick={() => onNavigateTab('student-detail', { userId: s.id })}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 pr-2">
                        <div className="font-medium text-slate-200">{s.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{s.email}</div>
                      </td>
                      <td className="py-2.5 text-slate-300">
                        {s.branch || 'AIML'}
                      </td>
                      <td className="py-2.5 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        {formatDate(s.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Documents Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-slate-100">Recent Uploaded Documents</h3>
            </div>
            <button
              onClick={() => onNavigateTab('files')}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              View Repository &rarr;
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {recentDocuments.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No documents uploaded yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800/60">
                    <th className="pb-2 font-medium">Document</th>
                    <th className="pb-2 font-medium">Uploader</th>
                    <th className="pb-2 font-medium">Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {recentDocuments.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 pr-2">
                        <div className="font-medium text-slate-200 truncate max-w-[180px]">{d.name}</div>
                        <div className="text-[11px] text-slate-500">{d.chunk_count || 0} RAG Chunks</div>
                      </td>
                      <td className="py-2.5 text-slate-300 truncate max-w-[120px]">
                        {d.user_name || d.user_email || 'Student'}
                      </td>
                      <td className="py-2.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {formatBytes(d.size)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Security Audit Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-100">Live Security Audit Log</h3>
          </div>
          <button
            onClick={() => onNavigateTab('activity')}
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Audit History &rarr;
          </button>
        </div>

        {recentActivity.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            No audit log events recorded yet.
          </div>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((log) => (
              <div 
                key={log.id} 
                className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60 text-xs"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">
                    {log.action}
                  </span>
                  <span className="text-slate-300 truncate">{log.details || log.action}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500 whitespace-nowrap flex-shrink-0">
                  {formatDate(log.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
