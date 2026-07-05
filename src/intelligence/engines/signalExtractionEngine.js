export function extractAttemptSignals(feature) {
  const signals = [];
  const { outcome, confidence, timing, answerBehaviour, questionContext } = feature;
  const isCorrect = outcome.correct;
  
  if (!isCorrect) {
    // 1. High confidence wrong
    if (confidence.tag === 'sure') {
      signals.push({ signal: 'high_confidence_wrong', strength: 0.9 });
    }
    // 2. Rushed error
    if (timing.normalizedTimeRatio < 0.35) {
      signals.push({ signal: 'fast_incorrect', strength: 0.85 });
      signals.push({ signal: 'rapid_guess', strength: 0.8 });
    }
    // 3. Slow/time sink error
    if (timing.normalizedTimeRatio > 2.0) {
      signals.push({ signal: 'slow_incorrect', strength: 0.75 });
    }
    // 4. Panic choice switch
    if (answerBehaviour.answerChangeCount >= 2) {
      signals.push({ signal: 'multiple_answer_changes', strength: 0.8 });
    }
    // 5. Changed from correct
    if (answerBehaviour.changedFromCorrect) {
      signals.push({ signal: 'changed_from_correct', strength: 0.9 });
    }
    // 6. Distractor match (option trap)
    if (questionContext.distractorMatch) {
      signals.push({ signal: 'distractor_match', strength: 0.9 });
    }
    // 7. Time budget exceeded
    if (timing.normalizedTimeRatio > 1.5) {
      signals.push({ signal: 'time_budget_exceeded', strength: 0.7 });
    }
  } else {
    // Correct
    // 1. Low confidence correct
    if (confidence.tag === 'guess') {
      signals.push({ signal: 'low_confidence_correct', strength: 0.85 });
    }
    // 2. Changed to correct
    if (answerBehaviour.changedToCorrect) {
      signals.push({ signal: 'changed_to_correct', strength: 0.8 });
    }
  }

  return signals;
}
