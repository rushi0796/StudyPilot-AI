export interface ChatHistoryItem {
  role: 'user' | 'assistant' | 'model';
  content: string;
}

export interface DocumentChunkContext {
  documentName: string;
  pageOrSection?: string;
  content: string;
}

export interface ChatRequestPayload {
  message: string;
  history?: ChatHistoryItem[];
  language?: 'en' | 'hi' | 'mr' | 'te';
  voiceMode?: boolean;
  hasActiveDocument?: boolean;
  activeDocumentName?: string;
  studyContext?: {
    subject?: string;
    topic?: string;
    difficulty?: 'simple' | 'standard' | 'deep';
    simplificationLevel?: number;
    university?: string;
    course?: string;
    branch?: string;
    semester?: string;
    hasActiveDocument?: boolean;
    activeDocumentName?: string;
  };
  documentChunks?: DocumentChunkContext[];
  model?: string;
}

function evaluateArithmetic(expr: string): number | null {
  try {
    const sanitized = expr.replace(/[^0-9+\-*/().^%\s]/g, '');
    if (!sanitized.trim()) return null;
    const normalized = sanitized.replace(/\^/g, '**');
    const fn = new Function(`"use strict"; return (${normalized});`);
    const val = fn();
    return typeof val === 'number' && !isNaN(val) ? val : null;
  } catch {
    return null;
  }
}

/**
 * High-precision lexical and semantic scoring for uploaded document chunks
 */
export function searchDocuments(query: string, chunks?: DocumentChunkContext[]): Array<{ source: string; text: string; score: number }> {
  if (!chunks || chunks.length === 0 || !query.trim()) return [];

  const stopWords = new Set(['what', 'is', 'the', 'in', 'of', 'and', 'to', 'a', 'for', 'about', 'how', 'why', 'can', 'you', 'explain', 'tell', 'me']);
  const queryLower = query.toLowerCase().trim();
  const terms = queryLower
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !stopWords.has(t));

  const scored = chunks.map(chunk => {
    const textLower = chunk.content.toLowerCase();
    const sectionLower = (chunk.pageOrSection || '').toLowerCase();
    const docNameLower = chunk.documentName.toLowerCase();
    let score = 0;

    // Exact phrase match
    const hasExactPhrase = queryLower.length > 5 && textLower.includes(queryLower);
    if (hasExactPhrase) {
      score += 25;
    }

    // Term frequency scoring
    for (const term of terms) {
      if (textLower.includes(term)) {
        const count = textLower.split(term).length - 1;
        score += Math.min(count, 4) * 3;
      }
      if (sectionLower.includes(term)) {
        score += 6;
      }
      if (docNameLower.includes(term)) {
        score += 2;
      }
    }

    // Multi-term coverage check to eliminate false positives (e.g. "full form of DBMS" matching solely on "dbms")
    const matchedTerms = terms.filter(t => textLower.includes(t) || sectionLower.includes(t) || docNameLower.includes(t));
    if (queryLower.includes('full form') && !textLower.includes('full form') && !textLower.includes('database management system')) {
      score = 0;
    } else if (!hasExactPhrase) {
      if (terms.length >= 2 && matchedTerms.length < Math.min(2, terms.length)) {
        score = 0;
      } else if (terms.length >= 3 && (matchedTerms.length / terms.length) < 0.7) {
        score = 0;
      }
    }

    return {
      chunk,
      score,
      source: `${chunk.documentName}, ${chunk.pageOrSection || 'Section'}`
    };
  });

  return scored
    .filter(item => item.score > 2.0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(item => ({
      source: item.source,
      text: item.chunk.content,
      score: item.score
    }));
}

/**
 * Call Gemini with a strict timeout and transient failure retry only.
 * Avoids cascading retries on 400 bad requests or 429 quota exhaustion.
 */
export async function callGeminiWithTimeout(
  url: string,
  body: any,
  timeoutMs = 15000
): Promise<{ ok: boolean; status: number; data?: any; errorData?: any }> {
  const attemptCall = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        return { ok: false, status: response.status, errorData: errData };
      }
      const data = await response.json();
      return { ok: true, status: 200, data };
    } catch (err: any) {
      clearTimeout(timeout);
      const isTimeout = err?.name === 'AbortError';
      return {
        ok: false,
        status: isTimeout ? 504 : 500,
        errorData: {
          error: {
            message: isTimeout ? 'Gemini request timed out after 15 seconds.' : (err?.message || 'Network error contacting Gemini API')
          }
        }
      };
    }
  };

  let res = await attemptCall();
  // Transient failure retry only for 500 or 503; do NOT retry 400 or 429 quota errors
  if (!res.ok && (res.status === 500 || res.status === 503)) {
    console.warn(`Gemini returned transient status ${res.status}. Retrying once after 1s...`);
    await new Promise(r => setTimeout(r, 1000));
    res = await attemptCall();
  }
  return res;
}

export async function processChatRequest(payload: ChatRequestPayload) {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  if (!apiKey) {
    return {
      error: {
        message: 'GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY in your server-side environment variables.',
        code: 'MISSING_API_KEY',
        status: 401
      }
    };
  }

  const userMessage = (payload.message || '').trim();
  if (!userMessage) {
    return {
      error: {
        message: 'Message cannot be empty.',
        code: 'INVALID_REQUEST',
        status: 400
      }
    };
  }

  if (userMessage.length > 2000) {
    return {
      error: {
        message: 'Message exceeds maximum allowed limit of 2,000 characters.',
        code: 'INPUT_TOO_LONG',
        status: 400
      }
    };
  }

  const PRIMARY_GEMINI_MODEL = (process.env.GEMINI_MODEL || payload.model || 'gemini-2.5-flash').trim();

  const selectedLang = (payload.language || 'en').toLowerCase();
  let languageStrictRule = '';
  if (selectedLang === 'mr') {
    languageStrictRule = 'CRITICAL LANGUAGE DIRECTIVE: You MUST answer EXCLUSIVELY in Marathi (मराठी). Even if the student speaks/types in English, asks technical questions, or mentions technical terms (like "database", "algorithm", "operating system"), provide your ENTIRE explanation in natural, fluent Marathi (देवनागरी). NEVER switch to English.';
  } else if (selectedLang === 'hi') {
    languageStrictRule = 'CRITICAL LANGUAGE DIRECTIVE: You MUST answer EXCLUSIVELY in Hindi (हिंदी). Even if the student uses English technical words or borrowed vocabulary, provide your ENTIRE explanation in clear, natural Hindi (देवनागरी). NEVER switch to English.';
  } else if (selectedLang === 'te') {
    languageStrictRule = 'CRITICAL LANGUAGE DIRECTIVE: You MUST answer EXCLUSIVELY in Telugu (తెలుగు). Even if the student uses English technical terms, provide your ENTIRE explanation in natural Telugu script. NEVER switch to English.';
  } else {
    languageStrictRule = 'CRITICAL LANGUAGE DIRECTIVE: You MUST answer EXCLUSIVELY in clear, articulate collegiate English. Even if the student uses Hindi/Marathi words or regional collegiate slang, answer in clear English.';
  }

  // 1. Perform High-Precision Document Retrieval only if uploaded document chunks exist
  let ragContext = '';
  const retrievedCitations: string[] = [];
  const rawChunks = payload.documentChunks || [];
  const hasUploadedDocs = Boolean(
    (rawChunks.length > 0) || payload.hasActiveDocument || payload.studyContext?.hasActiveDocument
  );

  if (hasUploadedDocs && rawChunks.length > 0) {
    const relevantPassages = searchDocuments(userMessage, rawChunks).slice(0, 4);

    if (relevantPassages.length > 0) {
      relevantPassages.forEach(p => retrievedCitations.push(`[Source: ${p.source}]`));
      ragContext = `\n\n### USER'S UPLOADED STUDY MATERIALS (RETRIEVED SOURCE PASSAGES - GROUND TRUTH):\n` +
        relevantPassages.map((p, idx) => `--- Excerpt ${idx + 1} ([Source: ${p.source}]) ---\n${p.text}`).join('\n\n') +
        `\n\nCRITICAL GROUNDING RULES:
1. When answering questions regarding the student's uploaded materials, base your answer strictly on the retrieved excerpts above.
2. For any fact from the document, explicitly cite: "[Source: <DocumentName>, <Page/Section>]".
3. Never invent facts, page numbers, quotations, or citations.
4. Never claim an answer came from a file unless the content is in the excerpts above.`;
    } else {
      // Chunks exist, but NONE matched the query. Check if user asked about their document:
      const asksAboutDoc = /\b(document|notes|pdf|file|uploaded|handout|chapter|page|slides|material)\b/i.test(userMessage);
      if (asksAboutDoc) {
        ragContext = `\n\n### NOTICE REGARDING UPLOADED STUDY MATERIALS:
The student asked a question referencing their uploaded study document/notes, but the requested information was NOT found anywhere in their uploaded documents.
CRITICAL INSTRUCTION:
1. State clearly at the beginning: "I couldn't find this information in your uploaded documents."
2. Then, provide a helpful general explanation from your general knowledge, clearly labeled:
"[General Knowledge - Not found in uploaded files]: <your answer here>".
3. Do NOT cite any document source or pretend it was in their notes.`;
      }
    }
  }

  const targetUniversity = payload.studyContext?.university || 'Sanjay Ghodawat University (SGU)';
  const targetCourse = payload.studyContext?.course || 'B.Tech in Artificial Intelligence';
  const targetBranch = payload.studyContext?.branch || 'Department of Artificial Intelligence';
  const targetSemester = payload.studyContext?.semester || 'Semester III';

  let systemInstruction = `You are StudyPilot AI, an intelligent, personalized conversational study assistant in the domain of Artificial Intelligence, developed by Team Codex for college students.

Student Academic Profile:
- University: ${targetUniversity}
- Degree Program: ${targetCourse}
- Branch / Department: ${targetBranch}
- Current Term: ${targetSemester}

Core Capabilities & Operating Principles:
1. Understand the user's ACTUAL question (spoken or typed) and answer that specific question directly, conversationally, and accurately.
2. Broad Domain Intelligence:
   - You are NOT restricted to academic syllabus topics. You must answer general knowledge, programming, technology, entertainment, everyday questions, brainstorming, science, and casual conversation naturally.
   - For programming & CS questions (e.g., "Explain recursion in simple terms", "Difference between React and Angular"): provide clear explanations, analogies, and clean code.
   - For science questions (e.g., "Explain photosynthesis"): explain the mechanism clearly with steps.
   - For general knowledge & sports questions: answer accurately. For questions requiring live real-time feeds past knowledge limits, explain clearly that as an AI assistant without a live sports ticker, you do not have today's live match result, but provide the latest tournament info you know. Do NOT fabricate live scores.
   - For everyday conversation & entertainment (e.g., "Tell me a joke"): respond with humor and warmth.
   - For brainstorming (e.g., "Give me ideas for a college project"): give creative, actionable, well-structured ideas.
   - For exam preparation advice (e.g., "How can I prepare for my exams?"): give structured, practical revision tips.
   - For definition questions (e.g., "What is artificial intelligence?"): give a precise, comprehensive, and engaging definition.
   - For ambiguous questions, ask a brief clarification instead of guessing.
3. Multi-turn Follow-up Handling:
   - When the user asks a follow-up (e.g., "Explain that with an example", "Make it simpler"), look at the recent conversation history to know what "that" or "it" refers to and continue the explanation seamlessly.
   - If the user changes the subject to an unrelated topic, focus entirely on the new topic without letting previous context interfere.
4. Language & Multilingual Directive:
   - The user has chosen ${selectedLang.toUpperCase()} as their active study language.
   - ${languageStrictRule}
5. Grounding & Citations:
   - When retrieved document excerpts are provided, cite "[Source: <DocumentName>, <Page/Section>]".
   - When no document excerpts are provided, answer directly and authoritatively from your knowledge base without mentioning documents or non-existent files.`;

  if (payload.studyContext?.subject || payload.studyContext?.topic) {
    systemInstruction += `\nCurrent Academic Context: Subject: "${payload.studyContext.subject || 'General'}", Focus Area: "${payload.studyContext.topic || 'General'}". (Always prioritize the user's exact query).`;
  }

  if (payload.voiceMode) {
    systemInstruction += `\n6. Real-Time Voice Call Assistant Guidelines:
   - You are speaking aloud in a real-time conversational voice call with the student.
   - ${languageStrictRule}
   - Keep answers conversational, crisp, direct, and concise (typically 2 to 4 spoken sentences).
   - DO NOT output complex markdown tables, raw HTML, emojis, or heavy bullet point lists that sound unnatural when spoken by text-to-speech.
   - Speak naturally with friendly, encouraging, academic warmth.
   - If explaining a concept, explain it clearly and intuitively.`;
  }

  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text?: string; functionCall?: any; functionResponse?: any }> }> = [];

  // Limit conversation history to the last 8 turns to avoid prompt bloat and unnecessary latency
  const rawHistory = (payload.history || []).slice(-8);
  for (const item of rawHistory) {
    const itemContent = item.content || (item as any).text;
    if (!itemContent || !itemContent.trim()) continue;
    const role: 'user' | 'model' = (item.role === 'assistant' || item.role === 'model') ? 'model' : 'user';

    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += `\n\n${itemContent.trim()}`;
    } else {
      contents.push({
        role,
        parts: [{ text: itemContent.trim() }]
      });
    }
  }

  if (contents.length > 0 && contents[0].role === 'model') {
    contents.shift();
  }

  const userPromptWithRag = userMessage + (ragContext ? `\n\n${ragContext}` : '');

  if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
    contents[contents.length - 1].parts[0].text += `\n\n${userPromptWithRag}`;
  } else {
    contents.push({
      role: 'user',
      parts: [{ text: userPromptWithRag }]
    });
  }

  const tools = [
    {
      functionDeclarations: [
        {
          name: 'calculate_math',
          description: 'Perform an exact mathematical calculation or arithmetic expression.',
          parameters: {
            type: 'OBJECT',
            properties: {
              expression: {
                type: 'STRING',
                description: 'The mathematical expression to evaluate, e.g. "17 * 24"'
              }
            },
            required: ['expression']
          }
        }
      ]
    }
  ];

  try {
    const requestBody: any = {
      contents,
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 2048
      },
      tools
    };

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${PRIMARY_GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

    // Call Gemini with 15s timeout and transient-only retry (status 500/503)
    let callResult = await callGeminiWithTimeout(geminiUrl, requestBody, 15000);

    if (!callResult.ok) {
      return {
        error: {
          message: `Google Gemini error: ${callResult.errorData?.error?.message || `HTTP ${callResult.status} from Gemini API`}`,
          code: callResult.status === 429 ? 'RATE_LIMIT_EXCEEDED' : 'GEMINI_ERROR',
          status: callResult.status,
          details: callResult.errorData?.error
        }
      };
    }

    const data = callResult.data;
    const candidate = data?.candidates?.[0]?.content;
    const parts = candidate?.parts || [];

    const functionCalls = parts.filter((p: any) => Boolean(p.functionCall)).map((p: any) => p.functionCall);

    if (functionCalls.length > 0) {
      const executedTools: Array<{ name: string; args: any; result: any }> = [];
      const toolParts: any[] = [];

      for (const call of functionCalls) {
        if (call.name === 'calculate_math') {
          const expr = call.args?.expression || '';
          const resultVal = evaluateArithmetic(expr);
          executedTools.push({ name: 'calculate_math', args: call.args, result: resultVal });

          toolParts.push({
            functionResponse: {
              name: 'calculate_math',
              response: {
                expression: expr,
                result: resultVal !== null ? resultVal : 'Could not evaluate expression'
              }
            }
          });
        }
      }

      contents.push({
        role: 'model',
        parts: functionCalls.map((fc: any) => ({ functionCall: fc }))
      });

      contents.push({
        role: 'user',
        parts: toolParts
      });

      const secondCallResult = await callGeminiWithTimeout(geminiUrl, {
        contents,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 2048
        }
      }, 15000);

      if (secondCallResult.ok) {
        const secondData = secondCallResult.data;
        const secondText = secondData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return {
          text: secondText,
          model: PRIMARY_GEMINI_MODEL,
          toolCallsExecuted: executedTools.length > 0 ? executedTools : undefined,
          citations: retrievedCitations.length > 0 ? Array.from(new Set(retrievedCitations)) : undefined
        };
      }
    }

    const outputText = parts.find((p: any) => typeof p.text === 'string')?.text || '';
    if (!outputText) {
      return {
        error: {
          message: 'Gemini returned an empty response. Please try rephrasing your question.',
          code: 'EMPTY_RESPONSE',
          status: 502
        }
      };
    }

    return {
      text: outputText,
      model: PRIMARY_GEMINI_MODEL,
      citations: retrievedCitations.length > 0 ? Array.from(new Set(retrievedCitations)) : undefined
    };

  } catch (error: any) {
    return {
      error: {
        message: `Google Gemini error: ${error?.message || 'Network error'}`,
        code: 'NETWORK_ERROR',
        status: 500
      }
    };
  }
}

export async function processOcrRequest(payload: {
  image: string;
  mimeType?: string;
  filename?: string;
  pageNumber?: number;
}) {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  if (!apiKey) {
    return {
      error: {
        message: 'GEMINI_API_KEY is not configured on the server.',
        code: 'MISSING_API_KEY',
        status: 401
      }
    };
  }

  const rawImage = (payload.image || '').trim();
  if (!rawImage) {
    return {
      error: {
        message: 'Image data is required for OCR extraction.',
        code: 'INVALID_REQUEST',
        status: 400
      }
    };
  }

  // Strip data URL scheme prefix if present
  const base64Data = rawImage.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
  const mimeType = payload.mimeType || 'image/jpeg';

  const PRIMARY_OCR_MODEL = (process.env.GEMINI_OCR_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();

  const ocrPrompt = `You are an expert academic document Optical Character Recognition (OCR) engine.
Analyze this scanned study document page (File: "${payload.filename || 'Scanned Document'}", Page ${payload.pageNumber || 1}) and extract all text, questions, options, headings, numbers, tables, marks, and student notes.
Instructions:
1. Extract and transcribe all legible content faithfully and accurately.
2. If this is an exam question paper or OMR answer sheet, transcribe all question items, choices, candidate/roll details, instructions, and filled responses systematically.
3. Organize tables and sections using clean, structured markdown.
4. Output ONLY the extracted document text. Do NOT include conversational greetings or conversational commentary.`;

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: ocrPrompt },
          {
            inlineData: {
              mimeType,
              data: base64Data
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096
    }
  };

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${PRIMARY_OCR_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const callResult = await callGeminiWithTimeout(geminiUrl, requestBody, 20000);

  if (!callResult.ok) {
    return {
      error: {
        message: `OCR extraction failed: ${callResult.errorData?.error?.message || `HTTP ${callResult.status} from Gemini API`}`,
        code: 'OCR_FAILED',
        status: callResult.status || 500
      }
    };
  }

  const data = callResult.data;
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const extractedText = parts.find((p: any) => typeof p.text === 'string')?.text || '';

  return {
    text: extractedText.trim(),
    model: PRIMARY_OCR_MODEL,
    pageNumber: payload.pageNumber || 1
  };
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'active',
      service: 'StudyPilot AI Chat Service',
      hasApiKey: Boolean((process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim()),
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: {
        message: 'Method Not Allowed. Use POST.',
        code: 'METHOD_NOT_ALLOWED',
        status: 405
      }
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    } else if (!body) {
      body = {};
    }

    // Support OCR extraction requests for scanned documents & OMR sheets
    if (body.action === 'ocr' || body.image) {
      const ocrResult = await processOcrRequest(body);
      if ('error' in ocrResult) {
        return res.status(ocrResult.error.status || 500).json(ocrResult);
      }
      return res.status(200).json(ocrResult);
    }

    const result = await processChatRequest(body);
    if ('error' in result) {
      return res.status(result.error.status || 500).json(result);
    }

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({
      error: {
        message: err?.message || 'Internal Server Error in chat handler',
        code: 'INTERNAL_SERVER_ERROR',
        status: 500
      }
    });
  }
}
