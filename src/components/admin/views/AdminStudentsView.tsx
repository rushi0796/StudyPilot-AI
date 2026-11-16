import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  FileText,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Loader2,
  HardDrive
} from 'lucide-react';

interface StudentItem {
  id: string;
  name: string;
  email: string;
  university: string;
  course: string;
  branch: string;
  year: string;
  semester: string;
  role: 'student';
  accountStatus: 'Active' | 'New' | 'Inactive';
  uploadedDocsCount: number;
  processedDocsCount: number;
  storageConsumed: number;
  lastLoginAt: string;
  onboardingCompleted: boolean;
  createdAt: string;
}

interface AdminStudentsViewProps {
  onSelectStudent: (studentId: string) => void;
}

export const AdminStudentsView: React.FC<AdminStudentsViewProps> = ({ onSelectStudent }) => {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'new'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchStudents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin?action=users', { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data = await res.json();
      setStudents(data.users || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load students directory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return iso;
    }
  };

  // Filter & Search Logic
  const filteredStudents = students.filter((s) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchEmail = s.email.toLowerCase().includes(q);
      const matchId = s.id.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchId) return false;
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'active' && s.accountStatus !== 'Active') return false;
      if (statusFilter === 'new' && s.accountStatus !== 'New') return false;
    }

    if (dateFilter !== 'all') {
      const createdTime = new Date(s.createdAt).getTime();
      const now = Date.now();
      if (dateFilter === 'today' && now - createdTime > 24 * 60 * 60 * 1000) return false;
      if (dateFilter === '7days' && now - createdTime > 7 * 24 * 60 * 60 * 1000) return false;
      if (dateFilter === '30days' && now - createdTime > 30 * 24 * 60 * 60 * 1000) return false;
    }

    return true;
  }).sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const displayedStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Student Directory
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            All Registered Students
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Inspect individual student profiles, view real database records, uploaded notes, and device sessions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            Total: <span className="font-bold text-white">{students.length}</span> Students
          </span>
        </div>
      </div>

      {/* Search & Filters Control Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by student name, email, or user ID..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="py-2 px-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="new">New Signups</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="py-2 px-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="all">Any Date</option>
              <option value="today">Past 24 Hours</option>
              <option value="7days">Past 7 Days</option>
              <option value="30days">Past 30 Days</option>
            </select>

            {/* Sort Toggle */}
            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
              title={`Sort by Date: ${sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}`}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Table or Card Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-400 mb-2" />
            <p className="text-xs font-mono">Querying studypilot_users table from Neon PostgreSQL...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-400 text-xs">
            {error}
          </div>
        ) : displayedStudents.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-600 mb-1" />
            <p className="text-sm font-semibold text-slate-300">No matching students found</p>
            <p className="text-xs">Try adjusting your search query or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 bg-slate-950/40">
                  <th className="py-3 px-4 font-medium">Student Identity</th>
                  <th className="py-3 px-4 font-medium">Branch / Course</th>
                  <th className="py-3 px-4 font-medium">Files Stored</th>
                  <th className="py-3 px-4 font-medium">Storage Consumed</th>
                  <th className="py-3 px-4 font-medium">Registered</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {displayedStudents.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => onSelectStudent(s.id)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-100 flex items-center gap-2">
                        <span>{s.name}</span>
                        {s.accountStatus === 'Active' ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-400" title="Active learner" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-blue-400" title="New registration" />
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">{s.email}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{s.branch || 'AIML'}</div>
                      <div className="text-[11px] text-slate-500">{s.year || '2nd Year'} • {s.semester || 'Sem III'}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      {s.uploadedDocsCount || 0}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      {formatBytes(s.storageConsumed || 0)}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {formatDate(s.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStudent(s.id);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                      >
                        Inspect &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing Page <span className="font-bold text-white">{currentPage}</span> of <span className="font-bold text-white">{totalPages}</span> ({filteredStudents.length} Students)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
