import { calculateBetaBinomialCredibleInterval } from '../statistics/betaBinomial';

export const INTELLIGENCE_VERSION = "3.1.0";

export function calculateReadinessScore({
  masteryMap = {},      // { topicName: ELO value (600 to 1500) }
  attempts = [],        // array of attempts [{ correct, timeRatio }]
  retentionMap = {},    // { topicName: pRecall }
  strategyStats = {},   // { rushRate, timeSinkRate, secondGuessRate }
  recentMockScores = []
}) {
  const totalAttempts = attempts.length;

  // 1. Beta-Binomial Credible Interval on global evidence
  const successes = attempts.filter(a => a.correct).length;
  const failures = totalAttempts - successes;

  const interval = calculateBetaBinomialCredibleInterval({
    successes,
    failures,
    priorAlpha: 2,
    priorBeta: 2
  });

  // If evidence is insufficient (attempts < 15), return assessment in progress
  if (totalAttempts < 15) {
    return {
      status: "ASSESSMENT_IN_PROGRESS",
      score: null,
      confidence: "LOW",
      evidence: {
        totalAttempts,
        progressPct: Math.round((totalAttempts / 15) * 100)
      },
      uncertaintyRange: [0.0, 1.0],
      intelligenceVersion: INTELLIGENCE_VERSION
    };
  }

  // 2. Mastery Index (M)
  const masteries = Object.values(masteryMap);
  const avgElo = masteries.length > 0 ? masteries.reduce((a, b) => a + b, 0) / masteries.length : 800;
  const M = Math.min(Math.max((avgElo - 600) / 900, 0), 1.0);

  // 3. Syllabus Coverage (C)
  const totalTopics = 15;
  const uniqueAttempted = new Set(attempts.map(a => a.topic).filter(Boolean)).size;
  const C = Math.min(uniqueAttempted / totalTopics, 1.0);

  // 4. Pacing Efficiency (P)
  const recentAttempts = attempts.slice(-100);
  const timeRatios = recentAttempts.map(a => a.timeRatio || 1.0);
  const avgTimeRatio = timeRatios.length > 0 ? timeRatios.reduce((a, b) => a + b, 0) / timeRatios.length : 1.0;
  const P = Math.max(0, Math.min(1.5 - avgTimeRatio, 1.0));

  // 5. Retention Index (R)
  const retentions = Object.values(retentionMap);
  const R = retentions.length > 0 ? retentions.reduce((a, b) => a + b, 0) / retentions.length : 0.5;

  // 6. Strategy Index (S)
  const rushRate = strategyStats.rushRate || 0.0;
  const timeSinkRate = strategyStats.timeSinkRate || 0.0;
  const secondGuessRate = strategyStats.secondGuessRate || 0.0;
  const S = Math.max(0, 1.0 - (rushRate * 0.4 + timeSinkRate * 0.4 + secondGuessRate * 0.2));

  // 7. Performance Stability (V)
  let V = 0.5;
  if (recentMockScores.length >= 2) {
    const mean = recentMockScores.reduce((a, b) => a + b, 0) / recentMockScores.length;
    const variance = recentMockScores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / recentMockScores.length;
    const stdDev = Math.sqrt(variance);
    V = Math.max(0, Math.min(1.0 - (stdDev / 40.0), 1.0));
  } else if (recentMockScores.length === 1) {
    V = 0.7;
  }

  // 8. Integrate weighted metrics
  const readiness = 0.30 * M + 0.20 * C + 0.15 * P + 0.15 * R + 0.10 * S + 0.10 * V;
  const finalScore = Math.round(readiness * 100);

  // Calculate uncertainty bounds from interval statistics
  const lowerBound = Math.round(interval.lowerBound * 100);
  const upperBound = Math.round(interval.upperBound * 100);

  return {
    status: "COMPLETE",
    score: finalScore,
    confidence: totalAttempts >= 100 ? "HIGH" : totalAttempts >= 50 ? "MEDIUM" : "LOW",
    uncertaintyRange: [lowerBound, upperBound],
    components: {
      mastery: Math.round(M * 100),
      coverage: Math.round(C * 100),
      pacing: Math.round(P * 100),
      retention: Math.round(R * 100),
      strategy: Math.round(S * 100),
      stability: Math.round(V * 100)
    },
    intelligenceVersion: INTELLIGENCE_VERSION
  };
}
