/**
 * Spaced Repetition Forgetting Risk Predictor.
 * Uses a half-life exponential decay model to estimate student recall probability.
 */

export function calculateRetentionProbability({
  lastReviewedTime,  // timestamp in ms
  stabilityHours,    // interval stability factor in hours
  currentTime = Date.now()
}) {
  if (!lastReviewedTime) {
    return 0.0; // unattempted/forgotten
  }

  // Calculate elapsed time in hours
  const elapsedMs = currentTime - lastReviewedTime;
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  // Stability defaults to 24 hours if not specified
  const S = stabilityHours || 24;

  // P(recall) = e^(-t / S)
  const pRecall = Math.exp(-elapsedHours / S);

  return parseFloat(pRecall.toFixed(3));
}

/**
 * Iterates through all SM-2 spaced repetition items to rank memory recall risks.
 */
export function predictForgettingRisks(srItems = [], currentTime = Date.now()) {
  return srItems.map(item => {
    const pRecall = calculateRetentionProbability({
      lastReviewedTime: item.lastReviewed,
      stabilityHours: item.intervalDays * 24, // Convert days to hours
      currentTime
    });

    return {
      id: item.questionId,
      topic: item.topic,
      pRecall,
      risk: parseFloat((1 - pRecall).toFixed(3)) // risk = 1 - P(recall)
    };
  }).sort((a, b) => b.risk - a.risk); // Sort by highest risk of forgetting
}
