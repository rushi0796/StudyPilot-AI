import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Mail,
  GraduationCap,
  Calendar,
  Clock,
  HardDrive,
  FolderOpen,
  FileCheck2,
  FileText,
  Eye,
  Download,
  Trash2,
  Loader2,
  AlertCircle,
  Activity
} from 'lucide-react';

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  university: string;
  course: string;
  branch: string;
  year: string;
  semester: string;
  role: 'student';
  onboardingCompleted: boolean;
  createdAt: string;
  uploadedDocsCount: number;
  processedDocsCount: number;
  storageConsumed: number;
}

interface StudentDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  upload_status: string;
  processing_status: string;
  chunk_count: number;
  word_count: number;
  created_at: string;
}

interface AdminStudentDetailsViewProps {
  studentId: string;
  onBack: () => void;
  onInspectDocument: (docId: string, docName: string) => void;
}

export const AdminStudentDetailsView: React.FC<AdminStudentDetailsViewProps> = ({
  studentId,
  onBack,
  onInspectDocument
}) => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'documents' | 'activity'>('documents');

  const fetchStudentData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin?action=user-detail&userId=${encodeURIComponent(studentId)}`, {
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data = await res.json();
      setProfile(data.user);
      setDocuments(data.documents || []);
      setActivities(data.activities || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load student details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchStudentData();
    }
  }, [studentId]);

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

  if (isLoading) {
    return (
      <div className="py-24 text-center text-[#859180]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#E2C785] mb-3" />
        <p className="text-xs font-mono">Fetching student records and private documents from Neon PostgreSQL...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-[#242A25] border border-rose-900/60 rounded-3xl p-8 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Student Record Not Found</h2>
        <p className="text-xs text-[#A0A89C] max-w-md mx-auto">{error || 'Could not locate student profile.'}</p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#2E362F] hover:bg-[#38433A] text-white border border-[#404D41] transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Students Directory</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#A0A89C] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Students</span>
        </button>
      </div>

      {/* Student Profile Card */}
      <div className="bg-[#242A25] border border-[#374138] rounded-3xl p-6 sm:p-8 shadow-xl text-white">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2D362E] to-[#1E231F] border border-[#3E4D40] text-[#E2C785] flex items-center justify-center font-bold text-xl font-mono shadow-md">
              {profile.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {profile.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                  Student Account
                </span>
                {profile.onboardingCompleted && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950/60 text-blue-300 border border-blue-800">
                    Onboarded
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 mt-2 text-xs text-[#A0A89C] flex-wrap font-mono">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#859180]" />
                  {profile.email}
                </span>
                <span className="text-[#566054]">•</span>
                <span className="text-[#859180]">ID: {profile.id}</span>
              </div>

              <div className="flex items-center gap-3 mt-3 text-xs text-[#D5DCD2] flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#1A1F1B] border border-[#364237]">
                  <GraduationCap className="w-3.5 h-3.5 text-[#E2C785]" />
                  {profile.course || 'B.Tech'} — {profile.branch || 'AIML'}
                </span>
                <span className="px-3 py-1 rounded-xl bg-[#1A1F1B] border border-[#364237] text-[#A0A89C]">
                  {profile.year || '2nd Year'} • {profile.semester || 'Semester III'}
                </span>
                <span className="px-3 py-1 rounded-xl bg-[#1A1F1B] border border-[#364237] text-[#A0A89C]">
                  {profile.university || 'Sanjay Ghodawat University'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right flex-shrink-0 text-xs text-[#859180]">
            <div className="flex items-center sm:justify-end gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#6E786B]" />
              <span>Joined: {formatDate(profile.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards for this student */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#242A25] border border-[#374138] p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#A0A89C]">Uploaded Documents</span>
            <FolderOpen className="w-4 h-4 text-[#66C296]" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{documents.length}</div>
          <p className="text-[11px] text-[#6E786B] mt-1">Study materials in private storage</p>
        </div>

        <div className="bg-[#242A25] border border-[#374138] p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#A0A89C]">Processed & Indexed</span>
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {documents.filter(d => d.processing_status === 'indexed' || d.upload_status === 'completed').length}
          </div>
          <p className="text-[11px] text-[#6E786B] mt-1">Semantic RAG ready chunks</p>
        </div>

        <div className="bg-[#242A25] border border-[#374138] p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#A0A89C]">Storage Consumed</span>
            <HardDrive className="w-4 h-4 text-[#85B7E2]" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {formatBytes(documents.reduce((acc, d) => acc + (d.size || 0), 0))}
          </div>
          <p className="text-[11px] text-[#6E786B] mt-1">PostgreSQL binary payload footprint</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#374138] pb-3">
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'documents'
              ? 'bg-[#E2C785] text-charcoal-900 shadow-md'
              : 'text-[#A0A89C] hover:text-white bg-[#242A25]'
          }`}
        >
          Uploaded Documents ({documents.length})
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'activity'
              ? 'bg-[#E2C785] text-charcoal-900 shadow-md'
              : 'text-[#A0A89C] hover:text-white bg-[#242A25]'
          }`}
        >
          Learning Activity Logs ({activities.length})
        </button>
      </div>

      {/* Tab 1: Uploaded Documents */}
      {activeTab === 'documents' && (
        <div className="bg-[#242A25] border border-[#374138] rounded-3xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-[#343E35]">
            <h3 className="text-sm font-bold text-white">Student Document Repository</h3>
            <p className="text-xs text-[#A0A89C]">
              Files uploaded exclusively by this student. Super Admin can preview extracted text, inspect semantic RAG chunks, or download the original file.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#343E35] bg-[#1E231F] text-[11px] font-bold text-[#A0A89C] uppercase tracking-wider">
                  <th className="py-3 px-5">Document Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">RAG Status</th>
                  <th className="py-3 px-4">Chunks</th>
                  <th className="py-3 px-4">Uploaded</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2F3830] text-xs">
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#859180]">
                      This student has not uploaded any study materials yet.
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-[#2A322B] transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-[#66C296] flex-shrink-0" />
                          <span className="font-bold text-white">{doc.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono uppercase text-[#A0A89C] text-[11px]">
                        {doc.type}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-white text-xs">
                        {formatBytes(doc.size)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                          {doc.processing_status || 'indexed'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-white">
                        {doc.chunk_count || 0}
                      </td>
                      <td className="py-3.5 px-4 text-[#859180] font-mono text-[11px]">
                        {formatDate(doc.created_at)}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onInspectDocument(doc.id, doc.name)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#2E362F] hover:bg-[#39443B] text-white border border-[#404D41] transition-colors cursor-pointer"
                            title="Inspect Chunks and Text"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#E2C785]" />
                            <span>Inspect</span>
                          </button>
                          <button
                            onClick={() => handleDownload(doc.id, doc.name)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#2E362F] hover:bg-[#39443B] text-white border border-[#404D41] transition-colors cursor-pointer"
                            title="Download Original File"
                          >
                            <Download className="w-3.5 h-3.5 text-[#66C296]" />
                            <span>Download</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Activity Logs */}
      {activeTab === 'activity' && (
        <div className="bg-[#242A25] border border-[#374138] rounded-3xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-4">Student Activity Summary</h3>
          {activities.length === 0 ? (
            <p className="text-xs text-[#859180] py-6 text-center">
              No quiz or evaluation activity recorded for this student yet.
            </p>
          ) : (
            <div className="divide-y divide-[#323B33]">
              {activities.map((act) => (
                <div key={act.id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <span className="font-bold text-white text-xs">{act.title || act.activity_type}</span>
                    <p className="text-[11px] text-[#A0A89C] mt-0.5">{act.description}</p>
                  </div>
                  <span className="text-[10px] text-[#859180] font-mono flex-shrink-0">
                    {formatDate(act.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
