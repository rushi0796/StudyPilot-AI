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
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
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
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`Delete failed with HTTP ${res.status}`);
      }
      setDocuments(prev => prev.filter(d => d.id !== docId));
      setDeleteNotice(`"${docName}" was permanently deleted and logged to security audit trail.`);
      setTimeout(() => setDeleteNotice(null), 4000);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete document.');
    } finally {
      setIsDeleting(null);
    }
  };

  // Distinct students for dropdown
  const studentOptions = Array.from(
    new Map(documents.map(d => [d.userId, { id: d.userId, name: d.user_name || d.user_email || d.userId }])).values()
  );

  // Filter logic
  const filteredDocs = documents.filter((d) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = d.name.toLowerCase().includes(q);
      const matchUser = (d.user_name || '').toLowerCase().includes(q) || (d.user_email || '').toLowerCase().includes(q);
      if (!matchName && !matchUser) return false;
    }

    if (studentFilter !== 'all' && d.userId !== studentFilter) return false;
    if (typeFilter !== 'all' && d.type !== typeFilter) return false;
    if (statusFilter !== 'all' && d.processingStatus !== statusFilter) return false;

    return true;
  }).sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });

  const totalPages = Math.max(1, Math.ceil(filteredDocs.length / pageSize));
  const displayedDocs = filteredDocs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Global File Management
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            All Uploaded Documents
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            View, preview, download, inspect RAG embeddings, or permanently purge files across all student workspaces.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            Total Files: <span className="font-bold text-white">{documents.length}</span>
          </span>
        </div>
      </div>

      {deleteNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{deleteNotice}</span>
        </div>
      )}

      {/* Control Bar: Search & Filters */}
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
              placeholder="Search by file name or student owner..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Student Filter */}
          <select
            value={studentFilter}
            onChange={(e) => {
              setStudentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="py-2 px-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="all">All Students ({studentOptions.length})</option>
            {studentOptions.map(opt => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>

          {/* File Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="py-2 px-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="all">All File Types</option>
            <option value="pdf">PDF Documents (.pdf)</option>
            <option value="docx">Word Handouts (.docx)</option>
            <option value="md">Markdown (.md)</option>
            <option value="txt">Plain Text (.txt)</option>
          </select>

          {/* Sort Toggle */}
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            title={`Sort by Upload Date: ${sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}`}
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Files Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-400 mb-2" />
            <p className="text-xs font-mono">Querying global studypilot_documents repository from Neon PostgreSQL...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-400 text-xs">
            {error}
          </div>
        ) : displayedDocs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <FolderOpen className="w-8 h-8 mx-auto text-slate-600 mb-1" />
            <p className="text-sm font-semibold text-slate-300">No matching documents found</p>
            <p className="text-xs">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 bg-slate-950/40">
                  <th className="py-3 px-4 font-medium">Document Name</th>
                  <th className="py-3 px-4 font-medium">Student Owner</th>
                  <th className="py-3 px-4 font-medium">Size</th>
                  <th className="py-3 px-4 font-medium">RAG Chunks</th>
                  <th className="py-3 px-4 font-medium">Upload Date</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {displayedDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span className="truncate max-w-[240px]" title={doc.name}>{doc.name}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">ID: {doc.id}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div className="font-medium text-slate-200">{doc.user_name || 'Student'}</div>
                      <div className="text-[11px] font-mono text-slate-400">{doc.user_email || doc.userId}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      {formatBytes(doc.size)}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300">
                        {doc.chunkCount || 0} chunks ({doc.wordCount || 0} words)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {formatDate(doc.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewingDoc({ id: doc.id, name: doc.name, type: doc.type })}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Preview Document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownload(doc.id, doc.name)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Download Original File"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onInspectDocument(doc.id, doc.name)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Inspect RAG Chunks"
                        >
                          <Layers className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id, doc.name)}
                          disabled={isDeleting === doc.id}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors disabled:opacity-50"
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
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing Page <span className="font-bold text-white">{currentPage}</span> of <span className="font-bold text-white">{totalPages}</span> ({filteredDocs.length} Documents)
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

      {/* PDF / File Preview Modal */}
      {previewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-5xl h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-white truncate">{previewingDoc.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 uppercase">
                  {previewingDoc.type}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(previewingDoc.id, previewingDoc.name)}
                  className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setPreviewingDoc(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 bg-slate-950 overflow-hidden relative">
              <iframe
                src={`/api/admin?action=preview&id=${encodeURIComponent(previewingDoc.id)}`}
                className="w-full h-full border-none"
                title={previewingDoc.name}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
