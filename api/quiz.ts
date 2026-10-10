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
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    } else if (!body) {
      body = {};
    }

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

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.5,
          maxOutputTokens: 4096
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: {
          message: errData.error?.message || 'Gemini quiz generation API error',
          code: 'QUIZ_ERROR'
        }
      });
    }

    const data = await response.json();
    const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      const clean = jsonText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
      try {
        parsed = JSON.parse(clean);
      } catch {
        parsed = [];
      }
    }

    return res.status(200).json(Array.isArray(parsed) ? parsed : []);
  } catch (error: any) {
    return res.status(500).json({
      error: {
        message: error?.message || 'Failed to generate quiz with Gemini',
        code: 'QUIZ_GENERATION_ERROR'
      }
    });
  }
}
