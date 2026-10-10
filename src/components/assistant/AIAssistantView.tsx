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
  Cpu
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Language, DifficultyLevel, ChatMessage, DocumentChunk } from '../../types';
import { askGeminiTutor, isLiveAiAvailable, getStoredModel } from '../../services/aiProvider';

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

  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeDoc = uploadedDocuments.find(d => d.id === activeDocumentId) || uploadedDocuments[0];
  const isLive = isLiveAiAvailable();
  const currentModel = getStoredModel();

  // Initial greeting conversation
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_1',
      sender: 'assistant',
      timestamp: 'Today at 02:30 PM',
      language: studentProfile.preferredLanguage,
      content: `Hello ${studentProfile.name}! I am your **StudyPilot AI Academic Tutor**, personalized for Sanjay Ghodawat University **${studentProfile.branch}** (${studentProfile.semester}).

${isLive ? `⚡ **Live Generative Intelligence Active (${currentModel})**: Connected to Google Gemini with document grounding and semantic citation search.` : `📚 **Operating in Local Academic Demo Mode**: Aligned with the SGU curriculum rubric. You can add your free Google Gemini API key in **Settings** anytime to unlock dynamic live generation!`}

You can ask any doubt from your syllabus or uploaded study materials:
- *"Explain database normalization in simple language with an analogy"*
- *"Why is 3NF preferred over 2NF in university exam questions?"*
- *"Explain ACID properties with real-world banking transactions"*`,
      followUpSuggestions: [
        "Explain database normalization in simple language",
        "Why is 3NF preferred over 2NF?",
        "Explain ACID properties of transactions"
      ]
    }
  ]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

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
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

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
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  // Progressive Simplification: "Teach Me Until I Understand"
  const handleTeachMeSimply = async () => {
    const nextLevel = simplificationLevel + 1;
    setSimplificationLevel(nextLevel);

    const promptText = `Explain ${selectedTopic} even more simply! (Simplification Level ${nextLevel})`;
    
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      timestamp: 'Just now',
      language: studentProfile.preferredLanguage,
      content: promptText,
      topic: selectedTopic
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      let chunksToPass: DocumentChunk[] = [];
      if (groundWithFiles && activeDoc) {
        chunksToPass = activeDoc.chunks.slice(0, 3);
      }

      const responseData = await askGeminiTutor({
        query: `Explain ${selectedTopic} in ultra-simple ELI5 everyday language with a visual analogy`,
        subject: activeSubject.name,
        topic: selectedTopic,
        language: studentProfile.preferredLanguage,
        difficulty: 'simple',
        simplificationLevel: nextLevel,
        documentChunks: chunksToPass
      });

      const assistantMsg: ChatMessage = {
        id: `msg_asst_${Date.now()}`,
        sender: 'assistant',
        timestamp: 'Just now',
        language: studentProfile.preferredLanguage,
        content: responseData.content,
        topic: selectedTopic,
        difficulty: 'simple',
        followUpSuggestions: ["Explain More Simply", "Give Me an Example", "Test My Understanding"],
        quizPrompt: responseData.quiz,
        audioAvailable: true,
        documentCitations: responseData.citations
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
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
    <div className="flex flex-col h-[calc(100vh-130px)] lg:h-[calc(100vh-125px)] bg-white rounded-3xl border border-[#E5E0D5] overflow-hidden shadow-card animate-in fade-in duration-200">
      
      {/* 1. Assistant Top Control Bar */}
      <div className="bg-[#FDFCF9] border-b border-[#E5E0D5] p-3 lg:px-5 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        
        {/* Left: Active Subject & AI Engine Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest-100 border border-forest-200 text-forest-700 flex items-center justify-center font-bold shadow-subtle">
            <Bot className="w-5 h-5 text-forest-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-charcoal-900 flex items-center gap-1.5">
                AI Study Tutor
              </h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isLive 
                  ? 'bg-forest-100 text-forest-800 border border-forest-300' 
                  : 'bg-sage-100 text-charcoal-700 border border-[#E5E0D5]'
              }`}>
                {isLive ? `Gemini 1.5 Flash` : 'Academic Demo Engine'}
              </span>
            </div>
            <p className="text-[11px] text-charcoal-400">
              Curriculum: {activeSubject.name} ({activeSubject.code})
            </p>
          </div>
        </div>

        {/* Right: Topic Dropdown, Document Grounding, Language & Difficulty */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          
          {/* Document Grounding Selector */}
          {uploadedDocuments.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-[#E5E0D5] text-charcoal-700">
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

          {/* Topic Selector */}
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-[#E5E0D5] text-charcoal-800 focus:border-forest-500 focus:outline-none text-xs font-medium shadow-subtle"
          >
            <option value="Relational Database Normalization">Topic: Normalization (3NF/BCNF)</option>
            <option value="Transaction Concepts & ACID Properties">Topic: ACID Properties</option>
            <option value="B-Trees and B+ Trees Architecture">Topic: B+ Tree Indexing</option>
            <option value="Conflict Serializability & Graphs">Topic: Conflict Serializability</option>
          </select>

          {/* Difficulty Toggle: Simple | Standard | Detailed */}
          <div className="flex items-center bg-academic-bg p-0.5 rounded-xl border border-[#E5E0D5]">
            {(['simple', 'standard', 'detailed'] as DifficultyLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all ${
                  difficulty === level 
                    ? 'bg-forest-500 text-white shadow-subtle' 
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
            className="px-2.5 py-1.5 rounded-xl bg-white border border-[#E5E0D5] text-charcoal-800 focus:border-forest-500 focus:outline-none text-xs uppercase font-bold shadow-subtle"
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
        <div className="p-3 rounded-2xl bg-white border border-[#E5E0D5] text-[11px] text-charcoal-700 flex items-center justify-between gap-2 shadow-subtle">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-forest-600 flex-shrink-0" />
            <span>
              {isLive ? (
                <>Connected to <strong>Google Gemini</strong>. Grounded in university curriculum standards.</>
              ) : (
                <>Operating in demo mode. Add your free <strong>Gemini API Key</strong> in <button onClick={() => setActiveView('settings')} className="text-forest-600 font-bold underline">Settings</button> to unlock live generation.</>
              )}
            </span>
          </div>
          {groundWithFiles && activeDoc && (
            <span className="text-[10px] text-forest-700 font-semibold flex items-center gap-1 bg-forest-50 px-2 py-0.5 rounded-full border border-forest-200">
              <CheckCircle2 className="w-3 h-3 text-forest-600" />
              <span>Grounded in: {activeDoc.name}</span>
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
                <div className="w-8 h-8 rounded-xl bg-forest-500 text-white flex items-center justify-center flex-shrink-0 shadow-subtle">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-2xl rounded-2xl p-4 lg:p-5 text-xs sm:text-sm leading-relaxed ${
                isUser 
                  ? 'bg-forest-500 text-white shadow-card' 
                  : 'bg-white border border-[#E5E0D5] text-charcoal-900 shadow-subtle'
              }`}>
                
                {/* Assistant Message Header Actions */}
                {!isUser && (
                  <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#E5E0D5] text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-forest-800">StudyPilot AI Tutor</span>
                      <span className="text-[10px] text-charcoal-400">• {msg.timestamp}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Audio Speak Button */}
                      <button
                        onClick={() => speakText(msg.content, msg.language)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isSpeaking 
                            ? 'text-forest-700 bg-forest-100 animate-pulse' 
                            : 'text-charcoal-400 hover:text-charcoal-700 hover:bg-sage-100'
                        }`}
                        title="Listen to audio explanation"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Copy Explanation */}
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-700 hover:bg-sage-100 transition-colors"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-forest-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      {/* Bookmark Topic */}
                      <button
                        onClick={() => toggleBookmark(msg.topic || selectedTopic)}
                        className="p-1.5 rounded-lg text-charcoal-400 hover:text-gold-500 hover:bg-sage-100 transition-colors"
                        title={isBookmarked ? "Topic bookmarked" : "Bookmark topic"}
                      >
                        {isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5 text-gold-500 fill-gold-500" /> : <Bookmark className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Message Content with Markdown Formatting */}
                <div className="prose prose-sm max-w-none space-y-2 whitespace-pre-wrap text-charcoal-900">
                  {msg.content}
                </div>

                {/* Citations if available */}
                {!isUser && msg.documentCitations && msg.documentCitations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[#E5E0D5] text-[11px] text-charcoal-400">
                    <span className="font-bold text-forest-700 block mb-1">Document Citations:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.documentCitations.map((cit, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-sage-50 text-forest-800 border border-forest-200 text-[10px] font-mono">
                          {cit}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Embedded Mini-Quiz if available */}
                {!isUser && msg.quizPrompt && (
                  <div className="mt-4 p-3.5 rounded-xl bg-academic-bg border border-[#E5E0D5] text-xs">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5E0D5]">
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
                                  ? 'bg-forest-100 border-forest-400 text-forest-900 font-bold'
                                  : isSelected
                                    ? 'bg-rose-100 border-rose-300 text-rose-900 font-bold'
                                    : 'bg-white border-[#E5E0D5] text-charcoal-400'
                                : 'bg-white border-[#E5E0D5] hover:border-forest-400 text-charcoal-800'
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
                          ? 'bg-forest-100 text-forest-900 border border-forest-300' 
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
                  <div className="mt-4 pt-3 border-t border-[#E5E0D5] flex flex-wrap gap-2">
                    <button
                      onClick={handleTeachMeSimply}
                      className="px-2.5 py-1.5 rounded-lg bg-forest-50 hover:bg-forest-100 text-forest-700 border border-forest-200 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                      title="Keep explaining simpler and simpler without restarting"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Explain More Simply</span>
                    </button>

                    <button
                      onClick={() => handleSendMessage(`Give me a detailed real-world example of ${selectedTopic}`)}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-sage-50 text-charcoal-700 border border-[#E5E0D5] text-[11px] font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-gold-500" />
                      <span>Give Me an Example</span>
                    </button>

                    <button
                      onClick={() => handleSendMessage(`Test my understanding on ${selectedTopic} with a 5-mark university exam question`)}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-sage-50 text-charcoal-700 border border-[#E5E0D5] text-[11px] font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-forest-600" />
                      <span>Test My Understanding</span>
                    </button>
                  </div>
                )}

              </div>
            </div>
          );
        })}

        {/* AI Typing Indicator */}
        {isTyping && (
          <div className="flex gap-3 justify-start animate-in fade-in duration-150">
            <div className="w-8 h-8 rounded-xl bg-forest-500 text-white flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#E5E0D5] text-xs text-charcoal-700 flex items-center gap-2 shadow-subtle">
              <span className="w-2 h-2 rounded-full bg-forest-500 animate-ping" />
              <span>StudyPilot AI is synthesizing explanation with university marking rubrics...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* 3. Audio Player Bar (when speaking) */}
      {isSpeaking && (
        <div className="bg-white border-t border-[#E5E0D5] px-4 py-2 flex items-center justify-between text-xs animate-in slide-in-from-bottom-2">
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
      <div className="bg-white border-t border-[#E5E0D5] p-3 lg:p-4 flex-shrink-0">
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
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Ask any doubt in ${studentProfile.preferredLanguage === 'hi' ? 'Hindi' : studentProfile.preferredLanguage === 'te' ? 'Telugu' : 'English'} (e.g. 'Explain database normalization in simple language')...`}
            className="flex-1 px-4 py-3 rounded-xl bg-academic-bg border border-[#E5E0D5] text-charcoal-900 placeholder-charcoal-400 focus:border-forest-500 focus:outline-none text-xs sm:text-sm"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="px-5 py-3 rounded-xl bg-forest-500 hover:bg-forest-600 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-card flex items-center gap-2 transition-all"
          >
            <span className="hidden sm:inline">Ask AI</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};
