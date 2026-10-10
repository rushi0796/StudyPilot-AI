import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  if (!apiKey) {
    return res.status(401).json({
      error: {
        message: 'GEMINI_API_KEY is not configured on the server.',
        code: 'MISSING_API_KEY'
      }
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { question, studentAnswer, maxMarks, markingCriteria, documentChunks } = body;

    let ragContext = '';
    if (documentChunks && documentChunks.length > 0) {
      ragContext = `\n\nReference Material from Student's Uploaded Notes:\n` +
        documentChunks.map((c: any) => c.content).slice(0, 3).join('\n---\n');
    }

    const prompt = `You are a strict, fair engineering professor grading an examination at Sanjay Ghodawat University.
Question: "${question}"
Max Marks: ${maxMarks || 5}
University Marking Criteria:
${(markingCriteria || []).map((c: string) => `- ${c}`).join('\n')}
${ragContext}

Student's Written Answer:
"""
${studentAnswer}
"""

Evaluate this student answer thoroughly. Award partial credit objectively.
Respond with ONLY valid JSON with this exact structure:
{
  "estimatedMarks": <number between 1 and ${maxMarks || 5}, e.g. 3.5>,
  "scorePercentage": <number between 0 and 100>,
  "gradeTier": "<'Excellent' | 'Good' | 'Fair' | 'Needs Improvement'>",
  "correctConcepts": ["<Concept 1 student got right>", "<Concept 2>"],
  "missingPoints": ["<Crucial missing point 1 and marks lost>", "<Point 2>"],
  "conceptualErrors": ["<Any factual error or misconception, if none return empty array>"],
  "structureClarityFeedback": "<Paragraph evaluating presentation, formatting, and notation>",
  "actionableImprovements": ["<Actionable tip 1 for SGU exams>", "<Tip 2>", "<Tip 3>"],
  "improvedSampleAnswer": "<A complete, flawless model answer that would receive 100% full marks>"
}`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 2048
      }
    });

    const jsonText = response.text || '{}';
    const parsed = JSON.parse(jsonText);

    return res.status(200).json(parsed);
  } catch (error: any) {
    return res.status(500).json({
      error: {
        message: error?.message || 'Failed to evaluate answer with Gemini',
        code: 'EVALUATION_ERROR'
      }
    });
  }
}
