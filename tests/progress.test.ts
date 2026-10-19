import assert from 'node:assert';
import {
  calculateSubjectProgress,
  calculateOverallProgress,
  getStudentProgress,
  recordQuizAttempt,
  recordAnswerEvaluation,
  updateStudentTopicStatus,
  _resetMemoryProgressDb,
  _setMockAuthResolver,
  default as progressHandler
} from '../api/progress.ts';
import {
  _resetMemoryDb,
  insertUser,
  hashPassword,
  generateSessionToken,
  hashSessionToken,
  createSessionCookie,
  findUserBySessionToken,
  insertSession
} from '../api/auth.ts';

console.log('\n======================================================');
console.log('STUDYPILOT AI - PER-USER PROGRESS & SCORE TRACKING TEST SUITE');
console.log('======================================================\n');

let totalAssertions = 0;
function check(description: string, condition: boolean) {
  totalAssertions++;
  assert.ok(condition, description);
  console.log(`  ✓ ${description}`);
}

async function runTests() {
  _resetMemoryDb();
  _resetMemoryProgressDb();

  _setMockAuthResolver(async (token: string) => {
    const u = await findUserBySessionToken(token);
    return u ? { id: u.id, email: u.email, name: u.name } : null;
  });

  // Create two distinct mock users
  const userAId = 'usr_student_alpha_001';
  const userBId = 'usr_student_beta_002';
  const now = new Date().toISOString();

  await insertUser({
    id: userAId,
    email: 'student.alpha@sgu.ac.in',
    passwordHash: await hashPassword('StudentA@Pass123'),
    name: 'Student Alpha',
    university: 'Sanjay Ghodawat University',
    course: 'B.Tech',
    branch: 'Artificial Intelligence',
    year: 'Year 2',
    semester: 'Semester III',
    preferredLanguage: 'en',
    createdAt: now,
    updatedAt: now
  });

  await insertUser({
    id: userBId,
    email: 'student.beta@sgu.ac.in',
    passwordHash: await hashPassword('StudentB@Pass123'),
    name: 'Student Beta',
    university: 'Sanjay Ghodawat University',
    course: 'B.Tech',
    branch: 'Artificial Intelligence',
    year: 'Year 2',
    semester: 'Semester III',
    preferredLanguage: 'en',
    createdAt: now,
    updatedAt: now
  });

  // 1. New User Safe Zero Initialization
  console.log('1. Testing New User Safe Zero Initialization:');
  const initialA = await getStudentProgress(userAId);
  const initialB = await getStudentProgress(userBId);

  check('User A starts at overall_progress = 0%', initialA.summary.overall_progress === 0);
  check('User A starts with quizzes_completed = 0', initialA.summary.quizzes_completed === 0);
  check('User A starts with questions_answered = 0', initialA.summary.questions_answered === 0);
  check('User A starts with correct_answers = 0', initialA.summary.correct_answers === 0);
  check('User A starts with accuracy_percentage = 0%', initialA.summary.accuracy_percentage === 0);
  check('User A starts with evaluations_completed = 0', initialA.summary.evaluations_completed === 0);
  check('User A starts with empty quizAttempts list', initialA.quizAttempts.length === 0);
  check('User A starts with empty recentActivity list', initialA.recentActivity.length === 0);
  check('User A subject progress is 0% for CS201', initialA.subjectProgress['cs201'] === 0);
  check('User A subject progress is 0% for AI202', initialA.subjectProgress['ai202'] === 0);
  check('User A subject progress is 0% for CS203', initialA.subjectProgress['cs203'] === 0);

  check('User B starts at overall_progress = 0%', initialB.summary.overall_progress === 0);
  check('User B starts with 0 quizzes completed', initialB.summary.quizzes_completed === 0);
  check('User B starts with empty activity log', initialB.recentActivity.length === 0);

  // 2. Mathematical Progress Formula Verification
  console.log('\n2. Testing Mathematical Progress Calculation Formula:');
  // Formula:
  // syllabusScore (50%): (completedTopics / 90) * 50
  // quizScore (30%): min(20, (quizzes / 5) * 20) + (accuracy / 100) * 10
  // evalScore (20%): min(20, (evals / 4) * 20)
  const calc1 = calculateOverallProgress(0, 0, 0, 0);
  check('0 topics, 0 quizzes, 0 evals yields 0%', calc1 === 0);

  // 9 topics = (9/90)*50 = 5%
  const calc2 = calculateOverallProgress(9, 0, 0, 0);
  check('9 completed topics yields 5% progress', calc2 === 5);

  // 1 quiz with 100% accuracy = (1/5)*20 + 10 = 14%
  const calc3 = calculateOverallProgress(0, 1, 100, 0);
  check('1 quiz with 100% accuracy yields 14% progress', calc3 === 14);

  // 2 evaluations = (2/4)*20 = 10%
  const calc4 = calculateOverallProgress(0, 0, 0, 2);
  check('2 evaluations yield 10% progress', calc4 === 10);

  // Combined score capped at 100
  const calc5 = calculateOverallProgress(90, 10, 100, 10);
  check('Max activities capped at exactly 100%', calc5 === 100);

  // 3. Record Quiz Attempt for User A
  console.log('\n3. Testing Quiz Attempt Recording & Metrics for User A:');
  const quizRes = await recordQuizAttempt(userAId, {
    quizId: 'quiz_standard',
    title: 'SGU DBMS Normalization Mock Quiz',
    subjectId: 'cs201',
    subjectName: 'Database Management Systems',
    score: 16,
    totalMarks: 20,
    questionsCount: 5,
    correctCount: 4,
    timeSpentSeconds: 360
  });

  check('Quiz attempt succeeds', quizRes.success === true);
  check('Attempt recorded with accuracy = 80%', quizRes.attempt.accuracy === 80);
  check('User A quizzes_completed increments to 1', quizRes.summary.quizzes_completed === 1);
  check('User A questions_answered increments to 5', quizRes.summary.questions_answered === 5);
  check('User A correct_answers increments to 4', quizRes.summary.correct_answers === 4);
  check('User A overall accuracy is 80%', quizRes.summary.accuracy_percentage === 80);
  check('User A overall progress increased above 0%', quizRes.summary.overall_progress > 0);

  // 4. Strict Isolation: Verify User B Remained at 0
  console.log('\n4. Testing Strict Cross-Student Data Isolation:');
  const afterAProgressB = await getStudentProgress(userBId);
  check('User B overall_progress is still 0%', afterAProgressB.summary.overall_progress === 0);
  check('User B quizzes_completed is still 0', afterAProgressB.summary.quizzes_completed === 0);
  check('User B questions_answered is still 0', afterAProgressB.summary.questions_answered === 0);
  check('User B quizAttempts list is still empty', afterAProgressB.quizAttempts.length === 0);
  check('User B recentActivity list is still empty', afterAProgressB.recentActivity.length === 0);

  // 5. Record Answer Evaluation for User A
  console.log('\n5. Testing AI Answer Evaluation Recording for User A:');
  const evalRes = await recordAnswerEvaluation(userAId, {
    question: 'Explain 3NF Normalization and Dependency Preservation',
    subject: 'Database Management Systems',
    maxMarks: 5,
    estimatedMarks: 4,
    scorePercentage: 80,
    gradeTier: 'Good'
  });

  check('Evaluation recording succeeds', evalRes.success === true);
  check('User A evaluations_completed increments to 1', evalRes.summary.evaluations_completed === 1);
  check('User A questions_answered increments to 6', evalRes.summary.questions_answered === 6);
  check('User A correct_answers increments to 5', evalRes.summary.correct_answers === 5);

  const updatedA = await getStudentProgress(userAId);
  check('User A has 2 activity log entries', updatedA.recentActivity.length === 2);
  check('User A first activity is answer_evaluated', updatedA.recentActivity[0].activity_type === 'answer_evaluated');
  check('User A second activity is quiz_completed', updatedA.recentActivity[1].activity_type === 'quiz_completed');

  // Verify User B is STILL isolated
  const checkB2 = await getStudentProgress(userBId);
  check('User B has 0 activity logs after User A evaluation', checkB2.recentActivity.length === 0);
  check('User B evaluations_completed is still 0', checkB2.summary.evaluations_completed === 0);

  // 6. Syllabus Topic Completion & Subject-Wise Progress
  console.log('\n6. Testing Syllabus Topic Completion & Subject-Wise Progress:');
  const topicRes = await updateStudentTopicStatus(userAId, {
    subjectId: 'cs201',
    unitId: 'cs201_u1',
    topicId: 'cs201_u1_t1',
    status: 'completed'
  });

  check('Topic update succeeds', topicRes.success === true);
  check('CS201 subject progress for User A is > 0%', topicRes.subjectProgress['cs201'] > 0);
  check('AI202 subject progress for User A is still 0%', topicRes.subjectProgress['ai202'] === 0);

  const topicCheckB = await getStudentProgress(userBId);
  check('CS201 subject progress for User B is still 0%', topicCheckB.subjectProgress['cs201'] === 0);
  check('Topic progress for User B has 0 completed topics', Object.keys(topicCheckB.topicProgress).length === 0);

  // 7. Robust Bounds Validation
  console.log('\n7. Testing Bounds Validation & Data Integrity:');
  const boundedQuiz = await recordQuizAttempt(userAId, {
    quizId: 'quiz_bounds',
    title: 'Extreme Bounds Quiz',
    subjectId: 'cs201',
    subjectName: 'DBMS',
    score: 9999, // exceeds total marks
    totalMarks: 20,
    questionsCount: 5,
    correctCount: 999, // exceeds question count
    timeSpentSeconds: -50
  });

  check('Score bounded to total_marks (<= 20)', boundedQuiz.attempt.score <= 20);
  check('Correct count bounded to questions_count (<= 5)', boundedQuiz.attempt.correct_count <= 5);
  check('Accuracy bounded to 100%', boundedQuiz.attempt.accuracy <= 100);
  check('Time spent bounded to >= 0 seconds', boundedQuiz.attempt.time_spent_seconds >= 0);

  // 8. Serverless Endpoint Security & Authorization Checks
  console.log('\n8. Testing Serverless Handler Security & Session Enforcement:');
  
  // Unauthenticated GET /api/progress
  let unauthStatusCode = 0;
  let unauthBody: any = null;
  const mockUnauthReq = {
    method: 'GET',
    url: '/api/progress',
    headers: {}
  };
  const mockUnauthRes = {
    setHeader: () => {},
    status: (code: number) => {
      unauthStatusCode = code;
      return {
        json: (data: any) => { unauthBody = data; },
        end: () => {}
      };
    }
  };
  await progressHandler(mockUnauthReq, mockUnauthRes);
  check('Rejects unauthenticated GET request with HTTP 401', unauthStatusCode === 401);
  check('Returns UNAUTHENTICATED error code', unauthBody?.error?.code === 'UNAUTHENTICATED');

  // Authenticated GET /api/progress using valid session cookie for User B
  const rawTokenB = generateSessionToken();
  const tokenHashB = hashSessionToken(rawTokenB);
  // Store session for User B
  const { insertSession } = await import('../api/auth.ts');
  const sessionExpiresAt = new Date(Date.now() + 86400000).toISOString();
  await insertSession({
    id: 'sess_test_b',
    user_id: userBId,
    token_hash: tokenHashB,
    expires_at: sessionExpiresAt
  });

  let authBStatusCode = 0;
  let authBBody: any = null;
  const mockAuthReqB = {
    method: 'GET',
    url: '/api/progress',
    headers: {
      cookie: `studypilot_session=${rawTokenB}`
    }
  };
  const mockAuthResB = {
    setHeader: () => {},
    status: (code: number) => {
      authBStatusCode = code;
      return {
        json: (data: any) => { authBBody = data; },
        end: () => {}
      };
    }
  };
  await progressHandler(mockAuthReqB, mockAuthResB);
  check('Authenticates User B via session cookie with HTTP 200', authBStatusCode === 200);
  check('Returns User B profile info', authBBody?.user?.id === userBId);
  check('User B returned progress is strictly 0%', authBBody?.progress?.overall_progress === 0);
  check('User B returned quiz attempts count is 0', authBBody?.quizAttempts?.length === 0);
  check('User B returned recent activity count is 0', authBBody?.recentActivity?.length === 0);

  // 9. Client Cannot Impersonate Another User via Request Body
  console.log('\n9. Testing Server-Side User Derivation (Anti-Spoofing):');
  // User B sends a POST attempting to modify User A by putting user_id: userAId in body
  let spoofStatusCode = 0;
  let spoofBody: any = null;
  const mockSpoofReq = {
    method: 'POST',
    url: '/api/progress?action=quiz',
    headers: {
      cookie: `studypilot_session=${rawTokenB}`
    },
    body: {
      user_id: userAId, // malicious client trying to alter User A
      userId: userAId,
      score: 20,
      totalMarks: 20,
      questionsCount: 5,
      correctCount: 5
    }
  };
  const mockSpoofRes = {
    setHeader: () => {},
    status: (code: number) => {
      spoofStatusCode = code;
      return {
        json: (data: any) => { spoofBody = data; },
        end: () => {}
      };
    }
  };
  await progressHandler(mockSpoofReq, mockSpoofRes);
  check('Handler completes for authenticated session with HTTP 200', spoofStatusCode === 200);
  check('Attempt is credited to User B (session owner), NOT User A', spoofBody?.attempt?.user_id === userBId);

  // Verify User A was not modified by User B's request
  const recheckA = await getStudentProgress(userAId);
  check('User A quiz attempts count remains unchanged at 2', recheckA.quizAttempts.length === 2);

  console.log(`\nAll ${totalAssertions} assertions passed successfully!`);
}

runTests().catch(err => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
