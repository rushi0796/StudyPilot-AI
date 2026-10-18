import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Pause, 
  Play, 
  RotateCcw, 
  Copy, 
  Check, 
  Bookmark, 
  BookmarkCheck, 
  Globe, 
  Lightbulb, 
  BookOpen, 
  HelpCircle, 
  FolderOpen, 
  Info, 
  CheckCircle2, 
  AlertCircle,
  Mic,
  MicOff,
  X,
  Radio,
  Headphones
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Language, DifficultyLevel, ChatMessage, DocumentChunk, SpeechRecognitionState } from '../../types';
import { askGeminiTutor, ChatHistoryTurn } from '../../services/aiProvider';
import { retrieveRelevantChunks } from '../../services/ragEngine';
import { 
  speechService, 
  isSpeechRecognitionSupported, 
  LANGUAGE_CONFIGS, 
  SpeechRecognitionErrorDetails 
} from '../../services/speechService';

export const AIAssistantView: React.FC = () => {
  const { 
    studentProfile, 
    updateStudentProfile,
    subjects, 
    activeSubject, 
    speakText, 
    stopSpeech, 
    pauseSpeech, 
    resumeSpeech, 
    isSpeaking, 
    isSpeechPaused,
    autoSpeak,
    setAutoSpeak,
    currentlySpeakingText,
    addRevisionTask,
    uploadedDocuments,
    activeDocumentId,
    setActiveDocumentId,
    setActiveView
  } = useApp();

  const [inputMessage, setInputMessage] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('Relational Database Normalization');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('simple');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bookmarkedTopics, setBookmarkedTopics] = useState<string[]>(['Relational Database Normalization']);
  const [simplificationLevel, setSimplificationLevel] = useState(1);
  const [isTyping, setIsTyping] = useState(false);
  const [groundWithFiles, setGroundWithFiles] = useState(true);
  const [chatError, setChatError] = useState<{ message: string; failedQuery: string } | null>(null);

  // Voice Assistant state
  const [recognitionState, setRecognitionState] = useState<SpeechRecognitionState>('idle');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<SpeechRecognitionErrorDetails | null>(null);
  const [isListeningSupported] = useState(() => isSpeechRecognitionSupported());

  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeDoc = uploadedDocuments.find(d => d.id === activeDocumentId) || uploadedDocuments[0];

  // Initial greeting conversation
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_1',
      sender: 'assistant',
      timestamp: 'Today',
      language: studentProfile.preferredLanguage,
      content: `Hello ${studentProfile.name}! I am **StudyPilot AI**, your voice-enabled academic tutor and study assistant for Sanjay Ghodawat University **${studentProfile.branch}** (${studentProfile.semester}).

⚡ **Powered by Google Gemini Generative Intelligence & Web Voice Engine**:
- Speak directly by tapping the **Microphone** button below.
- I understand and speak **English, Hindi (हिंदी), Marathi (मराठी), and Telugu (తెలుగు)**.
- Ask conceptual doubts, programming questions, science problems, general knowledge, jokes, or college project ideas.
- Toggle **Auto-Speak** in the header for a hands-free conversational voice experience!

Try asking or speaking:
- *"Explain recursion in simple words with an example"*
- *"What is the difference between React and Angular?"*
- *"Explain photosynthesis in steps"*
- *"Tell me a joke"*
- *"Give me innovative ideas for a college AI project"*
- *"What is 17 multiplied by 24? Show calculation"*`,
      followUpSuggestions: [
        "Explain recursion with a real-world example",
        "Difference between React and Angular",
        "Give me ideas for a college project"
      ]
    }
  ]);

  // Clean up audio operations on unmount
  useEffect(() => {
    return () => {
      speechService.cleanup();
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, chatError, recognitionState]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleBookmark = (topicName: string) => {
    setBookmarkedTopics(prev => 
      prev.includes(topicName) ? prev.filter(t => t !== topicName) : [...prev, topicName]
    );
  };

  // Toggle microphone listening session
  const toggleListening = () => {
    if (recognitionState === 'listening' || recognitionState === 'requesting_permission') {
      const finalTranscript = speechService.stopListening();
      setRecognitionState('idle');
      setInterimTranscript('');
      if (finalTranscript.trim()) {
        setInputMessage(finalTranscript.trim());
      }
    } else {
      setVoiceError(null);
      setInterimTranscript('');
      // Stop speech playback to prevent mic feedback
      stopSpeech();

      speechService.startListening({
        language: studentProfile.preferredLanguage,
        onStateChange: (state, err) => {
          setRecognitionState(state);
          if (err) setVoiceError(err);
        },
        onTranscript: (interim, final) => {
          setInterimTranscript(interim);
          if (final.trim()) {
            setInputMessage(final.trim());
          }
        },
        onError: (err) => {
          setVoiceError(err);
          setRecognitionState('error');
        },
        onEnd: (final) => {
          setRecognitionState('idle');
          setInterimTranscript('');
          if (final.trim()) {
            setInputMessage(final.trim());
          }
        }
      });
    }
  };

  // Cancel microphone listening session
  const cancelListening = () => {
    speechService.abortListening();
    setRecognitionState('idle');
    setInterimTranscript('');
  };

  // Send the spoken question immediately
  const sendSpokenQuestion = () => {
    const text = (inputMessage || interimTranscript).trim();
    speechService.stopListening();
    setRecognitionState('idle');
    setInterimTranscript('');
    if (text) {
      handleSendMessage(text);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    if (isTyping) return;
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    // Make sure mic is stopped
    if (recognitionState === 'listening') {
      speechService.stopListening();
      setRecognitionState('idle');
    }

    setChatError(null);
    setVoiceError(null);

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      timestamp: 'Just now',
      language: studentProfile.preferredLanguage,
      content: text,
      subject: activeSubject.name,
      topic: selectedTopic,
      difficulty
    };

    // Format previous conversation turns for Gemini multi-turn context
    const historyTurns: ChatHistoryTurn[] = messages
      .filter(m => m.id !== 'msg_1') // skip the initial greeting template so history begins with user turn
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.content
      }));

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsTyping(true);

    try {
      // Gather document chunks if grounding is active
      let chunksToPass: DocumentChunk[] = [];
      if (groundWithFiles && uploadedDocuments.length > 0) {
        let candidateChunks: DocumentChunk[] = [];
        if (activeDocumentId === 'all') {
          candidateChunks = uploadedDocuments.flatMap(d => d.chunks || []);
        } else if (activeDoc) {
          candidateChunks = activeDoc.chunks || [];
        } else {
          candidateChunks = uploadedDocuments.flatMap(d => d.chunks || []);
        }

        // High-precision hybrid lexical & semantic retrieval
        const retrieved = retrieveRelevantChunks(text, candidateChunks, 6);
        if (retrieved.length > 0) {
          chunksToPass = retrieved.map(r => r.chunk);
        } else {
          // When no chunks match, pass empty array. Never pass arbitrary candidate chunks!
          chunksToPass = [];
        }
      }

      const activeDocName = activeDocumentId === 'all'
        ? 'All Uploaded Documents'
        : activeDoc?.name || (uploadedDocuments[0]?.name || 'Uploaded Notes');

      const responseData = await askGeminiTutor({
        query: text,
        history: historyTurns,
        subject: activeSubject.name,
        topic: selectedTopic,
        language: studentProfile.preferredLanguage,
        difficulty,
        simplificationLevel,
        documentChunks: chunksToPass,
        activeDocumentName: activeDocName,
        groundWithFiles: groundWithFiles && uploadedDocuments.length > 0,
        academicProfile: {
          university: studentProfile.university,
          course: studentProfile.course,
          branch: studentProfile.branch,
          semester: studentProfile.semester
        },
        voiceMode: autoSpeak
      });

      const assistantMsg: ChatMessage = {
        id: `msg_asst_${Date.now()}`,
        sender: 'assistant',
        timestamp: 'Just now',
        language: studentProfile.preferredLanguage,
        content: responseData.content,
        topic: selectedTopic,
        subject: activeSubject.name,
        difficulty,
        followUpSuggestions: responseData.suggestions,
        quizPrompt: responseData.quiz,
        audioAvailable: true,
        documentCitations: responseData.citations,
        webSearchResult: responseData.webSearchResult,
        isWebSearchFallback: responseData.isWebSearchFallback
      };

      setMessages(prev => [...prev, assistantMsg]);

      // If Auto-Speak (Voice Mode) is enabled, automatically speak answer aloud
      if (autoSpeak && responseData.content) {
        speakText(responseData.content, studentProfile.preferredLanguage);
      }

    } catch (err: any) {
      console.error('Chat error:', err);
      setChatError({
        message: err?.message || 'Failed to receive response from Gemini AI. Please check server configuration.',
        failedQuery: text
      });
    } finally {
      setIsTyping(false);
    }
  };

  // Progressive Simplification: "Teach Me Until I Understand"
  const handleTeachMeSimply = async () => {
    if (isTyping) return;
    const nextLevel = simplificationLevel + 1;
    setSimplificationLevel(nextLevel);

    const promptText = `Explain this even more simply in intuitive everyday terms! (Simplification Level ${nextLevel})`;
    await handleSendMessage(promptText);
  };

  // Quiz submission inside chat
  const [answeredQuizzes, setAnsweredQuizzes] = useState<{ [msgId: string]: { selected: number; correct: boolean } }>({});

  const handleQuizAnswer = (msgId: string, selectedIdx: number, correctIdx: number, topicName: string) => {
    const isCorrect = selectedIdx === correctIdx;
    setAnsweredQuizzes(prev => ({
      ...prev,
      [msgId]: { selected: selectedIdx, correct: isCorrect }
    }));

    if (!isCorrect) {
      addRevisionTask({
        title: `Revise: ${topicName} (Missed in AI Tutor Mini-Quiz)`,
        subject: activeSubject.name,
        priority: 'high',
        reason: 'Quiz Miss',
        dueDate: 'Tomorrow',
        timeEstimateMinutes: 20
      });
    }
  };

  const currentLangConfig = LANGUAGE_CONFIGS[studentProfile.preferredLanguage] || LANGUAGE_CONFIGS.en;

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] lg:h-[calc(100vh-125px)] bg-white rounded-3xl border border-academic-border overflow-hidden shadow-sm animate-in fade-in duration-200">
      
      {/* 1. Assistant Top Control Bar */}
      <div className="bg-[#FDFCF9] border-b border-academic-border p-3 lg:px-5 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        
        {/* Left: Active Subject & AI Engine Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sage-100 border border-sage-200 text-forest-700 flex items-center justify-center font-bold">
            <Bot className="w-5 h-5 text-forest-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-charcoal-900 flex items-center gap-1.5">
                StudyPilot AI Voice Assistant
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sage-100 text-forest-800 border border-sage-200">
                Gemini 2.5 Flash
              </span>
            </div>
            <p className="text-[11px] text-charcoal-400">
              Department of Artificial Intelligence • Sanjay Ghodawat University
            </p>
          </div>
        </div>

        {/* Right: Topic Dropdown, Document Grounding, Language, Voice Mode & Difficulty */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          
          {/* Hands-Free Voice Mode (Auto-Speak Answers) Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextVal = !autoSpeak;
              setAutoSpeak(nextVal);
              if (!nextVal) stopSpeech();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              autoSpeak
                ? 'bg-forest-600 text-white border-forest-600 shadow-sm'
                : 'bg-white text-charcoal-700 border-academic-border hover:bg-sage-50'
            }`}
            title="When active, StudyPilot AI will automatically speak answers aloud"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Auto-Speak: {autoSpeak ? 'ON' : 'OFF'}</span>
          </button>

          {/* Document Grounding Selector */}
          {uploadedDocuments.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-academic-border text-charcoal-700">
              <FolderOpen className="w-3.5 h-3.5 text-forest-600" />
              <select
                value={activeDocumentId || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setActiveDocumentId(val || undefined);
                  setGroundWithFiles(Boolean(val));
                }}
                className="bg-transparent text-charcoal-800 font-semibold text-xs focus:outline-none max-w-[140px] truncate"
              >
                <option value="">No File Grounding</option>
                <option value="all">All Files ({uploadedDocuments.length})</option>
                {uploadedDocuments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Subject Context Selector */}
          <select
            value={activeSubject.id}
            onChange={(e) => {
              const sub = subjects.find(s => s.id === e.target.value);
              if (sub) setSelectedTopic(sub.units[0]?.topics[0]?.title || selectedTopic);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-academic-border text-charcoal-800 focus:border-forest-600 focus:outline-none text-xs font-medium"
          >
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.code}: {s.name}</option>
            ))}
          </select>

          {/* Difficulty Toggle: Simple | Standard | Detailed */}
          <div className="flex items-center bg-academic-bg p-0.5 rounded-xl border border-academic-border">
            {(['simple', 'standard', 'detailed'] as DifficultyLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all ${
                  difficulty === level 
                    ? 'bg-forest-600 text-white shadow-sm' 
                    : 'text-charcoal-400 hover:text-charcoal-800'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          {/* Multilingual Voice Language Selector */}
          <select
            value={studentProfile.preferredLanguage}
            onChange={(e) => {
              const newLang = e.target.value as Language;
              updateStudentProfile({ preferredLanguage: newLang });
              // If listening, stop so new recognition language can take effect
              if (recognitionState === 'listening') {
                speechService.stopListening();
                setRecognitionState('idle');
              }
            }}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-academic-border text-charcoal-800 focus:border-forest-600 focus:outline-none text-xs uppercase font-bold"
            title="Speech Recognition and Response Language"
          >
            <option value="en">EN (English)</option>
            <option value="hi">HI (हिंदी)</option>
            <option value="mr">MR (मराठी)</option>
            <option value="te">TE (తెలుగు)</option>
          </select>
        </div>

      </div>

      {/* 2. Chat Conversation Feed */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5 bg-[#FDFCF9]">
        
        {/* Banner Notice */}
        <div className="p-3 rounded-2xl bg-white border border-academic-border text-[11px] text-charcoal-700 flex flex-wrap items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-forest-600 flex-shrink-0" />
            <span>
              <strong>Voice-Enabled Study Pilot:</strong> Speak or type in <strong>{currentLangConfig.native}</strong>. Multimodal speech recognition and dynamic Gemini answers active.
            </span>
          </div>
          {groundWithFiles && uploadedDocuments.length > 0 && (
            <span className="text-[10px] text-forest-800 font-semibold flex items-center gap-1 bg-sage-100 px-2.5 py-0.5 rounded-full border border-sage-200">
              <CheckCircle2 className="w-3 h-3 text-forest-600" />
              <span>Grounded: {activeDocumentId === 'all' ? `All Files (${uploadedDocuments.length})` : (activeDoc?.name || 'Active Document')}</span>
            </span>
          )}
        </div>

        {/* Browser Voice Recognition Support Notice if unsupported */}
        {!isListeningSupported && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Microphone speech recognition is not supported in this browser.</p>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                For hands-free speech input, please open StudyPilot AI in Google Chrome, Microsoft Edge, or Safari. You can continue typing questions normally!
              </p>
            </div>
          </div>
        )}

        {/* Voice Recognition Error Notification */}
        {voiceError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900">{voiceError.message}</p>
                <p className="text-rose-700 mt-0.5">{voiceError.actionable}</p>
              </div>
            </div>
            <button
              onClick={() => setVoiceError(null)}
              className="p-1 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-100 transition-colors flex-shrink-0"
              title="Dismiss error"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isBookmarked = bookmarkedTopics.includes(msg.topic || selectedTopic);
          const isCurrentlySpeakingThis = isSpeaking && currentlySpeakingText === msg.content;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-forest-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-2xl rounded-2xl p-4 lg:p-5 text-xs sm:text-sm leading-relaxed ${
                isUser 
                  ? 'bg-forest-600 text-white shadow-sm' 
                  : isCurrentlySpeakingThis
                  ? 'bg-white border-2 border-forest-400 text-charcoal-900 shadow-md ring-2 ring-forest-100'
                  : 'bg-white border border-academic-border text-charcoal-900 shadow-sm'
              }`}>
                
                {/* Assistant Message Header Actions */}
                {!isUser && (
                  <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-academic-border text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-forest-800">StudyPilot AI</span>
                      <span className="text-[10px] text-charcoal-400">• {msg.timestamp}</span>
                      {isCurrentlySpeakingThis && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-forest-700 bg-forest-50 px-2 py-0.5 rounded-full border border-forest-200 animate-pulse">
                          <Radio className="w-3 h-3 text-forest-600" />
                          <span>Speaking Now</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Audio Controls for Message */}
                      {isCurrentlySpeakingThis ? (
                        <div className="flex items-center gap-1 bg-sage-100 px-1.5 py-0.5 rounded-lg border border-forest-300">
                          {isSpeechPaused ? (
                            <button
                              onClick={resumeSpeech}
                              className="p-1 rounded text-forest-800 hover:text-forest-950 transition-colors"
                              title="Resume reading"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                          ) : (
                            <button
                              onClick={pauseSpeech}
                              className="p-1 rounded text-forest-800 hover:text-forest-950 transition-colors"
                              title="Pause reading"
                            >
                              <Pause className="w-3.5 h-3.5 fill-current" />
                            </button>
                          )}
                          <button
                            onClick={stopSpeech}
                            className="p-1 rounded text-rose-600 hover:text-rose-800 transition-colors"
                            title="Stop speaking"
                          >
                            <VolumeX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => speakText(msg.content, msg.language)}
                          className="p-1.5 rounded-lg text-charcoal-400 hover:text-forest-700 hover:bg-sage-50 transition-colors"
                          title="Read answer aloud"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Replay Button */}
                      <button
                        onClick={() => {
                          stopSpeech();
                          speakText(msg.content, msg.language);
                        }}
                        className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-700 hover:bg-sage-50 transition-colors"
                        title="Replay audio from beginning"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                      {/* Copy Explanation */}
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-700 hover:bg-sage-50 transition-colors"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-forest-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      {/* Bookmark Topic */}
                      <button
                        onClick={() => toggleBookmark(msg.topic || selectedTopic)}
                        className="p-1.5 rounded-lg text-charcoal-400 hover:text-gold-500 hover:bg-sage-50 transition-colors"
                        title={isBookmarked ? "Topic bookmarked" : "Bookmark topic"}
                      >
                        {isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5 text-gold-500 fill-gold-500" /> : <Bookmark className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Message Content with Markdown Formatting */}
                <div className="prose prose-sm max-w-none space-y-2 whitespace-pre-wrap text-charcoal-900 font-sans">
                  {msg.content}
                </div>

                {/* Citations if available */}
                {!isUser && msg.documentCitations && msg.documentCitations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-academic-border text-[11px] text-charcoal-500">
                    <span className="font-bold text-forest-700 block mb-1">Document Citations:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.documentCitations.map((cit, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-sage-50 text-forest-800 border border-sage-200 text-[10px] font-mono">
                          {cit}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Web Search Fallback Result */}
                {!isUser && msg.isWebSearchFallback && msg.webSearchResult && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-blue-200">
                    {/* Banner: not found in PDF */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border-b border-amber-200">
                      <span className="text-amber-600 text-sm">⚠️</span>
                      <span className="text-[11px] font-bold text-amber-800">
                        This answer was not found in your uploaded PDF
                      </span>
                    </div>
                    {/* Web search answer */}
                    <div className="px-4 py-3 bg-blue-50">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Globe className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wide">Web Search Result</span>
                      </div>
                      <div className="text-xs text-charcoal-800 leading-relaxed whitespace-pre-wrap">
                        {msg.webSearchResult}
                      </div>
                    </div>
                  </div>
                )}

                {/* Embedded Mini-Quiz if available */}
                {!isUser && msg.quizPrompt && (
                  <div className="mt-4 p-3.5 rounded-xl bg-academic-bg border border-academic-border text-xs">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-academic-border">
                      <span className="font-bold text-forest-800 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-forest-600" />
                        Quick Understanding Check
                      </span>
                      <span className="text-[10px] text-charcoal-400">1 Question</span>
                    </div>

                    <p className="font-bold text-charcoal-900 mb-2.5">
                      {msg.quizPrompt.question}
                    </p>

                    <div className="space-y-1.5">
                      {msg.quizPrompt.options.map((opt, oIdx) => {
                        const answerState = answeredQuizzes[msg.id];
                        const isSelected = answerState?.selected === oIdx;
                        const isCorrect = oIdx === msg.quizPrompt?.correctIndex;

                        return (
                          <button
                            key={oIdx}
                            disabled={!!answerState}
                            onClick={() => handleQuizAnswer(msg.id, oIdx, msg.quizPrompt!.correctIndex, msg.topic || selectedTopic)}
                            className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs flex items-center justify-between ${
                              answerState
                                ? isCorrect
                                  ? 'bg-sage-100 border-forest-400 text-forest-900 font-bold'
                                  : isSelected
                                    ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                                    : 'bg-white border-academic-border text-charcoal-400'
                                : 'bg-white border-academic-border hover:border-forest-400 text-charcoal-800'
                            }`}
                          >
                            <span>{opt}</span>
                            {answerState && isCorrect && <Check className="w-3.5 h-3.5 text-forest-600" />}
                          </button>
                        );
                      })}
                    </div>

                    {answeredQuizzes[msg.id] && (
                      <div className={`mt-2.5 p-2 rounded-lg text-[11px] ${
                        answeredQuizzes[msg.id].correct 
                          ? 'bg-sage-100 text-forest-900 border border-sage-200' 
                          : 'bg-rose-50 text-rose-900 border border-rose-200'
                      }`}>
                        <p className="font-bold">
                          {answeredQuizzes[msg.id].correct ? "✓ Correct!" : "✗ Needs Revision:"}
                        </p>
                        <p className="mt-0.5 text-charcoal-700">{msg.quizPrompt.explanation}</p>
                        {!answeredQuizzes[msg.id].correct && (
                          <p className="mt-1 text-[10px] text-amber-800 font-bold">
                            → Added to your Revision Planner automatically!
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Follow-up Quick Action Buttons */}
                {!isUser && msg.followUpSuggestions && (
                  <div className="mt-4 pt-3 border-t border-academic-border flex flex-wrap gap-2">
                    <button
                      onClick={handleTeachMeSimply}
                      disabled={isTyping}
                      className="px-2.5 py-1.5 rounded-lg bg-sage-50 hover:bg-sage-100 text-forest-800 border border-sage-200 text-[11px] font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      title="Progressively simplify explanation"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Explain More Simply</span>
                    </button>

                    {msg.followUpSuggestions.slice(0, 2).map((sugg, sIdx) => (
                      <button
                        key={sIdx}
                        disabled={isTyping}
                        onClick={() => handleSendMessage(sugg)}
                        className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-sage-50 text-charcoal-700 border border-academic-border text-[11px] font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <Lightbulb className="w-3.5 h-3.5 text-gold-600" />
                        <span>{sugg}</span>
                      </button>
                    ))}
                  </div>
                )}

              </div>
            </div>
          );
        })}

        {/* AI Typing Indicator */}
        {isTyping && (
          <div className="flex gap-3 justify-start animate-in fade-in duration-150">
            <div className="w-8 h-8 rounded-xl bg-forest-600 text-white flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="p-4 rounded-2xl bg-white border border-academic-border text-xs text-charcoal-700 flex items-center gap-2.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-forest-600 animate-ping" />
              <span>StudyPilot AI is formulating answer with Gemini...</span>
            </div>
          </div>
        )}

        {/* Error Notification with Direct Retry Action */}
        {chatError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900">Unable to generate response from Gemini</p>
                <p className="text-rose-700 mt-0.5 leading-relaxed">{chatError.message}</p>
              </div>
            </div>
            <button
              onClick={() => handleSendMessage(chatError.failedQuery)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm self-start sm:self-auto transition-colors flex-shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Question</span>
            </button>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* 3. Audio Player Bar (when speaking) */}
      {isSpeaking && (
        <div className="bg-white border-t border-academic-border px-4 py-2 flex items-center justify-between text-xs animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 h-5">
              <span className="w-1 bg-forest-600 rounded-full wave-bar-1" />
              <span className="w-1 bg-forest-600 rounded-full wave-bar-2" />
              <span className="w-1 bg-forest-600 rounded-full wave-bar-3" />
              <span className="w-1 bg-forest-600 rounded-full wave-bar-4" />
              <span className="w-1 bg-forest-600 rounded-full wave-bar-5" />
            </div>
            <span className="text-charcoal-700 font-medium">
              Audio Narration: <strong className="text-forest-700">{studentProfile.preferredLanguage.toUpperCase()}</strong> Voice Engine
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isSpeechPaused ? (
              <button onClick={resumeSpeech} className="p-1.5 rounded-lg bg-sage-100 text-charcoal-700 hover:bg-sage-200 transition-colors" title="Resume">
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button onClick={pauseSpeech} className="p-1.5 rounded-lg bg-sage-100 text-charcoal-700 hover:bg-sage-200 transition-colors" title="Pause">
                <Pause className="w-3.5 h-3.5 fill-current" />
              </button>
            )}
            <button onClick={stopSpeech} className="p-1.5 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors" title="Stop">
              <VolumeX className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 3.5 Active Speech Recognition Banner */}
      {(recognitionState === 'listening' || recognitionState === 'requesting_permission') && (
        <div className="bg-amber-50 border-t border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3 text-xs animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className="relative flex h-3 w-3 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <div className="truncate">
              <span className="font-bold text-amber-900 mr-2">
                {recognitionState === 'requesting_permission' 
                  ? 'Requesting microphone permission...' 
                  : `Listening in ${currentLangConfig.native}...`}
              </span>
              <span className="text-amber-800 italic">
                {interimTranscript || inputMessage || 'Speak your question clearly...'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={sendSpokenQuestion}
              disabled={!(inputMessage || interimTranscript).trim()}
              className="px-3 py-1.5 rounded-lg bg-forest-600 hover:bg-forest-700 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Question</span>
            </button>
            <button
              type="button"
              onClick={cancelListening}
              className="p-1.5 rounded-lg bg-white border border-amber-300 text-charcoal-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Cancel speech recognition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Chat Input Bar with Microphone Button */}
      <div className="bg-white border-t border-academic-border p-3 lg:p-4 flex-shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (recognitionState === 'listening') {
              speechService.stopListening();
              setRecognitionState('idle');
            }
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Microphone Voice Input Button */}
          <button
            type="button"
            onClick={toggleListening}
            disabled={isTyping}
            className={`p-3 rounded-xl border flex items-center justify-center transition-all flex-shrink-0 ${
              recognitionState === 'listening'
                ? 'bg-rose-500 text-white border-rose-600 animate-pulse shadow-md'
                : recognitionState === 'requesting_permission'
                ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                : isListeningSupported
                ? 'bg-white hover:bg-sage-50 text-forest-700 border-academic-border hover:border-forest-400 shadow-sm'
                : 'bg-academic-bg text-charcoal-300 border-academic-border cursor-not-allowed'
            }`}
            title={
              !isListeningSupported
                ? 'Speech recognition not supported in this browser (use Chrome or Edge)'
                : recognitionState === 'listening'
                ? 'Listening... Click to finish speaking'
                : `Click to speak question in ${currentLangConfig.native}`
            }
          >
            {recognitionState === 'listening' ? (
              <Mic className="w-5 h-5 text-white animate-bounce" />
            ) : recognitionState === 'requesting_permission' ? (
              <Radio className="w-5 h-5 text-amber-700 animate-spin" />
            ) : isListeningSupported ? (
              <Mic className="w-5 h-5 text-forest-600" />
            ) : (
              <MicOff className="w-5 h-5 text-charcoal-400" />
            )}
          </button>

          <input
            type="text"
            value={inputMessage}
            disabled={isTyping}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              recognitionState === 'listening'
                ? `Listening... speak now in ${currentLangConfig.native}`
                : currentLangConfig.placeholderPrompt
            }
            className={`flex-1 px-4 py-3 rounded-xl bg-academic-bg border text-charcoal-900 placeholder-charcoal-400 focus:outline-none text-xs sm:text-sm disabled:opacity-60 transition-colors ${
              recognitionState === 'listening' ? 'border-rose-400 bg-rose-50/30' : 'border-academic-border focus:border-forest-600'
            }`}
          />

          <button
            type="submit"
            disabled={isTyping || !inputMessage.trim()}
            className="px-5 py-3 rounded-xl bg-forest-600 hover:bg-forest-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center gap-2 transition-all flex-shrink-0"
          >
            <span className="hidden sm:inline">Ask AI</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};
