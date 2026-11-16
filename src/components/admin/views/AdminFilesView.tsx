import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  FileText,
  FileCode,
  HardDrive,
  Calendar,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  X,
  ExternalLink,
  Layers,
  ArrowUpDown
} from 'lucide-react';

interface GlobalDocumentItem {
  id: string;
  userId: string;
  name: string;
  type: string;
  size: number;
  uploadStatus: string;
  processingStatus: string;
  chunkCount: number;
  wordCount: number;
  hasExtractedText?: boolean;
  createdAt: string;
  user_name?: string;
  user_email?: string;
}

interface AdminFilesViewProps {
  onInspectDocument: (docId: string, docName: string) => void;
}

export const AdminFilesView: React.FC<AdminFilesViewProps> = ({ onInspectDocument }) => {
  const [documents, setDocuments] = useState<GlobalDocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [studentFilter, setStudentFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Preview Modal
  const [previewingDoc, setPreviewingDoc] = useState<{ id: string; name: string; type: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const fetchDocuments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin?action=documents', { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load global document repository.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
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
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  const handleDownload = (docId: string, docName: string) => {
    const downloadUrl = `/api/admin?action=download&id=${encodeURIComponent(docId)}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = docName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async (docId: string, docName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${docName}"? This action cannot be undone and will remove it from the student's workspace and RAG index.`)) {
      return;
    }

    setIsDeleting(docId);
    try {
      const res = await fetch(`/api/admin?action=delete-document&id=${encodeURIComponent(docId)}`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== docId));
        setDeleteNotice(`Successfully deleted "${docName}".`);
        setTimeout(() => setDeleteNotice(null), 5000);
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.error?.message || 'Failed to delete document.');
      }
    } catch (err: any) {
      alert(err?.message || 'Network error deleting document.');
    } finally {
      setIsDeleting(null);
    }
  };

  // Unique list of students for dropdown filter
  const uniqueStudents = Array.from(
    new Set(documents.map(d => d.user_email || d.userId).filter(Boolean))
  );

  // Filter Logic
  const filteredDocs = documents.filter((doc) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = doc.name.toLowerCase().includes(q);
      const matchStudent = (doc.user_name || '').toLowerCase().includes(q);
      const matchEmail = (doc.user_email || '').toLowerCase().includes(q);
      if (!matchName && !matchStudent && !matchEmail) return false;
    }

    // Student Filter
    if (studentFilter !== 'all') {
      if ((doc.user_email || doc.userId) !== studentFilter) return false;
    }

    // Type Filter
    if (typeFilter !== 'all') {
      if (doc.type.toLowerCase() !== typeFilter.toLowerCase()) return false;
    }

    // Status Filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'indexed' && doc.processingStatus !== 'indexed' && doc.uploadStatus !== 'completed') return false;
      if (statusFilter === 'processing' && doc.processingStatus !== 'processing' && doc.uploadStatus !== 'pending') return false;
      if (statusFilter === 'failed' && doc.processingStatus !== 'failed' && doc.uploadStatus !== 'failed') return false;
    }

    return true;
  }).sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });

  const totalPages = Math.ceil(filteredDocs.length / pageSize) || 1;
  const paginatedDocs = filteredDocs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#242A25] border border-[#374138] rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <FolderOpen className="w-6 h-6 text-[#66C296]" />
            All Uploaded Files & Global Repository
          </h1>
          <p className="text-xs text-[#A0A89C] mt-1">
            Global repository of every file uploaded by all students across StudyPilot AI. Preview PDFs, inspect semantic RAG chunks, download byte-perfect binary, or delete.
          </p>
        </div>
        <div className="text-xs font-mono text-[#66C296] bg-[#22382C] px-3.5 py-1.5 rounded-xl border border-emerald-800 self-start sm:self-auto">
          {documents.length} Total Files • {formatBytes(documents.reduce((acc, d) => acc + (d.size || 0), 0))}
        </div>
      </div>

      {deleteNotice && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{deleteNotice}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-[#242A25] border border-[#374138] rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-[#859180] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by filename or student..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#1A1F1B] border border-[#3A463B] rounded-xl text-white placeholder-[#687364] focus:outline-none focus:ring-1 focus:ring-[#66C296]"
            />
          </div>

          {/* Student Filter */}
          <div className="flex items-center gap-2">
            <select
              value={studentFilter}
              onChange={(e) => {
                setStudentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-[#1A1F1B] border border-[#3A463B] rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[#66C296]"
            >
              <option value="all">All Students</option>
              {uniqueStudents.map((email) => (
                <option key={email} value={email}>
                  {email}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-[#1A1F1B] border border-[#3A463B] rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[#66C296]"
            >
              <option value="all">All Types</option>
              <option value="pdf">PDF Documents</option>
              <option value="docx">DOCX Documents</option>
              <option value="txt">Text Notes</option>
              <option value="other">Images / Other</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="w-full px-3 py-2 text-xs font-semibold bg-[#1A1F1B] border border-[#3A463B] rounded-xl text-white flex items-center justify-between hover:border-[#4E5D4F] transition-colors cursor-pointer"
            >
              <span>{sortOrder === 'desc' ? 'Latest Upload' : 'Oldest'}</span>
              <ArrowUpDown className="w-3.5 h-3.5 text-[#859180]" />
            </button>
          </div>
        </div>
      </div>

      {/* Global Files Table */}
      <div className="bg-[#242A25] border border-[#374138] rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#343E35] bg-[#1E231F] text-[11px] font-bold text-[#A0A89C] uppercase tracking-wider">
                <th className="py-3.5 px-5">Original Filename</th>
                <th className="py-3.5 px-4">Uploaded By</th>
                <th className="py-3.5 px-4">Format & Size</th>
                <th className="py-3.5 px-4">Processing Status</th>
                <th className="py-3.5 px-4 text-center">RAG Chunks</th>
                <th className="py-3.5 px-4">Upload Date</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2F3830] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#859180]">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#66C296] mb-2" />
                    <span>Loading global files from studypilot_documents...</span>
                  </td>
                </tr>
              ) : paginatedDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#859180]">
                    No files found matching the criteria.
                  </td>
                </tr>
              ) : (
                paginatedDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#2A322B] transition-colors">
                    {/* Filename */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-[#66C296] flex-shrink-0" />
                        <span className="font-bold text-white text-xs">{doc.name}</span>
                      </div>
                      <div className="text-[10px] text-[#6E786B] font-mono mt-0.5 ml-6.5">
                        Doc ID: {doc.id.slice(0, 16)}...
                      </div>
                    </td>

                    {/* Student */}
                    <td className="py-3.5 px-4">
                      <div className="text-white font-medium text-xs truncate max-w-[160px]">
                        {doc.user_name || 'Student'}
                      </div>
                      <div className="text-[11px] text-[#A0A89C] font-mono truncate max-w-[160px]">
                        {doc.user_email || doc.userId}
                      </div>
                    </td>

                    {/* Format & Size */}
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[#1A1F1B] border border-[#3A463B] text-[#E2C785] mr-1.5">
                        {doc.type}
                      </span>
                      <span className="text-white">{formatBytes(doc.size)}</span>
                    </td>

                    {/* Processing Status */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          doc.processingStatus === 'indexed' || doc.uploadStatus === 'completed'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                            : 'bg-amber-950/60 text-amber-300 border-amber-800'
                        }`}>
                          {doc.processingStatus || 'indexed'}
                        </span>
                        {doc.hasExtractedText && (
                          <span className="text-[10px] text-[#859180] font-mono" title="Text extracted">
                            ✓ Text
                          </span>
                        )}
                      </div>
                    </td>

                    {/* RAG Chunks */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono font-bold text-white text-xs">
                        {doc.chunkCount || 0}
                      </span>
                      <span className="text-[10px] text-[#6E786B] block">
                        {doc.wordCount || 0} words
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-[#859180] font-mono text-xs">
                      {formatDate(doc.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Preview */}
                        <button
                          onClick={() => setPreviewingDoc({ id: doc.id, name: doc.name, type: doc.type })}
                          className="p-1.5 rounded-lg bg-[#2E362F] hover:bg-[#38433A] text-white border border-[#404D41] transition-colors cursor-pointer"
                          title="Preview Document Inline"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#E2C785]" />
                        </button>

                        {/* Inspect RAG */}
                        <button
                          onClick={() => onInspectDocument(doc.id, doc.name)}
                          className="p-1.5 rounded-lg bg-[#2E362F] hover:bg-[#38433A] text-white border border-[#404D41] transition-colors cursor-pointer"
                          title="Inspect Semantic RAG Chunks"
                        >
                          <Layers className="w-3.5 h-3.5 text-[#85B7E2]" />
                        </button>

                        {/* Download original binary */}
                        <button
                          onClick={() => handleDownload(doc.id, doc.name)}
                          className="p-1.5 rounded-lg bg-[#2E362F] hover:bg-[#38433A] text-white border border-[#404D41] transition-colors cursor-pointer"
                          title="Download Original Binary File"
                        >
                          <Download className="w-3.5 h-3.5 text-[#66C296]" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(doc.id, doc.name)}
                          disabled={isDeleting === doc.id}
                          className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800 transition-colors cursor-pointer disabled:opacity-50"
                          title="Permanently Delete Document"
                        >
                          {isDeleting === doc.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
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
            Showing <span className="text-white font-bold">{filteredDocs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="text-white font-bold">{Math.min(currentPage * pageSize, filteredDocs.length)}</span> of{' '}
            <span className="text-white font-bold">{filteredDocs.length}</span> documents
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-xl bg-[#1A1F1B] border border-[#3A463B] text-white hover:bg-[#2A322B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            <span className="font-mono text-white text-xs font-bold px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-xl bg-[#1A1F1B] border border-[#3A463B] text-white hover:bg-[#2A322B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Inline Preview Modal */}
      {previewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#1E231F] border border-[#3A463B] rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#343E35] flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-5 h-5 text-[#E2C785] flex-shrink-0" />
                <h3 className="text-sm font-bold text-white truncate">{previewingDoc.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(previewingDoc.id, previewingDoc.name)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#2E362F] hover:bg-[#38433A] text-[#66C296] border border-[#404D41] transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setPreviewingDoc(null)}
                  className="p-1.5 rounded-xl text-[#A0A89C] hover:text-white hover:bg-[#2E362F] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Embedded PDF or Text Viewer */}
            <div className="flex-1 overflow-hidden p-2 sm:p-4 bg-[#141815]">
              <iframe
                src={`/api/admin?action=preview&id=${encodeURIComponent(previewingDoc.id)}`}
                className="w-full h-[65vh] rounded-xl border border-[#2E362F] bg-white"
                title={previewingDoc.name}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
