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
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Language, DifficultyLevel, ChatMessage, DocumentChunk } from '../../types';
import { askGeminiTutor, ChatHistoryTurn } from '../../services/aiProvider';

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

  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeDoc = uploadedDocuments.find(d => d.id === activeDocumentId) || uploadedDocuments[0];

  // Initial greeting conversation
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_1',
      sender: 'assistant',
      timestamp: 'Today',
      language: studentProfile.preferredLanguage,
      content: `Hello ${studentProfile.name}! I am **StudyPilot AI**, your personalized academic tutor and study assistant for Sanjay Ghodawat University **${studentProfile.branch}** (${studentProfile.semester}).

⚡ **Powered by Google Gemini Generative Intelligence**: I can answer conceptual doubts, explain code, solve mathematical calculations, explain in Hindi or Telugu, or ground answers directly in your uploaded syllabus and lecture notes.

Try asking me:
- *"Hi, who are you?"*
- *"Explain recursion in simple words with an example"*
- *"What is 17 multiplied by 24? Show the calculation"*
- *"Explain database normalization and why 3NF is used"*`,
      followUpSuggestions: [
        "Explain recursion with a real-world example",
        "What is 17 multiplied by 24?",
        "Why is 3NF preferred over 2NF?"
      ]
    }
  ]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, chatError]);

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

  const handleSendMessage = async (textToSend?: string) => {
    if (isTyping) return;
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    setChatError(null);

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
      if (groundWithFiles && activeDoc) {
        chunksToPass = activeDoc.chunks.slice(0, 4);
      }

      const responseData = await askGeminiTutor({
        query: text,
        history: historyTurns,
        subject: activeSubject.name,
        topic: selectedTopic,
        language: studentProfile.preferredLanguage,
        difficulty,
        simplificationLevel,
        documentChunks: chunksToPass
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
        documentCitations: responseData.citations
      };

      setMessages(prev => [...prev, assistantMsg]);
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
                StudyPilot AI Tutor
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

        {/* Right: Topic Dropdown, Document Grounding, Language & Difficulty */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          
          {/* Document Grounding Selector */}
          {uploadedDocuments.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-academic-border text-charcoal-700">
              <FolderOpen className="w-3.5 h-3.5 text-forest-600" />
              <select
                value={activeDocumentId || ''}
                onChange={(e) => {
                  setActiveDocumentId(e.target.value || undefined);
                  setGroundWithFiles(Boolean(e.target.value));
                }}
                className="bg-transparent text-charcoal-800 font-semibold text-xs focus:outline-none max-w-[140px] truncate"
              >
                <option value="">No File Grounding</option>
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

          {/* Language Selector */}
          <select
            value={studentProfile.preferredLanguage}
            onChange={(e) => updateStudentProfile({ preferredLanguage: e.target.value as Language })}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-academic-border text-charcoal-800 focus:border-forest-600 focus:outline-none text-xs uppercase font-bold"
          >
            <option value="en">EN (English)</option>
            <option value="hi">HI (हिंदी)</option>
            <option value="te">TE (తెలుగు)</option>
          </select>
        </div>

      </div>

      {/* 2. Chat Conversation Feed */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5 bg-[#FDFCF9]">
        
        {/* Banner Notice */}
        <div className="p-3 rounded-2xl bg-white border border-academic-border text-[11px] text-charcoal-700 flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-forest-600 flex-shrink-0" />
            <span>
              Connected to <strong>Google Gemini API</strong> via server-side agent. Conversational multi-turn context and tool calling active.
            </span>
          </div>
          {groundWithFiles && activeDoc && (
            <span className="text-[10px] text-forest-800 font-semibold flex items-center gap-1 bg-sage-100 px-2.5 py-0.5 rounded-full border border-sage-200">
              <CheckCircle2 className="w-3 h-3 text-forest-600" />
              <span>Grounded: {activeDoc.name}</span>
            </span>
          )}
        </div>

        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isBookmarked = bookmarkedTopics.includes(msg.topic || selectedTopic);

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
                  : 'bg-white border border-academic-border text-charcoal-900 shadow-sm'
              }`}>
                
                {/* Assistant Message Header Actions */}
                {!isUser && (
                  <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-academic-border text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-forest-800">StudyPilot AI</span>
                      <span className="text-[10px] text-charcoal-400">• {msg.timestamp}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Audio Speak Button */}
                      <button
                        onClick={() => speakText(msg.content, msg.language)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isSpeaking 
                            ? 'text-forest-700 bg-sage-100 animate-pulse' 
                            : 'text-charcoal-400 hover:text-charcoal-700 hover:bg-sage-50'
                        }`}
                        title="Listen to audio explanation"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
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
                      title="Keep explaining simpler and simpler without restarting"
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
              <button onClick={resumeSpeech} className="p-1 rounded bg-sage-100 text-charcoal-700" title="Resume">
                <Play className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button onClick={pauseSpeech} className="p-1 rounded bg-sage-100 text-charcoal-700" title="Pause">
                <Pause className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={stopSpeech} className="p-1 rounded bg-rose-100 text-rose-700" title="Stop">
              <VolumeX className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Chat Input Bar */}
      <div className="bg-white border-t border-academic-border p-3 lg:p-4 flex-shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            disabled={isTyping}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Ask any doubt or question (e.g. 'Explain recursion', '17 * 24', 'Hi, who are you?')...`}
            className="flex-1 px-4 py-3 rounded-xl bg-academic-bg border border-academic-border text-charcoal-900 placeholder-charcoal-400 focus:border-forest-600 focus:outline-none text-xs sm:text-sm disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={isTyping || !inputMessage.trim()}
            className="px-5 py-3 rounded-xl bg-forest-600 hover:bg-forest-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center gap-2 transition-all"
          >
            <span className="hidden sm:inline">Ask AI</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};
