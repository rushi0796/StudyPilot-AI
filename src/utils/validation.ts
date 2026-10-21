/**
 * StudyPilot AI - Centralized Validation & Character Limits Specification
 * 
 * Enforced consistently across:
 * 1. Frontend UI inputs (immediate user feedback & counters)
 * 2. Backend Serverless API endpoints (untrusted payload validation)
 * 3. Neon PostgreSQL database column types & constraints
 */

export const VALIDATION_LIMITS = {
  // Identity & Auth
  NAME_MIN: 2,
  NAME_MAX: 70,
  EMAIL_MIN: 5,
  EMAIL_MAX: 254,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 100,

  // Academic Profile Fields
  UNIVERSITY_MIN: 2,
  UNIVERSITY_MAX: 100,
  COURSE_MIN: 2,
  COURSE_MAX: 80,
  BRANCH_MIN: 2,
  BRANCH_MAX: 80,
  YEAR_MIN: 2,
  YEAR_MAX: 30,
  SEMESTER_MIN: 2,
  SEMESTER_MAX: 30,
  PREFERRED_LANGUAGE_MAX: 10,

  // Learning Tasks & Revision Planner
  TASK_TITLE_MIN: 2,
  TASK_TITLE_MAX: 120,
  TASK_SUBJECT_MIN: 2,
  TASK_SUBJECT_MAX: 80,
  TASK_REASON_MAX: 120,
  TASK_DUE_DATE_MAX: 50,
  TASK_TIME_MIN: 1,
  TASK_TIME_MAX: 1440, // 24 hours in minutes

  // AI Chat & Doubt Solving
  CHAT_QUERY_MIN: 1,
  CHAT_QUERY_MAX: 2000,

  // Answer Evaluator
  STUDENT_ANSWER_MIN: 1,
  STUDENT_ANSWER_MAX: 5000,
  EVALUATION_QUESTION_MAX: 500,

  // File Uploads
  FILE_NAME_MAX: 150,
  FILE_SIZE_MAX_BYTES: 20 * 1024 * 1024, // 20 MB

  // Notifications
  NOTIFICATION_TITLE_MIN: 1,
  NOTIFICATION_TITLE_MAX: 80,
  NOTIFICATION_MESSAGE_MIN: 1,
  NOTIFICATION_MESSAGE_MAX: 300,

  // Quiz & Exam Attempt
  QUIZ_TITLE_MAX: 120,
  SUBJECT_NAME_MAX: 80
} as const;

/**
 * Normalizes input string by trimming leading/trailing whitespace
 */
export function cleanString(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val.trim();
}

/**
 * Returns accurate character count considering multi-byte Unicode and emojis
 */
export function getGraphemeCount(val: unknown): number {
  if (typeof val !== 'string') return 0;
  if (!val) return 0;
  
  if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
    try {
      const segmenter = new (Intl as any).Segmenter('en', { granularity: 'grapheme' });
      return [...segmenter.segment(val)].length;
    } catch {
      return [...val].length;
    }
  }
  return [...val].length;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  count: number;
  max: number;
}

/**
 * Validates a text field against min and max bounds
 */
export function validateTextField(
  val: unknown,
  fieldName: string,
  min: number,
  max: number,
  required = true
): ValidationResult {
  const clean = cleanString(val);
  const count = getGraphemeCount(clean);

  if (!clean) {
    if (required) {
      return {
        valid: false,
        error: `${fieldName} is required.`,
        count: 0,
        max
      };
    }
    return { valid: true, count: 0, max };
  }

  if (count < min) {
    return {
      valid: false,
      error: `${fieldName} must be at least ${min} characters long.`,
      count,
      max
    };
  }

  if (count > max) {
    return {
      valid: false,
      error: `${fieldName} cannot exceed ${max} characters (currently ${count}).`,
      count,
      max
    };
  }

  return { valid: true, count, max };
}

/**
 * Validates an email address according to standard regex and length limits
 */
export function validateEmailField(email: unknown): ValidationResult {
  const clean = cleanString(email).toLowerCase();
  const count = getGraphemeCount(clean);

  if (!clean) {
    return { valid: false, error: 'Email address is required.', count: 0, max: VALIDATION_LIMITS.EMAIL_MAX };
  }

  if (count > VALIDATION_LIMITS.EMAIL_MAX) {
    return {
      valid: false,
      error: `Email address cannot exceed ${VALIDATION_LIMITS.EMAIL_MAX} characters.`,
      count,
      max: VALIDATION_LIMITS.EMAIL_MAX
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clean)) {
    return {
      valid: false,
      error: 'Please enter a valid email address (e.g. student@sgu.ac.in).',
      count,
      max: VALIDATION_LIMITS.EMAIL_MAX
    };
  }

  return { valid: true, count, max: VALIDATION_LIMITS.EMAIL_MAX };
}

/**
 * Validates password length and strength
 */
export function validatePasswordField(password: unknown): ValidationResult {
  if (typeof password !== 'string' || !password) {
    return { valid: false, error: 'Password is required.', count: 0, max: VALIDATION_LIMITS.PASSWORD_MAX };
  }

  const count = password.length;
  if (count < VALIDATION_LIMITS.PASSWORD_MIN) {
    return {
      valid: false,
      error: `Password must be at least ${VALIDATION_LIMITS.PASSWORD_MIN} characters long.`,
      count,
      max: VALIDATION_LIMITS.PASSWORD_MAX
    };
  }

  if (count > VALIDATION_LIMITS.PASSWORD_MAX) {
    return {
      valid: false,
      error: `Password cannot exceed ${VALIDATION_LIMITS.PASSWORD_MAX} characters.`,
      count,
      max: VALIDATION_LIMITS.PASSWORD_MAX
    };
  }

  return { valid: true, count, max: VALIDATION_LIMITS.PASSWORD_MAX };
}
