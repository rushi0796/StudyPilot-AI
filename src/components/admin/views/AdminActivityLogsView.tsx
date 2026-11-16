import React, { useState, useEffect } from 'react';
import {
  Activity,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  RefreshCw,
  FileText
} from 'lucide-react';

interface AuditLogItem {
  id: string;
  admin_id: string;
  admin_email: string;
  target_user_id?: string;
  target_user_email?: string;
  document_id?: string;
  document_name?: string;
  action: string;
  details?: string;
  created_at: string;
}

export const AdminActivityLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin?action=audit-logs', { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load security audit logs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'ADMIN_LOGIN_SUCCESS':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800">LOGIN_SUCCESS</span>;
      case 'ADMIN_LOGIN_FAILED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-950/80 text-rose-300 border border-rose-800">LOGIN_FAILED</span>;
      case 'ADMIN_LOGOUT':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-charcoal-800 text-charcoal-300 border border-charcoal-700">LOGOUT</span>;
      case 'VIEW_STUDENT_PROFILE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-blue-950/80 text-blue-300 border border-blue-800">VIEW_STUDENT</span>;
      case 'DOWNLOAD_STUDENT_DOCUMENT':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-950/80 text-purple-300 border border-purple-800">DOWNLOAD_DOC</span>;
      case 'PREVIEW_STUDENT_DOCUMENT':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-950/80 text-amber-300 border border-amber-800">PREVIEW_DOC</span>;
      case 'ADMIN_DELETE_DOCUMENT':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-950/80 text-rose-300 border border-rose-800">DELETE_DOC</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-charcoal-800 text-[#A0A89C] border border-[#3A463B]">{action}</span>;
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchEmail = (log.admin_email || '').toLowerCase().includes(q);
      const matchTarget = (log.target_user_email || '').toLowerCase().includes(q);
      const matchDoc = (log.document_name || '').toLowerCase().includes(q);
      const matchDetails = (log.details || '').toLowerCase().includes(q);
      if (!matchEmail && !matchTarget && !matchDoc && !matchDetails) return false;
    }

    if (actionFilter !== 'all') {
      if (log.action !== actionFilter) return false;
    }

    return true;
  });

  const exportLogsAsJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `studypilot_audit_logs_${Date.now()}.json`);
    dl.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#242A25] border border-[#374138] rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-[#85B7E2]" />
            Security & Administration Audit Trail
          </h1>
          <p className="text-xs text-[#A0A89C] mt-1">
            Immutable log of all administrative authentication events, student profile inspections, document previews, binary downloads, and deletions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-[#2E362F] hover:bg-[#38433A] text-white border border-[#404D41] transition-colors cursor-pointer"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={exportLogsAsJson}
            disabled={logs.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#2E362F] hover:bg-[#38433A] text-[#85B7E2] border border-[#404D41] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Logs (JSON)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#242A25] border border-[#374138] rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-[#859180] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student, document, admin, or keywords..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#1A1F1B] border border-[#3A463B] rounded-xl text-white placeholder-[#687364] focus:outline-none focus:ring-1 focus:ring-[#85B7E2]"
            />
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#1A1F1B] border border-[#3A463B] rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[#85B7E2]"
            >
              <option value="all">All Action Types</option>
              <option value="ADMIN_LOGIN_SUCCESS">Admin Login Success</option>
              <option value="ADMIN_LOGIN_FAILED">Admin Login Failed</option>
              <option value="VIEW_STUDENT_PROFILE">View Student Profile</option>
              <option value="PREVIEW_STUDENT_DOCUMENT">Preview Document</option>
              <option value="DOWNLOAD_STUDENT_DOCUMENT">Download Document</option>
              <option value="ADMIN_DELETE_DOCUMENT">Delete Document</option>
              <option value="ADMIN_LOGOUT">Admin Logout</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-[#242A25] border border-[#374138] rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#343E35] bg-[#1E231F] text-[11px] font-bold text-[#A0A89C] uppercase tracking-wider">
                <th className="py-3 px-5">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Admin Origin</th>
                <th className="py-3 px-4">Target Student / Document</th>
                <th className="py-3 px-5">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2F3830] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#859180]">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#85B7E2] mb-2" />
                    <span>Querying studypilot_audit_logs...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#859180]">
                    No audit records match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#2A322B] transition-colors">
                    <td className="py-3.5 px-5 text-[#859180] font-mono whitespace-nowrap text-xs">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-white text-xs whitespace-nowrap">
                      {log.admin_email}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {log.target_user_email && (
                        <div className="text-white font-medium truncate max-w-[180px]">
                          {log.target_user_email}
                        </div>
                      )}
                      {log.document_name && (
                        <div className="text-[11px] text-[#A0A89C] truncate max-w-[180px]">
                          Doc: {log.document_name}
                        </div>
                      )}
                      {!log.target_user_email && !log.document_name && (
                        <span className="text-[#6E786B]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-[#D5DCD2]">
                      {log.details || log.action}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
