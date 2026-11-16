import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Clock,
  AlertTriangle,
  Layers,
  FileText,
  Activity,
  HardDrive,
  RefreshCw,
  Cpu,
  CheckCircle2
} from 'lucide-react';

export const AdminProcessingStatusView: React.FC = () => {
  const [docs, setDocs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin?action=documents', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setDocs(data.documents || []);
      }
    } catch {}
    finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const total = docs.length;
  const processed = docs.filter(d => d.processingStatus === 'indexed' || d.uploadStatus === 'completed').length;
  const pending = docs.filter(d => d.processingStatus === 'processing' || d.uploadStatus === 'pending').length;
  const failed = docs.filter(d => d.processingStatus === 'failed' || d.uploadStatus === 'failed').length;

  const pdfCount = docs.filter(d => d.type === 'pdf').length;
  const docxCount = docs.filter(d => d.type === 'docx').length;
  const txtCount = docs.filter(d => d.type === 'txt' || d.type === 'md').length;
  const otherCount = total - (pdfCount + docxCount + txtCount);

  const totalChunks = docs.reduce((acc, d) => acc + (d.chunkCount || 0), 0);
  const totalWords = docs.reduce((acc, d) => acc + (d.wordCount || 0), 0);
  const avgChunks = total > 0 ? (totalChunks / total).toFixed(1) : '0';
  const avgWords = total > 0 ? Math.round(totalWords / total) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#242A25] border border-[#374138] rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-emerald-400" />
            Document Processing Pipeline & Health
          </h1>
          <p className="text-xs text-[#A0A89C] mt-1">
            Real-time status of document ingestion, PDF parsing, OCR recognition, semantic chunking, and vector index generation.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#2E362F] hover:bg-[#38433A] text-white border border-[#404D41] transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* 4 Pipeline Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#242A25] border border-[#374138] p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#A0A89C]">Total Ingested</span>
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{total}</div>
          <p className="text-[11px] text-[#6E786B] mt-1">Total documents queued</p>
        </div>

        <div className="bg-[#242A25] border border-[#374138] p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#A0A89C]">Processed & Indexed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">{processed}</div>
          <p className="text-[11px] text-[#6E786B] mt-1">Ready for single-call RAG</p>
        </div>

        <div className="bg-[#242A25] border border-[#374138] p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#A0A89C]">Processing / Pending</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">{pending}</div>
          <p className="text-[11px] text-[#6E786B] mt-1">Background OCR/parsing active</p>
        </div>

        <div className="bg-[#242A25] border border-[#374138] p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#A0A89C]">Failed Ingestion</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">{failed}</div>
          <p className="text-[11px] text-[#6E786B] mt-1">Malformed or corrupted files</p>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Format Distribution */}
        <div className="bg-[#242A25] border border-[#374138] rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-white mb-4">Format Distribution</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-medium text-[#A0A89C] mb-1">
                <span>PDF Documents (pdfjs-dist / Gemini OCR)</span>
                <span className="font-mono text-white">{pdfCount} ({total > 0 ? Math.round((pdfCount / total) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#1A1F1B] overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${total > 0 ? (pdfCount / total) * 100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-[#A0A89C] mb-1">
                <span>Word Documents (mammoth.js DOCX)</span>
                <span className="font-mono text-white">{docxCount} ({total > 0 ? Math.round((docxCount / total) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#1A1F1B] overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${total > 0 ? (docxCount / total) * 100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-[#A0A89C] mb-1">
                <span>Text & Markdown Notes (.txt, .md)</span>
                <span className="font-mono text-white">{txtCount} ({total > 0 ? Math.round((txtCount / total) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#1A1F1B] overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${total > 0 ? (txtCount / total) * 100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-[#A0A89C] mb-1">
                <span>Images / Other (.png, .jpg, scanned notes)</span>
                <span className="font-mono text-white">{otherCount} ({total > 0 ? Math.round((otherCount / total) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#1A1F1B] overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${total > 0 ? (otherCount / total) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Quality Metrics */}
        <div className="bg-[#242A25] border border-[#374138] rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-white mb-4">Ingestion Quality Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#1A1F1B] border border-[#374138]">
              <span className="text-[11px] font-semibold text-[#A0A89C] block">Total Indexed Chunks</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">{totalChunks}</span>
              <span className="text-[10px] text-[#6E786B] mt-1 block">Avg {avgChunks} chunks / file</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#1A1F1B] border border-[#374138]">
              <span className="text-[11px] font-semibold text-[#A0A89C] block">Total Extracted Words</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">{totalWords.toLocaleString()}</span>
              <span className="text-[10px] text-[#6E786B] mt-1 block">Avg {avgWords} words / file</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#1A1F1B] border border-[#374138]">
              <span className="text-[11px] font-semibold text-[#A0A89C] block">Chunk Window Length</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">850 chars</span>
              <span className="text-[10px] text-[#6E786B] mt-1 block">Overlap: 120 chars</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#1A1F1B] border border-[#374138]">
              <span className="text-[11px] font-semibold text-[#A0A89C] block">Scoring Engine</span>
              <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">Active</span>
              <span className="text-[10px] text-[#6E786B] mt-1 block">Lexical & Semantic Match</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
