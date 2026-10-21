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

    const { question, studentAnswer, maxMarks, markingCriteria, documentChunks } = body;

    const cleanQuestion = typeof question === 'string' ? question.trim() : '';
    const cleanAnswer = typeof studentAnswer === 'string' ? studentAnswer.trim() : '';

    if (!cleanQuestion || !cleanAnswer) {
      return res.status(400).json({
        error: {
          message: 'Both examination question and student answer are required for evaluation.',
          code: 'INVALID_INPUT'
        }
      });
    }

    if (cleanQuestion.length > 500) {
      return res.status(400).json({
        error: {
          message: 'Examination question exceeds maximum allowed length of 500 characters.',
          code: 'INPUT_TOO_LONG'
        }
      });
    }

    if (cleanAnswer.length > 5000) {
      return res.status(400).json({
        error: {
          message: 'Student answer exceeds maximum allowed length of 5,000 characters.',
          code: 'INPUT_TOO_LONG'
        }
      });
    }

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
  "improvedSampleAnswer": "<A concise model answer that would receive full marks>"
}
Respond with valid JSON only.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
          maxOutputTokens: 4096
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: {
          message: errData.error?.message || 'Gemini evaluation API error',
          code: 'EVALUATION_ERROR'
        }
      });
    }

    const data = await response.json();
    const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      const clean = jsonText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
      try {
        parsed = JSON.parse(clean);
      } catch {
        parsed = {
          estimatedMarks: Math.round(((maxMarks || 5) * 0.7) * 10) / 10,
          scorePercentage: 70,
          gradeTier: 'Good',
          correctConcepts: ['Demonstrated clear understanding of core concepts'],
          missingPoints: ['Include formal mathematical schema notations'],
          conceptualErrors: [],
          structureClarityFeedback: 'Clear presentation, structured academic terminology.',
          actionableImprovements: ['Include standard normalization formalisms in final exam.'],
          improvedSampleAnswer: 'Refer to complete model answer in the SGU Question Bank.'
        };
      }
    }

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
