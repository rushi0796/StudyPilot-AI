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
  SlidersHorizontal, 
  Lightbulb, 
  BookOpen, 
  HelpCircle, 
  ListOrdered,
  Layers,
  ChevronDown,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Language, DifficultyLevel, ChatMessage } from '../../types';
import { MULTILINGUAL_EXPLANATIONS } from '../../data/mockData';

export const AIAssistantView: React.FC = () => {
  const { 
    studentProfile, 
    updateStudentProfile,
    subjects, 
    activeSubject, 
    setActiveSubjectId,
    speakText,
    stopSpeech,
    pauseSpeech,
    resumeSpeech,
    isSpeaking,
    isSpeechPaused,
    addRevisionTask
  } = useApp();

  const [inputMessage, setInputMessage] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('Relational Database Normalization');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('simple');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bookmarkedTopics, setBookmarkedTopics] = useState<string[]>(['Relational Database Normalization']);
  const [simplificationLevel, setSimplificationLevel] = useState(1);
  const [isTyping, setIsTyping] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initial greeting conversation
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_1',
      sender: 'assistant',
      timestamp: 'Today at 02:30 PM',
      language: studentProfile.preferredLanguage,
      content: `Hello ${studentProfile.name}! I am your **StudyPilot AI Academic Tutor**, personalized for Sanjay Ghodawat University **${studentProfile.branch}** (${studentProfile.semester}).

I can explain any engineering concept from your syllabus, break down mathematical proofs into intuitive analogies, generate 2-10 mark university answers, and narrate everything with voice audio.

What topic would you like to master today? Try asking:
- *"Explain database normalization in simple language"*
- *"Why is 3NF preferred over 2NF with a real-world example?"*
- *"Explain ACID properties with bank transactions"*`,
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

  // Generate intelligent response based on topic, query, language, difficulty, and simplification loop
  const generateAIResponse = (userQuery: string, currentSimpLevel = simplificationLevel) => {
    const qLower = userQuery.toLowerCase();
    const lang = studentProfile.preferredLanguage;

    // Normalization responses
    if (qLower.includes('norm') || qLower.includes('3nf') || qLower.includes('2nf') || qLower.includes('bcnf') || selectedTopic.includes('Normal')) {
      if (lang === 'hi') {
        return {
          content: `### डेटाबेस सामान्यीकरण (Database Normalization - स्तर ${currentSimpLevel})

**सरल परिभाषा:**
डेटाबेस नॉर्मलाइजेशन एक ऐसी प्रक्रिया है जिसमें हम डेटा को व्यवस्थित करके **डेटा दोहराव (Redundancy)** और **विसंगतियों (Anomalies)** को समाप्त करते हैं।

${currentSimpLevel > 1 ? `**अत्यंत सरल उदाहरण (Teach Me More Simply):**
मान लीजिए आपके पास एक बहुत बड़ी स्कूल डायरी है जिसमें हर छात्र के नाम के साथ उसके प्रिंसिपल का नाम और फोन नंबर बार-बार लिखा जाता है। अगर प्रिंसिपल का फोन नंबर बदलता है, तो आपको 1000 पन्नों पर सुधार करना पड़ेगा! 
नॉर्मलाइजेशन कहता है: 'प्रिंसिपल की जानकारी एक अलग पेज पर रखो, और छात्रों के पेज पर सिर्फ एक छोटा कोड लिखो'।` : `**चरण-दर-चरण व्याख्या:**
1. **1NF (पहला सामान्य रूप):** सभी सेल में केवल एकल (Atomic) मान होना चाहिए। कोई बहु-मूल्यवान कॉलम नहीं।
2. **2NF (दूसरा सामान्य रूप):** 1NF + कोई आंशिक निर्भरता (Partial Dependency) नहीं।
3. **3NF (तीसरा सामान्य रूप):** 2NF + कोई सकर्मक निर्भरता (Transitive Dependency) नहीं। (गैर-कुंजी कॉलम किसी अन्य गैर-कुंजी कॉलम पर निर्भर नहीं होना चाहिए)।`}

**संजय घोड़ावत विश्वविद्यालय परीक्षा महत्वपूर्ण बिंदु:**
- **3NF बनाम 2NF:** 2NF आंशिक निर्भरता हटाता है, लेकिन 3NF सकर्मक निर्भरता (Transitive Dependency) को भी हटाकर टेबल को पूर्ण सुरक्षित बनाता है।
- **अंक:** 5 अंक के प्रश्नों में हमेशा 3NF का छात्र-विभाग उदाहरण अवश्य बनाएं।`,
          quiz: {
            question: "3NF में किस प्रकार की निर्भरता को समाप्त किया जाता है?",
            options: ["आंशिक निर्भरता (Partial)", "सकर्मक निर्भरता (Transitive)", "बहु-मूल्यवान निर्भरता (Multivalued)", "पूर्ण निर्भरता (Full)"],
            correctIndex: 1,
            explanation: "3NF सकर्मक निर्भरता (Transitive Dependency) को हटाता है जहां X -> Y और Y -> Z होता है।"
          },
          suggestions: ["Give Me an Example", "Explain More Simply", "Test My Understanding"]
        };
      } else if (lang === 'te') {
        return {
          content: `### డేటాబేస్ నార్మలైజేషన్ (Database Normalization - స్థాయి ${currentSimpLevel})

**సరళమైన వివరణ:**
డేటాబేస్ నార్మలైజేషన్ అనేది రిలేషనల్ టేబుల్స్‌లో అనవసరమైన డేటా పునరావృతాన్ని (Redundancy) మరియు తప్పులను (Anomalies) తొలగించే ఒక పద్ధతి.

${currentSimpLevel > 1 ? `**చాలా సులభమైన ఉదాహరణ (Teach Me More Simply):**
ఒక పెద్ద డైరీలో ప్రతి విద్యార్థి వివరాల పక్కన ప్రిన్సిపాల్ పేరు మరియు ఫోన్ నంబర్ పదే పదే రాయడం వల్ల స్థలం వృధా అవుతుంది. ప్రిన్సిపాల్ ఫోన్ మారితే అందరి పేజీల్లో మార్చాలి!
నార్మలైజేషన్ ద్వారా ప్రిన్సిపాల్ వివరాలను వేరే పట్టికలో భద్రపరిచి, లింక్ చేస్తాము.` : `**దశలవారీగా వివరణ:**
1. **1NF:** ప్రతి కాలమ్‌లో కేవలం విడదీయరాని విలువలు (Atomic values) మాత్రమే ఉండాలి.
2. **2NF:** 1NF నిబంధనలు + పాక్షిక ఆధారపడటం (Partial Dependency) ఉండకూడదు.
3. **3NF:** 2NF నిబంధనలు + ట్రాన్సిటివ్ ఆధారపడటం (Transitive Dependency) ఉండకూడదు.`}

**సంజయ్ ఘోడావత్ విశ్వవిద్యాలయ పరీక్ష ముఖ్యాంశాలు:**
- 2NF పాక్షిక డిపెండెన్సీని మాత్రమే తొలగిస్తుంది, కానీ 3NF ట్రాన్సిటివ్ డిపెండెన్సీని తొలగించి స్థిరత్వాన్ని ఇస్తుంది.
- 5 మార్కుల సమాధానం కోసం స్టూడెంట్ మరియు డిపార్ట్‌మెంట్ ఉదాహరణను తప్పక రాయండి.`,
          quiz: {
            question: "3NF లో తొలగించబడే డిపెండెన్సీ ఏది?",
            options: ["పాక్షిక డిపెండెన్సీ", "ట్రాన్సిటివ్ డిపెండెన్సీ", "మల్టీవాల్యూడ్ డిపెండెన్సీ", "డొమైన్ డిపెండెన్సీ"],
            correctIndex: 1,
            explanation: "3NF లో నాన్-ప్రైమ్ అట్రిబ్యూట్స్ మధ్య ఉండే ట్రాన్సిటివ్ డిపెండెన్సీని తొలగిస్తారు."
          },
          suggestions: ["Give Me an Example", "Explain More Simply", "Test My Understanding"]
        };
      } else {
        // English
        return {
          content: `### Database Normalization (Explanation Level ${currentSimpLevel})

**Simple Definition:**
Database Normalization is the systematic method of decomposing tables to minimize **data redundancy** and eliminate undesirable **insertion, update, and deletion anomalies**.

${currentSimpLevel > 1 ? `**Simplified Everyday Analogy (Teach Me More Simply):**
Think of managing a university spreadsheet: If you keep Student details and Department Head details on every single row, you duplicate the Head's phone number 5,000 times!
- If the Head changes phone numbers, you must edit 5,000 rows (**Update Anomaly**).
- If you delete the last student, you lose the Department's record (**Deletion Anomaly**).
- Normalization splits this into two neat tables: \`Students\` and \`Departments\`, connected by a clean Foreign Key.` : `**Step-by-Step Breakdown:**
1. **1NF (First Normal Form):** Every column must contain atomic (indivisible) values. No comma-separated lists or repeating groups.
2. **2NF (Second Normal Form):** Meets 1NF + eliminates **Partial Dependency** (non-prime attributes must depend on the WHOLE candidate key, not part of a composite key).
3. **3NF (Third Normal Form):** Meets 2NF + eliminates **Transitive Dependency** (non-prime attributes cannot depend on other non-prime attributes: $X \\rightarrow Y \\rightarrow Z$).
4. **BCNF (Boyce-Codd Normal Form):** Stricter version where for EVERY functional dependency $X \\rightarrow Y$, the determinant $X$ must strictly be a Superkey.`}

**Why 3NF is Preferred Over 2NF (Crucial 5-Mark Exam Question):**
2NF only resolves partial dependencies on composite keys. A table with a single primary key is already in 2NF, but can still suffer from dangerous transitive dependencies that cause duplicate data! 3NF cleanly splits transitive dependencies into dedicated tables.

**Important Sanjay Ghodawat University Examination Points:**
- **Marks Value:** 5 to 7 marks in SGU Semester III DBMS end-term examination.
- **Always Include:** Schema before decomposition $\\rightarrow$ FDs identified $\\rightarrow$ Two decomposed tables with Primary & Foreign Keys labeled!`,
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
          suggestions: ["Give Me an Example", "Explain More Simply", "Test My Understanding"]
        };
      }
    }

    // ACID Properties response
    if (qLower.includes('acid') || qLower.includes('transaction') || selectedTopic.includes('Transaction')) {
      return {
        content: `### ACID Properties in DBMS Transactions

A **Transaction** is a logical unit of work in a database. To ensure data consistency even during power failures and concurrent access, every transaction must obey the **ACID** contract:

1. **Atomicity (All or Nothing):**
   - Either all operations of the transaction execute completely, or none do.
   - *Real-World Example:* If ₹5,000 is debited from Rushikesh's account, but the network fails before crediting SGU University fees, the debit is completely rolled back. Rushikesh doesn't lose money.

2. **Consistency (Integrity Invariant):**
   - The database moves from one valid consistent state to another, never violating constraints like balance $\\ge 0$.

3. **Isolation (Non-Interference):**
   - Concurrently executing transactions cannot see each other's intermediate uncommitted states.

4. **Durability (Permanent Storage):**
   - Once a transaction commits, its modifications are permanently recorded on non-volatile disk via Write-Ahead Logging (WAL), surviving power cuts.

**SGU Exam Tip:** ACID questions frequently appear as 2-Mark definitions or 5-Mark detailed questions with banking transaction timelines.`,
        quiz: {
          question: "Which mechanism guarantees Durability in DBMS even if the server crashes right after commit?",
          options: ["Two-Phase Locking (2PL)", "Write-Ahead Logging (WAL)", "Referential Integrity", "Query Parsing"],
          correctIndex: 1,
          explanation: "Write-Ahead Logging writes all log records to non-volatile disk before committing, ensuring redo recovery on reboot."
        },
        suggestions: ["Give Me an Example", "Explain More Simply", "Test My Understanding"]
      };
    }

    // Fallback general AI engineering response
    return {
      content: `### ${selectedTopic} - Conceptual Breakdown

**Core Overview:**
In the context of **${activeSubject.name} (${activeSubject.code})** at Sanjay Ghodawat University, this concept forms a key pillar of Unit syllabus requirements.

**Key Technical Principles:**
1. **Mathematical / Structural Model:** Formulates the problem using formal definitions, invariant rules, and computational trade-offs.
2. **Algorithmic Flow:** Operates deterministically to maintain data consistency and minimize time/space complexity.
3. **University Exam Application:** Common in 4-Mark and 7-Mark theoretical and problem-solving questions.

**Next Steps:**
Click **"Give Me an Example"** for a concrete case study, or **"Explain More Simply"** if you'd like an everyday analogy!`,
      quiz: {
        question: `What is the primary objective of studying ${selectedTopic}?`,
        options: [
          "Optimizing data structures and query efficiency",
          "Eliminating algorithmic redundancy",
          "Ensuring correctness according to specifications",
          "All of the above"
        ],
        correctIndex: 3,
        explanation: "All listed principles are core goals in university computer science and AI curricula."
      },
      suggestions: ["Give Me an Example", "Explain More Simply", "Test My Understanding"]
    };
  };

  const handleSendMessage = (textToSend?: string) => {
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

    setTimeout(() => {
      const responseData = generateAIResponse(text);
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
        audioAvailable: true
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 700);
  };

  // Progressive Simplification: "Teach Me Until I Understand"
  const handleTeachMeSimply = () => {
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

    setTimeout(() => {
      const responseData = generateAIResponse(selectedTopic, nextLevel);
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
        audioAvailable: true
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 700);
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
      // Automatically recommend to Revision Planner if student missed it!
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
    <div className="flex flex-col h-[calc(100vh-130px)] lg:h-[calc(100vh-125px)] bg-navy-950 rounded-2xl border border-navy-800 overflow-hidden shadow-2xl animate-in fade-in duration-200">
      
      {/* 1. Assistant Top Control Bar */}
      <div className="bg-navy-900 border-b border-navy-800 p-3 lg:px-5 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        
        {/* Left: Active Subject & Topic Picker */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-electric-500/20 text-electric-400 flex items-center justify-center font-bold">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                AI Study Tutor
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-electric-500/15 text-electric-300 border border-electric-500/30">
                SGU Demo Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Personalized for {activeSubject.name} ({activeSubject.code})
            </p>
          </div>
        </div>

        {/* Right: Topic Dropdown, Language & Difficulty Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          
          {/* Topic Selector */}
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-navy-950 border border-navy-700 text-slate-200 focus:border-electric-500 focus:outline-none text-xs"
          >
            <option value="Relational Database Normalization">Topic: Normalization (3NF/BCNF)</option>
            <option value="Transaction Concepts & ACID Properties">Topic: ACID Properties</option>
            <option value="B-Trees and B+ Trees Architecture">Topic: B+ Tree Indexing</option>
            <option value="Conflict Serializability & Graphs">Topic: Conflict Serializability</option>
          </select>

          {/* Difficulty Toggle: Simple | Standard | Detailed */}
          <div className="flex items-center bg-navy-950 p-0.5 rounded-xl border border-navy-700">
            {(['simple', 'standard', 'detailed'] as DifficultyLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all ${
                  difficulty === level 
                    ? 'bg-electric-500 text-white shadow' 
                    : 'text-slate-400 hover:text-slate-200'
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
            className="px-2.5 py-1.5 rounded-xl bg-navy-950 border border-navy-700 text-slate-200 focus:border-electric-500 focus:outline-none text-xs uppercase font-semibold"
          >
            <option value="en">EN (English)</option>
            <option value="hi">HI (हिंदी)</option>
            <option value="te">TE (తెలుగు)</option>
          </select>
        </div>

      </div>

      {/* 2. Chat Conversation Feed */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">
        
        {/* Pre-study Banner Notice */}
        <div className="p-3 rounded-xl bg-navy-900/60 border border-navy-800 text-[11px] text-slate-400 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-electric-400 flex-shrink-0" />
            <span>Operating in local academic prototype mode. All explanations are aligned with Sanjay Ghodawat University 2nd-Year AI curriculum.</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold flex-shrink-0">● Active</span>
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
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-electric-600 to-violet-600 text-white flex items-center justify-center flex-shrink-0 shadow">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-2xl rounded-2xl p-4 lg:p-5 text-xs sm:text-sm leading-relaxed ${
                isUser 
                  ? 'bg-electric-600 text-white shadow-glow' 
                  : 'bg-navy-900 border border-navy-800 text-slate-200 shadow-xl'
              }`}>
                
                {/* Assistant Message Header Actions */}
                {!isUser && (
                  <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-navy-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-electric-300">StudyPilot AI Tutor</span>
                      <span className="text-[10px] text-slate-500">• {msg.timestamp}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Audio Speak Button */}
                      <button
                        onClick={() => speakText(msg.content, msg.language)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isSpeaking 
                            ? 'text-violet-400 bg-violet-500/20 animate-pulse' 
                            : 'text-slate-400 hover:text-white hover:bg-navy-800'
                        }`}
                        title="Listen to audio explanation"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Copy Explanation */}
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      {/* Bookmark Topic */}
                      <button
                        onClick={() => toggleBookmark(msg.topic || selectedTopic)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-navy-800 transition-colors"
                        title={isBookmarked ? "Topic bookmarked" : "Bookmark topic"}
                      >
                        {isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> : <Bookmark className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Message Content with Markdown Formatting */}
                <div className="prose prose-invert prose-xs max-w-none space-y-2 whitespace-pre-wrap">
                  {msg.content}
                </div>

                {/* Embedded Mini-Quiz if available */}
                {!isUser && msg.quizPrompt && (
                  <div className="mt-4 p-3.5 rounded-xl bg-navy-950/80 border border-navy-800 text-xs">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-navy-850">
                      <span className="font-bold text-violet-300 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5" />
                        Quick Understanding Check
                      </span>
                      <span className="text-[10px] text-slate-400">1 Question</span>
                    </div>

                    <p className="font-medium text-slate-200 mb-2.5">
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
                                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-semibold'
                                  : isSelected
                                    ? 'bg-rose-500/20 border-rose-500 text-rose-200 font-semibold'
                                    : 'bg-navy-900 border-navy-800 text-slate-400'
                                : 'bg-navy-900 border-navy-800 hover:border-electric-500/50 text-slate-300 hover:text-white'
                            }`}
                          >
                            <span>{opt}</span>
                            {answerState && isCorrect && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                          </button>
                        );
                      })}
                    </div>

                    {answeredQuizzes[msg.id] && (
                      <div className={`mt-2.5 p-2 rounded-lg text-[11px] ${
                        answeredQuizzes[msg.id].correct 
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}>
                        <p className="font-bold">
                          {answeredQuizzes[msg.id].correct ? "✓ Correct!" : "✗ Needs Revision:"}
                        </p>
                        <p className="mt-0.5 text-slate-300">{msg.quizPrompt.explanation}</p>
                        {!answeredQuizzes[msg.id].correct && (
                          <p className="mt-1 text-[10px] text-amber-300 font-semibold">
                            → Added to your Revision Planner automatically!
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Follow-up Quick Action Buttons */}
                {!isUser && msg.followUpSuggestions && (
                  <div className="mt-4 pt-3 border-t border-navy-800 flex flex-wrap gap-2">
                    <button
                      onClick={handleTeachMeSimply}
                      className="px-2.5 py-1.5 rounded-lg bg-electric-500/15 hover:bg-electric-500/25 text-electric-300 border border-electric-500/30 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                      title="Keep explaining simpler and simpler without restarting"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Explain More Simply</span>
                    </button>

                    <button
                      onClick={() => handleSendMessage(`Give me a detailed real-world example of ${selectedTopic}`)}
                      className="px-2.5 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 text-slate-300 hover:text-white border border-navy-700 text-[11px] font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Lightbulb className="w-3 h-3 text-amber-400" />
                      <span>Give Me an Example</span>
                    </button>

                    <button
                      onClick={() => handleSendMessage(`Test my understanding on ${selectedTopic} with a 5-mark university exam question`)}
                      className="px-2.5 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 text-slate-300 hover:text-white border border-navy-700 text-[11px] font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <HelpCircle className="w-3 h-3 text-violet-400" />
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
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-electric-600 to-violet-600 text-white flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="p-4 rounded-2xl bg-navy-900 border border-navy-800 text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-electric-400 animate-ping" />
              <span>StudyPilot AI is structuring explanation with SGU marking rubrics...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* 3. Audio Player Bar (when speaking) */}
      {isSpeaking && (
        <div className="bg-navy-900 border-t border-navy-800 px-4 py-2 flex items-center justify-between text-xs animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 h-5">
              <span className="w-1 bg-violet-400 rounded-full wave-bar-1" />
              <span className="w-1 bg-violet-400 rounded-full wave-bar-2" />
              <span className="w-1 bg-violet-400 rounded-full wave-bar-3" />
              <span className="w-1 bg-violet-400 rounded-full wave-bar-4" />
              <span className="w-1 bg-violet-400 rounded-full wave-bar-5" />
            </div>
            <span className="text-slate-300 font-medium">
              Audio Narration: <strong className="text-white">{studentProfile.preferredLanguage.toUpperCase()}</strong> Voice Engine
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isSpeechPaused ? (
              <button onClick={resumeSpeech} className="p-1 rounded bg-navy-800 hover:bg-navy-700 text-white" title="Resume">
                <Play className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button onClick={pauseSpeech} className="p-1 rounded bg-navy-800 hover:bg-navy-700 text-white" title="Pause">
                <Pause className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={stopSpeech} className="p-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30" title="Stop">
              <VolumeX className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Chat Input Bar */}
      <div className="bg-navy-900 border-t border-navy-800 p-3 lg:p-4 flex-shrink-0">
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
            className="flex-1 px-4 py-3 rounded-xl bg-navy-950 border border-navy-700 text-white placeholder-slate-500 focus:border-electric-500 focus:outline-none text-xs sm:text-sm"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="px-5 py-3 rounded-xl bg-electric-600 hover:bg-electric-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-glow flex items-center gap-2 transition-all"
          >
            <span className="hidden sm:inline">Ask AI</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};
