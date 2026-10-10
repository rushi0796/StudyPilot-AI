import React, { useState, useRef } from 'react';
import { 
  FolderOpen, 
  Upload, 
  FileText, 
  FileCode, 
  Trash2, 
  Eye, 
  Sparkles, 
  Compass, 
  CheckSquare, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Layers, 
  Search, 
  Filter, 
  ExternalLink,
  X,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UploadedDocument, DocumentChunk } from '../../types';
import { parseDocumentFile } from '../../services/documentParser';

export const MyFilesView: React.FC = () => {
  const { 
    uploadedDocuments, 
    addUploadedDocument, 
    deleteUploadedDocument, 
    activeSubject,
    setActiveView,
    setActiveDocumentId,
    activeDocumentId
  } = useApp();

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<UploadedDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processSelectedFile(files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processSelectedFile(files[0]);
      e.target.value = '';
    }
  };

  const processSelectedFile = async (file: File) => {
    // Check 20MB size limit
    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError(`File "${file.name}" exceeds the 20MB limit. Please upload a smaller study file.`);
      return;
    }

    const validExtensions = ['pdf', 'docx', 'txt', 'md'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!validExtensions.includes(ext)) {
      setUploadError(`Unsupported format (.${ext}). Please upload a PDF, DOCX, TXT, or Markdown (.md) document.`);
      return;
    }

    setUploadError(null);
    setIsProcessing(true);
    setUploadProgress(20);

    const progressTimer = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 25, 90));
    }, 250);

    try {
      const parsedDoc = await parseDocumentFile(file, activeSubject.id);
      clearInterval(progressTimer);
      setUploadProgress(100);

      setTimeout(() => {
        addUploadedDocument(parsedDoc);
        setIsProcessing(false);
        setUploadProgress(0);
      }, 400);
    } catch (err: any) {
      clearInterval(progressTimer);
      setIsProcessing(false);
      setUploadError(`Failed to parse file: ${err?.message || 'Unknown parsing error'}`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredDocs = uploadedDocuments.filter(doc => {
    if (selectedTypeFilter !== 'all' && doc.type !== selectedTypeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return doc.name.toLowerCase().includes(q) || doc.text.toLowerCase().includes(q);
    }
    return true;
  });

  const totalWords = uploadedDocuments.reduce((acc, d) => acc + (d.wordCount || 0), 0);
  const totalChunks = uploadedDocuments.reduce((acc, d) => acc + (d.chunks?.length || 0), 0);

  const handleChatWithDocument = (doc: UploadedDocument) => {
    setActiveDocumentId(doc.id);
    setActiveView('assistant');
  };

  const handleGenerateQuizFromDoc = (doc: UploadedDocument) => {
    setActiveDocumentId(doc.id);
    setActiveView('practice');
  };

  const handleExtractToSyllabus = (doc: UploadedDocument) => {
    setActiveDocumentId(doc.id);
    setActiveView('syllabus');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* 1. Header & Academic Scope */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E0D5]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-forest-100 border border-forest-200 flex items-center justify-center text-forest-600 shadow-sm">
              <FolderOpen className="w-5 h-5 text-forest-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-charcoal-900 tracking-tight">
                  My Files & Study Materials
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-forest-100 text-forest-700 border border-forest-200">
                  Document Hub
                </span>
              </div>
              <p className="text-xs text-charcoal-400 mt-0.5">
                Upload university syllabus PDFs, textbooks, and class notes to power grounded AI answers, quizzes, and evaluations.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-500 hover:bg-forest-600 text-white font-semibold text-xs shadow-card transition-all"
        >
          <Upload className="w-4 h-4" />
          <span>Upload New File (Max 20MB)</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* 2. Drag-and-Drop Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-3 ${
          isDragging 
            ? 'border-forest-500 bg-forest-50/80 scale-[1.01]' 
            : 'border-[#E5E0D5] bg-white hover:border-forest-400 hover:bg-sage-50/50 shadow-subtle'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-center text-forest-500 mx-auto shadow-sm">
          <Upload className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <p className="text-sm font-bold text-charcoal-900">
            Drag and drop study materials here, or <span className="text-forest-600 underline">browse files</span>
          </p>
          <p className="text-xs text-charcoal-400 mt-1">
            Supports PDF, DOCX, TXT, and Markdown files up to 20MB. Automatically chunked & indexed for semantic retrieval.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-charcoal-400">
          <span className="px-2 py-0.5 rounded-md bg-academic-bg border border-[#E5E0D5] font-mono">.PDF</span>
          <span className="px-2 py-0.5 rounded-md bg-academic-bg border border-[#E5E0D5] font-mono">.DOCX</span>
          <span className="px-2 py-0.5 rounded-md bg-academic-bg border border-[#E5E0D5] font-mono">.TXT</span>
          <span className="px-2 py-0.5 rounded-md bg-academic-bg border border-[#E5E0D5] font-mono">.MD</span>
        </div>
      </div>

      {/* Processing Animation */}
      {isProcessing && (
        <div className="p-4 rounded-xl bg-white border border-[#E5E0D5] shadow-card space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-charcoal-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-forest-500 animate-ping" />
              Extracting text & generating semantic citation chunks...
            </span>
            <span className="font-mono font-bold text-forest-600">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-sage-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-forest-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button onClick={() => setUploadError(null)} className="p-1 text-rose-500 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Document Hub Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E5E0D5] shadow-subtle">
          <div className="flex items-center justify-between text-xs text-charcoal-400">
            <span>Uploaded Files</span>
            <FolderOpen className="w-4 h-4 text-forest-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-charcoal-900">{uploadedDocuments.length}</span>
            <span className="text-xs text-forest-600 font-semibold">Active in Memory</span>
          </div>
          <span className="text-[10px] text-charcoal-400 mt-1 block">Persisted in browser localStorage</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E0D5] shadow-subtle">
          <div className="flex items-center justify-between text-xs text-charcoal-400">
            <span>Indexed Academic Words</span>
            <FileText className="w-4 h-4 text-forest-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-charcoal-900">{totalWords.toLocaleString()}</span>
            <span className="text-xs text-forest-600 font-semibold">Words</span>
          </div>
          <span className="text-[10px] text-charcoal-400 mt-1 block">Extracted from notes & handouts</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E0D5] shadow-subtle">
          <div className="flex items-center justify-between text-xs text-charcoal-400">
            <span>Semantic Chunks</span>
            <Layers className="w-4 h-4 text-gold-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-charcoal-900">{totalChunks}</span>
            <span className="text-xs text-gold-600 font-semibold">RAG Citations</span>
          </div>
          <span className="text-[10px] text-charcoal-400 mt-1 block">Available for doubt-solving grounding</span>
        </div>
      </div>

      {/* 4. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search uploaded materials..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[#E5E0D5] text-xs text-charcoal-900 placeholder-charcoal-400 focus:border-forest-500 focus:outline-none shadow-subtle"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-charcoal-400 mr-1 flex-shrink-0">Filter Format:</span>
          {['all', 'pdf', 'docx', 'txt', 'md'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedTypeFilter(type)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase transition-colors flex-shrink-0 ${
                selectedTypeFilter === type 
                  ? 'bg-forest-500 text-white shadow-sm' 
                  : 'bg-white text-charcoal-400 hover:text-charcoal-900 border border-[#E5E0D5]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Document Cards / List */}
      <div className="space-y-3.5">
        {filteredDocs.length === 0 ? (
          <div className="p-12 text-center text-charcoal-400 rounded-2xl bg-white border border-[#E5E0D5] shadow-subtle">
            <FolderOpen className="w-10 h-10 text-charcoal-400 mx-auto mb-2 opacity-50" />
            <p className="font-semibold text-charcoal-700">No documents found matching your filter.</p>
            <p className="text-xs text-charcoal-400 mt-1">
              Upload a syllabus handout or notes file above to get started.
            </p>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isCurrentlySelected = activeDocumentId === doc.id;

            return (
              <div
                key={doc.id}
                className={`p-5 rounded-2xl bg-white border transition-all ${
                  isCurrentlySelected 
                    ? 'border-forest-500 ring-2 ring-forest-200 shadow-card' 
                    : 'border-[#E5E0D5] hover:border-forest-300 shadow-subtle'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* File Meta */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-forest-50 border border-forest-100 flex items-center justify-center text-forest-600 flex-shrink-0 shadow-sm">
                      {doc.type === 'pdf' ? <FileText className="w-5 h-5 text-forest-600" /> :
                       doc.type === 'md' ? <FileCode className="w-5 h-5 text-forest-500" /> :
                       <FileText className="w-5 h-5 text-forest-600" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-charcoal-900 hover:text-forest-600 transition-colors">
                          {doc.name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sage-200 text-forest-800">
                          {doc.type.toUpperCase()}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-forest-50 text-forest-700 border border-forest-200">
                          Ready for AI RAG
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-charcoal-400">
                        <span>Size: <strong>{formatFileSize(doc.size)}</strong></span>
                        <span>•</span>
                        <span>Words: <strong>{doc.wordCount?.toLocaleString() || 0}</strong></span>
                        <span>•</span>
                        <span>Chunks: <strong>{doc.chunks?.length || 0} sections</strong></span>
                        <span>•</span>
                        <span>Uploaded: {doc.uploadedAt}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-[#E5E0D5]">
                    
                    {/* Preview Chunks */}
                    <button
                      onClick={() => setPreviewDocument(doc)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-academic-bg hover:bg-sage-100 text-charcoal-700 text-xs font-semibold border border-[#E5E0D5] transition-colors"
                      title="Preview extracted text and citation chunks"
                    >
                      <Eye className="w-3.5 h-3.5 text-forest-600" />
                      <span>Preview Chunks</span>
                    </button>

                    {/* Chat with Document */}
                    <button
                      onClick={() => handleChatWithDocument(doc)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest-500 hover:bg-forest-600 text-white text-xs font-bold shadow-subtle transition-all"
                      title="Ask AI questions grounded in this document"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Chat with File</span>
                    </button>

                    {/* Generate Quiz */}
                    <button
                      onClick={() => handleGenerateQuizFromDoc(doc)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-700 text-xs font-semibold border border-forest-200 transition-colors"
                      title="Generate a practice quiz from this document"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Generate Quiz</span>
                    </button>

                    {/* Delete File */}
                    <button
                      onClick={() => {
                        if (confirm(`Remove "${doc.name}" from your uploaded study materials?`)) {
                          deleteUploadedDocument(doc.id);
                        }
                      }}
                      className="p-2 rounded-xl text-charcoal-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 6. Preview Document Modal */}
      {previewDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-white border border-[#E5E0D5] rounded-3xl shadow-elevated overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E5E0D5] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-forest-500" />
                <div>
                  <h3 className="font-bold text-sm text-charcoal-900">{previewDocument.name}</h3>
                  <p className="text-[11px] text-charcoal-400">
                    {previewDocument.chunks.length} Semantic Chunks • {previewDocument.wordCount} Words
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPreviewDocument(null)}
                className="p-1.5 rounded-xl text-charcoal-400 hover:text-charcoal-700 hover:bg-sage-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Chunks Feed */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="p-3 rounded-xl bg-sage-50 border border-forest-200 text-xs text-forest-800">
                These chunks are supplied to Google Gemini to ground technical explanations and cite exact source sections.
              </div>

              {previewDocument.chunks.map((chk, idx) => (
                <div key={chk.id} className="p-4 rounded-xl bg-academic-bg border border-[#E5E0D5] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-forest-700">
                      Chunk #{idx + 1}: {chk.pageOrSection || `Section ${idx + 1}`}
                    </span>
                    <span className="text-[10px] text-charcoal-400 font-mono">
                      ID: {chk.id}
                    </span>
                  </div>
                  <p className="text-xs text-charcoal-700 leading-relaxed font-sans whitespace-pre-wrap">
                    {chk.content}
                  </p>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E5E0D5] flex items-center justify-between bg-academic-bg">
              <span className="text-xs text-charcoal-400">Status: Parsed and indexed</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleChatWithDocument(previewDocument);
                    setPreviewDocument(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-500 hover:bg-forest-600 text-white text-xs font-bold shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Start AI Chat Grounded in this File</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
