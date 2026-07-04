/**
 * Placement Readiness Score calculation engine.
 * Computes a weighted overall readiness score (0-100) and feedback.
 */

export function calculateReadinessScore({
  masteryMap = {},      // { topicName: value (0 to 1500) }
  attempts = [],        // array of user attempts [{ topic, correct, solveTime, timeRatio, date }]
  retentionMap = {},    // { topicName: recallProbability (0 to 1) }
  strategyStats = {},   // { rushRate, timeSinkRate, secondGuessRate }
  recentMockScores = [] // array of scores (0-100)
}) {
  // 1. Mastery Score (M) - Normalized average ELO ability (0-1)
  const masteries = Object.values(masteryMap);
  const avgMasteryElo = masteries.length > 0 ? masteries.reduce((a, b) => a + b, 0) / masteries.length : 800;
  const M = Math.min(Math.max((avgMasteryElo - 600) / 900, 0), 1); // maps 600-1500 ELO to 0-1

  // 2. Syllabus Coverage (C)
  const totalTopicCount = 15; // default constant representing active subtopics
  const uniqueAttemptedTopics = new Set(attempts.map(a => a.topic)).size;
  const C = Math.min(uniqueAttemptedTopics / totalTopicCount, 1.0);

  // 3. Pacing Efficiency (P)
  // Calculate average time ratio across recent attempts (capped to avoid penalizing super-fast correct answers)
  const recentAttempts = attempts.slice(-100);
  const timeRatios = recentAttempts.map(a => a.timeRatio || 1.0);
  const avgTimeRatio = timeRatios.length > 0 ? timeRatios.reduce((a, b) => a + b, 0) / timeRatios.length : 1.0;
  const P = Math.max(0, Math.min(1.5 - avgTimeRatio, 1.0)); // ratio of 1.0 -> 0.5, ratio of 0.5 -> 1.0, ratio of 2.0 -> 0.0

  // 4. Retention Score (R)
  const retentions = Object.values(retentionMap);
  const R = retentions.length > 0 ? retentions.reduce((a, b) => a + b, 0) / retentions.length : 0.5;

  // 5. Strategy Quality (S)
  const rushRate = strategyStats.rushRate || 0.0;
  const timeSinkRate = strategyStats.timeSinkRate || 0.0;
  const secondGuessRate = strategyStats.secondGuessRate || 0.0;
  const S = Math.max(0, 1.0 - (rushRate * 0.4 + timeSinkRate * 0.4 + secondGuessRate * 0.2));

  // 6. Performance Stability (V)
  let V = 0.5;
  if (recentMockScores.length >= 2) {
    const mean = recentMockScores.reduce((a, b) => a + b, 0) / recentMockScores.length;
    const variance = recentMockScores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / recentMockScores.length;
    const stdDev = Math.sqrt(variance);
    // Lower standard deviation means higher stability
    V = Math.max(0, Math.min(1.0 - (stdDev / 40.0), 1.0));
  } else if (recentMockScores.length === 1) {
    V = 0.7; // baseline stability
  }

  // 7. Weighted Integration
  // Readiness = 0.30*M + 0.20*C + 0.15*P + 0.15*R + 0.10*S + 0.10*V
  const readiness = 0.30 * M + 0.20 * C + 0.15 * P + 0.15 * R + 0.10 * S + 0.10 * V;
  const finalScore = Math.round(readiness * 100);

  // 8. Generate Actionable Feedback
  let feedback = "";
  if (finalScore >= 80) {
    feedback = "Highly competitive. Ready for top-tier company core OAs.";
  } else if (finalScore >= 65) {
    feedback = "Likely to clear moderate mechanical OAs. Target weak-topic numerical pacing.";
  } else {
    feedback = "Below threshold. Focus on core conceptual revision and foundation tests.";
  }

  return {
    score: finalScore,
    components: {
      mastery: Math.round(M * 100),
      coverage: Math.round(C * 100),
      pacing: Math.round(P * 100),
      retention: Math.round(R * 100),
      strategy: Math.round(S * 100),
      stability: Math.round(V * 100)
    },
    feedback
  };
}
