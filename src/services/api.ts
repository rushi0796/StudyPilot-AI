/**
 * StudyPilot AI - API Client Service
 * Bridges React Frontend with FastAPI backend on http://127.0.0.1:8000
 * Falls back gracefully to local deterministic engine if server is offline.
 */

const BACKEND_URL = 'http://127.0.0.1:8000';

export async function checkBackendHealth(): Promise<{ online: boolean; message?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, { method: 'GET', signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      const data = await res.json();
      return { online: true, message: data.university };
    }
    return { online: false };
  } catch (err) {
    return { online: false };
  }
}

export async function callBackendChat(query: string, topic: string, language: string, level = 1) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/chat/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        topic,
        language,
        simplification_level: level
      }),
      signal: AbortSignal.timeout(2000)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Graceful offline fallback
  }
  return null;
}

export async function callBackendEvaluation(question: string, studentAnswer: string, maxMarks: number) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/evaluate-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        student_answer: studentAnswer,
        max_marks: maxMarks
      }),
      signal: AbortSignal.timeout(2500)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Graceful offline fallback
  }
  return null;
}
