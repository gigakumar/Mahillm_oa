/**
 * Spaced Repetition Forgetting Risk Predictor.
 * Exponential memory decay P(recall) = e^(-t / S).
 */

export function calculateRetentionProbability({
  lastReviewedTime,  // timestamp in ms
  stabilityHours,    // memory stability factor in hours
  currentTime = Date.now()
}) {
  if (!lastReviewedTime) {
    return 0.0;
  }

  // Elapsed time in hours
  const elapsedMs = currentTime - lastReviewedTime;
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  const S = Math.max(1, stabilityHours || 24);
  const pRecall = Math.exp(-elapsedHours / S);

  return parseFloat(pRecall.toFixed(4));
}

export function predictForgettingRisks(srItems = [], currentTime = Date.now()) {
  return srItems.map(item => {
    const pRecall = calculateRetentionProbability({
      lastReviewedTime: item.lastReviewed,
      stabilityHours: item.intervalDays * 24,
      currentTime
    });

    return {
      id: item.questionId,
      topic: item.topic,
      pRecall,
      risk: parseFloat((1 - pRecall).toFixed(4))
    };
  }).sort((a, b) => b.risk - a.risk);
}
