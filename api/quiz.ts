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
    const { subject, topic, documentChunks, count = 4 } = body;

    const docText = (documentChunks || []).map((c: any) => c.content).slice(0, 3).join('\n') || '';
    const prompt = `Create a ${count}-question university practice quiz for ${subject || 'Engineering'} on the topic "${topic || 'General'}".
${docText ? `Ground the questions in this document material:\n${docText}\n` : ''}

Output ONLY a JSON array of ${count} items with this exact schema:
[
  {
    "id": "gen_q1",
    "type": "mcq",
    "question": "Question text here",
    "marks": 2,
    "topic": "${topic || 'General'}",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Detailed explanation of why option A is correct."
  }
]`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.5,
        maxOutputTokens: 2048
      }
    });

    const jsonText = response.text || '[]';
    const parsed = JSON.parse(jsonText);

    return res.status(200).json(parsed);
  } catch (error: any) {
    return res.status(500).json({
      error: {
        message: error?.message || 'Failed to generate quiz with Gemini',
        code: 'QUIZ_GENERATION_ERROR'
      }
    });
  }
}
