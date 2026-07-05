export function compileAttemptFeatures(attempt, questionDb = []) {
  const question = questionDb.find(q => q.id === attempt.questionId || q.id === attempt.id) || {};
  const isCorrect = attempt.correct !== undefined ? attempt.correct : (attempt.answer?.isCorrect || false);
  
  // Timing
  const responseTimeMs = (attempt.solveTime * 1000) || attempt.timing?.activeTimeMs || 60000;
  const expectedTimeMs = question.expectedTimeMs || 60000;
  const normalizedTimeRatio = expectedTimeMs > 0 ? parseFloat((responseTimeMs / expectedTimeMs).toFixed(2)) : 1.0;
  
  // Selections / Switches
  const events = attempt.events || [];
  const selections = events.filter(e => e.type === "OPTION_SELECTED");
  const initialAnswer = selections.length > 0 ? selections[0].option : null;
  const finalAnswer = selections.length > 0 ? selections[selections.length - 1].option : null;
  const answerChangeCount = selections.length > 0 ? selections.length - 1 : 0;
  const changedAnswer = answerChangeCount > 0;
  
  let changedFromCorrect = false;
  let changedToCorrect = false;
  if (changedAnswer && selections.length >= 2) {
    const firstSelected = selections[0].option;
    const lastSelected = selections[selections.length - 1].option;
    const correctOption = question.correct;
    if (firstSelected === correctOption && lastSelected !== correctOption) {
      changedFromCorrect = true;
    }
    if (firstSelected !== correctOption && lastSelected === correctOption) {
      changedToCorrect = true;
    }
  }

  // Distractor matching
  let distractorMatch = null;
  if (!isCorrect && finalAnswer !== null && question.distractors) {
    // Check both number and alpha keys (e.g. key: 0, 1, 2 or 'A', 'B', 'C')
    const optionChar = String.fromCharCode(65 + finalAnswer);
    const distractorMeta = question.distractors[finalAnswer] || question.distractors[optionChar];
    if (distractorMeta) {
      distractorMatch = distractorMeta.type || distractorMeta;
    }
  }

  // Recency
  const attemptedAt = attempt.date ? new Date(attempt.date).getTime() : (attempt.timing?.submittedAt || Date.now());
  const ageDays = Math.max(0, (Date.now() - attemptedAt) / (1000 * 60 * 60 * 24));
  const recencyWeight = parseFloat(Math.exp(-ageDays / 7).toFixed(2)); // 7-day half life

  return {
    attemptId: attempt.attemptId || attempt.id?.toString() || `ATT_${attemptedAt}`,
    questionId: question.id || attempt.questionId || attempt.id,
    topicId: question.topic || attempt.topic || 'General',
    conceptIds: question.concepts || [],
    outcome: {
      correct: isCorrect,
      score: isCorrect ? 1 : 0
    },
    confidence: {
      tag: (attempt.confidence || 'sure').toLowerCase(),
      probability: (attempt.confidence || 'sure').toLowerCase() === 'sure' ? 0.9 : (attempt.confidence || 'sure').toLowerCase() === 'unsure' ? 0.6 : 0.33
    },
    timing: {
      responseTimeMs,
      expectedTimeMs,
      normalizedTimeRatio,
      remainingTestTimeRatio: attempt.timing?.remainingTestTimeRatio || null
    },
    answerBehaviour: {
      initialAnswer,
      finalAnswer,
      answerChangeCount,
      changedAnswer,
      changedFromCorrect,
      changedToCorrect
    },
    questionContext: {
      difficulty: question.difficulty || 'medium',
      discrimination: question.discrimination || 0.5,
      sourceType: question.sourceType || 'standard',
      distractorMatch
    },
    temporal: {
      attemptedAt,
      ageDays: parseFloat(ageDays.toFixed(2)),
      recencyWeight
    }
  };
}
