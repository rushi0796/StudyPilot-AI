import { DocumentChunk } from '../types';

export interface RetrievedChunkResult {
  chunk: DocumentChunk;
  score: number;
  citation: string;
}

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'what', 'which', 'who', 'how', 'when', 'where', 'why', 'can',
  'tell', 'me', 'about', 'explain', 'give', 'does', 'do', 'did', 'show'
]);

/**
 * Tokenize text into stemmed / normalized tokens
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * High-Precision Hybrid RAG Retriever
 * Combines exact phrase matching, lexical BM25-style term weighting, and section header relevance.
 */
export function retrieveRelevantChunks(
  query: string,
  chunks: DocumentChunk[],
  topK = 4
): RetrievedChunkResult[] {
  if (!chunks || chunks.length === 0 || !query.trim()) {
    return [];
  }

  const queryTokens = tokenize(query);
  const queryLower = query.toLowerCase().trim();

  const scored: RetrievedChunkResult[] = chunks.map((chunk) => {
    let score = 0;
    const contentLower = chunk.content.toLowerCase();
    const sectionLower = (chunk.pageOrSection || '').toLowerCase();
    const docNameLower = chunk.documentName.toLowerCase();

    // 1. Exact phrase matching boost
    if (queryLower.length > 5 && contentLower.includes(queryLower)) {
      score += 25;
    }

    // 2. Multi-word n-gram matches (2-word phrases)
    if (queryTokens.length >= 2) {
      for (let i = 0; i < queryTokens.length - 1; i++) {
        const bigram = `${queryTokens[i]} ${queryTokens[i + 1]}`;
        if (contentLower.includes(bigram)) {
          score += 10;
        }
      }
    }

    // 3. Keyword matching with term frequency
    for (const token of queryTokens) {
      // Content matches
      if (contentLower.includes(token)) {
        const occurrences = contentLower.split(token).length - 1;
        score += Math.min(occurrences, 4) * 2.5;
      }

      // Heading / Page / Section matches (high information value)
      if (sectionLower.includes(token)) {
        score += 6.0;
      }

      // Document name relevance
      if (docNameLower.includes(token)) {
        score += 2.0;
      }
    }

    const citation = `[Source: ${chunk.documentName}, ${chunk.pageOrSection || `Section ${chunk.chunkIndex + 1}`}]`;

    return {
      chunk,
      score,
      citation
    };
  });

  // Sort by score descending and take top matches with non-zero relevance
  return scored
    .filter(item => item.score > 2.0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Format retrieved passages for Ground Truth Prompt Injection
 */
export function formatRetrievedContext(results: RetrievedChunkResult[]): {
  contextText: string;
  citations: string[];
} {
  if (results.length === 0) {
    return { contextText: '', citations: [] };
  }

  const citations: string[] = [];
  const sectionsText = results.map((r, i) => {
    citations.push(r.citation);
    return `--- Excerpt ${i + 1} (${r.citation}) ---\n${r.chunk.content}`;
  }).join('\n\n');

  const contextText = `### USER'S UPLOADED STUDY MATERIALS (RETRIEVED GROUND TRUTH PASSAGES):\n` +
    sectionsText +
    `\n\n### GROUNDING INSTRUCTIONS:\n` +
    `1. Answer the user's question directly based on the retrieved excerpts above.\n` +
    `2. Cite the exact source for facts using the provided citation format (e.g. "[Source: DocumentName, Page X]").\n` +
    `3. If the answer is NOT found in these excerpts, say: "I couldn't find this information in your uploaded documents." You may then offer general knowledge if helpful, but you MUST explicitly prefix it with "[General Knowledge - Not found in uploaded files]:".\n` +
    `4. Never invent citations, page numbers, or quotes not present in the excerpts.`;

  return { contextText, citations: Array.from(new Set(citations)) };
}
