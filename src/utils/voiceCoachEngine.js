// voiceCoachEngine.js (hardened)
// Wraps Web Speech API with feature detection + graceful fallback

import { safeAverage, clampNumber } from './validators.js';

/**
 * Feature detection — call this before rendering the mic button at all.
 */
export function getSpeechSupportTier() {
  const hasSpeechRecognition =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  if (!hasSpeechRecognition) {
    return {
      tier: 'unsupported',
      message: 'Voice input isn’t supported in this browser. Try Chrome or Edge, or type your answer below.',
    };
  }
  return { tier: 'supported', message: null };
}

/**
 * Creates a recognition instance with sane defaults and required error handlers wired in.
 */
export function createRecognitionSession({ onTranscriptUpdate, onError, onEnd }) {
  const support = getSpeechSupportTier();
  if (support.tier === 'unsupported') {
    onError?.(new Error(support.message));
    return null;
  }

  const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognitionCtor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-IN';

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = 0; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    onTranscriptUpdate?.(transcript);
  };

  recognition.onerror = (event) => {
    const messages = {
      'not-allowed': 'Microphone access was denied. Enable it in your browser settings to use voice mode.',
      'no-speech': 'No speech detected — try again, speaking clearly into the mic.',
      'network': 'Voice recognition needs an internet connection. Check your connection and retry.',
    };
    onError?.(new Error(messages[event.error] || `Voice recognition error: ${event.error}`));
  };

  recognition.onend = () => onEnd?.();

  return recognition;
}

/**
 * Converts raw analysis metrics into qualitative bands instead of a bare numeric score.
 */
export function evaluateVivaAnswer({ transcript, targetKeywords, expectedMinWords = 25 }) {
  const text = (transcript || '').trim();
  const wordCount = text.length === 0 ? 0 : text.split(/\s+/).length;

  const foundKeywords = (targetKeywords || []).filter((kw) =>
    text.toLowerCase().includes(kw.toLowerCase())
  );
  const coverageRatio = targetKeywords?.length
    ? foundKeywords.length / targetKeywords.length
    : 0;

  const fluencyRatio = clampNumber(wordCount / expectedMinWords, 0, 1, 0);

  const combinedSignal = safeAverage([coverageRatio, fluencyRatio]);

  let band;
  if (combinedSignal >= 0.7) band = 'strong';
  else if (combinedSignal >= 0.4) band = 'developing';
  else band = 'needs-work';

  return {
    band,
    wordCount,
    keywordsFound: foundKeywords,
    keywordsMissing: (targetKeywords || []).filter((kw) => !foundKeywords.includes(kw)),
    scoreType: 'keyword_and_length_proxy',
  };
}
