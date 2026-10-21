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

  const preferredModel = payload.model || 'gemini-3.8-flash';

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

  // 1. Perform Document Retrieval if document chunks or active document grounding is provided
  let ragContext = '';
  const retrievedCitations: string[] = [];
  const hasChunksProvided = Boolean(payload.documentChunks && payload.documentChunks.length > 0);
  const isGroundingActive = Boolean(hasChunksProvided || payload.hasActiveDocument || payload.studyContext?.hasActiveDocument);
  const activeDocName = payload.activeDocumentName || payload.studyContext?.activeDocumentName || payload.documentChunks?.[0]?.documentName || 'uploaded notes';

  if (isGroundingActive) {
    const relevantPassages = hasChunksProvided ? searchDocuments(userMessage, payload.documentChunks) : [];

    if (relevantPassages.length > 0) {
      relevantPassages.forEach(p => retrievedCitations.push(`[Source: ${p.source}]`));
      ragContext = `\n\n### USER'S UPLOADED STUDY MATERIALS (RETRIEVED SOURCE PASSAGES - GROUND TRUTH):\n` +
        relevantPassages.map((p, idx) => `--- Excerpt ${idx + 1} ([Source: ${p.source}]) ---\n${p.text}`).join('\n\n') +
        `\n\nCRITICAL GROUNDING RULES:
1. When answering questions regarding the student's uploaded materials, base your answer strictly on the retrieved excerpts above.
2. For any fact from the document, explicitly cite: "[Source: <DocumentName>, <Page/Section>]".
3. Never invent facts, page numbers, quotations, or citations.
4. If the user asks about something specific to their uploaded document that is NOT in the retrieved excerpts, clearly say: "I couldn't find this information in your uploaded documents." You may then offer general knowledge, explicitly labeled: "[General Knowledge - Not found in uploaded files]: <explanation>".
5. Never claim an answer came from a file unless the content is in the excerpts above.`;
    } else {
      // Document grounding active, but NO passages matched query — mark for web search fallback
      ragContext = 'WEB_SEARCH_FALLBACK';
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
   - For general knowledge & sports questions (e.g., "Who won the latest cricket match?"): answer accurately. For questions requiring live real-time feeds past knowledge limits, explain clearly that as an AI assistant without a live sports ticker, you do not have today's live match result, but provide the latest tournament info you know. Do NOT fabricate live scores.
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
5. Uploaded Document Grounding:
   - When the user asks about their uploaded study documents or notes:
     * Base your answer strictly on the retrieved source excerpts and cite "[Source: <DocumentName>, <Page/Section>]".
     * If the required information is not in the uploaded documents, state: "I couldn't find this information in your uploaded documents." You may then provide a general answer labeled: "[General Knowledge - Not found in uploaded files]: ...".
   - When the user is NOT asking about an uploaded file (e.g. general questions, jokes, cricket, math, general programming), NEVER say "I couldn't find this information in your uploaded documents". Answer normally from your general knowledge.`;

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

  const rawHistory = payload.history || [];
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
    const candidateModels = [
      preferredModel,
      'gemini-3.8-flash',
      'gemini-3.5-flash-lite',
      'gemini-2.5-flash'
    ].filter(Boolean) as string[];
    const modelsToTry = Array.from(new Set(candidateModels));

    let lastErrorData: any = null;
    let data: any = null;
    let activeModel = preferredModel;

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

    for (const modelToAttempt of modelsToTry) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelToAttempt}:generateContent?key=${encodeURIComponent(apiKey)}`;
      
      try {
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          lastErrorData = {
            status: response.status,
            message: errData.error?.message || `HTTP ${response.status} from Gemini API (${modelToAttempt})`,
            details: errData.error
          };

          // If candidate model fails with any HTTP error (429 quota, 404 missing, 400 bad config, 500/503 server error), try next candidate model
          console.warn(`Model ${modelToAttempt} failed with HTTP ${response.status}. Trying next candidate model...`);
          continue;
        }

        data = await response.json();
        activeModel = modelToAttempt;
        break;
      } catch (fetchErr: any) {
        lastErrorData = {
          status: 500,
          message: fetchErr?.message || `Network error contacting Gemini API for ${modelToAttempt}`
        };
        continue;
      }
    }

    if (!data) {
      return {
        error: {
          message: `Google Gemini error: ${lastErrorData?.message || 'All candidate AI models were unreachable.'}`,
          code: lastErrorData?.status === 429 ? 'RATE_LIMIT_EXCEEDED' : 'GEMINI_ERROR',
          status: lastErrorData?.status || 500,
          details: lastErrorData?.details
        }
      };
    }

    const candidate = data.candidates?.[0]?.content;
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

      const secondGeminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const secondResponse = await fetch(secondGeminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 2048
          }
        })
      });

      if (secondResponse.ok) {
        const secondData = await secondResponse.json();
        const secondText = secondData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return {
          text: secondText,
          model: activeModel,
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

    // ── Web Search Fallback ────────────────────────────────────────────────────
    // When document grounding is active but NO PDF chunks matched, perform a
    // secondary Gemini call with the google_search grounding tool so the student
    // still gets a real, web-sourced answer clearly distinguished from PDF content.
    if (ragContext === 'WEB_SEARCH_FALLBACK') {
      const webSearchBody: any = {
        contents: [
          {
            role: 'user',
            parts: [{ text: userMessage }]
          }
        ],
        systemInstruction: {
          parts: [{ text: `You are StudyPilot AI, an intelligent academic assistant for ${targetUniversity} students. Answer the following question clearly and concisely using up-to-date information from the web. ${languageStrictRule}` }]
        },
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1024
        },
        tools: [{ googleSearch: {} }]
      };

      try {
        const webSearchModel = 'gemini-3.8-flash';
        const webSearchUrl = `https://generativelanguage.googleapis.com/v1beta/models/${webSearchModel}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const webResp = await fetch(webSearchUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webSearchBody)
        });

        if (webResp.ok) {
          const webData = await webResp.json();
          const webText = webData.candidates?.[0]?.content?.parts?.find((p: any) => typeof p.text === 'string')?.text || '';
          if (webText) {
            return {
              text: `⚠️ This information was not found in your uploaded PDF.

I searched the web and found the following answer:`,
              webSearchResult: webText,
              model: activeModel,
              isWebSearchFallback: true
            };
          }
        }
      } catch {
        // Web search failed — fall through to normal general-knowledge answer below
      }

      // If web search itself failed, give a clear honest general-knowledge answer
      return {
        text: `⚠️ This information was not found in your uploaded PDF.

Here is a general knowledge answer (not from your document):

${outputText}`,
        model: activeModel,
        isWebSearchFallback: true
      };
    }

    return {
      text: outputText,
      model: activeModel,
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

  const candidateModels = [
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite',
    'gemini-2.5-flash'
  ];

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

  let lastErrorData: any = null;
  let data: any = null;
  let activeModel = 'gemini-3.8-flash';

  for (const modelToAttempt of candidateModels) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelToAttempt}:generateContent?key=${encodeURIComponent(apiKey)}`;
    try {
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        lastErrorData = {
          status: response.status,
          message: errData.error?.message || `HTTP ${response.status} from Gemini API (${modelToAttempt})`
        };
        console.warn(`OCR model ${modelToAttempt} failed with HTTP ${response.status}. Trying next...`);
        continue;
      }

      data = await response.json();
      activeModel = modelToAttempt;
      break;
    } catch (fetchErr: any) {
      lastErrorData = {
        status: 500,
        message: fetchErr?.message || `Network error contacting Gemini API for ${modelToAttempt}`
      };
      continue;
    }
  }

  if (!data) {
    return {
      error: {
        message: `OCR extraction failed: ${lastErrorData?.message || 'All candidate AI models were unreachable.'}`,
        code: 'OCR_FAILED',
        status: lastErrorData?.status || 500
      }
    };
  }

  const parts = data.candidates?.[0]?.content?.parts || [];
  const extractedText = parts.find((p: any) => typeof p.text === 'string')?.text || '';

  return {
    text: extractedText.trim(),
    model: activeModel,
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
      model: 'gemini-3.8-flash'
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
