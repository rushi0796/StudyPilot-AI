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
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchEmail = s.email.toLowerCase().includes(q);
      const matchId = s.id.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchId) return false;
    }

    // Status
    if (statusFilter !== 'all') {
      if (statusFilter === 'active' && s.accountStatus !== 'Active') return false;
      if (statusFilter === 'new' && s.accountStatus !== 'New') return false;
    }

    // Date
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

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#242A25] border border-[#374138] rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#E2C785]" />
            Student Directory
          </h1>
          <p className="text-xs text-[#A0A89C] mt-1">
            Complete registry of student accounts with individual document quotas, registration timelines, and activity state.
          </p>
        </div>
        <div className="text-xs font-mono text-[#E2C785] bg-[#2E362F] px-3.5 py-1.5 rounded-xl border border-[#3E4A3F] self-start sm:self-auto">
          Total: {students.length} students
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-[#242A25] border border-[#374138] rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#859180] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, email, or ID..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#1A1F1B] border border-[#3A463B] rounded-xl text-white placeholder-[#687364] focus:outline-none focus:ring-1 focus:ring-[#E2C785]"
            />
          </div>

          {/* Account Status */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#A0A89C]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e: any) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 px-3 py-2 text-xs bg-[#1A1F1B] border border-[#3A463B] rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[#E2C785]"
            >
              <option value="all">All Accounts</option>
              <option value="active">Active Recently</option>
              <option value="new">Newly Registered</option>
            </select>
          </div>

          {/* Registration Date Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#A0A89C]">Registered:</span>
            <select
              value={dateFilter}
              onChange={(e: any) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 px-3 py-2 text-xs bg-[#1A1F1B] border border-[#3A463B] rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[#E2C785]"
            >
              <option value="all">Anytime</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#A0A89C]">Sort:</span>
            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="flex-1 px-3 py-2 text-xs font-semibold bg-[#1A1F1B] border border-[#3A463B] rounded-xl text-white flex items-center justify-between hover:border-[#4E5D4F] transition-colors cursor-pointer"
            >
              <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
              <ArrowUpDown className="w-3.5 h-3.5 text-[#859180]" />
            </button>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-[#242A25] border border-[#374138] rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#343E35] bg-[#1E231F] text-[11px] font-bold text-[#A0A89C] uppercase tracking-wider">
                <th className="py-3.5 px-5">Student Identity</th>
                <th className="py-3.5 px-4">Academic Details</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Uploaded Docs</th>
                <th className="py-3.5 px-4 text-right">Storage</th>
                <th className="py-3.5 px-4">Registered</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2F3830] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#859180]">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#E2C785] mb-2" />
                    <span>Loading student records from Neon PostgreSQL...</span>
                  </td>
                </tr>
              ) : paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#859180]">
                    No students match the selected search or filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-[#2A322B] transition-colors">
                    {/* Student Identity */}
                    <td className="py-4 px-5">
                      <div className="font-bold text-white text-xs">{s.name}</div>
                      <div className="text-[11px] text-[#A0A89C] font-mono mt-0.5">{s.email}</div>
                      <div className="text-[9px] text-[#6E786B] font-mono mt-0.5">ID: {s.id.slice(0, 16)}...</div>
                    </td>

                    {/* Academic Details */}
                    <td className="py-4 px-4">
                      <div className="text-white font-medium text-xs">{s.course || 'B.Tech'} • {s.branch || 'AIML'}</div>
                      <div className="text-[11px] text-[#859180] mt-0.5">{s.year || '2nd Year'} • {s.semester || 'Semester III'}</div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        s.accountStatus === 'Active'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                          : 'bg-amber-950/60 text-amber-300 border-amber-800'
                      }`}>
                        {s.accountStatus}
                      </span>
                    </td>

                    {/* Uploaded Docs */}
                    <td className="py-4 px-4 text-center">
                      <span className="font-mono font-bold text-white text-xs">
                        {s.uploadedDocsCount}
                      </span>
                      <span className="text-[10px] text-[#6E786B] block">
                        ({s.processedDocsCount} indexed)
                      </span>
                    </td>

                    {/* Storage */}
                    <td className="py-4 px-4 text-right font-mono text-white text-xs">
                      {formatBytes(s.storageConsumed)}
                    </td>

                    {/* Registered Date */}
                    <td className="py-4 px-4 text-[#859180] font-mono text-xs">
                      {formatDate(s.createdAt)}
                    </td>

                    {/* Action */}
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => onSelectStudent(s.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#2E362F] hover:bg-[#39443B] text-[#E2C785] border border-[#404D41] transition-all cursor-pointer"
                      >
                        <span>Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-[#343E35] flex items-center justify-between text-xs text-[#A0A89C]">
          <div>
            Showing <span className="text-white font-bold">{filteredStudents.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="text-white font-bold">{Math.min(currentPage * pageSize, filteredStudents.length)}</span> of{' '}
            <span className="text-white font-bold">{filteredStudents.length}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-[#1A1F1B] border border-[#3A463B] text-white hover:bg-[#2A322B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-white text-xs font-bold px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-[#1A1F1B] border border-[#3A463B] text-white hover:bg-[#2A322B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
