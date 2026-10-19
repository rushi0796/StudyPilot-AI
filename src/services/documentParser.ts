import { DocumentChunk, UploadedDocument } from '../types';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';

// Configure the correct PDF.js worker for the installed version and Vite bundler
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker || new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
  }
}

/**
 * StudyPilot AI - Real Multi-Format Academic Document Parser
 * Supports: PDF, DOCX, TXT, MD
 * Extracts real text, preserves page numbers & headings, and produces RAG-ready chunks.
 */

// Sample preloaded academic documents for SGU Semester III curriculum
export const INITIAL_PRELOADED_DOCUMENTS: UploadedDocument[] = [
  {
    id: 'doc_dbms_handout',
    name: 'SGU_DBMS_Unit3_Normalization_Handout.pdf',
    size: 245 * 1024,
    type: 'pdf',
    uploadedAt: 'Today at 01:15 PM',
    wordCount: 1420,
    status: 'ready',
    subjectId: 'cs201',
    text: `SANJAY GHODAWAT UNIVERSITY - DEPARTMENT OF ARTIFICIAL INTELLIGENCE
COURSE: CS201 DATABASE MANAGEMENT SYSTEMS (SEMESTER III)
UNIT 3: RELATIONAL DATABASE DESIGN & NORMALIZATION THEORY

Section 1: The Problem of Redundancy
Relational schema anomalies arise when multiple real-world facts are grouped into a single table. The three core anomalies are:
1. Insertion Anomaly: Inability to record information about an entity without recording unrelated information about another entity.
2. Deletion Anomaly: Unintended loss of crucial information when a related record is removed.
3. Update Anomaly: Necessity of modifying multiple rows when a single fact changes, risking database inconsistency.

Section 2: First Normal Form (1NF) & Second Normal Form (2NF)
A relation R is in 1NF if and only if all domain values are atomic and no repeating groups exist.
A relation R is in 2NF if it is in 1NF and every non-prime attribute is fully functionally dependent on the primary key (no partial functional dependency). If a candidate key is composite (e.g. {StudentID, CourseID}), non-key attributes cannot depend on only StudentID.

Section 3: Third Normal Form (3NF) vs BCNF
A relation R is in 3NF if whenever X -> A holds in R, either:
- X is a superkey of R, or
- A is a prime attribute (member of some candidate key).
This condition specifically eliminates Transitive Dependencies (X -> Y and Y -> A where A is non-prime).
Boyce-Codd Normal Form (BCNF) is strictly stronger: for every non-trivial FD X -> A, X MUST be a superkey. Every BCNF schema is in 3NF, but not every 3NF schema is in BCNF.

Section 4: Lossless-Join Decomposition & Dependency Preservation
Any schema decomposition must guarantee:
1. Lossless Join: Natural join of decomposed tables must recreate the original relation without spurious tuples. R1 ∩ R2 -> R1 or R1 ∩ R2 -> R2.
2. Dependency Preservation: All functional dependencies in F can be enforced without computing joins across decomposed tables.`,
    chunks: [
      {
        id: 'chk_dbms_1',
        documentId: 'doc_dbms_handout',
        documentName: 'SGU_DBMS_Unit3_Normalization_Handout.pdf',
        chunkIndex: 0,
        pageOrSection: 'Page 1 (Section 1: Redundancy & Anomalies)',
        content: `Relational schema anomalies arise when multiple real-world facts are grouped into a single table. The three core anomalies are: 1. Insertion Anomaly: Inability to record information about an entity without recording unrelated information about another entity. 2. Deletion Anomaly: Unintended loss of crucial information when a related record is removed. 3. Update Anomaly: Necessity of modifying multiple rows when a single fact changes, risking database inconsistency.`
      },
      {
        id: 'chk_dbms_2',
        documentId: 'doc_dbms_handout',
        documentName: 'SGU_DBMS_Unit3_Normalization_Handout.pdf',
        chunkIndex: 1,
        pageOrSection: 'Page 1 (Section 2: 1NF & 2NF Rules)',
        content: `A relation R is in 1NF if and only if all domain values are atomic and no repeating groups exist. A relation R is in 2NF if it is in 1NF and every non-prime attribute is fully functionally dependent on the primary key (no partial functional dependency). If a candidate key is composite (e.g. {StudentID, CourseID}), non-key attributes cannot depend on only StudentID.`
      },
      {
        id: 'chk_dbms_3',
        documentId: 'doc_dbms_handout',
        documentName: 'SGU_DBMS_Unit3_Normalization_Handout.pdf',
        chunkIndex: 2,
        pageOrSection: 'Page 2 (Section 3: 3NF vs BCNF Comparison)',
        content: `A relation R is in 3NF if whenever X -> A holds in R, either X is a superkey of R, or A is a prime attribute. This condition specifically eliminates Transitive Dependencies (X -> Y and Y -> A). BCNF is strictly stronger: for every FD X -> A, X MUST be a superkey. Every BCNF schema is in 3NF, but not every 3NF schema is in BCNF.`
      },
      {
        id: 'chk_dbms_4',
        documentId: 'doc_dbms_handout',
        documentName: 'SGU_DBMS_Unit3_Normalization_Handout.pdf',
        chunkIndex: 3,
        pageOrSection: 'Page 2 (Section 4: Lossless Join & Preservation)',
        content: `Any schema decomposition must guarantee: 1. Lossless Join: Natural join of decomposed tables must recreate the original relation without spurious tuples (R1 ∩ R2 -> R1 or R1 ∩ R2 -> R2). 2. Dependency Preservation: All functional dependencies in F can be enforced without computing joins across decomposed tables.`
      }
    ]
  },
  {
    id: 'doc_ai_foundations',
    name: 'SGU_AI_Foundations_Unit2_Search_Algorithms.md',
    size: 112 * 1024,
    type: 'md',
    uploadedAt: 'Yesterday at 04:30 PM',
    wordCount: 960,
    status: 'ready',
    subjectId: 'ai202',
    text: `# Sanjay Ghodawat University - Department of AI
## Course: AI202 Artificial Intelligence Foundations
### Unit 2: Informed Search & Heuristics

#### 1. A* Search Algorithm
A* evaluates nodes by combining g(n) (cost to reach the node from start) and h(n) (estimated cost from node to goal):
f(n) = g(n) + h(n)

#### 2. Admissibility and Consistency
- An admissible heuristic NEVER overestimates the true cost to reach the goal: h(n) <= h*(n).
- Tree-Search A* is optimal if h(n) is admissible.
- Graph-Search A* is optimal if h(n) is consistent (monotonic): h(n) <= c(n, a, n') + h(n'). Every consistent heuristic is admissible.`,
    chunks: [
      {
        id: 'chk_ai_1',
        documentId: 'doc_ai_foundations',
        documentName: 'SGU_AI_Foundations_Unit2_Search_Algorithms.md',
        chunkIndex: 0,
        pageOrSection: 'Unit 2: Informed Search & A*',
        content: `A* evaluates nodes by combining g(n) (cost to reach the node from start) and h(n) (estimated cost from node to goal): f(n) = g(n) + h(n). Admissible heuristic NEVER overestimates: h(n) <= h*(n). Graph-search A* is optimal if h(n) is consistent: h(n) <= c(n, a, n') + h(n').`
      }
    ]
  }
];

export interface ParsedPageData {
  pageNumber: number;
  text: string;
}

/**
 * Validate and parse an uploaded study document into structured chunks
 */
export async function parseDocumentFile(file: File, subjectId = 'cs201'): Promise<UploadedDocument> {
  // 1. Validation
  const maxSizeBytes = 20 * 1024 * 1024; // 20MB
  if (file.size > maxSizeBytes) {
    throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 20MB limit.`);
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const supportedExtensions = ['pdf', 'docx', 'txt', 'md', 'png', 'jpg', 'jpeg'];
  if (!supportedExtensions.includes(extension)) {
    throw new Error(`Unsupported file type ".${extension}". Please upload PDF, DOCX, TXT, MD, or Image files.`);
  }

  let fullText = '';
  let chunks: DocumentChunk[] = [];
  const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  let docType: UploadedDocument['type'] = 'other';

  // 2. Format-Specific Parsing
  if (extension === 'pdf') {
    docType = 'pdf';
    let pages = await parsePdfPages(file);
    
    // If no digital text found (e.g. scanned OMR answer sheet, photocopy, scanned notes), invoke Gemini Vision OCR
    if (pages.length === 0 || pages.every(p => !p.text.trim())) {
      try {
        pages = await performOcrOnScannedPdf(file);
      } catch (ocrErr) {
        console.warn('Scanned PDF OCR attempt failed:', ocrErr);
      }
    }

    // If still empty (e.g. blank document), create a safe placeholder page so the user file is never lost
    if (pages.length === 0 || pages.every(p => !p.text.trim())) {
      pages = [
        {
          pageNumber: 1,
          text: `Document: ${file.name}\nType: Scanned Answer Sheet / Image PDF\nStatus: Visual study document indexed for reference.`
        }
      ];
    }

    fullText = pages.map(p => `--- Page ${p.pageNumber} ---\n${p.text}`).join('\n\n');
    chunks = createChunksFromPages(docId, file.name, pages);
  } else if (['png', 'jpg', 'jpeg'].includes(extension)) {
    docType = 'other';
    try {
      fullText = await performOcrOnImageFile(file);
    } catch (imgErr) {
      console.warn('Image OCR failed:', imgErr);
    }
    if (!fullText.trim()) {
      fullText = `Image Document: ${file.name}\nScanned visual study material.`;
    }
    chunks = createDocumentChunks(docId, file.name, fullText);
  } else if (extension === 'docx') {
    docType = 'docx';
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    fullText = result.value || '';
    if (!fullText.trim()) {
      fullText = `Document: ${file.name}\nUploaded DOCX document.`;
    }
    chunks = createDocumentChunks(docId, file.name, fullText);
  } else if (extension === 'md') {
    docType = 'md';
    fullText = await file.text();
    if (!fullText.trim()) {
      fullText = `Markdown Document: ${file.name}\nUploaded notes.`;
    }
    chunks = createDocumentChunks(docId, file.name, fullText);
  } else {
    docType = 'txt';
    fullText = await file.text();
    if (!fullText.trim()) {
      fullText = `Text Document: ${file.name}\nUploaded notes.`;
    }
    chunks = createDocumentChunks(docId, file.name, fullText);
  }

  let cleanText = fullText.trim();
  let words = cleanText.split(/\s+/).filter(Boolean);

  if (words.length < 5) {
    cleanText = `${cleanText}\nDocument: ${file.name}\nUploaded study reference document.`;
    words = cleanText.split(/\s+/).filter(Boolean);
  }

  return {
    id: docId,
    name: file.name,
    size: file.size,
    type: docType,
    uploadedAt: 'Just now',
    text: cleanText,
    wordCount: words.length,
    chunks,
    status: 'ready',
    subjectId
  };
}

/**
 * Automated Gemini Vision OCR for Scanned / Image-Only PDFs
 * Renders pages onto an HTML canvas, encodes as JPEG, and transcribes content using Gemini Vision OCR
 */
async function performOcrOnScannedPdf(file: File): Promise<ParsedPageData[]> {
  if (typeof window === 'undefined') return [];

  // Ensure worker is initialized
  if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker || new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
    } catch {
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
    }
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true
  });

  const pdf = await loadingTask.promise;
  const pagesData: ParsedPageData[] = [];
  // Scan up to first 8 pages to avoid excessive payload latency
  const maxPages = Math.min(pdf.numPages, 8);

  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    try {
      const page: any = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      if (!context) continue;

      await page.render({
        canvasContext: context,
        viewport
      }).promise;

      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      const base64Data = dataUrl.split(',')[1];

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ocr',
          image: base64Data,
          mimeType: 'image/jpeg',
          filename: file.name,
          pageNumber: pageNum
        })
      });

      if (res.ok) {
        const ocrResult = await res.json();
        if (ocrResult.text && ocrResult.text.trim()) {
          pagesData.push({
            pageNumber: pageNum,
            text: ocrResult.text.trim()
          });
        }
      }
    } catch (pageErr) {
      console.warn(`Scanned page ${pageNum} OCR extraction skipped:`, pageErr);
    }
  }

  return pagesData;
}

/**
 * Automated Gemini Vision OCR for uploaded image files (PNG, JPG, JPEG)
 */
async function performOcrOnImageFile(file: File): Promise<string> {
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      resolve(res.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'ocr',
      image: base64Data,
      mimeType: file.type || 'image/jpeg',
      filename: file.name,
      pageNumber: 1
    })
  });

  if (res.ok) {
    const ocrResult = await res.json();
    return ocrResult.text?.trim() || '';
  }
  return '';
}

/**
 * Real PDF Page Extractor using pdfjs-dist
 */
async function parsePdfPages(file: File): Promise<ParsedPageData[]> {
  // Ensure worker is configured before getDocument
  if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker || new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
    } catch {
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
    }
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true
  });

  const pdf = await loadingTask.promise;
  const pagesData: ParsedPageData[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items
      .filter((item: any) => typeof item.str === 'string')
      .map((item: any) => item.str);
    
    const pageText = strings.join(' ').replace(/\s+/g, ' ').trim();
    if (pageText) {
      pagesData.push({
        pageNumber: pageNum,
        text: pageText
      });
    }
  }

  return pagesData;
}

/**
 * Chunk PDF pages preserving exact page numbers
 */
function createChunksFromPages(docId: string, docName: string, pages: ParsedPageData[]): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  let chunkIdx = 0;
  const maxChunkLength = 850;

  for (const page of pages) {
    const text = page.text;
    if (text.length <= maxChunkLength) {
      chunks.push({
        id: `${docId}_chk_${chunkIdx}`,
        documentId: docId,
        documentName: docName,
        chunkIndex: chunkIdx,
        pageOrSection: `Page ${page.pageNumber}`,
        content: text
      });
      chunkIdx++;
    } else {
      // Split large page with small overlap
      let start = 0;
      let partNum = 1;
      while (start < text.length) {
        const end = Math.min(start + maxChunkLength, text.length);
        const sub = text.slice(start, end).trim();
        if (sub.length > 20) {
          chunks.push({
            id: `${docId}_chk_${chunkIdx}`,
            documentId: docId,
            documentName: docName,
            chunkIndex: chunkIdx,
            pageOrSection: `Page ${page.pageNumber} (Part ${partNum})`,
            content: sub
          });
          chunkIdx++;
          partNum++;
        }
        start += maxChunkLength - 120;
        if (start >= text.length - 120) break;
      }
    }
  }

  return chunks;
}

/**
 * Chunk text by headings or paragraphs with metadata preservation
 */
function createDocumentChunks(docId: string, docName: string, fullText: string): DocumentChunk[] {
  const chunkSize = 850;
  const overlap = 120;
  const chunks: DocumentChunk[] = [];

  // Check for markdown headings (#, ##, ###)
  const sections = fullText.split(/\n(?=#{1,3}\s+)/g).filter(s => s.trim().length > 0);

  if (sections.length > 1) {
    let chunkIdx = 0;
    for (const sec of sections) {
      const firstLine = sec.split('\n')[0].replace(/^#+\s*/, '').trim() || `Section ${chunkIdx + 1}`;
      const secLabel = firstLine.length > 40 ? firstLine.slice(0, 37) + '...' : firstLine;

      if (sec.length <= chunkSize) {
        chunks.push({
          id: `${docId}_chk_${chunkIdx}`,
          documentId: docId,
          documentName: docName,
          chunkIndex: chunkIdx,
          pageOrSection: `Section: ${secLabel}`,
          content: sec.trim()
        });
        chunkIdx++;
      } else {
        // Sub-split
        let start = 0;
        let part = 1;
        while (start < sec.length) {
          const end = Math.min(start + chunkSize, sec.length);
          const chunkContent = sec.slice(start, end).trim();
          if (chunkContent.length > 20) {
            chunks.push({
              id: `${docId}_chk_${chunkIdx}`,
              documentId: docId,
              documentName: docName,
              chunkIndex: chunkIdx,
              pageOrSection: `Section: ${secLabel} (Part ${part})`,
              content: chunkContent
            });
            chunkIdx++;
            part++;
          }
          start += chunkSize - overlap;
          if (start >= sec.length - overlap) break;
        }
      }
    }
  } else {
    // Sliding window over paragraphs
    let start = 0;
    let chunkIdx = 0;
    while (start < fullText.length) {
      const end = Math.min(start + chunkSize, fullText.length);
      const content = fullText.slice(start, end).trim();
      if (content.length > 20) {
        chunks.push({
          id: `${docId}_chk_${chunkIdx}`,
          documentId: docId,
          documentName: docName,
          chunkIndex: chunkIdx,
          pageOrSection: `Section ${chunkIdx + 1}`,
          content
        });
        chunkIdx++;
      }
      start += chunkSize - overlap;
      if (start >= fullText.length - overlap) break;
    }
  }

  if (chunks.length === 0) {
    chunks.push({
      id: `${docId}_chk_0`,
      documentId: docId,
      documentName: docName,
      chunkIndex: 0,
      pageOrSection: 'Full Document',
      content: fullText.slice(0, 1000)
    });
  }

  return chunks;
}
