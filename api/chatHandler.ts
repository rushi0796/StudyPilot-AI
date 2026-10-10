import { GoogleGenAI } from '@google/genai';

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

export interface ChatResponseSuccess {
  text: string;
  model: string;
  toolCallsExecuted?: Array<{ name: string; args: any; result: any }>;
  citations?: string[];
}

export interface ChatResponseError {
  error: {
    message: string;
    code: string;
    status: number;
    details?: any;
  };
}

import fs from 'fs';
import path from 'path';

/**
 * Clean up invalid local proxy env variables if present and load .env.local if available
 */
function sanitizeEnvironment() {
  // Load local env files if present
  for (const envFile of ['.env.local', '.env']) {
    try {
      const p = path.resolve(process.cwd(), envFile);
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf-8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const idx = trimmed.indexOf('=');
            if (idx > 0) {
              const k = trimmed.slice(0, idx).trim();
              const v = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
              if (!process.env[k] && v) {
                process.env[k] = v;
              }
            }
          }
        }
      }
    } catch {}
  }

  const badBaseUrl = process.env.GOOGLE_GEMINI_BASE_URL || process.env.GEMINI_BASE_URL;
  if (badBaseUrl && (badBaseUrl.includes('127.0.0.1') || badBaseUrl.includes('localhost'))) {
    delete process.env.GOOGLE_GEMINI_BASE_URL;
    delete process.env.GEMINI_BASE_URL;
  }
}

/**
 * Safe arithmetic evaluator for calculator tool
 */
function evaluateArithmetic(expr: string): number | null {
  try {
    // Only allow digits, whitespace, and basic arithmetic operators
    const sanitized = expr.replace(/[^0-9+\-*/().^%\s]/g, '');
    if (!sanitized.trim()) return null;
    // Replace ^ with **
    const normalized = sanitized.replace(/\^/g, '**');
    // Using Function constructor with strictly sanitized math syntax
    const fn = new Function(`"use strict"; return (${normalized});`);
    const val = fn();
    return typeof val === 'number' && !isNaN(val) ? val : null;
  } catch {
    return null;
  }
}

/**
 * Search uploaded document chunks
 */
function searchDocuments(query: string, chunks?: DocumentChunkContext[]): Array<{ source: string; text: string }> {
  if (!chunks || chunks.length === 0) return [];
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  if (terms.length === 0) return chunks.slice(0, 2).map(c => ({
    source: `${c.documentName}${c.pageOrSection ? ` (${c.pageOrSection})` : ''}`,
    text: c.content
  }));

  const scored = chunks.map(chunk => {
    const textLower = chunk.content.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (textLower.includes(term)) {
        score += (textLower.split(term).length - 1);
      }
    }
    return { chunk, score };
  });

  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => ({
      source: `${item.chunk.documentName}${item.chunk.pageOrSection ? ` (${item.chunk.pageOrSection})` : ''}`,
      text: item.chunk.content
    }));
}

export async function processChatRequest(payload: ChatRequestPayload): Promise<ChatResponseSuccess | ChatResponseError> {
  sanitizeEnvironment();

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

  // System instruction
  const languageSpec = payload.language === 'hi'
    ? 'The user prefers explanations in Hindi (हिंदी). Respond primarily in Hindi unless writing code or mathematical equations.'
    : payload.language === 'te'
    ? 'The user prefers explanations in Telugu (తెలుగు). Respond primarily in Telugu unless writing code or mathematical equations.'
    : 'Respond in clear, academic English.';

  let systemInstruction = `You are StudyPilot AI, an intelligent, conversational academic study assistant developed by Team Codex for students at Sanjay Ghodawat University (SGU), Department of Artificial Intelligence.

Core Operating Principles:
1. Always understand the user's actual message and answer that specific question directly, conversationally, and accurately.
2. Never deflect to unrelated syllabus topics, generic disclaimers, or canned text.
   - If the user sends a greeting (e.g., "Hi, who are you?"), introduce yourself warmly as StudyPilot AI, the personalized study assistant for SGU AI students.
   - If the user asks a coding or computer science question (e.g., "Explain recursion in simple words with an example"), provide a clear conceptual explanation, an intuitive real-world analogy, and a clean code snippet.
   - If the user asks a mathematical calculation (e.g., "What is 17 multiplied by 24? Show the calculation"), calculate it accurately and show the working clearly.
   - If the user asks a follow-up question (e.g., "Now explain it in Hindi"), consult the preceding conversation history to determine what "it" refers to and explain that exact topic accordingly.
   - If the user asks a general-knowledge question, answer it accurately and informatively.
3. Language instruction: ${languageSpec}
4. When relevant uploaded study material is provided or retrieved, ground your answer in it and cite the sources. If the question is outside the uploaded documents or general in nature, answer using your knowledge and do NOT claim to have found it in documents.
5. If the user's question is genuinely ambiguous, ask a helpful clarifying question.`;

  if (payload.studyContext?.subject || payload.studyContext?.topic) {
    systemInstruction += `\nCurrent Academic Context: Subject: "${payload.studyContext.subject || 'General'}", Focus Area: "${payload.studyContext.topic || 'General'}". (Use this for academic context, but always prioritize the user's exact query).`;
  }

  // Format multi-turn conversation history
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text?: string; functionCall?: any; functionResponse?: any }> }> = [];

  const rawHistory = payload.history || [];
  for (const item of rawHistory) {
    if (!item.content || !item.content.trim()) continue;
    const role: 'user' | 'model' = (item.role === 'assistant' || item.role === 'model') ? 'model' : 'user';

    // Merge consecutive turns with the same role
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += `\n\n${item.content.trim()}`;
    } else {
      contents.push({
        role,
        parts: [{ text: item.content.trim() }]
      });
    }
  }

  // Ensure first turn in history is 'user' if history exists
  if (contents.length > 0 && contents[0].role === 'model') {
    contents.shift();
  }

  // Append latest user message
  if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
    contents[contents.length - 1].parts[0].text += `\n\n${userMessage}`;
  } else {
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });
  }

  // Tool definitions
  const tools = [
    {
      functionDeclarations: [
        {
          name: 'search_study_materials',
          description: 'Search the student uploaded lecture notes, syllabus, or study materials for specific topics, keywords, or concepts.',
          parameters: {
            type: 'OBJECT',
            properties: {
              query: {
                type: 'STRING',
                description: 'The search query or concept to search for in uploaded materials'
              }
            },
            required: ['query']
          }
        },
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
    const ai = new GoogleGenAI({ apiKey });

    // Initial call
    const initialResponse = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction,
        temperature: 0.6,
        maxOutputTokens: 2048,
        tools: (payload.documentChunks && payload.documentChunks.length > 0) ? tools : [tools[0]]
      }
    });

    const executedTools: Array<{ name: string; args: any; result: any }> = [];
    const citations: string[] = [];

    // Check if Gemini invoked any function calls
    if (initialResponse.functionCalls && initialResponse.functionCalls.length > 0) {
      const toolParts: any[] = [];

      for (const call of initialResponse.functionCalls) {
        if (call.name === 'search_study_materials') {
          const q = (call.args as any)?.query || userMessage;
          const searchResults = searchDocuments(q, payload.documentChunks);
          executedTools.push({ name: 'search_study_materials', args: call.args, result: searchResults });
          
          if (searchResults.length > 0) {
            searchResults.forEach(r => citations.push(`[Source: ${r.source}]`));
          }

          toolParts.push({
            functionResponse: {
              name: 'search_study_materials',
              response: {
                query: q,
                results: searchResults.length > 0 ? searchResults : 'No direct matches found in uploaded study materials.'
              }
            }
          });
        } else if (call.name === 'calculate_math') {
          const expr = (call.args as any)?.expression || '';
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

      // Add model's tool calls and our function responses to the conversation
      contents.push({
        role: 'model',
        parts: initialResponse.functionCalls.map(fc => ({ functionCall: fc }))
      });

      contents.push({
        role: 'user',
        parts: toolParts
      });

      // Second turn to let Gemini generate the final grounded text
      const finalResponse = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction,
          temperature: 0.6,
          maxOutputTokens: 2048
        }
      });

      const finalText = finalResponse.text || 'I have processed your request.';
      return {
        text: finalText,
        model: modelName,
        toolCallsExecuted: executedTools.length > 0 ? executedTools : undefined,
        citations: citations.length > 0 ? Array.from(new Set(citations)) : undefined
      };
    }

    // Direct text response
    const outputText = initialResponse.text || '';
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
      model: modelName
    };

  } catch (error: any) {
    const errorMsg = error?.message || 'Gemini API execution error';
    const errorStatus = error?.status || (errorMsg.includes('API key') ? 401 : 500);

    return {
      error: {
        message: `Google Gemini error: ${errorMsg}`,
        code: 'GEMINI_ERROR',
        status: typeof errorStatus === 'number' ? errorStatus : 500,
        details: error?.details || undefined
      }
    };
  }
}
