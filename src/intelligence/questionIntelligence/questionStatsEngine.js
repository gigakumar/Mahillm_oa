/**
 * Question Stats Engine
 * Tracks and updates raw attempt aggregates and cohort response mappings.
 */

export function createInitialStats() {
  return {
    answeredCount: 0,
    correctCount: 0,
    wrongCount: 0,
    skippedCount: 0,
    timeoutCount: 0,
    sureWrongCount: 0,
    totalResponseTime: 0,
    responseTimeSquaredSum: 0,
    cohorts: {}
  };
}

export function updateQuestionStats(stats = createInitialStats(), attempt, cohortId = 'all_users') {
  const isCorrect = attempt.correct === true || attempt.outcome?.correct === true;
  const isSkipped = attempt.skipped === true || attempt.outcome?.skipped === true;
  const isTimeout = attempt.timeout === true || attempt.timing?.timeUp === true;
  const isSureWrong = !isCorrect && attempt.confidence?.toLowerCase() === 'sure';
  const solveTimeMs = attempt.solveTime * 1000 || attempt.timing?.responseTimeMs || 60000;

  const newStats = {
    ...stats,
    cohorts: { ...stats.cohorts }
  };

  // Update base global counters
  newStats.answeredCount++;
  if (isCorrect) newStats.correctCount++;
  else newStats.wrongCount++;

  if (isSkipped) newStats.skippedCount++;
  if (isTimeout) newStats.timeoutCount++;
  if (isSureWrong) newStats.sureWrongCount++;

  newStats.totalResponseTime += solveTimeMs;
  newStats.responseTimeSquaredSum += Math.pow(solveTimeMs, 2);

  // Update cohort-specific counters
  if (cohortId) {
    if (!newStats.cohorts[cohortId]) {
      newStats.cohorts[cohortId] = { correct: 0, answered: 0 };
    }
    const cohort = newStats.cohorts[cohortId];
    cohort.answered++;
    if (isCorrect) cohort.correct++;
  }

  return newStats;
}
