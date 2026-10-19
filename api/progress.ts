import crypto from 'crypto';
import { parseCookie } from 'cookie';
import { neon } from '@neondatabase/serverless';

/* ==========================================================================
   1. TYPES & MODELS
   ========================================================================== */

export interface StudentProgressRecord {
  user_id: string;
  overall_progress: number;
  quizzes_completed: number;
  questions_answered: number;
  correct_answers: number;
  accuracy_percentage: number;
  evaluations_completed: number;
  tasks_completed: number;
  streak_days: number;
  last_active_at: string;
  created_at: string;
  updated_at: string;
}

export interface QuizAttemptRecord {
  id: string;
  user_id: string;
  quiz_id: string;
  title: string;
  subject_id: string;
  subject_name: string;
  score: number;
  total_marks: number;
  questions_count: number;
  correct_count: number;
  accuracy: number;
  time_spent_seconds: number;
  submitted_at: string;
}

export interface ActivityLogRecord {
  id: string;
  user_id: string;
  activity_type: string;
  subject_id?: string;
  title: string;
  description?: string;
  score_percentage?: number;
  metadata?: any;
  created_at: string;
}

export interface TopicProgressRecord {
  id: string;
  user_id: string;
  subject_id: string;
  unit_id: string;
  topic_id: string;
  status: 'not-started' | 'in-progress' | 'completed';
  updated_at: string;
}

export interface UserTaskRecord {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  due_date: string;
  time_estimate_minutes: number;
  completed: boolean;
  created_at: string;
  completed_at?: string;
}

export interface SubjectProgressSummary {
  [subjectId: string]: {
    completedTopics: number;
    totalTopics: number;
    percentage: number;
  };
}

/* ==========================================================================
   2. DATABASE CONNECTION & DEV IN-MEMORY FALLBACK
   ========================================================================== */

export class DatabaseConfigurationError extends Error {
  constructor(message = 'Production database is not configured. POSTGRES_URL or DATABASE_URL is required.') {
    super(message);
    this.name = 'DatabaseConfigurationError';
  }
}

let progressSchemaInitialized = false;

// Ephemeral in-memory storage for unit testing and local dev when DB is absent
const memoryProgress = new Map<string, StudentProgressRecord>();
const memoryQuizAttempts = new Map<string, QuizAttemptRecord[]>();
const memoryActivityLogs = new Map<string, ActivityLogRecord[]>();
const memoryTopicProgress = new Map<string, Map<string, TopicProgressRecord>>();
const memoryUserTasks = new Map<string, UserTaskRecord[]>();

export function _resetMemoryProgressDb(): void {
  memoryProgress.clear();
  memoryQuizAttempts.clear();
  memoryActivityLogs.clear();
  memoryTopicProgress.clear();
  memoryUserTasks.clear();
  progressSchemaInitialized = false;
}

function getDatabaseConnectionString(): string | null {
  const url =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    '';
  return url.trim() ? url.trim() : null;
}

function isNeonConfigured(): boolean {
  return Boolean(getDatabaseConnectionString());
}

function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
}

async function queryNeon<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
  const connString = getDatabaseConnectionString();
  if (!connString) {
    throw new DatabaseConfigurationError();
  }
  const sql = neon(connString);
  if (typeof (sql as any).query === 'function') {
    const result = await (sql as any).query(queryText, params && params.length > 0 ? params : []);
    return (result as T[]) || [];
  }
  const result = await (sql as any)(queryText, params);
  return (result as T[]) || [];
}

/* ==========================================================================
   3. IDEMPOTENT SCHEMA INITIALIZATION
   ========================================================================== */

export async function ensureProgressDatabaseSchema(): Promise<void> {
  if (progressSchemaInitialized) return;
  if (!isNeonConfigured()) {
    if (isProductionEnvironment()) throw new DatabaseConfigurationError();
    progressSchemaInitialized = true;
    return;
  }

  try {
    await queryNeon(`
      CREATE TABLE IF NOT EXISTS studypilot_student_progress (
        user_id VARCHAR(64) PRIMARY KEY REFERENCES studypilot_users(id) ON DELETE CASCADE,
        overall_progress INT DEFAULT 0,
        quizzes_completed INT DEFAULT 0,
        questions_answered INT DEFAULT 0,
        correct_answers INT DEFAULT 0,
        accuracy_percentage INT DEFAULT 0,
        evaluations_completed INT DEFAULT 0,
        tasks_completed INT DEFAULT 0,
        streak_days INT DEFAULT 0,
        last_active_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryNeon(`
      CREATE TABLE IF NOT EXISTS studypilot_quiz_attempts (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES studypilot_users(id) ON DELETE CASCADE,
        quiz_id VARCHAR(64) NOT NULL,
        title VARCHAR(255) NOT NULL,
        subject_id VARCHAR(64) NOT NULL,
        subject_name VARCHAR(255) NOT NULL,
        score INT NOT NULL,
        total_marks INT NOT NULL,
        questions_count INT NOT NULL,
        correct_count INT NOT NULL,
        accuracy INT NOT NULL,
        time_spent_seconds INT DEFAULT 0,
        submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryNeon(`
      CREATE TABLE IF NOT EXISTS studypilot_activity_logs (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES studypilot_users(id) ON DELETE CASCADE,
        activity_type VARCHAR(64) NOT NULL,
        subject_id VARCHAR(64),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        score_percentage INT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryNeon(`
      CREATE TABLE IF NOT EXISTS studypilot_topic_progress (
        id VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES studypilot_users(id) ON DELETE CASCADE,
        subject_id VARCHAR(64) NOT NULL,
        unit_id VARCHAR(64) NOT NULL,
        topic_id VARCHAR(64) NOT NULL,
        status VARCHAR(32) NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryNeon(`
      CREATE TABLE IF NOT EXISTS studypilot_user_tasks (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES studypilot_users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        priority VARCHAR(16) NOT NULL,
        reason VARCHAR(64) NOT NULL,
        due_date VARCHAR(64) NOT NULL,
        time_estimate_minutes INT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMPTZ
      );
    `);

    await queryNeon('CREATE INDEX IF NOT EXISTS idx_sp_qa_user ON studypilot_quiz_attempts(user_id, submitted_at DESC);');
    await queryNeon('CREATE INDEX IF NOT EXISTS idx_sp_al_user ON studypilot_activity_logs(user_id, created_at DESC);');
    await queryNeon('CREATE INDEX IF NOT EXISTS idx_sp_tp_user ON studypilot_topic_progress(user_id, subject_id);');
    await queryNeon('CREATE INDEX IF NOT EXISTS idx_sp_ut_user ON studypilot_user_tasks(user_id, completed);');

    progressSchemaInitialized = true;
  } catch (err: any) {
    progressSchemaInitialized = false;
    throw err;
  }
}

/* ==========================================================================
   4. SESSION AUTHENTICATION (SERVER-SIDE SOURCE OF TRUTH)
   ========================================================================== */

function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getSessionTokenFromRequest(req: any): string | null {
  const cookieHeader = req?.headers?.cookie || req?.headers?.Cookie || '';
  if (cookieHeader) {
    try {
      const parsed = parseCookie(cookieHeader);
      if (parsed['studypilot_session']) {
        return parsed['studypilot_session'];
      }
    } catch {}
  }
  const authHeader = req?.headers?.authorization || req?.headers?.Authorization || '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

let mockAuthResolver: ((token: string) => Promise<{ id: string; email: string; name: string } | null>) | null = null;

export function _setMockAuthResolver(resolver: typeof mockAuthResolver) {
  mockAuthResolver = resolver;
}

export async function getAuthenticatedUser(req: any): Promise<{ id: string; email: string; name: string } | null> {
  if (req.__testUser) return req.__testUser;

  const token = getSessionTokenFromRequest(req);
  if (!token) return null;

  if (mockAuthResolver) {
    const resolved = await mockAuthResolver(token);
    if (resolved) return resolved;
  }

  const tokenHash = hashSessionToken(token);
  const now = new Date().toISOString();

  if (!isNeonConfigured()) {
    // In dev test fallback mode, verify with memory store if mocked
    return req.__testUser || null;
  }

  await ensureProgressDatabaseSchema();

  const rows = await queryNeon<{ id: string; email: string; name: string }>(
    `SELECT u.id, u.email, u.name 
     FROM studypilot_users u
     JOIN studypilot_sessions s ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > $2
     LIMIT 1;`,
    [tokenHash, now]
  );

  return rows[0] || null;
}

/* ==========================================================================
   5. PROGRESS CALCULATION FORMULA & CORE LOGIC
   ========================================================================== */

/**
 * Total topics across the standard SGU Semester III AI Curriculum (approx 90 topics, 18 per subject)
 */
export const TOTAL_CURRICULUM_TOPICS = 90;
export const TOTAL_CURRICULUM_MODULES = 30; // 6 units x 5 subjects

/**
 * Progress Calculation Formula:
 * 1. Syllabus Topic Mastery (50% weight):
 *    (Completed Topics / TOTAL_CURRICULUM_TOPICS) * 50
 * 2. Quiz Assessments (30% weight):
 *    min(20, (Quizzes Completed / 5) * 20) + (Average Quiz Accuracy / 100) * 10
 * 3. AI Answer Evaluation Practice (20% weight):
 *    min(20, (Evaluations Completed / 4) * 20)
 * 
 * Overall = min(100, Topic Score + Quiz Score + Evaluation Score)
 * A brand new account starts at precisely 0%.
 */
export function calculateOverallProgress(
  completedTopicsCount: number,
  quizzesCompletedCount: number,
  avgQuizAccuracy: number,
  evaluationsCompletedCount: number
): number {
  if (completedTopicsCount === 0 && quizzesCompletedCount === 0 && evaluationsCompletedCount === 0) {
    return 0;
  }

  const topicScore = Math.min(50, (completedTopicsCount / TOTAL_CURRICULUM_TOPICS) * 50);
  const quizCountScore = Math.min(20, (quizzesCompletedCount / 5) * 20);
  const quizAccuracyScore = quizzesCompletedCount > 0 ? (avgQuizAccuracy / 100) * 10 : 0;
  const quizScore = Math.min(30, quizCountScore + quizAccuracyScore);
  const evalScore = Math.min(20, (evaluationsCompletedCount / 4) * 20);

  const total = Math.round(topicScore + quizScore + evalScore);
  return Math.min(100, Math.max(0, total));
}

export function calculateSubjectProgress(
  completedTopicsForSubject: number,
  totalTopicsForSubject: number = 18
): number {
  if (totalTopicsForSubject <= 0 || completedTopicsForSubject <= 0) return 0;
  return Math.min(100, Math.round((completedTopicsForSubject / totalTopicsForSubject) * 100));
}

/* ==========================================================================
   6. PROGRESS DATA ACCESS & UPDATERS
   ========================================================================== */

export async function getStudentProgress(userId: string): Promise<{
  summary: StudentProgressRecord;
  quizAttempts: QuizAttemptRecord[];
  recentActivity: ActivityLogRecord[];
  topicProgress: { [topicId: string]: string };
  subjectProgress: { [subjectId: string]: number };
  userTasks: UserTaskRecord[];
}> {
  await ensureProgressDatabaseSchema();

  if (!isNeonConfigured()) {
    const summary = memoryProgress.get(userId) || {
      user_id: userId,
      overall_progress: 0,
      quizzes_completed: 0,
      questions_answered: 0,
      correct_answers: 0,
      accuracy_percentage: 0,
      evaluations_completed: 0,
      tasks_completed: 0,
      streak_days: 0,
      last_active_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const attempts = memoryQuizAttempts.get(userId) || [];
    const activities = memoryActivityLogs.get(userId) || [];
    const topicsMap = memoryTopicProgress.get(userId) || new Map<string, TopicProgressRecord>();
    const tasks = memoryUserTasks.get(userId) || [];

    const topicProgressObj: { [topicId: string]: string } = {};
    const subjectCompletedCount: { [subId: string]: number } = {};

    for (const [topId, rec] of topicsMap.entries()) {
      topicProgressObj[topId] = rec.status;
      if (rec.status === 'completed') {
        subjectCompletedCount[rec.subject_id] = (subjectCompletedCount[rec.subject_id] || 0) + 1;
      }
    }

    const subjectProgressObj: { [subjectId: string]: number } = {
      cs201: calculateSubjectProgress(subjectCompletedCount['cs201'] || 0, 18),
      ai202: calculateSubjectProgress(subjectCompletedCount['ai202'] || 0, 18),
      cs203: calculateSubjectProgress(subjectCompletedCount['cs203'] || 0, 18),
      ma204: calculateSubjectProgress(subjectCompletedCount['ma204'] || 0, 18),
      cs205: calculateSubjectProgress(subjectCompletedCount['cs205'] || 0, 18)
    };

    return {
      summary,
      quizAttempts: attempts,
      recentActivity: activities,
      topicProgress: topicProgressObj,
      subjectProgress: subjectProgressObj,
      userTasks: tasks
    };
  }

  // Neon PostgreSQL Queries
  let summaryRows = await queryNeon<StudentProgressRecord>(
    'SELECT * FROM studypilot_student_progress WHERE user_id = $1 LIMIT 1;',
    [userId]
  );

  let summary = summaryRows[0];
  if (!summary) {
    // Initialize genuinely new user with zero values
    const now = new Date().toISOString();
    const inserted = await queryNeon<StudentProgressRecord>(
      `INSERT INTO studypilot_student_progress (
         user_id, overall_progress, quizzes_completed, questions_answered,
         correct_answers, accuracy_percentage, evaluations_completed,
         tasks_completed, streak_days, last_active_at
       ) VALUES ($1, 0, 0, 0, 0, 0, 0, 0, 0, $2)
       RETURNING *;`,
      [userId, now]
    );
    summary = inserted[0];
  }

  const quizAttempts = await queryNeon<QuizAttemptRecord>(
    'SELECT * FROM studypilot_quiz_attempts WHERE user_id = $1 ORDER BY submitted_at DESC LIMIT 10;',
    [userId]
  );

  const recentActivity = await queryNeon<ActivityLogRecord>(
    'SELECT * FROM studypilot_activity_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 15;',
    [userId]
  );

  const topicRows = await queryNeon<TopicProgressRecord>(
    'SELECT * FROM studypilot_topic_progress WHERE user_id = $1;',
    [userId]
  );

  const userTasks = await queryNeon<UserTaskRecord>(
    'SELECT * FROM studypilot_user_tasks WHERE user_id = $1 ORDER BY created_at DESC;',
    [userId]
  );

  const topicProgressObj: { [topicId: string]: string } = {};
  const subjectCompletedCount: { [subId: string]: number } = {};

  for (const row of topicRows) {
    topicProgressObj[row.topic_id] = row.status;
    if (row.status === 'completed') {
      subjectCompletedCount[row.subject_id] = (subjectCompletedCount[row.subject_id] || 0) + 1;
    }
  }

  const subjectProgressObj: { [subjectId: string]: number } = {
    cs201: calculateSubjectProgress(subjectCompletedCount['cs201'] || 0, 18),
    ai202: calculateSubjectProgress(subjectCompletedCount['ai202'] || 0, 18),
    cs203: calculateSubjectProgress(subjectCompletedCount['cs203'] || 0, 18),
    ma204: calculateSubjectProgress(subjectCompletedCount['ma204'] || 0, 18),
    cs205: calculateSubjectProgress(subjectCompletedCount['cs205'] || 0, 18)
  };

  return {
    summary,
    quizAttempts,
    recentActivity,
    topicProgress: topicProgressObj,
    subjectProgress: subjectProgressObj,
    userTasks
  };
}

export async function recordQuizAttempt(
  userId: string,
  data: {
    quizId?: string;
    quiz_id?: string;
    title?: string;
    subjectId?: string;
    subject_id?: string;
    subjectName?: string;
    subject_name?: string;
    score?: number;
    totalMarks?: number;
    total_marks?: number;
    questionsCount?: number;
    questions_count?: number;
    correctCount?: number;
    correct_count?: number;
    timeSpentSeconds?: number;
    time_spent_seconds?: number;
  }
): Promise<{ success: boolean; attempt: QuizAttemptRecord; summary: StudentProgressRecord }> {
  await ensureProgressDatabaseSchema();

  // Validate bounds server-side
  const score = Math.max(0, Number(data.score !== undefined ? data.score : 0));
  const totalMarks = Math.max(1, Number(data.totalMarks || data.total_marks) || 20);
  const questionsCount = Math.max(1, Number(data.questionsCount || data.questions_count) || 5);
  const correctCount = Math.min(questionsCount, Math.max(0, Number(data.correctCount !== undefined ? data.correctCount : data.correct_count) || 0));
  const boundedScore = Math.min(totalMarks, score);
  const accuracy = Math.round((correctCount / questionsCount) * 100);
  const attemptId = crypto.randomUUID();
  const now = new Date().toISOString();

  const attempt: QuizAttemptRecord = {
    id: attemptId,
    user_id: userId,
    quiz_id: data.quizId || data.quiz_id || 'quiz_standard',
    title: (data.title || 'Practice Quiz').trim().slice(0, 255),
    subject_id: (data.subjectId || data.subject_id || 'cs201').trim().slice(0, 64),
    subject_name: (data.subjectName || data.subject_name || 'Database Management Systems').trim().slice(0, 255),
    score: boundedScore,
    total_marks: totalMarks,
    questions_count: questionsCount,
    correct_count: correctCount,
    accuracy,
    time_spent_seconds: Math.max(0, Number(data.timeSpentSeconds || data.time_spent_seconds) || 0),
    submitted_at: now
  };

  if (!isNeonConfigured()) {
    const attempts = memoryQuizAttempts.get(userId) || [];
    attempts.unshift(attempt);
    memoryQuizAttempts.set(userId, attempts);

    // Activity log
    const activities = memoryActivityLogs.get(userId) || [];
    activities.unshift({
      id: crypto.randomUUID(),
      user_id: userId,
      activity_type: 'quiz_completed',
      subject_id: attempt.subject_id,
      title: `Completed Quiz: ${attempt.title}`,
      description: `Scored ${attempt.score}/${attempt.total_marks} Marks (${attempt.accuracy}% accuracy).`,
      score_percentage: attempt.accuracy,
      created_at: now
    });
    memoryActivityLogs.set(userId, activities);

    // Recalculate summary
    const prev = memoryProgress.get(userId) || {
      user_id: userId,
      overall_progress: 0,
      quizzes_completed: 0,
      questions_answered: 0,
      correct_answers: 0,
      accuracy_percentage: 0,
      evaluations_completed: 0,
      tasks_completed: 0,
      streak_days: 1,
      last_active_at: now,
      created_at: now,
      updated_at: now
    };

    const newQuizzesCompleted = prev.quizzes_completed + 1;
    const newQuestionsAnswered = prev.questions_answered + questionsCount;
    const newCorrectAnswers = prev.correct_answers + correctCount;
    const newAccuracy = newQuestionsAnswered > 0 
      ? Math.round((newCorrectAnswers / newQuestionsAnswered) * 100) 
      : 0;

    const topicsMap = memoryTopicProgress.get(userId) || new Map();
    let completedTopics = 0;
    for (const t of topicsMap.values()) {
      if (t.status === 'completed') completedTopics++;
    }

    const overall = calculateOverallProgress(
      completedTopics,
      newQuizzesCompleted,
      newAccuracy,
      prev.evaluations_completed
    );

    const updatedSummary: StudentProgressRecord = {
      ...prev,
      overall_progress: overall,
      quizzes_completed: newQuizzesCompleted,
      questions_answered: newQuestionsAnswered,
      correct_answers: newCorrectAnswers,
      accuracy_percentage: newAccuracy,
      streak_days: Math.max(1, prev.streak_days),
      last_active_at: now,
      updated_at: now
    };

    memoryProgress.set(userId, updatedSummary);
    return { success: true, attempt, summary: updatedSummary };
  }

  // Neon Transaction / Execution
  await queryNeon(
    `INSERT INTO studypilot_quiz_attempts (
       id, user_id, quiz_id, title, subject_id, subject_name,
       score, total_marks, questions_count, correct_count,
       accuracy, time_spent_seconds, submitted_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);`,
    [
      attempt.id,
      attempt.user_id,
      attempt.quiz_id,
      attempt.title,
      attempt.subject_id,
      attempt.subject_name,
      attempt.score,
      attempt.total_marks,
      attempt.questions_count,
      attempt.correct_count,
      attempt.accuracy,
      attempt.time_spent_seconds,
      attempt.submitted_at
    ]
  );

  await queryNeon(
    `INSERT INTO studypilot_activity_logs (
       id, user_id, activity_type, subject_id, title, description, score_percentage, created_at
     ) VALUES ($1, $2, 'quiz_completed', $3, $4, $5, $6, $7);`,
    [
      crypto.randomUUID(),
      userId,
      attempt.subject_id,
      `Completed Quiz: ${attempt.title}`,
      `Scored ${attempt.score}/${attempt.total_marks} Marks (${attempt.accuracy}% accuracy).`,
      attempt.accuracy,
      now
    ]
  );

  // Fetch current summary
  const currRows = await queryNeon<StudentProgressRecord>(
    'SELECT * FROM studypilot_student_progress WHERE user_id = $1 LIMIT 1;',
    [userId]
  );
  const curr = currRows[0];

  const newQuizzesCompleted = (curr?.quizzes_completed || 0) + 1;
  const newQuestionsAnswered = (curr?.questions_answered || 0) + questionsCount;
  const newCorrectAnswers = (curr?.correct_answers || 0) + correctCount;
  const newAccuracy = newQuestionsAnswered > 0
    ? Math.round((newCorrectAnswers / newQuestionsAnswered) * 100)
    : 0;

  const topicCountRows = await queryNeon<{ count: string }>(
    "SELECT COUNT(*) as count FROM studypilot_topic_progress WHERE user_id = $1 AND status = 'completed';",
    [userId]
  );
  const completedTopics = parseInt(topicCountRows[0]?.count || '0', 10);

  const overall = calculateOverallProgress(
    completedTopics,
    newQuizzesCompleted,
    newAccuracy,
    curr?.evaluations_completed || 0
  );

  const updatedSummaryRows = await queryNeon<StudentProgressRecord>(
    `INSERT INTO studypilot_student_progress (
       user_id, overall_progress, quizzes_completed, questions_answered,
       correct_answers, accuracy_percentage, evaluations_completed,
       tasks_completed, streak_days, last_active_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, $9, $9)
     ON CONFLICT (user_id) DO UPDATE SET
       overall_progress = EXCLUDED.overall_progress,
       quizzes_completed = EXCLUDED.quizzes_completed,
       questions_answered = EXCLUDED.questions_answered,
       correct_answers = EXCLUDED.correct_answers,
       accuracy_percentage = EXCLUDED.accuracy_percentage,
       streak_days = CASE WHEN studypilot_student_progress.streak_days = 0 THEN 1 ELSE studypilot_student_progress.streak_days END,
       last_active_at = EXCLUDED.last_active_at,
       updated_at = EXCLUDED.updated_at
     RETURNING *;`,
    [
      userId,
      overall,
      newQuizzesCompleted,
      newQuestionsAnswered,
      newCorrectAnswers,
      newAccuracy,
      curr?.evaluations_completed || 0,
      curr?.tasks_completed || 0,
      now
    ]
  );

  return { success: true, attempt, summary: updatedSummaryRows[0] };
}

export async function recordAnswerEvaluation(
  userId: string,
  data: {
    question?: string;
    question_text?: string;
    subject?: string;
    subject_name?: string;
    maxMarks?: number;
    max_marks?: number;
    estimatedMarks?: number;
    estimated_marks?: number;
    scorePercentage?: number;
    score_percentage?: number;
    gradeTier?: string;
    grade_tier?: string;
  }
): Promise<{ success: boolean; summary: StudentProgressRecord }> {
  await ensureProgressDatabaseSchema();

  const maxMarks = Math.max(1, Number(data.maxMarks || data.max_marks) || 5);
  const estimatedMarks = Math.min(maxMarks, Math.max(0, Number(data.estimatedMarks !== undefined ? data.estimatedMarks : data.estimated_marks) || 0));
  const scorePercentage = Math.min(100, Math.max(0, Number(data.scorePercentage || data.score_percentage) || Math.round((estimatedMarks / maxMarks) * 100)));
  const now = new Date().toISOString();

  if (!isNeonConfigured()) {
    const activities = memoryActivityLogs.get(userId) || [];
    activities.unshift({
      id: crypto.randomUUID(),
      user_id: userId,
      activity_type: 'answer_evaluated',
      subject_id: 'cs201',
      title: `Answer Evaluated: ${data.subject || 'Academic Subject'}`,
      description: `Awarded ${estimatedMarks}/${maxMarks} marks (${scorePercentage}%, ${data.gradeTier || 'Evaluated'}).`,
      score_percentage: scorePercentage,
      created_at: now
    });
    memoryActivityLogs.set(userId, activities);

    const prev = memoryProgress.get(userId) || {
      user_id: userId,
      overall_progress: 0,
      quizzes_completed: 0,
      questions_answered: 0,
      correct_answers: 0,
      accuracy_percentage: 0,
      evaluations_completed: 0,
      tasks_completed: 0,
      streak_days: 1,
      last_active_at: now,
      created_at: now,
      updated_at: now
    };

    const newEvals = prev.evaluations_completed + 1;
    const newQuestionsAnswered = prev.questions_answered + 1;
    const newCorrect = prev.correct_answers + (scorePercentage >= 50 ? 1 : 0);
    const newAccuracy = Math.round((newCorrect / newQuestionsAnswered) * 100);

    const topicsMap = memoryTopicProgress.get(userId) || new Map();
    let completedTopics = 0;
    for (const t of topicsMap.values()) {
      if (t.status === 'completed') completedTopics++;
    }

    const overall = calculateOverallProgress(
      completedTopics,
      prev.quizzes_completed,
      newAccuracy,
      newEvals
    );

    const updated: StudentProgressRecord = {
      ...prev,
      overall_progress: overall,
      evaluations_completed: newEvals,
      questions_answered: newQuestionsAnswered,
      correct_answers: newCorrect,
      accuracy_percentage: newAccuracy,
      streak_days: Math.max(1, prev.streak_days),
      last_active_at: now,
      updated_at: now
    };

    memoryProgress.set(userId, updated);
    return { success: true, summary: updated };
  }

  await queryNeon(
    `INSERT INTO studypilot_activity_logs (
       id, user_id, activity_type, subject_id, title, description, score_percentage, created_at
     ) VALUES ($1, $2, 'answer_evaluated', 'cs201', $3, $4, $5, $6);`,
    [
      crypto.randomUUID(),
      userId,
      `Answer Evaluated: ${data.subject || 'Academic Subject'}`,
      `Awarded ${estimatedMarks}/${maxMarks} marks (${scorePercentage}%, ${data.gradeTier || 'Evaluated'}).`,
      scorePercentage,
      now
    ]
  );

  const currRows = await queryNeon<StudentProgressRecord>(
    'SELECT * FROM studypilot_student_progress WHERE user_id = $1 LIMIT 1;',
    [userId]
  );
  const curr = currRows[0];

  const newEvals = (curr?.evaluations_completed || 0) + 1;
  const newQuestionsAnswered = (curr?.questions_answered || 0) + 1;
  const newCorrect = (curr?.correct_answers || 0) + (scorePercentage >= 50 ? 1 : 0);
  const newAccuracy = Math.round((newCorrect / newQuestionsAnswered) * 100);

  const topicCountRows = await queryNeon<{ count: string }>(
    "SELECT COUNT(*) as count FROM studypilot_topic_progress WHERE user_id = $1 AND status = 'completed';",
    [userId]
  );
  const completedTopics = parseInt(topicCountRows[0]?.count || '0', 10);

  const overall = calculateOverallProgress(
    completedTopics,
    curr?.quizzes_completed || 0,
    newAccuracy,
    newEvals
  );

  const updatedSummaryRows = await queryNeon<StudentProgressRecord>(
    `INSERT INTO studypilot_student_progress (
       user_id, overall_progress, quizzes_completed, questions_answered,
       correct_answers, accuracy_percentage, evaluations_completed,
       tasks_completed, streak_days, last_active_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, $9, $9)
     ON CONFLICT (user_id) DO UPDATE SET
       overall_progress = EXCLUDED.overall_progress,
       evaluations_completed = EXCLUDED.evaluations_completed,
       questions_answered = EXCLUDED.questions_answered,
       correct_answers = EXCLUDED.correct_answers,
       accuracy_percentage = EXCLUDED.accuracy_percentage,
       streak_days = CASE WHEN studypilot_student_progress.streak_days = 0 THEN 1 ELSE studypilot_student_progress.streak_days END,
       last_active_at = EXCLUDED.last_active_at,
       updated_at = EXCLUDED.updated_at
     RETURNING *;`,
    [
      userId,
      overall,
      curr?.quizzes_completed || 0,
      newQuestionsAnswered,
      newCorrect,
      newAccuracy,
      newEvals,
      curr?.tasks_completed || 0,
      now
    ]
  );

  return { success: true, summary: updatedSummaryRows[0] };
}

export async function updateStudentTopicStatus(
  userId: string,
  data: {
    subjectId?: string;
    subject_id?: string;
    unitId?: string;
    unit_id?: string;
    topicId?: string;
    topic_id?: string;
    status: 'not-started' | 'in-progress' | 'completed';
  }
): Promise<{ success: boolean; summary: StudentProgressRecord; subjectProgress: { [subId: string]: number } }> {
  await ensureProgressDatabaseSchema();

  const subjectId = (data.subjectId || data.subject_id || 'cs201').trim();
  const unitId = (data.unitId || data.unit_id || '').trim();
  const topicId = (data.topicId || data.topic_id || '').trim();
  const recordId = `${userId}_${topicId}`;
  const status = (['not-started', 'in-progress', 'completed'].includes(data.status)) ? data.status : 'not-started';
  const now = new Date().toISOString();

  if (!isNeonConfigured()) {
    let userTopics = memoryTopicProgress.get(userId);
    if (!userTopics) {
      userTopics = new Map();
      memoryTopicProgress.set(userId, userTopics);
    }
    userTopics.set(topicId, {
      id: recordId,
      user_id: userId,
      subject_id: subjectId,
      unit_id: unitId,
      topic_id: topicId,
      status,
      updated_at: now
    });

    // Recalculate
    let completedTopics = 0;
    const subjectCompletedCount: { [subId: string]: number } = {};
    for (const t of userTopics.values()) {
      if (t.status === 'completed') {
        completedTopics++;
        subjectCompletedCount[t.subject_id] = (subjectCompletedCount[t.subject_id] || 0) + 1;
      }
    }

    const prev = memoryProgress.get(userId) || {
      user_id: userId,
      overall_progress: 0,
      quizzes_completed: 0,
      questions_answered: 0,
      correct_answers: 0,
      accuracy_percentage: 0,
      evaluations_completed: 0,
      tasks_completed: 0,
      streak_days: 1,
      last_active_at: now,
      created_at: now,
      updated_at: now
    };

    const overall = calculateOverallProgress(
      completedTopics,
      prev.quizzes_completed,
      prev.accuracy_percentage,
      prev.evaluations_completed
    );

    const updatedSummary: StudentProgressRecord = {
      ...prev,
      overall_progress: overall,
      streak_days: Math.max(1, prev.streak_days),
      last_active_at: now,
      updated_at: now
    };
    memoryProgress.set(userId, updatedSummary);

    const subjectProgressObj: { [subjectId: string]: number } = {
      cs201: calculateSubjectProgress(subjectCompletedCount['cs201'] || 0, 18),
      ai202: calculateSubjectProgress(subjectCompletedCount['ai202'] || 0, 18),
      cs203: calculateSubjectProgress(subjectCompletedCount['cs203'] || 0, 18),
      ma204: calculateSubjectProgress(subjectCompletedCount['ma204'] || 0, 18),
      cs205: calculateSubjectProgress(subjectCompletedCount['cs205'] || 0, 18)
    };

    return { success: true, summary: updatedSummary, subjectProgress: subjectProgressObj };
  }

  await queryNeon(
    `INSERT INTO studypilot_topic_progress (
       id, user_id, subject_id, unit_id, topic_id, status, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET
       status = EXCLUDED.status,
       updated_at = EXCLUDED.updated_at;`,
    [recordId, userId, subjectId, unitId, topicId, status, now]
  );

  const topicCountRows = await queryNeon<{ count: string }>(
    "SELECT COUNT(*) as count FROM studypilot_topic_progress WHERE user_id = $1 AND status = 'completed';",
    [userId]
  );
  const completedTopics = parseInt(topicCountRows[0]?.count || '0', 10);

  const currRows = await queryNeon<StudentProgressRecord>(
    'SELECT * FROM studypilot_student_progress WHERE user_id = $1 LIMIT 1;',
    [userId]
  );
  const curr = currRows[0];

  const overall = calculateOverallProgress(
    completedTopics,
    curr?.quizzes_completed || 0,
    curr?.accuracy_percentage || 0,
    curr?.evaluations_completed || 0
  );

  const updatedSummaryRows = await queryNeon<StudentProgressRecord>(
    `INSERT INTO studypilot_student_progress (
       user_id, overall_progress, quizzes_completed, questions_answered,
       correct_answers, accuracy_percentage, evaluations_completed,
       tasks_completed, streak_days, last_active_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, $9, $9)
     ON CONFLICT (user_id) DO UPDATE SET
       overall_progress = EXCLUDED.overall_progress,
       streak_days = CASE WHEN studypilot_student_progress.streak_days = 0 THEN 1 ELSE studypilot_student_progress.streak_days END,
       last_active_at = EXCLUDED.last_active_at,
       updated_at = EXCLUDED.updated_at
     RETURNING *;`,
    [
      userId,
      overall,
      curr?.quizzes_completed || 0,
      curr?.questions_answered || 0,
      curr?.correct_answers || 0,
      curr?.accuracy_percentage || 0,
      curr?.evaluations_completed || 0,
      curr?.tasks_completed || 0,
      now
    ]
  );

  const allTopicsForUser = await queryNeon<TopicProgressRecord>(
    'SELECT subject_id, status FROM studypilot_topic_progress WHERE user_id = $1;',
    [userId]
  );

  const subjectCompletedCount: { [subId: string]: number } = {};
  for (const t of allTopicsForUser) {
    if (t.status === 'completed') {
      subjectCompletedCount[t.subject_id] = (subjectCompletedCount[t.subject_id] || 0) + 1;
    }
  }

  const subjectProgressObj: { [subjectId: string]: number } = {
    cs201: calculateSubjectProgress(subjectCompletedCount['cs201'] || 0, 18),
    ai202: calculateSubjectProgress(subjectCompletedCount['ai202'] || 0, 18),
    cs203: calculateSubjectProgress(subjectCompletedCount['cs203'] || 0, 18),
    ma204: calculateSubjectProgress(subjectCompletedCount['ma204'] || 0, 18),
    cs205: calculateSubjectProgress(subjectCompletedCount['cs205'] || 0, 18)
  };

  return { success: true, summary: updatedSummaryRows[0], subjectProgress: subjectProgressObj };
}

/* ==========================================================================
   7. VERCEL SERVERLESS HANDLER
   ========================================================================== */

export default async function progressHandler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', req.headers?.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({
        error: {
          message: 'Authentication required. Active session was not found.',
          code: 'UNAUTHENTICATED'
        }
      });
    }

    const url = req.url || '';
    let action = (req.query?.action || '').toLowerCase();
    if (!action && url.includes('?')) {
      try {
        const parsedUrl = new URL(url, 'http://localhost');
        action = (parsedUrl.searchParams.get('action') || '').toLowerCase();
      } catch {}
    }
    if (!action) {
      if (url.includes('/quiz') || url.includes('action=quiz')) action = 'quiz';
      else if (url.includes('/evaluate') || url.includes('action=evaluate')) action = 'evaluate';
      else if (url.includes('/topic') || url.includes('action=topic')) action = 'topic';
    }

    // 1. GET Current User Progress
    if (req.method === 'GET') {
      const data = await getStudentProgress(user.id);
      return res.status(200).json({
        success: true,
        user: { id: user.id, email: user.email, name: user.name },
        progress: data.summary,
        subjectProgress: data.subjectProgress,
        topicProgress: data.topicProgress,
        quizAttempts: data.quizAttempts,
        recentActivity: data.recentActivity,
        userTasks: data.userTasks,
        completedModules: Math.round((data.summary.overall_progress / 100) * TOTAL_CURRICULUM_MODULES),
        remainingModules: Math.max(0, TOTAL_CURRICULUM_MODULES - Math.round((data.summary.overall_progress / 100) * TOTAL_CURRICULUM_MODULES))
      });
    }

    // 2. POST actions
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string' && body.trim()) {
        try { body = JSON.parse(body); } catch {}
      }

      if (action === 'quiz') {
        const result = await recordQuizAttempt(user.id, body || {});
        return res.status(200).json(result);
      }

      if (action === 'evaluate') {
        const result = await recordAnswerEvaluation(user.id, body || {});
        return res.status(200).json(result);
      }

      if (action === 'topic') {
        const result = await updateStudentTopicStatus(user.id, body || {});
        return res.status(200).json(result);
      }

      return res.status(400).json({
        error: {
          message: 'Invalid progress action. Supported actions: quiz, evaluate, topic',
          code: 'INVALID_ACTION'
        }
      });
    }

    return res.status(405).json({
      error: { message: 'Method Not Allowed', code: 'METHOD_NOT_ALLOWED' }
    });
  } catch (err: any) {
    if (err instanceof DatabaseConfigurationError) {
      return res.status(503).json({
        error: {
          message: 'Database service is currently unavailable.',
          code: 'DATABASE_UNAVAILABLE'
        }
      });
    }
    return res.status(500).json({
      error: {
        message: err?.message ? `Progress service error: ${err.message}` : 'Internal server error.',
        code: 'INTERNAL_ERROR'
      }
    });
  }
}
