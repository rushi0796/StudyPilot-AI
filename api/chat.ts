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
  language?: 'en' | 'hi' | 'te';
  studyContext?: {
    subject?: string;
    topic?: string;
    difficulty?: 'simple' | 'standard' | 'deep';
    simplificationLevel?: number;
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
function searchDocuments(query: string, chunks?: DocumentChunkContext[]): Array<{ source: string; text: string; score: number }> {
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
    if (queryLower.length > 5 && textLower.includes(queryLower)) {
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
    ? 'The user prefers explanations in Hindi (हिंदी). Respond primarily in Hindi unless writing code or mathematical equations.'
    : payload.language === 'te'
    ? 'The user prefers explanations in Telugu (తెలుగు). Respond primarily in Telugu unless writing code or mathematical equations.'
    : 'Respond in clear, academic English.';

  // 1. Perform Document Retrieval if document chunks are provided
  let ragContext = '';
  const retrievedCitations: string[] = [];
  const hasDocumentsProvided = Boolean(payload.documentChunks && payload.documentChunks.length > 0);

  if (hasDocumentsProvided) {
    const relevantPassages = searchDocuments(userMessage, payload.documentChunks);

    if (relevantPassages.length > 0) {
      relevantPassages.forEach(p => retrievedCitations.push(`[Source: ${p.source}]`));
      ragContext = `\n\n### USER'S UPLOADED STUDY MATERIALS (RETRIEVED SOURCE PASSAGES - GROUND TRUTH):\n` +
        relevantPassages.map((p, idx) => `--- Excerpt ${idx + 1} ([Source: ${p.source}]) ---\n${p.text}`).join('\n\n') +
        `\n\nCRITICAL GROUNDING RULES:
1. Answer the question based on the retrieved excerpts above.
2. For any fact from the document, explicitly cite: "[Source: <DocumentName>, <Page/Section>]".
3. Never invent facts, page numbers, quotations, or citations.
4. If the user asks about something in their document that is NOT in the retrieved excerpts, clearly say: "I couldn't find this information in your uploaded documents." You may then offer general knowledge, but you MUST explicitly label it as: "[General Knowledge - Not found in uploaded files]: <explanation>".
5. Never claim an answer came from a file unless the content is in the excerpts above.`;
    } else {
      // Document grounding active, but no passages matched query
      ragContext = `\n\n### NOTICE REGARDING UPLOADED STUDY MATERIALS:\n` +
        `The user has uploaded study documents, but NO relevant passages in their documents matched the query "${userMessage}".\n` +
        `INSTRUCTION: If the user is asking about their uploaded notes or document, you MUST explicitly state: "I couldn't find this information in your uploaded documents." You may then offer general knowledge, explicitly prefixed with: "[General Knowledge - Not found in uploaded files]:".`;
    }
  }

  let systemInstruction = `You are StudyPilot AI, an intelligent, conversational academic study assistant developed by Team Codex for students at Sanjay Ghodawat University (SGU), Department of Artificial Intelligence.

Core Operating Principles:
1. Understand the user's actual question and answer that specific question directly, conversationally, and accurately.
2. Never deflect to unrelated syllabus topics or canned text.
   - If the user sends a greeting (e.g., "Hi, who are you?"), introduce yourself warmly as StudyPilot AI, the study assistant for SGU AI students.
   - If the user asks a coding or computer science question (e.g., "Explain recursion in simple words with an example"), provide a clear conceptual explanation, an intuitive real-world analogy, and a clean code snippet.
   - If the user asks a mathematical calculation (e.g., "What is 17 multiplied by 24? Show the calculation"), calculate it accurately and show the step-by-step arithmetic.
   - If the user asks a follow-up question (e.g., "Now explain it in Hindi"), consult preceding conversation history to determine what "it" refers to and explain that exact topic accordingly.
   - If the user asks a general-knowledge question, answer it accurately and informatively.
3. Language instruction: ${languageSpec}
4. Grounded Document Rules:
   - When retrieved study material passages are provided, ground your answer in them and cite the exact source using "[Source: <DocumentName>, <Page/Section>]".
   - If information is not in the uploaded documents, state clearly: "I couldn't find this information in your uploaded documents."
   - Never claim an answer came from a file unless the relevant content was actually retrieved.
5. If the user's question is genuinely ambiguous, ask a helpful clarifying question.`;

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
