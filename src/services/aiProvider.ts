import { Language, DifficultyLevel, DocumentChunk, EvaluationResult, QuestionMarks, QuizQuestion } from '../types';

/**
 * StudyPilot AI - Google Gemini Generative AI Service
 * Powered by Gemini 1.5 Flash / 2.5 Flash
 * Provides real-time doubt solving, document-grounded RAG Q&A,
 * subjective answer evaluation, and quiz generation.
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export function getStoredApiKey(): string {
  return localStorage.getItem('studypilot_gemini_api_key') || (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
}

export function getStoredModel(): string {
  return localStorage.getItem('studypilot_gemini_model') || 'gemini-1.5-flash';
}

export function isLiveAiAvailable(): boolean {
  return Boolean(getStoredApiKey().trim());
}

/**
 * Test connectivity with Google Gemini API
 */
export async function testGeminiConnection(apiKey: string, model = 'gemini-1.5-flash'): Promise<{ success: boolean; model: string; message: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, model, message: 'Please provide a valid Gemini API key.' };
  }

  try {
    const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey.trim()}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Respond with the exact word: CONNECTED' }]
          }
        ],
        generationConfig: {
          maxOutputTokens: 20,
          temperature: 0.1
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error?.message || `HTTP error ${response.status}`;
      return { success: false, model, message: errMsg };
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (candidateText.includes('CONNECTED') || candidateText.length > 0) {
      return { success: true, model, message: `Successfully connected to ${model}!` };
    }
    return { success: true, model, message: `Connected to ${model}` };
  } catch (error: any) {
    return { success: false, model, message: error?.message || 'Network connection failed' };
  }
}

/**
 * Real Conversational AI Tutor (Doubt Solving with RAG document grounding)
 */
export async function askGeminiTutor(params: {
  query: string;
  subject: string;
  topic: string;
  language: Language;
  difficulty: DifficultyLevel;
  simplificationLevel?: number;
  documentChunks?: DocumentChunk[];
}): Promise<{
  content: string;
  quiz?: { question: string; options: string[]; correctIndex: number; explanation: string };
  suggestions: string[];
  citations?: string[];
  isLive: boolean;
}> {
  const apiKey = getStoredApiKey();
  const model = getStoredModel();

  if (!apiKey) {
    // Graceful deterministic fallback
    return getLocalDeterministicTutorResponse(params);
  }

  try {
    let ragContext = '';
    const citations: string[] = [];

    if (params.documentChunks && params.documentChunks.length > 0) {
      ragContext = `\n\n### USER'S UPLOADED STUDY MATERIALS (GROUND TRUTH):\n` +
        params.documentChunks.map((chk, i) => {
          citations.push(`[Source: ${chk.documentName}, ${chk.pageOrSection || `Section ${i + 1}`}]`);
          return `--- Source: ${chk.documentName} (${chk.pageOrSection || `Section ${i + 1}`}) ---\n${chk.content}`;
        }).join('\n\n') +
        `\n\nINSTRUCTION FOR RAG: Whenever you use information from the uploaded study materials above, cite them explicitly using [Source: DocumentName, Section].`;
    }

    const languageInstruction = params.language === 'hi' 
      ? 'Explain in clear, fluent Hindi (हिंदी) with real-world analogies and student-friendly technical terms.'
      : params.language === 'te'
      ? 'Explain in clear, fluent Telugu (తెలుగు) with everyday examples and core academic concepts.'
      : 'Explain in clear academic English with university examination standards.';

    const prompt = `You are StudyPilot AI, an expert academic tutor for engineering students at Sanjay Ghodawat University (SGU), Department of Artificial Intelligence.
Current Subject: ${params.subject}
Current Topic: ${params.topic}
Difficulty Level: ${params.difficulty} (Simplification Level: ${params.simplificationLevel || 1})
Language Instruction: ${languageInstruction}

Student Question: "${params.query}"
${ragContext}

Please structure your response in Markdown with:
1. Concept Definition / Core Idea
2. Step-by-Step Breakdown or Everyday Real-World Analogy
3. University Exam Importance (Mention marks value: 2M, 5M, or 7M)
4. A 1-question multiple-choice comprehension check formatted at the end as:
QUIZ_QUESTION: <Question text>
QUIZ_OPTIONS: <Option A> | <Option B> | <Option C> | <Option D>
QUIZ_CORRECT: <0, 1, 2, or 3>
QUIZ_EXPLANATION: <Why it is correct>
SUGGESTIONS: <Suggestion 1> | <Suggestion 2> | <Suggestion 3>`;

    const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey.trim()}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 2048
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse Quiz & Suggestions from output
    const parsed = parseTutorOutput(rawText);

    return {
      content: parsed.cleanContent,
      quiz: parsed.quiz,
      suggestions: parsed.suggestions.length > 0 ? parsed.suggestions : ['Give Me an Example', 'Explain More Simply', 'Test My Understanding'],
      citations: citations.length > 0 ? citations : undefined,
      isLive: true
    };
  } catch (error) {
    console.warn('Gemini tutor call failed, falling back to local academic engine:', error);
    return getLocalDeterministicTutorResponse(params);
  }
}

/**
 * Real AI Subjective Answer Evaluator
 */
export async function evaluateAnswerWithGemini(params: {
  question: string;
  studentAnswer: string;
  maxMarks: QuestionMarks;
  markingCriteria: string[];
  documentChunks?: DocumentChunk[];
}): Promise<EvaluationResult> {
  const apiKey = getStoredApiKey();
  const model = getStoredModel();

  if (!apiKey) {
    return getLocalDeterministicEvaluation(params);
  }

  try {
    let ragContext = '';
    if (params.documentChunks && params.documentChunks.length > 0) {
      ragContext = `\n\nReference Material from Student's Uploaded Notes:\n` +
        params.documentChunks.map(c => c.content).slice(0, 3).join('\n---\n');
    }

    const prompt = `You are a strict, fair engineering professor grading an examination at Sanjay Ghodawat University.
Question: "${params.question}"
Max Marks: ${params.maxMarks}
University Marking Criteria:
${params.markingCriteria.map(c => `- ${c}`).join('\n')}
${ragContext}

Student's Written Answer:
"""
${params.studentAnswer}
"""

Evaluate this student answer thoroughly. Award partial credit objectively.
Respond with ONLY valid JSON with this exact structure:
{
  "estimatedMarks": <number between 1 and ${params.maxMarks}, e.g. 3.5>,
  "scorePercentage": <number between 0 and 100>,
  "gradeTier": "<'Excellent' | 'Good' | 'Fair' | 'Needs Improvement'>",
  "correctConcepts": ["<Concept 1 student got right>", "<Concept 2>"],
  "missingPoints": ["<Crucial missing point 1 and marks lost>", "<Point 2>"],
  "conceptualErrors": ["<Any factual error or misconception, if none return empty array>"],
  "structureClarityFeedback": "<Paragraph evaluating presentation, formatting, and mathematical/diagram notation>",
  "actionableImprovements": ["<Actionable tip 1 for SGU exams>", "<Tip 2>", "<Tip 3>"],
  "improvedSampleAnswer": "<A complete, flawless model answer that would receive 100% full marks>"
}`;

    const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey.trim()}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: 2048
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini evaluation failed: ${response.status}`);
    }

    const data = await response.json();
    const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const parsed = JSON.parse(jsonText);

    return {
      question: params.question,
      subject: 'CS201 (DBMS)',
      maxMarks: params.maxMarks,
      estimatedMarks: Math.min(params.maxMarks, Math.max(1, Number(parsed.estimatedMarks) || 2.5)),
      scorePercentage: Number(parsed.scorePercentage) || Math.round((parsed.estimatedMarks / params.maxMarks) * 100),
      gradeTier: parsed.gradeTier || 'Good',
      correctConcepts: Array.isArray(parsed.correctConcepts) ? parsed.correctConcepts : ['Covered core definitions'],
      missingPoints: Array.isArray(parsed.missingPoints) ? parsed.missingPoints : ['Could include formal schema notation'],
      conceptualErrors: Array.isArray(parsed.conceptualErrors) ? parsed.conceptualErrors : [],
      structureClarityFeedback: parsed.structureClarityFeedback || 'Organized with readable technical points.',
      actionableImprovements: Array.isArray(parsed.actionableImprovements) ? parsed.actionableImprovements : ['Include schema decomposition diagrams'],
      improvedSampleAnswer: parsed.improvedSampleAnswer || 'Refer to model answer in the question bank.',
      evaluatedAt: 'Just now (Gemini 1.5 Flash)',
      isDemoEstimate: false
    };
  } catch (error) {
    console.warn('Gemini evaluation failed, using local academic rubric engine:', error);
    return getLocalDeterministicEvaluation(params);
  }
}

/**
 * Real AI Quiz Generator from Document Context or Topic
 */
export async function generateQuizWithGemini(params: {
  subject: string;
  topic: string;
  documentChunks?: DocumentChunk[];
}): Promise<QuizQuestion[]> {
  const apiKey = getStoredApiKey();
  const model = getStoredModel();

  if (!apiKey) {
    return [];
  }

  try {
    const docText = params.documentChunks?.map(c => c.content).slice(0, 3).join('\n') || '';
    const prompt = `Create a 4-question university practice quiz for ${params.subject} on the topic "${params.topic}".
${docText ? `Ground the questions in this document material:\n${docText}\n` : ''}

Output ONLY a JSON array of 4 items with this exact schema:
[
  {
    "id": "gen_q1",
    "type": "mcq",
    "question": "Question text here",
    "marks": 2,
    "topic": "${params.topic}",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Detailed explanation of why option A is correct."
  }
]`;

    const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey.trim()}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.5,
          maxOutputTokens: 2048
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => ({
          ...item,
          id: `gen_q_${Date.now()}_${idx}`
        }));
      }
    }
  } catch (err) {
    console.warn('Quiz generation with Gemini failed:', err);
  }
  return [];
}

/**
 * Local Deterministic Tutor Fallback
 */
function getLocalDeterministicTutorResponse(params: {
  query: string;
  subject: string;
  topic: string;
  language: Language;
  difficulty: DifficultyLevel;
  simplificationLevel?: number;
  documentChunks?: DocumentChunk[];
}) {
  const qLower = params.query.toLowerCase();
  const level = params.simplificationLevel || 1;
  const lang = params.language;

  let citations: string[] = [];
  if (params.documentChunks && params.documentChunks.length > 0) {
    citations = params.documentChunks.map((c, i) => `[Source: ${c.documentName}, ${c.pageOrSection || `Section ${i + 1}`}]`);
  }

  if (qLower.includes('norm') || qLower.includes('3nf') || qLower.includes('2nf') || params.topic.includes('Normal')) {
    if (lang === 'hi') {
      return {
        content: `### डेटाबेस सामान्यीकरण (Database Normalization - स्तर ${level})

**सरल परिभाषा:**
डेटाबेस नॉर्मलाइजेशन एक ऐसी प्रक्रिया है जिसमें हम डेटा को तालिकाओं (Tables) में व्यवस्थित करके **डेटा दोहराव (Redundancy)** और **विसंगतियों (Anomalies)** को समाप्त करते हैं।

${level > 1 ? `**अत्यंत सरल उदाहरण:**
मान लीजिए आपके पास एक स्कूल डायरी है जिसमें हर छात्र के नाम के साथ उसके प्रिंसिपल का नाम और फोन नंबर बार-बार लिखा जाता है। अगर प्रिंसिपल का फोन बदलता है, तो आपको 1000 पन्नों पर सुधार करना पड़ेगा (Update Anomaly)!
नॉर्मलाइजेशन कहता है: 'प्रिंसिपल की जानकारी एक अलग पेज पर रखो, और छात्रों के पेज पर सिर्फ एक छोटा कोड लिखो'।` : `**चरण-दर-चरण व्याख्या:**
1. **1NF (पहला सामान्य रूप):** सभी सेल में केवल एकल (Atomic) मान होना चाहिए।
2. **2NF (दूसरा सामान्य रूप):** 1NF + कोई आंशिक निर्भरता (Partial Dependency) नहीं।
3. **3NF (तीसरा सामान्य रूप):** 2NF + कोई सकर्मक निर्भरता (Transitive Dependency) नहीं।`}

**संजय घोड़ावत विश्वविद्यालय परीक्षा महत्वपूर्ण बिंदु:**
- 5 अंक के प्रश्नों में हमेशा 3NF का छात्र-विभाग उदाहरण अवश्य बनाएं।
${citations.length > 0 ? `\n\n**दस्तावेज़ संदर्भ:**\n${citations.join('\n')}` : ''}`,
        quiz: {
          question: "3NF में किस प्रकार की निर्भरता को समाप्त किया जाता है?",
          options: ["आंशिक निर्भरता (Partial)", "सकर्मक निर्भरता (Transitive)", "बहु-मूल्यवान निर्भरता (Multivalued)", "पूर्ण निर्भरता (Full)"],
          correctIndex: 1,
          explanation: "3NF सकर्मक निर्भरता (Transitive Dependency) को हटाता है जहां X -> Y और Y -> Z होता है।"
        },
        suggestions: ["Give Me an Example", "Explain More Simply", "Test My Understanding"],
        citations: citations.length > 0 ? citations : undefined,
        isLive: false
      };
    } else if (lang === 'te') {
      return {
        content: `### డేటాబేస్ నార్మలైజేషన్ (Database Normalization - స్థాయి ${level})

**సరళమైన వివరణ:**
డేటాబేస్ నార్మలైజేషన్ అనేది రిలేషనల్ టేబుల్స్‌లో అనవసరమైన డేటా పునరావృతాన్ని (Redundancy) మరియు తప్పులను (Anomalies) తొలగించే ఒక పద్ధతి.

${level > 1 ? `**సులభమైన ఉదాహరణ:**
ఒక పెద్ద డైరీలో ప్రతి విద్యార్థి వివరాల పక్కన ప్రిన్సిపాల్ పేరు మరియు ఫోన్ నంబర్ పదే పదే రాయడం వల్ల స్థలం వృధా అవుతుంది. నార్మలైజేషన్ ద్వారా ప్రిన్సిపాల్ వివరాలను వేరే పట్టికలో భద్రపరిచి, లింక్ చేస్తాము.` : `**దశలవారీగా వివరణ:**
1. **1NF:** ప్రతి కాలమ్‌లో కేవలం విడదీయరాని విలువలు (Atomic values) మాత్రమే ఉండాలి.
2. **2NF:** 1NF నిబంధనలు + పాక్షిక ఆధారపడటం (Partial Dependency) ఉండకూడదు.
3. **3NF:** 2NF నిబంధనలు + ట్రాన్సిటివ్ ఆధారపడటం (Transitive Dependency) ఉండకూడదు.`}

**సంజయ్ ఘోడావత్ విశ్వవిద్యాలయ పరీక్ష ముఖ్యాంశాలు:**
- 5 మార్కుల సమాధానం కోసం స్టూడెంట్ మరియు డిపార్ట్‌మెంట్ ఉదాహరణను తప్పక రాయండి.
${citations.length > 0 ? `\n\n**డాక్యుమెంట్ రిఫరెన్స్:**\n${citations.join('\n')}` : ''}`,
        quiz: {
          question: "3NF లో తొలగించబడే డిపెండెన్సీ ఏది?",
          options: ["పాక్షిక డిపెండెన్సీ", "ట్రాన్సిటివ్ డిపెండెన్సీ", "మల్టీవాల్యూడ్ డిపెండెన్సీ", "డొమైన్ డిపెండెన్సీ"],
          correctIndex: 1,
          explanation: "3NF లో నాన్-ప్రైమ్ అట్రిబ్యూట్స్ మధ్య ఉండే ట్రాన్సిటివ్ డిపెండెన్సీని తొలగిస్తారు."
        },
        suggestions: ["Give Me an Example", "Explain More Simply", "Test My Understanding"],
        citations: citations.length > 0 ? citations : undefined,
        isLive: false
      };
    } else {
      return {
        content: `### Database Normalization (Explanation Level ${level})

**Simple Definition:**
Database Normalization is the systematic technique of organizing relational database schemas to eliminate **data redundancy** and prevent **insertion, update, and deletion anomalies**.

${level > 1 ? `**Simplified Everyday Analogy (Teach Me More Simply):**
Think of managing a university spreadsheet: If you keep Student details and Department Head details on every single row, you duplicate the Head's phone number 5,000 times!
- If the Head changes phone numbers, you must edit 5,000 rows (**Update Anomaly**).
- If you delete the last student, you lose the Department's record (**Deletion Anomaly**).
- Normalization splits this into two neat tables: \`Students\` and \`Departments\`, connected by a clean Foreign Key.` : `**Step-by-Step Breakdown:**
1. **1NF (First Normal Form):** Every column contains atomic values. No multivalued attributes or repeating groups.
2. **2NF (Second Normal Form):** Meets 1NF + eliminates **Partial Dependency** (non-prime attributes must depend on the whole candidate key).
3. **3NF (Third Normal Form):** Meets 2NF + eliminates **Transitive Dependency** ($X \\rightarrow Y \\rightarrow Z$).
4. **BCNF (Boyce-Codd Normal Form):** For every non-trivial functional dependency $X \\rightarrow Y$, $X$ must strictly be a Superkey.`}

**Why 3NF is Preferred Over 2NF (Crucial 5-Mark Exam Question):**
2NF only resolves partial dependencies on composite keys. A table with a single primary key is already in 2NF, but can still suffer from dangerous transitive dependencies! 3NF cleanly splits transitive dependencies into dedicated tables.

**Important Sanjay Ghodawat University Examination Points:**
- **Marks Value:** 5 to 7 marks in SGU Semester III DBMS end-term examination.
- **Always Include:** Schema before decomposition $\\rightarrow$ FDs identified $\\rightarrow$ Two decomposed tables with Primary & Foreign Keys labeled!
${citations.length > 0 ? `\n\n**Grounded in Uploaded Documents:**\n${citations.join('\n')}` : ''}`,
        quiz: {
          question: "In Third Normal Form (3NF), which dependency anomaly is specifically eliminated?",
          options: [
            "Partial dependency on composite candidate keys",
            "Transitive dependency between non-prime attributes",
            "Multi-valued dependencies",
            "Join dependencies"
          ],
          correctIndex: 1,
          explanation: "3NF is defined as 2NF with the condition that no non-prime attribute is transitively dependent on the primary key."
        },
        suggestions: ["Give Me an Example", "Explain More Simply", "Test My Understanding"],
        citations: citations.length > 0 ? citations : undefined,
        isLive: false
      };
    }
  }

  // Fallback
  return {
    content: `### ${params.topic} - Academic Breakdown

**Core Overview:**
In the context of **${params.subject}** at Sanjay Ghodawat University, this concept represents a fundamental requirement for Semester III examinations.

**Key Technical Principles:**
1. **Structural Model:** Adheres to formal definitions, integrity invariants, and computational trade-offs.
2. **Algorithmic Flow:** Operates deterministically to preserve consistency and optimize query performance.
3. **Examination Value:** Frequently appears in 4-Mark and 7-Mark questions.
${citations.length > 0 ? `\n\n**Grounded in Uploaded Materials:**\n${citations.join('\n')}` : ''}`,
    quiz: {
      question: `What is the primary objective of studying ${params.topic}?`,
      options: [
        "Optimizing data structures and query efficiency",
        "Eliminating algorithmic redundancy",
        "Ensuring correctness according to specifications",
        "All of the above"
      ],
      correctIndex: 3,
      explanation: "All listed principles are core goals in university computer science and AI curricula."
    },
    suggestions: ["Give Me an Example", "Explain More Simply", "Test My Understanding"],
    citations: citations.length > 0 ? citations : undefined,
    isLive: false
  };
}

/**
 * Local Deterministic Evaluation Fallback
 */
function getLocalDeterministicEvaluation(params: {
  question: string;
  studentAnswer: string;
  maxMarks: QuestionMarks;
  markingCriteria: string[];
}): EvaluationResult {
  const textLower = params.studentAnswer.toLowerCase();
  const words = params.studentAnswer.trim().split(/\s+/).length;

  let estScore = 2.0;
  const maxM = params.maxMarks;

  const hasAnomalies = textLower.includes('anomal') || textLower.includes('insert') || textLower.includes('delete');
  const hasDecomp = textLower.includes('decompose') || textLower.includes('table') || textLower.includes('split');
  const hasKeys = textLower.includes('primary key') || textLower.includes('foreign key') || textLower.includes('superkey');
  const hasTransitive = textLower.includes('transitive');
  const hasPartial = textLower.includes('partial');

  if (maxM === 5) {
    if (hasTransitive) estScore += 1.0;
    if (hasPartial) estScore += 0.5;
    if (hasAnomalies) estScore += 0.5;
    if (hasDecomp) estScore += 0.5;
    if (hasKeys) estScore += 0.5;
    if (words > 80) estScore = Math.min(5.0, estScore + 0.5);
    estScore = Math.min(5.0, Math.max(1.5, estScore));
  } else if (maxM === 2) {
    estScore = textLower.includes('definition') || words > 20 ? 1.5 : 1.0;
    if (hasTransitive || hasKeys) estScore = 2.0;
  } else {
    estScore = Math.round((words / 120) * maxM * 10) / 10;
    estScore = Math.min(maxM, Math.max(1.0, estScore));
  }

  const scorePct = Math.round((estScore / maxM) * 100);

  return {
    question: params.question,
    subject: 'Database Management Systems',
    maxMarks: maxM,
    estimatedMarks: estScore,
    scorePercentage: scorePct,
    gradeTier: scorePct >= 85 ? 'Excellent' : scorePct >= 70 ? 'Good' : scorePct >= 50 ? 'Fair' : 'Needs Improvement',
    correctConcepts: [
      "Identified core purpose of normalization (minimizing redundancy)",
      hasTransitive ? "Correctly defined Transitive Dependency condition for 3NF" : "Stated 1NF and 2NF criteria",
      hasDecomp ? "Demonstrated relational decomposition into separate tables" : "Mentioned student-department entity context"
    ],
    missingPoints: [
      !hasAnomalies ? "Did not explicitly mention the three specific anomalies eliminated (Insertion, Update, Deletion anomalies) - Cost: 1.0 Mark" : "Could further formalize the mathematical condition X -> A where X is superkey",
      !hasKeys ? "Did not label Primary Keys (PK) and Foreign Keys (FK) in decomposed schemas - Cost: 0.5 Mark" : "Include formal attribute closure step if asked in long form"
    ],
    conceptualErrors: words < 35 ? [
      "Answer is too brief for university examination standard. Lacks concrete schema representation."
    ] : [],
    structureClarityFeedback: words > 80 
      ? "Good academic structure with headings, bullet points, and relational schemas clearly separated." 
      : "Format with clear section headers: Definition → 2NF vs 3NF Difference → Schema Decomposition → Anomalies Eliminated.",
    actionableImprovements: [
      "In SGU Semester III exams, always write schema before decomposition: R(A, B, C, D) followed by decomposed tables R1 and R2.",
      "Explicitly state which table holds the Foreign Key to ensure referential integrity is preserved.",
      "Cite the 3 anomalies (Insert, Update, Delete) with a 1-sentence real-world scenario."
    ],
    improvedSampleAnswer: `A table in 2NF only removes partial dependencies on composite keys. A table with a single-attribute primary key is already in 2NF, but can still have Transitive Dependencies (non-prime attribute -> non-prime attribute).

For example:
Student_Dept(RollNo, Name, DeptCode, DeptName, HOD)
- Primary Key: RollNo
- FDs: RollNo -> DeptCode, DeptCode -> DeptName, HOD
Here, RollNo -> DeptCode -> DeptName is a transitive dependency causing anomalies:
1. Cannot add a department without enrolling a student (Insert Anomaly).
2. Deleting last student deletes the department (Delete Anomaly).
3. Changing HOD requires updating multiple rows (Update Anomaly).

To achieve 3NF, we decompose into:
- Student(RollNo, Name, DeptCode) [PK: RollNo, FK: DeptCode]
- Department(DeptCode, DeptName, HOD) [PK: DeptCode]
Both tables are now in 3NF and free from transitive anomalies.`,
    evaluatedAt: "Just now (Local SGU Rubric Engine)",
    isDemoEstimate: true
  };
}

function parseTutorOutput(rawText: string) {
  let cleanContent = rawText;
  let quiz: { question: string; options: string[]; correctIndex: number; explanation: string } | undefined;
  const suggestions: string[] = [];

  const quizMatch = rawText.match(/QUIZ_QUESTION:\s*(.*?)\nQUIZ_OPTIONS:\s*(.*?)\nQUIZ_CORRECT:\s*(\d+)\nQUIZ_EXPLANATION:\s*(.*?)(?=\nSUGGESTIONS:|$)/s);
  if (quizMatch) {
    const qText = quizMatch[1].trim();
    const opts = quizMatch[2].split('|').map(o => o.trim()).filter(Boolean);
    const corr = parseInt(quizMatch[3].trim(), 10) || 0;
    const expl = quizMatch[4].trim();

    if (qText && opts.length >= 2) {
      quiz = {
        question: qText,
        options: opts,
        correctIndex: corr,
        explanation: expl
      };
    }

    cleanContent = cleanContent.replace(/QUIZ_QUESTION:[\s\S]*?(?=\nSUGGESTIONS:|$)/s, '').trim();
  }

  const suggMatch = rawText.match(/SUGGESTIONS:\s*(.*)/);
  if (suggMatch) {
    const items = suggMatch[1].split('|').map(s => s.trim()).filter(Boolean);
    suggestions.push(...items);
    cleanContent = cleanContent.replace(/SUGGESTIONS:\s*.*$/, '').trim();
  }

  return { cleanContent, quiz, suggestions };
}
