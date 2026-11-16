import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  FileText,
  Sparkles,
  BookOpen,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const AdminRagInspectionView: React.FC<{ initialDocId?: string }> = ({ initialDocId }) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocId || '');
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [testQuery, setTestQuery] = useState('');
  const [scoredChunks, setScoredChunks] = useState<any[]>([]);

  // Fetch documents list for selector
  useEffect(() => {
    fetch('/api/admin?action=documents', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const docs = data.documents || [];
        setDocuments(docs);
        if (!selectedDocId && docs.length > 0) {
          setSelectedDocId(docs[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch full document with chunks when selectedDocId changes
  useEffect(() => {
    if (!selectedDocId) return;
    setLoadingDoc(true);
    fetch(`/api/admin?action=document-detail&id=${encodeURIComponent(selectedDocId)}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setSelectedDoc(data.document || null);
        setScoredChunks([]);
      })
      .catch(() => setSelectedDoc(null))
      .finally(() => setLoadingDoc(false));
  }, [selectedDocId]);

  // Simulate semantic retrieval scoring
  const handleTestQuery = () => {
    if (!selectedDoc || !testQuery.trim()) {
      setScoredChunks([]);
      return;
    }

    const q = testQuery.toLowerCase();
    const queryTokens = q.split(/\s+/).filter(t => t.length > 2);
    const chunks = selectedDoc.chunks || [];

    const scored = chunks.map((chk: any) => {
      const content = (chk.content || '').toLowerCase();
      let matchCount = 0;
      for (const token of queryTokens) {
        if (content.includes(token)) {
          matchCount++;
        }
      }
      const score = queryTokens.length > 0 ? Math.round((matchCount / queryTokens.length) * 100) : 0;
      return {
        ...chk,
        score,
        matched: score > 0
      };
    }).sort((a: any, b: any) => b.score - a.score);

    setScoredChunks(scored);
  };

  const chunksToDisplay = scoredChunks.length > 0 ? scoredChunks : (selectedDoc?.chunks || []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#242A25] border border-[#374138] rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-[#85B7E2]" />
            RAG Semantic Retrieval & Chunk Inspector
          </h1>
          <p className="text-xs text-[#A0A89C] mt-1">
            Inspect the exact semantic chunks ingested into the database for any student document, and simulate RAG retrieval scoring with live queries.
          </p>
        </div>
      </div>

      {/* Document Selector & Query Tester */}
      <div className="bg-[#242A25] border border-[#374138] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#A0A89C] uppercase tracking-wider mb-1.5">
              Select Document to Inspect:
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-[#1A1F1B] border border-[#3A463B] rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[#85B7E2]"
            >
              {documents.length === 0 ? (
                <option value="">No documents uploaded in system</option>
              ) : (
                documents.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.user_name || 'Student'})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#A0A89C] uppercase tracking-wider mb-1.5">
              Simulate Student Query (Test RAG Retrieval):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleTestQuery(); }}
                placeholder="e.g. What is the ACID principle or 3NF?"
                className="flex-1 px-3 py-2.5 text-xs bg-[#1A1F1B] border border-[#3A463B] rounded-xl text-white placeholder-[#687364] focus:outline-none focus:ring-1 focus:ring-[#85B7E2]"
              />
              <button
                onClick={handleTestQuery}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#85B7E2] hover:bg-[#97C6F2] text-charcoal-900 shadow-md transition-colors cursor-pointer"
              >
                Score Chunks
              </button>
            </div>
          </div>
        </div>

        {selectedDoc && (
          <div className="pt-3 border-t border-[#343E35] flex items-center justify-between text-xs text-[#A0A89C] flex-wrap gap-2">
            <div>
              Student: <span className="text-white font-bold">{selectedDoc.studentName}</span> ({selectedDoc.studentEmail})
            </div>
            <div className="font-mono">
              Total Chunks: <span className="text-[#85B7E2] font-bold">{selectedDoc.chunkCount}</span> • Total Words: <span className="text-[#85B7E2] font-bold">{selectedDoc.wordCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* Chunks List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>Semantic Document Chunks</span>
          {scoredChunks.length > 0 && (
            <span className="text-xs font-normal text-[#85B7E2]">
              (Sorted by similarity to "{testQuery}")
            </span>
          )}
        </h3>

        {loadingDoc ? (
          <div className="py-12 text-center text-[#859180] bg-[#242A25] border border-[#374138] rounded-2xl">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#85B7E2] mb-2" />
            <span>Loading chunks from studypilot_documents...</span>
          </div>
        ) : chunksToDisplay.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#859180] bg-[#242A25] border border-[#374138] rounded-2xl">
            No chunks found for this document.
          </div>
        ) : (
          chunksToDisplay.map((chk: any, idx: number) => (
            <div 
              key={chk.id || idx}
              className={`p-4 rounded-2xl border transition-all ${
                chk.score && chk.score > 0 
                  ? 'bg-[#1E2E25] border-[#3E8D6D] shadow-md' 
                  : 'bg-[#242A25] border-[#374138]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[#1A1F1B] border border-[#3A463B] text-[#85B7E2]">
                    Chunk #{chk.chunkIndex ?? idx}
                  </span>
                  <span className="text-xs font-semibold text-white">
                    {chk.pageOrSection || 'General Section'}
                  </span>
                </div>

                {chk.score !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                    chk.score > 40 
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                      : 'bg-charcoal-800 text-[#859180]'
                  }`}>
                    Match: {chk.score}%
                  </span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-[#1A1F1B] border border-[#2E372F] text-xs text-[#D5DCD2] font-mono leading-relaxed whitespace-pre-wrap">
                {chk.content}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
