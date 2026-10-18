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

  const modelName = payload.model || 'gemini-2.5-flash';

  const languageSpec = payload.language === 'hi'
    ? 'The user prefers explanations in Hindi (हिंदी). Respond primarily in Hindi (or natural Hinglish where appropriate) unless writing code or mathematical equations.'
    : payload.language === 'mr'
    ? 'The user prefers explanations in Marathi (मराठी). Respond primarily in Marathi unless writing code or mathematical equations.'
    : payload.language === 'te'
    ? 'The user prefers explanations in Telugu (తెలుగు). Respond primarily in Telugu unless writing code or mathematical equations.'
    : 'Respond in clear, natural English, or match the language/script the user spoke or typed in.';

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
      // Document grounding active, but no passages matched query
      ragContext = `\n\n### NOTICE REGARDING UPLOADED STUDY MATERIALS:\n` +
        `The user has active study documents (${activeDocName}), but NO relevant passages in their documents matched the query "${userMessage}".\n` +
        `CRITICAL GROUNDING RULES:
1. If the student is asking about their uploaded notes or document (or if this is an academic question while document grounding is active):
   - You MUST begin your answer with: "I couldn't find this information in your uploaded documents."
   - Then provide your accurate academic explanation labeled: "\n\n[General Knowledge - Not found in uploaded files]: <accurate general explanation>"
2. If the user is asking a purely casual question (such as "tell me a joke", greetings, everyday chit-chat), answer normally from general knowledge without mentioning uploaded documents.`;
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
   - When the user asks a follow-up (e.g., "Explain that with an example", "Make it simpler", "Explain it in Marathi"), look at the recent conversation history to know what "that" or "it" refers to and continue the explanation seamlessly.
   - If the user changes the subject to an unrelated topic, focus entirely on the new topic without letting previous context interfere.
4. Language & Multilingual Support:
   - Support English, Hindi (हिंदी), Marathi (मराठी), and Telugu (తెలుగు), as well as Hinglish/mixed inputs.
   - Language guideline: ${languageSpec}
   - If the user speaks or writes in Marathi, respond in natural Marathi. If they speak in Hindi, respond in Hindi.
5. Uploaded Document Grounding:
   - When the user asks about their uploaded study documents or notes:
     * Base your answer strictly on the retrieved source excerpts and cite "[Source: <DocumentName>, <Page/Section>]".
     * If the required information is not in the uploaded documents, state: "I couldn't find this information in your uploaded documents." You may then provide a general answer labeled: "[General Knowledge - Not found in uploaded files]: ...".
   - When the user is NOT asking about an uploaded file (e.g. general questions, jokes, cricket, math, general programming), NEVER say "I couldn't find this information in your uploaded documents". Answer normally from your general knowledge.`;

  if (payload.studyContext?.subject || payload.studyContext?.topic) {
    systemInstruction += `\nCurrent Academic Context: Subject: "${payload.studyContext.subject || 'General'}", Focus Area: "${payload.studyContext.topic || 'General'}". (Always prioritize the user's exact query).`;
  }

  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text?: string; functionCall?: any; functionResponse?: any }> }> = [];

  const rawHistory = payload.history || [];
  for (const item of rawHistory) {
    if (!item.content || !item.content.trim()) continue;
    const role: 'user' | 'model' = (item.role === 'assistant' || item.role === 'model') ? 'model' : 'user';

    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += `\n\n${item.content.trim()}`;
    } else {
      contents.push({
        role,
        parts: [{ text: item.content.trim() }]
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
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;
    
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

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData.error?.message || `HTTP ${response.status} from Gemini API`;
      return {
        error: {
          message: `Google Gemini error: ${msg}`,
          code: 'GEMINI_ERROR',
          status: response.status,
          details: errData.error
        }
      };
    }

    const data = await response.json();
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

      const secondResponse = await fetch(geminiUrl, {
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
          model: modelName,
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
      model: modelName,
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
      model: 'gemini-2.5-flash'
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
