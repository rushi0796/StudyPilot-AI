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
      <div className="bg-[#242A25] border border-[#374138] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#2E362F] text-[#E2C785] border border-[#3E4A3F] mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#E2C785]" />
              Super Admin Console v2.5
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Platform Overview & Health
            </h1>
            <p className="text-xs sm:text-sm text-[#A0A89C] mt-1 max-w-2xl">
              Live telemetry, real-time database counts, student directory metrics, and global document ingestion monitoring.
            </p>
          </div>
          <button
            onClick={fetchOverviewData}
            disabled={isLoading}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#2E362F] hover:bg-[#38433A] text-white border border-[#404D41] transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#E2C785]' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-200 text-xs flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 8 Real Database Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div 
          onClick={() => onNavigateTab('students')}
          className="bg-[#242A25] border border-[#374138] hover:border-[#4B594C] p-5 rounded-2xl shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D362E] text-[#E2C785] flex items-center justify-center border border-[#3B473C]">
              <Users className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-[#6E786B] group-hover:text-[#E2C785] transition-colors" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {isLoading ? '...' : (metrics?.totalStudents ?? 0)}
          </div>
          <div className="text-xs font-semibold text-[#A0A89C] mt-1">
            Total Registered Students
          </div>
          <div className="text-[11px] text-[#6E786B] mt-2">
            Active: <span className="text-[#E2C785] font-semibold">{metrics?.totalActiveStudents ?? 0}</span> in last 7 days
          </div>
        </div>

        {/* Total Uploaded Documents */}
        <div 
          onClick={() => onNavigateTab('files')}
          className="bg-[#242A25] border border-[#374138] hover:border-[#4B594C] p-5 rounded-2xl shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D362E] text-[#66C296] flex items-center justify-center border border-[#3B473C]">
              <FolderOpen className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-[#6E786B] group-hover:text-[#66C296] transition-colors" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {isLoading ? '...' : (metrics?.totalUploadedDocuments ?? 0)}
          </div>
          <div className="text-xs font-semibold text-[#A0A89C] mt-1">
            Total Uploaded Documents
          </div>
          <div className="text-[11px] text-[#6E786B] mt-2">
            Across all student accounts
          </div>
        </div>

        {/* Total Storage Consumed */}
        <div 
          onClick={() => onNavigateTab('files')}
          className="bg-[#242A25] border border-[#374138] hover:border-[#4B594C] p-5 rounded-2xl shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D362E] text-[#85B7E2] flex items-center justify-center border border-[#3B473C]">
              <HardDrive className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-[#6E786B] group-hover:text-[#85B7E2] transition-colors" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {isLoading ? '...' : formatBytes(metrics?.totalStorageConsumed ?? 0)}
          </div>
          <div className="text-xs font-semibold text-[#A0A89C] mt-1">
            Total Storage Consumed
          </div>
          <div className="text-[11px] text-[#6E786B] mt-2">
            Neon PostgreSQL byte capacity
          </div>
        </div>

        {/* Total Documents Processed */}
        <div 
          onClick={() => onNavigateTab('processing')}
          className="bg-[#242A25] border border-[#374138] hover:border-[#4B594C] p-5 rounded-2xl shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D362E] text-emerald-400 flex items-center justify-center border border-[#3B473C]">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-[#6E786B] group-hover:text-emerald-400 transition-colors" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {isLoading ? '...' : (metrics?.totalDocumentsProcessed ?? 0)}
          </div>
          <div className="text-xs font-semibold text-[#A0A89C] mt-1">
            Documents Processed & Indexed
          </div>
          <div className="text-[11px] text-[#6E786B] mt-2">
            Pending: <span className="text-amber-400 font-semibold">{metrics?.totalDocumentsPending ?? 0}</span> • Failed: <span className="text-rose-400 font-semibold">{metrics?.totalDocumentsFailed ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Grid of Recent Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Student Registrations */}
        <div className="bg-[#242A25] border border-[#374138] rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2E362F] text-[#E2C785] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Recent Student Registrations</h3>
                <p className="text-[11px] text-[#6E786B]">Latest student accounts in database</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('students')}
              className="text-xs font-bold text-[#E2C785] hover:underline cursor-pointer"
            >
              View All →
            </button>
          </div>

          <div className="divide-y divide-[#323B33]">
            {recentStudents.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#6E786B]">
                No student accounts registered yet.
              </div>
            ) : (
              recentStudents.map((s) => (
                <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{s.name}</p>
                    <p className="text-[11px] text-[#A0A89C] truncate font-mono">{s.email}</p>
                    <p className="text-[10px] text-[#6E786B] mt-0.5">
                      {s.course || 'B.Tech'} • {s.branch || 'AIML'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] text-[#859180] font-mono block">
                      {formatDate(s.created_at)}
                    </span>
                    <button
                      onClick={() => onNavigateTab('student-detail', { userId: s.id })}
                      className="text-[11px] font-semibold text-[#E2C785] hover:underline mt-1 inline-block cursor-pointer"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent File Uploads */}
        <div className="bg-[#242A25] border border-[#374138] rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2E362F] text-[#66C296] flex items-center justify-center">
                <FolderOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Recent Uploaded Files</h3>
                <p className="text-[11px] text-[#6E786B]">Global document ingestion feed</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('files')}
              className="text-xs font-bold text-[#66C296] hover:underline cursor-pointer"
            >
              View All →
            </button>
          </div>

          <div className="divide-y divide-[#323B33]">
            {recentDocuments.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#6E786B]">
                No documents uploaded yet.
              </div>
            ) : (
              recentDocuments.map((doc) => (
                <div key={doc.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-[#66C296] flex-shrink-0" />
                      <p className="text-xs font-bold text-white truncate">{doc.name}</p>
                    </div>
                    <p className="text-[11px] text-[#A0A89C] truncate">
                      Uploaded by: <span className="text-white font-medium">{doc.user_name || 'Student'}</span> ({doc.user_email || 'student'})
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] text-[#859180] font-mono block">
                      {formatBytes(doc.size)}
                    </span>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#22382C] text-emerald-300 border border-emerald-800">
                      {doc.chunk_count || 0} chunks
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Logs */}
      <div className="bg-[#242A25] border border-[#374138] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2E362F] text-[#85B7E2] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Recent Administrative Activity</h3>
              <p className="text-[11px] text-[#6E786B]">Security audit trail from studypilot_audit_logs</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('activity')}
            className="text-xs font-bold text-[#85B7E2] hover:underline cursor-pointer"
          >
            Full Audit Trail →
          </button>
        </div>

        <div className="divide-y divide-[#323B33]">
          {recentActivity.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#6E786B]">
              No audit logs recorded yet.
            </div>
          ) : (
            recentActivity.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase tracking-wider bg-[#2C343B] text-[#85B7E2] border border-[#3B4752]">
                      {log.action}
                    </span>
                    <span className="text-xs font-medium text-white">{log.details || log.action}</span>
                  </div>
                  <p className="text-[10px] text-[#6E786B] mt-1 font-mono">
                    Admin: {log.admin_email}
                  </p>
                </div>
                <span className="text-[10px] text-[#859180] font-mono flex-shrink-0">
                  {formatDate(log.created_at)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
