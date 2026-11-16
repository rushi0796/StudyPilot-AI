import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  FolderOpen,
  Layers,
  FileText,
  Search,
  Trash2,
  Eye,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  X,
  FileCode,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

interface AdminMetrics {
  totalStudents: number;
  totalSuperAdmins: number;
  totalDocuments: number;
  totalIndexedChunks: number;
  totalExtractedWords: number;
  serverTime: string;
}

interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  university: string;
  course: string;
  branch: string;
  year: string;
  semester: string;
  role: 'student' | 'super_admin';
  onboardingCompleted: boolean;
  createdAt: string;
}

interface AdminDocumentItem {
  id: string;
  userId: string;
  name: string;
  type: string;
  size: number;
  uploadStatus: string;
  processingStatus: string;
  chunkCount: number;
  wordCount: number;
  createdAt: string;
  user_email?: string;
  user_name?: string;
}

interface AdminAuditLogItem {
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

export const SuperAdminDashboard: React.FC = () => {
  const { currentUser: user } = useAuth();
  const { setActiveView } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'documents' | 'audit'>('overview');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [documents, setDocuments] = useState<AdminDocumentItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Student Drawer
  const [selectedStudent, setSelectedStudent] = useState<AdminUserItem | null>(null);
  const [selectedStudentDocs, setSelectedStudentDocs] = useState<AdminDocumentItem[]>([]);
  const [loadingStudentDocs, setLoadingStudentDocs] = useState(false);

  // Selected Document Inspection Modal
  const [inspectingDoc, setInspectingDoc] = useState<{
    id: string;
    name: string;
    studentName?: string;
    studentEmail?: string;
    extractedText?: string;
    chunks?: any[];
  } | null>(null);
  const [loadingDocDetail, setLoadingDocDetail] = useState(false);

  const fetchOverview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin?action=overview', { credentials: 'include' });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `HTTP error ${res.status}`);
      }
      const data = await res.json();
      setMetrics(data.metrics);
    } catch (err: any) {
      setError(err?.message || 'Failed to load Super Admin overview.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin?action=users', { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load students directory.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDocuments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin?action=documents', { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load global documents.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin?action=audit-logs', { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setAuditLogs(data.logs || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load audit logs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'overview') fetchOverview();
    else if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'documents') fetchDocuments();
    else if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab]);

  const handleSelectStudent = async (student: AdminUserItem) => {
    setSelectedStudent(student);
    setLoadingStudentDocs(true);
    try {
      const res = await fetch(`/api/admin?action=user-detail&userId=${encodeURIComponent(student.id)}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSelectedStudentDocs(data.documents || []);
      } else {
        setSelectedStudentDocs([]);
      }
    } catch {
      setSelectedStudentDocs([]);
    } finally {
      setLoadingStudentDocs(false);
    }
  };

  const handleInspectDocument = async (docId: string, docName: string) => {
    setLoadingDocDetail(true);
    setInspectingDoc({ id: docId, name: docName });
    try {
      const res = await fetch(`/api/admin?action=document-detail&id=${encodeURIComponent(docId)}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setInspectingDoc(data.document);
      }
    } catch (err: any) {
      alert(`Could not inspect document: ${err?.message}`);
    } finally {
      setLoadingDocDetail(false);
    }
  };

  const handleDeleteDocument = async (docId: string, docName: string) => {
    if (!confirm(`Are you sure you want to permanently delete document "${docName}"? This action is audited.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin?action=delete-document&id=${encodeURIComponent(docId)}`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Delete failed.');
      }
      alert(`Document "${docName}" deleted successfully.`);
      if (activeTab === 'documents') fetchDocuments();
      if (selectedStudent) handleSelectStudent(selectedStudent);
    } catch (err: any) {
      alert(`Delete failed: ${err?.message}`);
    }
  };

  const handleDownloadDocument = (docId: string, docName: string) => {
    const downloadUrl = `/api/documents?id=${encodeURIComponent(docId)}&action=download`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = docName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (user?.role !== 'super_admin') {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 text-center rounded-3xl bg-white border border-[#E5E0D5] shadow-card">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-charcoal-900 tracking-tight">Super Admin Access Required</h2>
        <p className="text-sm text-charcoal-500 mt-2 leading-relaxed">
          This portal is restricted to authorized platform administrators. You are currently signed in as <strong>{user?.email || 'a student'}</strong>.
        </p>
        <div className="mt-6">
          <button
            onClick={() => setActiveView('dashboard')}
            className="px-5 py-2.5 rounded-xl bg-forest-500 hover:bg-forest-600 text-white font-bold text-xs shadow-subtle transition-all"
          >
            Return to Student Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      
      {/* 1. Super Admin Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E0D5]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-forest-700 text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-charcoal-900 tracking-tight">
                  Super Admin Management Portal
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gold-400 text-charcoal-900">
                  Full Authority
                </span>
              </div>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Centralized oversight for students, database storage, isolated PDF documents, and security audit logs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeTab === 'overview') fetchOverview();
              else if (activeTab === 'users') fetchUsers();
              else if (activeTab === 'documents') fetchDocuments();
              else if (activeTab === 'audit') fetchAuditLogs();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-sage-100 text-charcoal-700 text-xs font-semibold border border-[#E5E0D5] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-forest-600 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setActiveView('dashboard')}
            className="px-4 py-2 rounded-xl bg-forest-500 hover:bg-forest-600 text-white text-xs font-bold transition-all shadow-subtle"
          >
            Exit to Student View
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E5E0D5] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-forest-600 text-white shadow-subtle'
              : 'bg-white text-charcoal-600 hover:text-charcoal-900 border border-[#E5E0D5]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Platform Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-forest-600 text-white shadow-subtle'
              : 'bg-white text-charcoal-600 hover:text-charcoal-900 border border-[#E5E0D5]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Students Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'documents'
              ? 'bg-forest-600 text-white shadow-subtle'
              : 'bg-white text-charcoal-600 hover:text-charcoal-900 border border-[#E5E0D5]'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>Global Documents Repository</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'audit'
              ? 'bg-forest-600 text-white shadow-subtle'
              : 'bg-white text-charcoal-600 hover:text-charcoal-900 border border-[#E5E0D5]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Security Audit Trail</span>
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW METRICS */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-5 rounded-2xl bg-white border border-[#E5E0D5] shadow-card">
              <div className="flex items-center justify-between text-xs text-charcoal-400">
                <span className="font-semibold uppercase tracking-wider">Registered Students</span>
                <Users className="w-4 h-4 text-forest-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-charcoal-900">{metrics?.totalStudents ?? '...'}</span>
                <span className="text-xs text-forest-600 font-bold">Accounts</span>
              </div>
              <span className="text-[11px] text-charcoal-400 mt-1 block">Live in PostgreSQL</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E5E0D5] shadow-card">
              <div className="flex items-center justify-between text-xs text-charcoal-400">
                <span className="font-semibold uppercase tracking-wider">Stored Documents</span>
                <FolderOpen className="w-4 h-4 text-forest-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-charcoal-900">{metrics?.totalDocuments ?? '...'}</span>
                <span className="text-xs text-forest-600 font-bold">Files</span>
              </div>
              <span className="text-[11px] text-charcoal-400 mt-1 block">Private per-student files</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E5E0D5] shadow-card">
              <div className="flex items-center justify-between text-xs text-charcoal-400">
                <span className="font-semibold uppercase tracking-wider">Indexed Chunks</span>
                <Layers className="w-4 h-4 text-gold-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-charcoal-900">{metrics?.totalIndexedChunks ?? '...'}</span>
                <span className="text-xs text-gold-600 font-bold">RAG Units</span>
              </div>
              <span className="text-[11px] text-charcoal-400 mt-1 block">Semantically vector searchable</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E5E0D5] shadow-card">
              <div className="flex items-center justify-between text-xs text-charcoal-400">
                <span className="font-semibold uppercase tracking-wider">Total Words Stored</span>
                <FileText className="w-4 h-4 text-forest-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-charcoal-900">{(metrics?.totalExtractedWords ?? 0).toLocaleString()}</span>
                <span className="text-xs text-forest-600 font-bold">Words</span>
              </div>
              <span className="text-[11px] text-charcoal-400 mt-1 block">Extracted academic text</span>
            </div>

          </div>

          {/* System Health & Security Notice */}
          <div className="p-5 rounded-2xl bg-forest-900 text-white shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-gold-400" />
                <h3 className="font-bold text-sm tracking-tight">Database & Security Integrity Verified</h3>
              </div>
              <p className="text-xs text-forest-200">
                PostgreSQL schema active with user-isolated document storage and administrative action logging.
              </p>
            </div>
            <div className="text-xs font-mono bg-forest-800/80 px-3.5 py-1.5 rounded-xl border border-forest-700">
              Admin: {user?.email}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STUDENTS DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="w-full sm:w-80 relative">
              <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students by name or email..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[#E5E0D5] text-xs text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:border-forest-500 shadow-subtle"
              />
            </div>
            <span className="text-xs text-charcoal-500 font-medium">
              Total Students: <strong>{users.length}</strong>
            </span>
          </div>

          <div className="rounded-2xl bg-white border border-[#E5E0D5] shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-academic-bg border-b border-[#E5E0D5] text-charcoal-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Email Address</th>
                    <th className="px-4 py-3">Degree & Branch</th>
                    <th className="px-4 py-3">Term / Year</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Onboarded</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D5]">
                  {users
                    .filter(u => {
                      if (!searchQuery.trim()) return true;
                      const q = searchQuery.toLowerCase();
                      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
                    })
                    .map((student) => (
                      <tr key={student.id} className="hover:bg-sage-50/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-charcoal-900">
                          {student.name}
                        </td>
                        <td className="px-4 py-3 font-mono text-charcoal-600">
                          {student.email}
                        </td>
                        <td className="px-4 py-3 text-charcoal-700">
                          {student.course} ({student.branch})
                        </td>
                        <td className="px-4 py-3 text-charcoal-600">
                          {student.semester || student.year}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            student.role === 'super_admin'
                              ? 'bg-gold-100 text-gold-800 border border-gold-300'
                              : 'bg-forest-50 text-forest-700 border border-forest-200'
                          }`}>
                            {student.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {student.onboardingCompleted ? (
                            <span className="flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Done
                            </span>
                          ) : (
                            <span className="text-charcoal-400 font-semibold text-[11px]">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleSelectStudent(student)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-forest-50 hover:bg-forest-100 text-forest-700 font-bold text-[11px] border border-forest-200 transition-colors"
                          >
                            <span>View Files</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: GLOBAL DOCUMENTS REPOSITORY */}
      {/* ========================================================================= */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="w-full sm:w-80 relative">
              <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents or student owner..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[#E5E0D5] text-xs text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:border-forest-500 shadow-subtle"
              />
            </div>
            <span className="text-xs text-charcoal-500 font-medium">
              Total Documents: <strong>{documents.length}</strong>
            </span>
          </div>

          <div className="rounded-2xl bg-white border border-[#E5E0D5] shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-academic-bg border-b border-[#E5E0D5] text-charcoal-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Document Name</th>
                    <th className="px-4 py-3">Format</th>
                    <th className="px-4 py-3">Student Owner</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Words</th>
                    <th className="px-4 py-3">Chunks</th>
                    <th className="px-4 py-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D5]">
                  {documents
                    .filter(d => {
                      if (!searchQuery.trim()) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        d.name.toLowerCase().includes(q) ||
                        (d.user_email && d.user_email.toLowerCase().includes(q)) ||
                        (d.user_name && d.user_name.toLowerCase().includes(q))
                      );
                    })
                    .map((doc) => (
                      <tr key={doc.id} className="hover:bg-sage-50/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-charcoal-900 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-forest-600 flex-shrink-0" />
                          <span>{doc.name}</span>
                        </td>
                        <td className="px-4 py-3 font-mono uppercase text-[10px] font-bold text-forest-700">
                          {doc.type}
                        </td>
                        <td className="px-4 py-3 text-charcoal-700">
                          <div className="font-semibold">{doc.user_name || 'Student'}</div>
                          <div className="text-[10px] text-charcoal-400 font-mono">{doc.user_email || doc.userId}</div>
                        </td>
                        <td className="px-4 py-3 text-charcoal-600">
                          {formatFileSize(doc.size)}
                        </td>
                        <td className="px-4 py-3 text-charcoal-600">
                          {Number(doc.wordCount || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-forest-50 text-forest-700 border border-forest-200">
                            {doc.chunkCount || 0} chunks
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleInspectDocument(doc.id, doc.name)}
                              className="p-1.5 rounded-lg bg-academic-bg hover:bg-sage-100 text-charcoal-700 border border-[#E5E0D5] transition-colors"
                              title="Inspect extracted text & RAG chunks"
                            >
                              <Eye className="w-3.5 h-3.5 text-forest-600" />
                            </button>
                            <button
                              onClick={() => handleDownloadDocument(doc.id, doc.name)}
                              className="p-1.5 rounded-lg bg-academic-bg hover:bg-sage-100 text-charcoal-700 border border-[#E5E0D5] transition-colors"
                              title="Download original file"
                            >
                              <Download className="w-3.5 h-3.5 text-forest-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc.id, doc.name)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                              title="Permanently delete document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SECURITY AUDIT TRAIL */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-charcoal-900">Administrative Audit Trail</h3>
            <span className="text-xs text-charcoal-500">Last 200 security events</span>
          </div>

          <div className="rounded-2xl bg-white border border-[#E5E0D5] shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-academic-bg border-b border-[#E5E0D5] text-charcoal-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Admin Email</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Target Student</th>
                    <th className="px-4 py-3">Document</th>
                    <th className="px-4 py-3">Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D5]">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-charcoal-400">
                        No audit events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-sage-50/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-[11px] text-charcoal-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-mono text-charcoal-700">
                          {log.admin_email}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-charcoal-600">
                          {log.target_user_email || log.target_user_id || '—'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-charcoal-800">
                          {log.document_name || log.document_id || '—'}
                        </td>
                        <td className="px-4 py-3 text-charcoal-600 max-w-xs truncate">
                          {log.details || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STUDENT PROFILE & DOCUMENTS DRAWER */}
      {/* ========================================================================= */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-end z-50 animate-in fade-in">
          <div className="w-full max-w-lg h-full bg-white shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D5]">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center font-bold">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-black text-lg text-charcoal-900">{selectedStudent.name}</h2>
                    <p className="text-xs text-charcoal-500 font-mono">{selectedStudent.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-800 hover:bg-sage-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Student Metadata Card */}
              <div className="p-4 rounded-xl bg-academic-bg border border-[#E5E0D5] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-charcoal-500">University:</span>
                  <span className="font-bold text-charcoal-900">{selectedStudent.university}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Degree & Branch:</span>
                  <span className="font-bold text-charcoal-900">{selectedStudent.course} ({selectedStudent.branch})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Term:</span>
                  <span className="font-bold text-charcoal-900">{selectedStudent.semester || selectedStudent.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Account Created:</span>
                  <span className="font-mono text-charcoal-700">{new Date(selectedStudent.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Student's Uploaded Files */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-charcoal-500 flex items-center justify-between">
                  <span>Student's Uploaded Files</span>
                  <span>{selectedStudentDocs.length} files</span>
                </h4>

                {loadingStudentDocs ? (
                  <div className="p-6 text-center text-xs text-charcoal-400">Loading student files...</div>
                ) : selectedStudentDocs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-charcoal-400 rounded-xl bg-sage-50/50 border border-[#E5E0D5]">
                    No files uploaded by this student.
                  </div>
                ) : (
                  selectedStudentDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-xl bg-white border border-[#E5E0D5] flex items-center justify-between gap-3 shadow-subtle"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <FileText className="w-4 h-4 text-forest-600 flex-shrink-0" />
                        <div className="overflow-hidden">
                          <p className="font-bold text-xs text-charcoal-900 truncate">{doc.name}</p>
                          <p className="text-[10px] text-charcoal-400">{formatFileSize(doc.size)} • {doc.chunkCount || 0} chunks</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleInspectDocument(doc.id, doc.name)}
                          className="p-1 rounded bg-sage-100 hover:bg-sage-200 text-charcoal-700"
                          title="Inspect chunks"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownloadDocument(doc.id, doc.name)}
                          className="p-1 rounded bg-sage-100 hover:bg-sage-200 text-charcoal-700"
                          title="Download file"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc.id, doc.name)}
                          className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600"
                          title="Delete file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>

            <div className="pt-4 border-t border-[#E5E0D5]">
              <button
                onClick={() => setSelectedStudent(null)}
                className="w-full py-2.5 rounded-xl bg-charcoal-800 text-white font-bold text-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DOCUMENT INSPECTION MODAL */}
      {/* ========================================================================= */}
      {inspectingDoc && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="w-full max-w-3xl max-h-[85vh] bg-white rounded-3xl shadow-2xl p-6 flex flex-col justify-between overflow-hidden">
            
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D5]">
              <div>
                <h3 className="font-black text-lg text-charcoal-900">{inspectingDoc.name}</h3>
                <p className="text-xs text-charcoal-500">
                  Student Owner: <strong>{inspectingDoc.studentName}</strong> ({inspectingDoc.studentEmail})
                </p>
              </div>
              <button
                onClick={() => setInspectingDoc(null)}
                className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-800 hover:bg-sage-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 overflow-y-auto space-y-4 pr-1">
              {loadingDocDetail ? (
                <div className="p-12 text-center text-xs text-charcoal-400">Loading document details...</div>
              ) : (
                <>
                  <div className="p-3.5 rounded-xl bg-academic-bg border border-[#E5E0D5] text-xs">
                    <span className="font-bold text-charcoal-700 block mb-1">Extracted Text Preview:</span>
                    <p className="text-charcoal-600 font-mono text-[11px] max-h-36 overflow-y-auto whitespace-pre-wrap">
                      {inspectingDoc.extractedText || 'No text extracted.'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="font-bold text-xs text-charcoal-700 block">
                      Generated RAG Citation Chunks ({inspectingDoc.chunks?.length || 0}):
                    </span>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {(inspectingDoc.chunks || []).map((chk: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-xl bg-white border border-[#E5E0D5] text-xs space-y-1">
                          <span className="font-mono text-[10px] font-bold text-forest-700 block">
                            {chk.pageOrSection || `Chunk ${idx + 1}`}
                          </span>
                          <p className="text-charcoal-700 leading-relaxed text-[11px]">
                            {chk.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-[#E5E0D5] flex items-center justify-between">
              <button
                onClick={() => handleDownloadDocument(inspectingDoc.id, inspectingDoc.name)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-700 font-bold text-xs border border-forest-200"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Original File</span>
              </button>
              <button
                onClick={() => setInspectingDoc(null)}
                className="px-5 py-2 rounded-xl bg-forest-500 hover:bg-forest-600 text-white font-bold text-xs"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
