import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  StudentProfile, 
  Subject, 
  QuestionItem, 
  RevisionTask, 
  Language, 
  TopicStatus,
  QuestionMarks,
  UploadedDocument,
  StudentProgress,
  ActivityLog,
  SubjectProgressMap
} from '../types';
import { 
  INITIAL_STUDENT_PROFILE, 
  DEFAULT_NEW_STUDENT_PROFILE,
  SUBJECTS_DATA, 
  QUESTION_BANK_DATA, 
  INITIAL_REVISION_TASKS 
} from '../data/mockData';

export const DEFAULT_ZERO_PROGRESS: StudentProgress = {
  overall_progress: 0,
  quizzes_completed: 0,
  questions_answered: 0,
  correct_answers: 0,
  accuracy_percentage: 0,
  evaluations_completed: 0,
  tasks_completed: 0,
  streak_days: 0,
  last_active_at: new Date().toISOString()
};

export const DEFAULT_SUBJECT_PROGRESS: SubjectProgressMap = {
  cs201: 0,
  ai202: 0,
  cs203: 0,
  ma204: 0,
  cs205: 0
};
import { isProfileValid } from '../utils/profileUtils';
import { INITIAL_PRELOADED_DOCUMENTS } from '../services/documentParser';
import { 
  loadPersistentDocuments, 
  savePersistentDocument, 
  deletePersistentDocument 
} from '../services/storageService';
import { speechService } from '../services/speechService';
import { useAuth } from './AuthContext';

export type ActiveView = 
  | 'dashboard' 
  | 'assistant' 
  | 'files'
  | 'subjects' 
  | 'syllabus' 
  | 'questions' 
  | 'practice' 
  | 'evaluator' 
  | 'planner' 
  | 'progress' 
  | 'settings';

interface AppContextType {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  studentProfile: StudentProfile;
  updateStudentProfile: (updates: Partial<StudentProfile>) => void;
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  activeSubject: Subject;
  setActiveSubjectId: (id: string) => void;
  updateTopicStatus: (subjectId: string, unitId: string, topicId: string, status: TopicStatus) => void;
  questionBank: QuestionItem[];
  setQuestionBank: React.Dispatch<React.SetStateAction<QuestionItem[]>>;
  toggleBookmarkQuestion: (questionId: string) => void;
  revisionTasks: RevisionTask[];
  toggleRevisionTask: (taskId: string) => void;
  addRevisionTask: (task: Omit<RevisionTask, 'id' | 'completed'>) => void;
  deleteRevisionTask: (taskId: string) => void;
  selectedQuestionForEvaluation?: QuestionItem;
  setSelectedQuestionForEvaluation: (q?: QuestionItem) => void;

  // Student Progress & Persistence
  studentProgress: StudentProgress;
  subjectProgress: SubjectProgressMap;
  recentActivity: ActivityLog[];
  isProgressLoading: boolean;
  refreshProgress: () => Promise<void>;
  recordQuizAttempt: (data: any) => Promise<any>;
  recordAnswerEvaluation: (data: any) => Promise<any>;
  
  // Document Uploads & RAG Grounding
  uploadedDocuments: UploadedDocument[];
  addUploadedDocument: (doc: UploadedDocument) => void;
  deleteUploadedDocument: (id: string) => void;
  activeDocumentId?: string;
  setActiveDocumentId: (id?: string) => void;

  // Gemini AI Settings
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  aiModel: string;
  setAiModel: (model: string) => void;

  // Modals
  globalSearchOpen: boolean;
  setGlobalSearchOpen: (open: boolean) => void;
  teamModalOpen: boolean;
  setTeamModalOpen: (open: boolean) => void;
  onboardingOpen: boolean;
  setOnboardingOpen: (open: boolean) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  unreadNotificationsCount: number;
  notifications: Array<{ id: string; title: string; message: string; time: string; type: 'alert' | 'success' | 'info' }>;
  dismissNotification: (id: string) => void;

  // Speech synthesize helper
  speakText: (text: string, lang?: Language) => void;
  stopSpeech: () => void;
  pauseSpeech: () => void;
  resumeSpeech: () => void;
  isSpeaking: boolean;
  isSpeechPaused: boolean;
  autoSpeak: boolean;
  setAutoSpeak: (val: boolean) => void;
  currentlySpeakingText: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('light'); // default academic light
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  // Student Profile state & Onboarding single-source-of-truth
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(() => {
    const saved = localStorage.getItem('studypilot_student_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (isProfileValid(parsed)) {
          return parsed;
        }
      } catch (e) { /* ignore */ }
    }
    return DEFAULT_NEW_STUDENT_PROFILE;
  });

  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('studypilot_student_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (isProfileValid(parsed)) {
          return false;
        }
      } catch (e) { /* ignore */ }
    }
    return true; // Brand new session without a valid completed profile triggers onboarding modal
  });

  // Access AuthContext if available to synchronize authenticated student
  let authContext: any = null;
  try {
    authContext = useAuth();
  } catch {
    // Graceful fallback if rendered without AuthProvider
  }
  const currentUser = authContext?.currentUser;

  useEffect(() => {
    if (currentUser) {
      setStudentProfile(prev => ({
        ...prev,
        name: currentUser.name || prev.name,
        university: currentUser.university || prev.university,
        course: currentUser.course || prev.course,
        branch: currentUser.branch || prev.branch,
        year: currentUser.year || prev.year,
        semester: currentUser.semester || prev.semester,
        preferredLanguage: (currentUser.preferredLanguage as any) || prev.preferredLanguage,
        onboardingCompleted: true
      }));
      setOnboardingOpen(false);
    }
  }, [currentUser]);

  // Gemini API key state
  const [geminiApiKey, setGeminiApiKeyState] = useState<string>(() => {
    return localStorage.getItem('studypilot_gemini_api_key') || (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
  });

  const [aiModel, setAiModelState] = useState<string>(() => {
    return localStorage.getItem('studypilot_gemini_model') || 'gemini-1.5-flash';
  });

  const setGeminiApiKey = (key: string) => {
    setGeminiApiKeyState(key);
    localStorage.setItem('studypilot_gemini_api_key', key);
  };

  const setAiModel = (model: string) => {
    setAiModelState(model);
    localStorage.setItem('studypilot_gemini_model', model);
  };

  // Uploaded Documents state
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>(() => {
    const saved = localStorage.getItem('studypilot_documents');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_PRELOADED_DOCUMENTS;
  });

  const [activeDocumentId, setActiveDocumentIdState] = useState<string | undefined>(() => {
    return localStorage.getItem('studypilot_active_doc_id') || INITIAL_PRELOADED_DOCUMENTS[0]?.id;
  });

  const setActiveDocumentId = (idOrUpdater?: string | ((prev?: string) => string | undefined)) => {
    setActiveDocumentIdState(prev => {
      const nextId = typeof idOrUpdater === 'function' ? idOrUpdater(prev) : idOrUpdater;
      if (nextId) {
        localStorage.setItem('studypilot_active_doc_id', nextId);
      } else {
        localStorage.removeItem('studypilot_active_doc_id');
      }
      return nextId;
    });
  };

  // Initialize from persistent IndexedDB on component mount
  useEffect(() => {
    let isMounted = true;
    loadPersistentDocuments()
      .then((docs) => {
        if (isMounted && docs && docs.length > 0) {
          setUploadedDocuments(docs);
          setActiveDocumentId(prev => prev || docs[0]?.id);
        }
      })
      .catch((err) => {
        console.warn('Could not load persistent documents from IndexedDB:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const addUploadedDocument = (doc: UploadedDocument) => {
    setUploadedDocuments(prev => [doc, ...prev.filter(d => d.id !== doc.id)]);
    setActiveDocumentId(doc.id);
    savePersistentDocument(doc).catch(err => {
      console.warn('Could not save document to IndexedDB:', err);
    });
  };

  const deleteUploadedDocument = (id: string) => {
    setUploadedDocuments(prev => prev.filter(d => d.id !== id));
    if (activeDocumentId === id) {
      setActiveDocumentId(undefined);
    }
    deletePersistentDocument(id).catch(err => {
      console.warn('Could not delete document from IndexedDB:', err);
    });
  };

  // Per-User Student Progress State
  const [studentProgress, setStudentProgress] = useState<StudentProgress>(DEFAULT_ZERO_PROGRESS);
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgressMap>(DEFAULT_SUBJECT_PROGRESS);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [isProgressLoading, setIsProgressLoading] = useState<boolean>(false);

  const refreshProgress = async () => {
    if (!currentUser) return;
    try {
      setIsProgressLoading(true);
      const res = await fetch('/api/progress', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (res.ok) {
        const json = await res.json();
        if (json.progress) {
          setStudentProgress(json.progress);
        }
        if (json.subjectProgress) {
          setSubjectProgress(json.subjectProgress);
        }
        if (Array.isArray(json.recentActivity)) {
          setRecentActivity(json.recentActivity);
        }

        // Synchronize topic progress into subjects
        const topicStatusMap = new Map<string, TopicStatus>();
        if (json.topicProgress) {
          if (Array.isArray(json.topicProgress)) {
            json.topicProgress.forEach((tp: any) => {
              topicStatusMap.set(tp.topic_id || tp.topicId, tp.status);
            });
          } else if (typeof json.topicProgress === 'object') {
            Object.entries(json.topicProgress).forEach(([topId, status]) => {
              topicStatusMap.set(topId, status as TopicStatus);
            });
          }
        }

        setSubjects(prevSubjects => {
          return prevSubjects.map(sub => ({
            ...sub,
            units: sub.units.map(unit => ({
              ...unit,
              topics: unit.topics.map(topic => {
                const status = topicStatusMap.get(topic.id);
                return {
                  ...topic,
                  status: status || 'not-started'
                };
              })
            }))
          }));
        });
      }
    } catch (err) {
      console.warn('Could not load student progress:', err);
    } finally {
      setIsProgressLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      refreshProgress();
    } else {
      setStudentProgress(DEFAULT_ZERO_PROGRESS);
      setSubjectProgress(DEFAULT_SUBJECT_PROGRESS);
      setRecentActivity([]);
    }
  }, [currentUser?.id]);

  const recordQuizAttempt = async (data: any) => {
    if (!currentUser) return null;
    try {
      const res = await fetch('/api/progress?action=quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.summary) {
          setStudentProgress(json.summary);
        }
        await refreshProgress();
        return json;
      }
    } catch (err) {
      console.warn('Could not record quiz attempt:', err);
    }
    return null;
  };

  const recordAnswerEvaluation = async (data: any) => {
    if (!currentUser) return null;
    try {
      const res = await fetch('/api/progress?action=evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.summary) {
          setStudentProgress(json.summary);
        }
        await refreshProgress();
        return json;
      }
    } catch (err) {
      console.warn('Could not record answer evaluation:', err);
    }
    return null;
  };

  // Subjects state
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('studypilot_subjects');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return SUBJECTS_DATA;
  });

  const [activeSubjectId, setActiveSubjectId] = useState<string>('cs201');
  const activeSubject = subjects.find(s => s.id === activeSubjectId) || subjects[0];

  // Question bank state
  const [questionBank, setQuestionBank] = useState<QuestionItem[]>(() => {
    const saved = localStorage.getItem('studypilot_questions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return QUESTION_BANK_DATA;
  });

  // Revision tasks state
  const [revisionTasks, setRevisionTasks] = useState<RevisionTask[]>(() => {
    const saved = localStorage.getItem('studypilot_revisions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_REVISION_TASKS;
  });

  // Active question sent to Answer Evaluator
  const [selectedQuestionForEvaluation, setSelectedQuestionForEvaluation] = useState<QuestionItem | undefined>(undefined);

  // Notifications
  const [notifications, setNotifications] = useState([
    {
      id: 'n1',
      title: 'Upcoming Assessment',
      message: 'CS201: Database Management Systems Unit 3 practice quiz scheduled.',
      time: '10 mins ago',
      type: 'alert' as const
    },
    {
      id: 'n2',
      title: 'Weak Concept Flagged',
      message: 'AI flagged BCNF Dependency Preservation for revision.',
      time: '1 hour ago',
      type: 'info' as const
    },
    {
      id: 'n3',
      title: 'Study Streak Active',
      message: '4-day continuous study streak maintained! Keep it up for SGU Semester III exams.',
      time: 'Yesterday',
      type: 'success' as const
    }
  ]);

  // Speech Synthesis state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeechPaused, setIsSpeechPaused] = useState(false);
  const [currentlySpeakingText, setCurrentlySpeakingText] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeakState] = useState<boolean>(() => {
    return localStorage.getItem('studypilot_auto_speak') === 'true';
  });

  const setAutoSpeak = (val: boolean) => {
    setAutoSpeakState(val);
    localStorage.setItem('studypilot_auto_speak', String(val));
  };

  // Sync valid profile to local storage immediately
  useEffect(() => {
    if (isProfileValid(studentProfile)) {
      localStorage.setItem('studypilot_student_profile', JSON.stringify(studentProfile));
    }
  }, [studentProfile]);

  useEffect(() => {
    try {
      localStorage.setItem('studypilot_documents', JSON.stringify(uploadedDocuments));
    } catch {
      // If full text exceeds 5MB localStorage quota, save metadata only as backup
      try {
        const metadataOnly = uploadedDocuments.map(d => ({
          ...d,
          text: d.text.slice(0, 500) + '...',
          chunks: d.chunks.slice(0, 2)
        }));
        localStorage.setItem('studypilot_documents', JSON.stringify(metadataOnly));
      } catch {}
    }
  }, [uploadedDocuments]);

  useEffect(() => {
    localStorage.setItem('studypilot_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('studypilot_questions', JSON.stringify(questionBank));
  }, [questionBank]);

  useEffect(() => {
    localStorage.setItem('studypilot_revisions', JSON.stringify(revisionTasks));
  }, [revisionTasks]);

  // Handle global shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update student profile with immediate persistence
  const updateStudentProfile = (updates: Partial<StudentProfile>) => {
    setStudentProfile(prev => {
      const updated = { ...prev, ...updates };
      try {
        if (isProfileValid(updated)) {
          localStorage.setItem('studypilot_student_profile', JSON.stringify(updated));
        }
      } catch (e) {
        console.warn('Failed to save student profile to localStorage:', e);
      }
      return updated;
    });
  };

  // Update Topic Status and recalculate subject progress
  const updateTopicStatus = (subjectId: string, unitId: string, topicId: string, newStatus: TopicStatus) => {
    setSubjects(prevSubjects => {
      return prevSubjects.map(sub => {
        if (sub.id !== subjectId) return sub;
        
        const updatedUnits = sub.units.map(unit => {
          if (unit.id !== unitId) return unit;
          const updatedTopics = unit.topics.map(top => {
            if (top.id === topicId) {
              return { ...top, status: newStatus };
            }
            return top;
          });
          return { ...unit, topics: updatedTopics };
        });

        return { ...sub, units: updatedUnits };
      });
    });

    if (currentUser) {
      fetch('/api/progress?action=topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subjectId, unitId, topicId, status: newStatus })
      })
        .then(res => res.json())
        .then(json => {
          if (json.summary) setStudentProgress(json.summary);
          if (json.subjectProgress) setSubjectProgress(json.subjectProgress);
        })
        .catch(err => {
          console.warn('Failed to sync topic status to server:', err);
        });
    }
  };

  // Toggle Bookmark
  const toggleBookmarkQuestion = (questionId: string) => {
    setQuestionBank(prev => prev.map(q => {
      if (q.id === questionId) {
        return { ...q, isBookmarked: !q.isBookmarked };
      }
      return q;
    }));
  };

  // Toggle revision task
  const toggleRevisionTask = (taskId: string) => {
    setRevisionTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextCompleted = !t.completed;
        return {
          ...t,
          completed: nextCompleted,
          dateCompleted: nextCompleted ? 'Just now' : undefined
        };
      }
      return t;
    }));
  };

  const addRevisionTask = (task: Omit<RevisionTask, 'id' | 'completed'>) => {
    const newTask: RevisionTask = {
      ...task,
      id: `rev_${Date.now()}`,
      completed: false
    };
    setRevisionTasks(prev => [newTask, ...prev]);
  };

  const deleteRevisionTask = (taskId: string) => {
    setRevisionTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  // Speech functions using dedicated speechService
  const stopSpeech = () => {
    speechService.stopSpeaking();
    setIsSpeaking(false);
    setIsSpeechPaused(false);
    setCurrentlySpeakingText(null);
  };

  const pauseSpeech = () => {
    speechService.pauseSpeaking();
    setIsSpeechPaused(true);
  };

  const resumeSpeech = () => {
    speechService.resumeSpeaking();
    setIsSpeechPaused(false);
  };

  const speakText = (text: string, lang: Language = studentProfile.preferredLanguage) => {
    if (!text.trim()) return;

    // Toggle off if currently speaking this exact message
    if (isSpeaking && currentlySpeakingText === text && !isSpeechPaused) {
      stopSpeech();
      return;
    }

    setCurrentlySpeakingText(text);
    setIsSpeaking(true);
    setIsSpeechPaused(false);

    speechService.speak({
      text,
      language: lang,
      onStart: () => {
        setIsSpeaking(true);
        setIsSpeechPaused(false);
      },
      onEnd: () => {
        setIsSpeaking(false);
        setIsSpeechPaused(false);
        setCurrentlySpeakingText(null);
      },
      onError: (err) => {
        console.warn('Speech playback issue:', err);
        setIsSpeaking(false);
        setIsSpeechPaused(false);
        setCurrentlySpeakingText(null);
      }
    });
  };

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView,
        studentProfile,
        updateStudentProfile,
        subjects,
        setSubjects,
        activeSubject,
        setActiveSubjectId,
        updateTopicStatus,
        questionBank,
        setQuestionBank,
        toggleBookmarkQuestion,
        revisionTasks,
        toggleRevisionTask,
        addRevisionTask,
        deleteRevisionTask,
        selectedQuestionForEvaluation,
        setSelectedQuestionForEvaluation,
        studentProgress,
        subjectProgress,
        recentActivity,
        isProgressLoading,
        refreshProgress,
        recordQuizAttempt,
        recordAnswerEvaluation,
        uploadedDocuments,
        addUploadedDocument,
        deleteUploadedDocument,
        activeDocumentId,
        setActiveDocumentId,
        geminiApiKey,
        setGeminiApiKey,
        aiModel,
        setAiModel,
        globalSearchOpen,
        setGlobalSearchOpen,
        teamModalOpen,
        setTeamModalOpen,
        onboardingOpen,
        setOnboardingOpen,
        theme,
        setTheme,
        toggleTheme,
        unreadNotificationsCount: notifications.length,
        notifications,
        dismissNotification,
        speakText,
        stopSpeech,
        pauseSpeech,
        resumeSpeech,
        isSpeaking,
        isSpeechPaused,
        autoSpeak,
        setAutoSpeak,
        currentlySpeakingText
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
