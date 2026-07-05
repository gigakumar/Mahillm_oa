import { MISTAKE_TYPES } from '../config/intelligenceTaxonomy.js';

export function inferMistake(signals = [], feature, learnerContext = {}) {
  const scores = {
    [MISTAKE_TYPES.CONCEPTUAL]: 0.1, // baseline
    [MISTAKE_TYPES.CALCULATION]: 0.1,
    [MISTAKE_TYPES.MISREAD]: 0.1,
    [MISTAKE_TYPES.FORMULA_RECALL]: 0.1,
    [MISTAKE_TYPES.OPTION_TRAP]: 0.1,
    [MISTAKE_TYPES.TIME_PRESSURE]: 0.1,
    [MISTAKE_TYPES.GUESS]: 0.1
  };

  const signalMap = {};
  signals.forEach(s => {
    signalMap[s.signal] = s.strength || 1.0;
  });

  // Apply rules based on confidence tag
  if (feature.confidence?.tag === 'guess') {
    scores[MISTAKE_TYPES.GUESS] += 0.8;
  }
  
  if (signalMap.rapid_guess) {
    scores[MISTAKE_TYPES.GUESS] += 0.4;
    scores[MISTAKE_TYPES.TIME_PRESSURE] += 0.45;
  }

  if (signalMap.fast_incorrect && feature.confidence?.tag !== 'sure') {
    scores[MISTAKE_TYPES.TIME_PRESSURE] += 0.55;
  }

  if (signalMap.distractor_match) {
    scores[MISTAKE_TYPES.OPTION_TRAP] += 0.65;
  }
  if (signalMap.changed_from_correct) {
    scores[MISTAKE_TYPES.OPTION_TRAP] += 0.45;
  }
  if (signalMap.multiple_answer_changes) {
    scores[MISTAKE_TYPES.OPTION_TRAP] += 0.25;
  }

  // Formula recall check
  const isTechnical = ['Strength of Materials', 'SOM', 'Thermodynamics', 'Fluid Mechanics', 'Heat Transfer', 'Machine Design', 'Engineering Mechanics', 'Theory of Machines', 'Manufacturing Engineering', 'Engineering Materials', 'Industrial Engineering'].includes(feature.topicId);
  if (isTechnical && feature.questionContext?.difficulty === 'hard') {
    scores[MISTAKE_TYPES.FORMULA_RECALL] += 0.45;
  }

  // Calculation errors (e.g. adjacent numbers or Quant math topic)
  if (feature.topicId?.toLowerCase().includes('quant') || feature.questionContext?.difficulty === 'medium') {
    scores[MISTAKE_TYPES.CALCULATION] += 0.35;
  }

  // Misread
  if (signalMap.changed_from_correct && feature.timing?.responseTimeMs < 20000) {
    scores[MISTAKE_TYPES.MISREAD] += 0.5;
  }

  // High confidence wrong implies conceptual or option trap
  if (signalMap.high_confidence_wrong) {
    scores[MISTAKE_TYPES.CONCEPTUAL] += 0.6;
    scores[MISTAKE_TYPES.OPTION_TRAP] += 0.25;
  }

  // Determine primary mistake
  let primaryType = MISTAKE_TYPES.UNKNOWN;
  let highestScore = 0.0;
  
  Object.keys(scores).forEach(type => {
    if (scores[type] > highestScore) {
      highestScore = scores[type];
      primaryType = type;
    }
  });

  // If highest score is very low, classify as unknown
  if (highestScore < 0.25) {
    primaryType = MISTAKE_TYPES.UNKNOWN;
  }

  const supportingSignals = [];
  const contradictingSignals = [];

  signals.forEach(s => {
    if (primaryType === MISTAKE_TYPES.OPTION_TRAP && ['distractor_match', 'changed_from_correct'].includes(s.signal)) {
      supportingSignals.push(s.signal);
    } else if (primaryType === MISTAKE_TYPES.TIME_PRESSURE && ['rapid_guess', 'fast_incorrect'].includes(s.signal)) {
      supportingSignals.push(s.signal);
    }
  });

  return {
    primaryType,
    confidence: parseFloat(Math.min(highestScore, 0.99).toFixed(2)),
    scores,
    supportingSignals,
    contradictingSignals
  };
}
