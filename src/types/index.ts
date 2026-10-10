export type Language = 'en' | 'hi' | 'te';

export type DifficultyLevel = 'simple' | 'standard' | 'detailed';

export type TopicStatus = 'not-started' | 'in-progress' | 'completed';

export type QuestionMarks = 2 | 3 | 4 | 5 | 7 | 10;

export interface StudentProfile {
  name: string;
  university: string;
  course: string;
  branch: string;
  year: string;
  semester: string;
  preferredLanguage: Language;
  learningPreferences: {
    simpleExplanations: boolean;
    stepByStep: boolean;
    examplesBased: boolean;
    voiceExplanations: boolean;
  };
  onboardingCompleted: boolean;
  geminiApiKey?: string;
  aiModel?: string;
}

export interface TeamMember {
  name: string;
  role: string;
  avatar: string;
  focus: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  documentName: string;
  chunkIndex: number;
  content: string;
  pageOrSection?: string;
}

export interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  type: 'pdf' | 'docx' | 'txt' | 'md' | 'other';
  uploadedAt: string;
  text: string;
  wordCount: number;
  chunks: DocumentChunk[];
  status: 'ready' | 'processing' | 'error';
  subjectId?: string;
}

export interface Topic {
  id: string;
  unitId: string;
  title: string;
  description: string;
  learningObjectives: string[];
  importantConcepts: string[];
  status: TopicStatus;
  weightageMarks: number;
  relatedQuestionIds?: string[];
  notes?: string;
}

export interface Unit {
  id: string;
  unitNumber: number;
  title: string;
  description: string;
  weightage: string;
  topics: Topic[];
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  semester: string;
  color: string;
  iconName: string;
  units: Unit[];
  recentlyStudiedTopic?: string;
  lastStudiedDate?: string;
  totalQuestionsCount: number;
}

export interface QuestionItem {
  id: string;
  subjectId: string;
  subjectCode: string;
  unitNumber: number;
  topic: string;
  text: string;
  marks: QuestionMarks;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  type: 'Theory' | 'Numerical' | 'Query' | 'Design';
  isBookmarked: boolean;
  markingCriteria: string[];
  modelAnswer: string;
  keyPoints: string[];
  commonMistakes: string[];
}

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'short';
  question: string;
  marks: number;
  topic: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  userAnswer?: string | number;
  isMarkedForReview?: boolean;
}

export interface QuizSession {
  id: string;
  title: string;
  subject: string;
  durationMinutes: number;
  totalMarks: number;
  questions: QuizQuestion[];
  completed?: boolean;
  score?: number;
  submittedAt?: string;
}

export interface EvaluationResult {
  question: string;
  subject: string;
  maxMarks: QuestionMarks;
  estimatedMarks: number;
  scorePercentage: number;
  gradeTier: 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement';
  correctConcepts: string[];
  missingPoints: string[];
  conceptualErrors: string[];
  structureClarityFeedback: string;
  actionableImprovements: string[];
  improvedSampleAnswer: string;
  evaluatedAt: string;
  isDemoEstimate: boolean;
}

export interface RevisionTask {
  id: string;
  title: string;
  subject: string;
  topicId?: string;
  priority: 'high' | 'medium' | 'low';
  reason: 'Quiz Miss' | 'Evaluator Weakness' | 'Scheduled Spaced Repetition' | 'User Pinned';
  dueDate: string;
  timeEstimateMinutes: number;
  completed: boolean;
  dateCompleted?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  content: string;
  language: Language;
  topic?: string;
  subject?: string;
  difficulty?: DifficultyLevel;
  followUpSuggestions?: string[];
  quizPrompt?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  audioAvailable?: boolean;
  documentCitations?: string[];
}
