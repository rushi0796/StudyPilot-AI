import type { Language, SpeechRecognitionState, SpeechSynthesisState } from '../types/index.ts';

/**
 * StudyPilot AI - Production Voice Assistant Service
 * 
 * Provides robust Web Speech API integration:
 * 1. SpeechRecognition (STT): Multi-language voice capture (English, Hindi, Marathi, Telugu)
 *    with interim results, state management, permission handling, and timeout safeguards.
 * 2. SpeechSynthesis (TTS): High-fidelity vocal response generation with Markdown cleaning,
 *    sentence chunking (prevents browser 15s pause bug), language-matched voice selection,
 *    and pause/resume/stop/replay controls.
 */

// Interface for Web Speech Recognition API
interface IWindowSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onaudiostart: ((this: IWindowSpeechRecognition, ev: Event) => any) | null;
  onsoundstart: ((this: IWindowSpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: IWindowSpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: IWindowSpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: IWindowSpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: IWindowSpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: IWindowSpeechRecognition, ev: any) => any) | null;
  onnomatch: ((this: IWindowSpeechRecognition, ev: any) => any) | null;
  onerror: ((this: IWindowSpeechRecognition, ev: any) => any) | null;
  onstart: ((this: IWindowSpeechRecognition, ev: Event) => any) | null;
  onend: ((this: IWindowSpeechRecognition, ev: Event) => any) | null;
}

export interface SpeechRecognitionErrorDetails {
  code: string;
  message: string;
  actionable: string;
}

export interface StartListeningOptions {
  language: Language;
  onStateChange: (state: SpeechRecognitionState, error?: SpeechRecognitionErrorDetails) => void;
  onTranscript: (interim: string, final: string) => void;
  onError: (error: SpeechRecognitionErrorDetails) => void;
  onEnd?: (finalTranscript: string) => void;
}

export interface SpeakOptions {
  text: string;
  language: Language;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

// BCP 47 locale mappings for STT and TTS
export const LANGUAGE_CONFIGS: Record<Language, {
  label: string;
  native: string;
  recognitionLocale: string;
  voiceLocales: string[];
  placeholderPrompt: string;
}> = {
  en: {
    label: 'English',
    native: 'English (Indian / US)',
    recognitionLocale: 'en-IN',
    voiceLocales: ['en-IN', 'en-US', 'en-GB', 'en'],
    placeholderPrompt: 'Ask any question or tap the mic to speak...'
  },
  hi: {
    label: 'Hindi',
    native: 'हिंदी (Hindi)',
    recognitionLocale: 'hi-IN',
    voiceLocales: ['hi-IN', 'hi'],
    placeholderPrompt: 'कोई भी प्रश्न पूछें या बोलने के लिए माइक दबाएं...'
  },
  mr: {
    label: 'Marathi',
    native: 'मराठी (Marathi)',
    recognitionLocale: 'mr-IN',
    // If native Marathi voice is not installed on OS, gracefully fallback to Hindi voice (Devanagari phonetics)
    voiceLocales: ['mr-IN', 'mr', 'hi-IN', 'hi'],
    placeholderPrompt: 'कोणताही प्रश्न विचारा किंवा बोलण्यासाठी माइक टॅप करा...'
  },
  te: {
    label: 'Telugu',
    native: 'తెలుగు (Telugu)',
    recognitionLocale: 'te-IN',
    voiceLocales: ['te-IN', 'te'],
    placeholderPrompt: 'ఏదైనా ప్రశ్న అడగండి లేదా మాట్లాడటానికి మైక్ నొక్కండి...'
  }
};

/**
 * Check if the browser supports Web Speech Recognition
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

/**
 * Check if the browser supports Web Speech Synthesis
 */
export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/**
 * Clean markdown symbols, citations, formulas, and code blocks
 * to produce clean, natural-sounding audio narration.
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  return text
    // Replace code blocks with concise spoken notice
    .replace(/```[\s\S]*?```/g, ' [Code snippet omitted for speech] ')
    .replace(/`([^`]+)`/g, '$1')
    // Strip LaTeX math blocks and symbols
    .replace(/\$\$[\s\S]*?\$\$/g, ' [Mathematical formula] ')
    .replace(/\$([^\$]+)\$/g, '$1')
    // Remove document citations like [Source: DBMS Unit 3, Page 12]
    .replace(/\[Source:[^\]]+\]/gi, '')
    // Remove markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove markdown table divider lines like |---|---| or |:---:|
    .replace(/\|[\s-:]+\|/g, ' ')
    // Replace pipe characters in tables
    .replace(/\|/g, ' ')
    // Remove HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Remove headers, bold, italics, strikethroughs, blockquotes
    .replace(/^[#>\s*+-]+/gm, ' ')
    .replace(/[*_~`]/g, ' ')
    // Remove excess whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Split text into sentence chunks under ~180 characters.
 * Prevents the well-known Chromium 15-second speech synthesis cutoff bug.
 */
export function splitIntoSpeechChunks(text: string): string[] {
  const clean = cleanTextForSpeech(text);
  if (!clean) return [];

  // Match sentence terminators: English (. ! ?), Devanagari danda (।), or newlines
  const regex = /([^.!?।\n]+[.!?।\n]+|[^.!?।\n]+$)/g;
  const matches = clean.match(regex);
  if (!matches) return [clean];

  const chunks: string[] = [];
  let currentChunk = '';

  for (const match of matches) {
    const trimmed = match.trim();
    if (!trimmed) continue;

    if ((currentChunk + ' ' + trimmed).length > 180) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = trimmed;
    } else {
      currentChunk = currentChunk ? `${currentChunk} ${trimmed}` : trimmed;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [clean];
}

/**
 * Get the best matching available system voice for the selected language
 */
export function getBestVoice(language: Language): { voice: SpeechSynthesisVoice | null; isExactMatch: boolean } {
  if (!isSpeechSynthesisSupported()) return { voice: null, isExactMatch: false };

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return { voice: null, isExactMatch: false };

  const config = LANGUAGE_CONFIGS[language] || LANGUAGE_CONFIGS.en;
  const targetLocales = config.voiceLocales;

  // 1. Try exact primary locale (e.g. 'mr-IN', 'hi-IN', 'te-IN')
  const primaryLocale = targetLocales[0].toLowerCase();
  const exactMatch = voices.find(v => v.lang && v.lang.toLowerCase().replace('_', '-') === primaryLocale);
  if (exactMatch) return { voice: exactMatch, isExactMatch: true };

  // 2. Try prefix match for target locales
  for (const loc of targetLocales) {
    const prefix = loc.toLowerCase().split('-')[0];
    const match = voices.find(v => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith(prefix));
    if (match) {
      const isExact = match.lang.toLowerCase().startsWith(primaryLocale);
      return { voice: match, isExactMatch: isExact };
    }
  }

  // 3. Fallback to default system voice
  const defaultVoice = voices.find(v => v.default) || voices[0];
  return { voice: defaultVoice || null, isExactMatch: false };
}

// Global active controller references to prevent overlapping sessions
let activeRecognitionInstance: IWindowSpeechRecognition | null = null;
let activeKeepAliveTimer: any = null;
let activeUtteranceQueue: SpeechSynthesisUtterance[] = [];
let currentSpeakingText: string | null = null;

/**
 * Voice Assistant Controller - Singleton Class
 */
export class VoiceAssistantController {
  private recognitionState: SpeechRecognitionState = 'idle';
  private synthesisState: SpeechSynthesisState = 'idle';
  private accumulatedFinalTranscript: string = '';
  private currentLanguage: Language = 'en';

  /**
   * Start speech recognition using browser Web Speech API
   */
  public startListening(options: StartListeningOptions): void {
    // 1. Check support
    if (!isSpeechRecognitionSupported()) {
      options.onStateChange('error');
      options.onError({
        code: 'unsupported',
        message: 'Speech recognition is not supported in this browser.',
        actionable: 'Speech recognition requires Google Chrome, Microsoft Edge, or Safari. You can still type your questions normally.'
      });
      return;
    }

    // 2. Stop any existing voice capture or playback
    this.stopListening();
    this.stopSpeaking();

    this.currentLanguage = options.language;
    this.accumulatedFinalTranscript = '';
    options.onStateChange('requesting_permission');

    try {
      const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition: IWindowSpeechRecognition = new SpeechRecognitionConstructor();
      activeRecognitionInstance = recognition;

      const config = LANGUAGE_CONFIGS[options.language] || LANGUAGE_CONFIGS.en;
      recognition.lang = config.recognitionLocale;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let isStarted = false;

      recognition.onstart = () => {
        isStarted = true;
        this.recognitionState = 'listening';
        options.onStateChange('listening');
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let currentFinalPart = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptSegment = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            currentFinalPart += transcriptSegment;
          } else {
            interimTranscript += transcriptSegment;
          }
        }

        if (currentFinalPart.trim()) {
          this.accumulatedFinalTranscript = this.accumulatedFinalTranscript 
            ? `${this.accumulatedFinalTranscript} ${currentFinalPart.trim()}`
            : currentFinalPart.trim();
        }

        options.onTranscript(interimTranscript, this.accumulatedFinalTranscript);
      };

      recognition.onerror = (event: any) => {
        const errType = event.error;
        let details: SpeechRecognitionErrorDetails = {
          code: errType,
          message: 'An error occurred during voice recognition.',
          actionable: 'Please try again.'
        };

        if (errType === 'not-allowed' || errType === 'permission-denied') {
          details = {
            code: 'not-allowed',
            message: 'Microphone permission was denied by your browser.',
            actionable: 'Please click the lock icon in your browser address bar and enable Microphone access for this site.'
          };
        } else if (errType === 'no-speech') {
          details = {
            code: 'no-speech',
            message: 'No speech was detected.',
            actionable: 'Please click the microphone button and speak clearly into your microphone.'
          };
        } else if (errType === 'audio-capture') {
          details = {
            code: 'audio-capture',
            message: 'No microphone was found or audio input failed.',
            actionable: 'Ensure a working microphone is connected to your device.'
          };
        } else if (errType === 'network') {
          details = {
            code: 'network',
            message: 'Network error occurred during speech recognition.',
            actionable: 'Browser speech recognition requires an active internet connection.'
          };
        } else if (errType === 'aborted') {
          // Normal user abort - do not surface error
          this.recognitionState = 'idle';
          options.onStateChange('idle');
          return;
        }

        this.recognitionState = 'error';
        options.onStateChange('error', details);
        options.onError(details);
      };

      recognition.onend = () => {
        if (this.recognitionState === 'listening') {
          this.recognitionState = 'idle';
          options.onStateChange('idle');
        }
        if (options.onEnd) {
          options.onEnd(this.accumulatedFinalTranscript);
        }
        activeRecognitionInstance = null;
      };

      recognition.start();

    } catch (err: any) {
      console.error('Speech recognition start error:', err);
      this.recognitionState = 'error';
      const details: SpeechRecognitionErrorDetails = {
        code: 'start_failed',
        message: err?.message || 'Could not start microphone.',
        actionable: 'Ensure your browser permits audio input and try again.'
      };
      options.onStateChange('error', details);
      options.onError(details);
    }
  }

  /**
   * Stop active listening session and return final transcript
   */
  public stopListening(): string {
    if (activeRecognitionInstance) {
      try {
        activeRecognitionInstance.stop();
      } catch {
        // ignore already stopped
      }
      activeRecognitionInstance = null;
    }
    this.recognitionState = 'idle';
    return this.accumulatedFinalTranscript;
  }

  /**
   * Abort active listening session immediately without emitting
   */
  public abortListening(): void {
    if (activeRecognitionInstance) {
      try {
        activeRecognitionInstance.abort();
      } catch {
        // ignore
      }
      activeRecognitionInstance = null;
    }
    this.recognitionState = 'idle';
    this.accumulatedFinalTranscript = '';
  }

  /**
   * Speak response aloud with SpeechSynthesis
   */
  public speak(options: SpeakOptions): void {
    if (!isSpeechSynthesisSupported()) {
      if (options.onError) {
        options.onError(new Error('Speech synthesis is not supported in this browser.'));
      }
      return;
    }

    // Stop any existing speech session
    this.stopSpeaking();

    const chunks = splitIntoSpeechChunks(options.text);
    if (chunks.length === 0) return;

    currentSpeakingText = options.text;
    this.synthesisState = 'speaking';

    const { voice } = getBestVoice(options.language);

    // Setup keep-alive timer for Chromium
    if (activeKeepAliveTimer) clearInterval(activeKeepAliveTimer);
    activeKeepAliveTimer = setInterval(() => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 5000);

    let chunkIndex = 0;

    const playNextChunk = () => {
      if (chunkIndex >= chunks.length) {
        this.stopSpeaking();
        if (options.onEnd) options.onEnd();
        return;
      }

      const chunkText = chunks[chunkIndex];
      const utterance = new SpeechSynthesisUtterance(chunkText);

      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        const config = LANGUAGE_CONFIGS[options.language] || LANGUAGE_CONFIGS.en;
        utterance.lang = config.recognitionLocale;
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      if (chunkIndex === 0 && options.onStart) {
        utterance.onstart = () => options.onStart!();
      }

      utterance.onend = () => {
        chunkIndex++;
        playNextChunk();
      };

      utterance.onerror = (e) => {
        // Ignore normal cancellation errors
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          console.warn('Speech synthesis utterance error:', e);
          if (options.onError) options.onError(e);
        }
        chunkIndex++;
        playNextChunk();
      };

      activeUtteranceQueue.push(utterance);
      window.speechSynthesis.speak(utterance);
    };

    playNextChunk();
  }

  /**
   * Pause active speech synthesis
   */
  public pauseSpeaking(): void {
    if (isSpeechSynthesisSupported() && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      this.synthesisState = 'paused';
    }
  }

  /**
   * Resume paused speech synthesis
   */
  public resumeSpeaking(): void {
    if (isSpeechSynthesisSupported() && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      this.synthesisState = 'speaking';
    }
  }

  /**
   * Stop all active speech playback
   */
  public stopSpeaking(): void {
    if (activeKeepAliveTimer) {
      clearInterval(activeKeepAliveTimer);
      activeKeepAliveTimer = null;
    }
    if (isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
    activeUtteranceQueue = [];
    currentSpeakingText = null;
    this.synthesisState = 'idle';
  }

  /**
   * Check if speech synthesis is currently active
   */
  public isSpeaking(): boolean {
    return isSpeechSynthesisSupported() && window.speechSynthesis.speaking && !window.speechSynthesis.paused;
  }

  public isCurrentlySpeaking(): boolean {
    return this.isSpeaking();
  }

  /**
   * Check if speech synthesis is currently paused
   */
  public isPaused(): boolean {
    return isSpeechSynthesisSupported() && window.speechSynthesis.paused;
  }

  /**
   * Get the text currently being spoken
   */
  public getCurrentSpeakingText(): string | null {
    return currentSpeakingText;
  }

  /**
   * Clean up all audio operations (e.g. on component unmount)
   */
  public cleanup(): void {
    this.abortListening();
    this.stopSpeaking();
  }
}

// Export singleton instance
export const speechService = new VoiceAssistantController();
