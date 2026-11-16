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
  Loader2,
  AlertCircle,
  Activity,
  Laptop,
  Smartphone,
  ShieldCheck,
  CheckCircle2
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

interface LoginSession {
  id: string;
  created_at: string;
  user_agent: string | null;
  ip_address: string | null;
  expires_at: string;
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
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'documents' | 'activity' | 'sessions'>('documents');

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
      setSessions(data.loginSessions || []);
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
      <div className="py-24 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-400 mb-3" />
        <p className="text-xs font-mono">Fetching student records and activity history from Neon PostgreSQL...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-slate-900 border border-rose-500/20 rounded-2xl p-8 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Student Record Not Found</h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">{error || 'Could not locate student profile.'}</p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Students Directory</span>
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
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
          <span>Back to Students</span>
        </button>
      </div>

      {/* Student Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg flex-shrink-0">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-white tracking-tight">{profile.name}</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Student Account
                </span>
                {profile.onboardingCompleted && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Onboarded
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2 font-mono">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  {profile.email}
                </span>
                <span>•</span>
                <span>ID: {profile.id.substring(0, 16)}...</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700/60 text-slate-300">
                  {profile.course || 'B.Tech'} — {profile.branch || 'AIML'}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700/60 text-slate-300">
                  {profile.year || '2nd Year'} • {profile.semester || 'Semester III'}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700/60 text-slate-300">
                  {profile.university || 'University'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right flex-shrink-0 text-xs text-slate-400 font-mono">
            <div className="flex items-center sm:justify-end gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Joined: {formatDate(profile.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400">Total Uploaded Files</div>
            <div className="text-lg font-bold font-mono text-slate-100 mt-0.5">{documents.length}</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400">Storage Consumed</div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">{formatBytes(profile.storageConsumed)}</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400">Quiz / Evals Done</div>
            <div className="text-lg font-bold font-mono text-blue-400 mt-0.5">{activities.length}</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400">Active Login Sessions</div>
            <div className="text-lg font-bold font-mono text-purple-400 mt-0.5">{sessions.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'documents'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>Uploaded Documents ({documents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'activity'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Learning Activity ({activities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'sessions'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Login History & Devices ({sessions.length})</span>
        </button>
      </div>

      {/* Tab 1: Uploaded Documents */}
      {activeTab === 'documents' && (
        <div className="space-y-3">
          {documents.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              <FolderOpen className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-xs">No documents uploaded by this student yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-white truncate" title={doc.name}>
                          {doc.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                          <span>{formatBytes(doc.size)}</span>
                          <span>•</span>
                          <span>{doc.chunk_count || 0} chunks</span>
                          <span>•</span>
                          <span>{doc.word_count || 0} words</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
                      {doc.processing_status || 'indexed'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                    <span className="text-[11px] font-mono text-slate-500">
                      {formatDate(doc.created_at)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onInspectDocument(doc.id, doc.name)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                      >
                        Inspect RAG
                      </button>
                      <button
                        onClick={() => handleDownload(doc.id, doc.name)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Download Original File"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Learning Activity */}
      {activeTab === 'activity' && (
        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              <Activity className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-xs">No learning activity or quiz attempts recorded for this student yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-100 truncate">{act.title || act.action || 'Activity'}</div>
                      <div className="text-[11px] text-slate-400">{act.details || act.description || 'Completed module evaluation'}</div>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-slate-500 whitespace-nowrap">
                    {formatDate(act.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Login History & Device Sessions */}
      {activeTab === 'sessions' && (
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              <Clock className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-xs">No active or historical login sessions found in database.</p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 bg-slate-950/40">
                    <th className="py-3 px-4 font-medium">Session Timestamp</th>
                    <th className="py-3 px-4 font-medium">Device / User Agent</th>
                    <th className="py-3 px-4 font-medium">IP Address</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {sessions.map((sess, idx) => {
                    const isMobile = sess.user_agent && /mobile|android|iphone|ipad/i.test(sess.user_agent);
                    const isExpired = new Date(sess.expires_at).getTime() < Date.now();
                    return (
                      <tr key={sess.id || idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                          {formatDate(sess.created_at)}
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-sans">
                          <div className="flex items-center gap-2">
                            {isMobile ? (
                              <Smartphone className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                            ) : (
                              <Laptop className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            )}
                            <span className="truncate max-w-[280px]" title={sess.user_agent || 'Unknown browser'}>
                              {sess.user_agent || 'Standard Web Browser'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {sess.ip_address || '127.0.0.1'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            !isExpired
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {!isExpired ? 'Active Session' : 'Expired'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
