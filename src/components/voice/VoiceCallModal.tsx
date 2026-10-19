import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  AlertCircle, 
  Globe, 
  Clock, 
  BookOpen, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw,
  Play,
  X,
  Radio
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  speechService, 
  isSpeechRecognitionSupported, 
  isSpeechSynthesisSupported, 
  cleanTextForSpeech, 
  LANGUAGE_CONFIGS,
  SpeechRecognitionErrorDetails 
} from '../../services/speechService';
import { askGeminiTutor, ChatHistoryTurn } from '../../services/aiProvider';
import { Language } from '../../types';

export type VoiceCallState = 
  | 'idle'          // Pre-call screen: user chooses to start
  | 'connecting'    // Initializing microphone and voice stream
  | 'listening'     // Listening to student speech
  | 'thinking'      // Calling Gemini API
  | 'speaking'      // AI speaking response aloud
  | 'muted'         // Microphone muted by user
  | 'error'         // Permission denied or network failure
  | 'ended';        // Call concluded, showing summary

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CallTurn {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({ isOpen, onClose }) => {
  const { studentProfile, activeSubject, subjects } = useApp();
  const { currentUser } = useAuth();

  // Call status
  const [callState, setCallState] = useState<VoiceCallState>('idle');
  const [errorMessage, setErrorMessage] = useState<{ title: string; description: string } | null>(null);

  // Audio & Mic controls
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    studentProfile?.preferredLanguage || 'en'
  );

  // Transcripts & Conversation
  const [interimTranscript, setInterimTranscript] = useState('');
  const [currentAssistantSpeech, setCurrentAssistantSpeech] = useState('');
  const [callHistory, setCallHistory] = useState<CallTurn[]>([]);
  const [showFullTranscript, setShowFullTranscript] = useState(false);

  // Call duration timer
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);
  const callTimerRef = useRef<any>(null);

  // Gemini conversation history across turns
  const geminiHistoryRef = useRef<ChatHistoryTurn[]>([]);

  // Silence auto-submit timer
  const silenceTimerRef = useRef<any>(null);
  const latestTranscriptRef = useRef('');

  // Audio wave animation amplitude simulation
  const [audioLevel, setAudioLevel] = useState(0.2);

  const hasSpeechSupport = isSpeechRecognitionSupported() && isSpeechSynthesisSupported();

  // Reset or teardown when modal closes
  useEffect(() => {
    if (!isOpen) {
      endCallCleanup();
      setCallState('idle');
      setCallDurationSeconds(0);
      setInterimTranscript('');
      setCurrentAssistantSpeech('');
      setCallHistory([]);
      geminiHistoryRef.current = [];
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleEndCall();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, callState]);

  // Call duration timer effect
  useEffect(() => {
    if (callState !== 'idle' && callState !== 'error' && callState !== 'ended') {
      if (!callTimerRef.current) {
        callTimerRef.current = setInterval(() => {
          setCallDurationSeconds(prev => prev + 1);
        }, 1000);
      }
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    }
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    };
  }, [callState]);

  // Audio wave pulsing simulation during listening or speaking
  useEffect(() => {
    let animInterval: any = null;
    if (callState === 'listening' || callState === 'speaking') {
      animInterval = setInterval(() => {
        setAudioLevel(0.2 + Math.random() * 0.8);
      }, 150);
    } else {
      setAudioLevel(0.2);
    }
    return () => clearInterval(animInterval);
  }, [callState]);

  /* ==========================================================================
     START & END CALL LIFECYCLE
     ========================================================================== */

  const handleStartCall = () => {
    if (!hasSpeechSupport) {
      setCallState('error');
      setErrorMessage({
        title: 'Browser Compatibility Notice',
        description: 'Web Speech Recognition or Synthesis is not supported in your browser. Please use Chrome, Edge, or Safari for voice calling.'
      });
      return;
    }

    setCallState('connecting');
    setCallDurationSeconds(0);
    setCallHistory([]);
    geminiHistoryRef.current = [];
    setErrorMessage(null);

    // Short simulated handshake before listening
    setTimeout(() => {
      startListeningLoop();
    }, 600);
  };

  const endCallCleanup = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    speechService.stopListening();
    speechService.stopSpeaking();
  };

  const handleEndCall = () => {
    endCallCleanup();
    setCallState('ended');
  };

  /* ==========================================================================
     CONTINUOUS TWO-WAY VOICE LOOP
     ========================================================================== */

  const startListeningLoop = () => {
    if (isMicMuted) {
      setCallState('muted');
      return;
    }

    endCallCleanup();
    setCallState('listening');
    setInterimTranscript('');
    latestTranscriptRef.current = '';

    speechService.startListening({
      language: selectedLanguage,
      onStateChange: (state, err) => {
        if (state === 'error' && err) {
          handleSpeechError(err);
        }
      },
      onTranscript: (interim, final) => {
        const fullTranscript = (final + ' ' + interim).trim();
        setInterimTranscript(fullTranscript);
        latestTranscriptRef.current = fullTranscript;

        // Barge-in: If user speaks while assistant was speaking, abort speaking immediately
        if (speechService.isSpeaking()) {
          speechService.stopSpeaking();
          setCurrentAssistantSpeech('');
          setCallState('listening');
        }

        // Debounce silence: When user pauses for 1.4 seconds, trigger AI query
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        if (fullTranscript.length > 2) {
          silenceTimerRef.current = setTimeout(() => {
            handleStudentFinishedSpeaking(fullTranscript);
          }, 1400);
        }
      },
      onError: (err) => {
        handleSpeechError(err);
      },
      onEnd: (final) => {
        // If recognition automatically ends on silence and we have transcript, process it
        const pending = final.trim() || latestTranscriptRef.current.trim();
        if (pending.length > 2 && callState === 'listening') {
          handleStudentFinishedSpeaking(pending);
        }
      }
    });
  };

  const handleSpeechError = (err: SpeechRecognitionErrorDetails) => {
    if (err.code === 'not-allowed' || err.code === 'permission-denied') {
      endCallCleanup();
      setCallState('error');
      setErrorMessage({
        title: 'Microphone Permission Needed',
        description: 'Microphone access was denied. Click the lock/tune icon in your browser address bar, set Microphone to "Allow", and try again.'
      });
    } else if (err.code === 'no-speech') {
      // Normal silence timeout; resume listening if still in active call
      if (callState === 'listening') {
        startListeningLoop();
      }
    } else if (err.code === 'audio-capture') {
      endCallCleanup();
      setCallState('error');
      setErrorMessage({
        title: 'Microphone Input Not Found',
        description: 'No microphone was detected on this device. Please connect an audio input device.'
      });
    } else if (err.code !== 'aborted') {
      // Other recoverable error: restart listening
      setTimeout(() => {
        if (callState === 'listening') startListeningLoop();
      }, 500);
    }
  };

  /* ==========================================================================
     AI PROCESSING & SPEAKING
     ========================================================================== */

  const handleStudentFinishedSpeaking = async (spokenText: string) => {
    if (!spokenText.trim() || spokenText.trim().length < 2) return;

    // Stop listening while thinking
    speechService.stopListening();
    setCallState('thinking');
    setInterimTranscript(spokenText);

    // Record turn in history
    const userTurn: CallTurn = {
      id: `turn_${Date.now()}_u`,
      sender: 'user',
      text: spokenText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setCallHistory(prev => [...prev, userTurn]);

    try {
      // Call server-side Gemini API with voiceMode: true
      const response = await askGeminiTutor({
        query: spokenText,
        history: geminiHistoryRef.current,
        subject: activeSubject?.name || 'Computer Science & AI',
        topic: activeSubject?.units?.[0]?.topics?.[0]?.title || 'General Academic Study',
        language: selectedLanguage,
        difficulty: 'standard',
        voiceMode: true,
        academicProfile: {
          university: currentUser?.university || studentProfile?.university,
          course: currentUser?.course || studentProfile?.course,
          branch: currentUser?.branch || studentProfile?.branch,
          semester: currentUser?.semester || studentProfile?.semester
        }
      });

      const replyText = response.content || 'I heard your question. Let me know how else I can help.';
      const cleanSpokenReply = cleanTextForSpeech(replyText);

      // Record in Gemini multi-turn history
      geminiHistoryRef.current.push({ role: 'user', content: spokenText });
      geminiHistoryRef.current.push({ role: 'assistant', content: cleanSpokenReply });

      // Add assistant turn to UI history
      const assistantTurn: CallTurn = {
        id: `turn_${Date.now()}_a`,
        sender: 'assistant',
        text: cleanSpokenReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setCallHistory(prev => [...prev, assistantTurn]);
      setCurrentAssistantSpeech(cleanSpokenReply);

      // Transition to speaking state
      setCallState('speaking');

      // Speak response aloud if speaker is not muted
      if (!isSpeakerMuted) {
        speechService.speak({
          text: cleanSpokenReply,
          language: selectedLanguage,
          onStart: () => {
            setCallState('speaking');
          },
          onEnd: () => {
            // After speaking finishes, smoothly resume listening for the student's next question
            setCurrentAssistantSpeech('');
            startListeningLoop();
          },
          onError: () => {
            setCurrentAssistantSpeech('');
            startListeningLoop();
          }
        });
      } else {
        // If speaker muted, show reply for 3s then resume listening
        setTimeout(() => {
          setCurrentAssistantSpeech('');
          startListeningLoop();
        }, 3000);
      }

    } catch (err: any) {
      console.warn('Voice AI tutor error:', err);
      const fallbackReply = 'I encountered a connection issue. Please ask again.';
      setCurrentAssistantSpeech(fallbackReply);
      setCallState('speaking');
      speechService.speak({
        text: fallbackReply,
        language: selectedLanguage,
        onEnd: () => {
          startListeningLoop();
        }
      });
    }
  };

  /* ==========================================================================
     INTERRUPT / BARGE-IN HANDLER
     ========================================================================== */

  const handleInterrupt = () => {
    speechService.stopSpeaking();
    setCurrentAssistantSpeech('');
    startListeningLoop();
  };

  /* ==========================================================================
     MIC & SPEAKER TOGGLE
     ========================================================================== */

  const toggleMic = () => {
    if (isMicMuted) {
      setIsMicMuted(false);
      startListeningLoop();
    } else {
      setIsMicMuted(true);
      endCallCleanup();
      setCallState('muted');
    }
  };

  const toggleSpeaker = () => {
    if (!isSpeakerMuted) {
      speechService.stopSpeaking();
      setIsSpeakerMuted(true);
    } else {
      setIsSpeakerMuted(false);
    }
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-charcoal-950/85 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0D1F18] border border-emerald-500/30 text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* 1. Header Bar */}
        <div className="px-6 py-4 border-b border-emerald-500/20 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-forest-700/80 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>StudyPilot AI Voice Assistant</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </h2>
              <p className="text-[11px] text-emerald-300/70">
                {currentUser?.name || studentProfile.name} • {activeSubject?.code || 'CS201'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Call Duration Pill */}
            {callState !== 'idle' && callState !== 'ended' && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 border border-emerald-500/30 text-xs font-mono font-semibold text-emerald-300">
                <Clock className="w-3 h-3 text-emerald-400" />
                {formatDuration(callDurationSeconds)}
              </span>
            )}

            {/* Close / Minimize */}
            <button
              onClick={handleEndCall}
              aria-label="Close Voice Assistant"
              className="p-1.5 rounded-xl text-emerald-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Main Call Canvas */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center overflow-y-auto space-y-6">
          
          {/* A. PRE-CALL IDLE SCREEN */}
          {callState === 'idle' && (
            <div className="space-y-6 py-4 max-w-sm">
              <div className="relative mx-auto w-24 h-24 rounded-full bg-gradient-to-tr from-forest-800 to-emerald-500 flex items-center justify-center shadow-xl border border-emerald-300/30">
                <Radio className="w-10 h-10 text-white animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-white tracking-tight">
                  Start Real-Time Voice Call
                </h3>
                <p className="text-xs text-emerald-200/80 leading-relaxed">
                  Have a natural, two-way academic conversation with your AI tutor. Ask questions, clarify concepts, or revise syllabus topics hands-free.
                </p>
              </div>

              {/* Language Selector */}
              <div className="p-3.5 rounded-2xl bg-black/30 border border-emerald-500/20 text-left space-y-2">
                <div className="flex items-center justify-between text-xs text-emerald-300">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Globe className="w-3.5 h-3.5" />
                    Conversation Language
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(LANGUAGE_CONFIGS) as Language[]).map(lang => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all ${
                        selectedLanguage === lang
                          ? 'bg-emerald-600 text-white border border-emerald-300 shadow-sm'
                          : 'bg-black/40 text-emerald-200/70 hover:bg-black/60 border border-emerald-500/10'
                      }`}
                    >
                      {LANGUAGE_CONFIGS[lang].native}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Call Button */}
              <button
                onClick={handleStartCall}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-forest-500 hover:from-emerald-500 hover:to-forest-400 text-white font-bold text-sm shadow-xl hover:shadow-2xl active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Voice Call Now</span>
              </button>

              <p className="text-[10px] text-emerald-400/60">
                Microphone permission will be requested after tapping start. Audio is processed in real time and never permanently recorded.
              </p>
            </div>
          )}

          {/* B. ACTIVE CALL (Connecting / Listening / Thinking / Speaking / Muted) */}
          {(callState === 'connecting' || callState === 'listening' || callState === 'thinking' || callState === 'speaking' || callState === 'muted') && (
            <div className="w-full space-y-6">
              
              {/* Dynamic Status Pill */}
              <div className="flex items-center justify-center">
                <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  callState === 'speaking' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    : callState === 'thinking'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 animate-pulse'
                    : callState === 'listening'
                    ? 'bg-forest-500/20 text-emerald-200 border border-emerald-500/30'
                    : callState === 'muted'
                    ? 'bg-red-500/20 text-red-300 border border-red-400/40'
                    : 'bg-white/10 text-white border border-white/20'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    callState === 'speaking' ? 'bg-emerald-400 animate-ping' :
                    callState === 'thinking' ? 'bg-amber-400 animate-spin' :
                    callState === 'listening' ? 'bg-emerald-400 animate-pulse' :
                    callState === 'muted' ? 'bg-red-400' : 'bg-white'
                  }`} />
                  <span className="capitalize">
                    {callState === 'connecting' && 'Connecting to StudyPilot AI...'}
                    {callState === 'listening' && 'Listening to you...'}
                    {callState === 'thinking' && 'Reasoning & formulating answer...'}
                    {callState === 'speaking' && 'Speaking answer...'}
                    {callState === 'muted' && 'Microphone Muted'}
                  </span>
                </span>
              </div>

              {/* Central Glowing AI Orb with Soundwaves */}
              <div className="relative py-4 flex items-center justify-center">
                
                {/* Outer Glow Ripples */}
                <div 
                  className={`absolute rounded-full transition-all duration-300 pointer-events-none ${
                    callState === 'speaking' 
                      ? 'w-44 h-44 bg-emerald-500/25 blur-xl animate-pulse'
                      : callState === 'listening'
                      ? 'w-40 h-40 bg-forest-400/20 blur-lg animate-ping'
                      : callState === 'thinking'
                      ? 'w-40 h-40 bg-amber-500/20 blur-xl'
                      : 'w-32 h-32 bg-emerald-600/10 blur'
                  }`}
                  style={{ transform: `scale(${1 + audioLevel * 0.3})` }}
                />

                {/* Animated Particle Rings */}
                <div className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                  callState === 'speaking'
                    ? 'border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.4)] bg-gradient-to-tr from-forest-800 to-emerald-600'
                    : callState === 'thinking'
                    ? 'border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.3)] bg-gradient-to-tr from-amber-900 to-forest-800 animate-spin-slow'
                    : callState === 'listening'
                    ? 'border-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.3)] bg-gradient-to-tr from-forest-900 to-emerald-700'
                    : 'border-white/20 bg-forest-950'
                }`}>
                  {callState === 'speaking' ? (
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-6 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-10 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-8 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="w-1.5 h-5 bg-white rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
                    </div>
                  ) : callState === 'thinking' ? (
                    <Sparkles className="w-10 h-10 text-amber-300 animate-spin" />
                  ) : callState === 'listening' ? (
                    <Mic className="w-10 h-10 text-white animate-pulse" />
                  ) : (
                    <MicOff className="w-10 h-10 text-red-400" />
                  )}
                </div>
              </div>

              {/* Live Speech Caption Box */}
              <div className="min-h-[85px] p-4 rounded-2xl bg-black/40 border border-emerald-500/20 flex flex-col items-center justify-center">
                {callState === 'listening' && (
                  <p className="text-xs sm:text-sm text-emerald-100 font-medium leading-relaxed italic">
                    {interimTranscript ? `"${interimTranscript}"` : 'Listening... Speak your question now.'}
                  </p>
                )}

                {callState === 'thinking' && (
                  <div className="space-y-1">
                    <p className="text-xs text-amber-300 font-semibold flex items-center justify-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      Consulting StudyPilot Academic Model...
                    </p>
                    <p className="text-[11px] text-emerald-200/70 italic">
                      "{interimTranscript}"
                    </p>
                  </div>
                )}

                {callState === 'speaking' && (
                  <div className="space-y-1 text-left w-full">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                      StudyPilot Voice Response:
                    </span>
                    <p className="text-xs sm:text-sm text-white font-medium leading-relaxed">
                      {currentAssistantSpeech}
                    </p>
                  </div>
                )}

                {callState === 'muted' && (
                  <p className="text-xs text-red-300">
                    Microphone is currently muted. Unmute to speak.
                  </p>
                )}
              </div>

              {/* Interrupt / Barge-In button (active while AI speaks) */}
              {callState === 'speaking' && (
                <button
                  onClick={handleInterrupt}
                  className="px-4 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Tap to interrupt & ask follow-up</span>
                </button>
              )}
            </div>
          )}

          {/* C. ERROR STATE (Permission Denied, Hardware error) */}
          {callState === 'error' && (
            <div className="space-y-4 py-4 max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 mx-auto flex items-center justify-center shadow-lg">
                <AlertCircle className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">
                  {errorMessage?.title || 'Voice Connection Error'}
                </h3>
                <p className="text-xs text-emerald-200/80 leading-relaxed">
                  {errorMessage?.description || 'Could not access audio stream. Please check your microphone settings.'}
                </p>
              </div>

              <button
                onClick={handleStartCall}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Connecting Again</span>
              </button>
            </div>
          )}

          {/* D. ENDED STATE (Call Summary) */}
          {callState === 'ended' && (
            <div className="space-y-5 py-4 max-w-sm w-full">
              <div className="w-16 h-16 rounded-2xl bg-forest-800/80 border border-emerald-400/40 text-emerald-300 mx-auto flex items-center justify-center">
                <PhoneOff className="w-8 h-8 text-emerald-300" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">Voice Call Completed</h3>
                <p className="text-xs text-emerald-200/70">
                  Duration: {formatDuration(callDurationSeconds)} • {callHistory.filter(t => t.sender === 'user').length} Questions Discussed
                </p>
              </div>

              {/* Quick Session Stats */}
              <div className="grid grid-cols-2 gap-2 text-left p-3.5 rounded-2xl bg-black/30 border border-emerald-500/20 text-xs">
                <div>
                  <span className="text-[10px] text-emerald-400/80 block">Subject Context</span>
                  <span className="font-semibold text-white">{activeSubject?.code || 'CS201'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400/80 block">Language Used</span>
                  <span className="font-semibold text-white">{LANGUAGE_CONFIGS[selectedLanguage]?.label}</span>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={handleStartCall}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Call Again</span>
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Transcript History Accordion */}
          {callHistory.length > 0 && callState !== 'ended' && (
            <div className="w-full text-left">
              <button
                onClick={() => setShowFullTranscript(!showFullTranscript)}
                className="w-full flex items-center justify-between py-2 text-xs font-semibold text-emerald-300 hover:text-white transition-colors border-t border-emerald-500/20 pt-3"
              >
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Conversation Transcript ({callHistory.length} turns)
                </span>
                {showFullTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showFullTranscript && (
                <div className="max-h-40 overflow-y-auto space-y-2 mt-2 pr-1 text-xs">
                  {callHistory.map(turn => (
                    <div 
                      key={turn.id} 
                      className={`p-2.5 rounded-xl ${
                        turn.sender === 'user' 
                          ? 'bg-emerald-950/60 border border-emerald-500/20 ml-4' 
                          : 'bg-black/40 border border-white/10 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-emerald-400/70 mb-1">
                        <span className="font-bold">{turn.sender === 'user' ? 'You' : 'StudyPilot AI'}</span>
                        <span>{turn.timestamp}</span>
                      </div>
                      <p className="text-white text-[11px] leading-relaxed">{turn.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* 3. Bottom Call Controls Bar */}
        {callState !== 'idle' && callState !== 'ended' && (
          <div className="px-6 py-4 bg-black/40 border-t border-emerald-500/20 flex items-center justify-around">
            
            {/* Mic Mute / Unmute */}
            <button
              onClick={toggleMic}
              aria-label={isMicMuted ? "Unmute microphone" : "Mute microphone"}
              className={`p-3.5 rounded-full transition-all duration-200 cursor-pointer ${
                isMicMuted 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30' 
                  : 'bg-white/10 text-white border border-white/10 hover:bg-white/20'
              }`}
            >
              {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* End Call Button */}
            <button
              onClick={handleEndCall}
              aria-label="End voice call"
              className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border-2 border-red-400/50"
            >
              <PhoneOff className="w-6 h-6" />
            </button>

            {/* Speaker Mute / Unmute */}
            <button
              onClick={toggleSpeaker}
              aria-label={isSpeakerMuted ? "Unmute assistant voice" : "Mute assistant voice"}
              className={`p-3.5 rounded-full transition-all duration-200 cursor-pointer ${
                isSpeakerMuted 
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30' 
                  : 'bg-white/10 text-white border border-white/10 hover:bg-white/20'
              }`}
            >
              {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

          </div>
        )}

      </div>
    </div>
  );
};
