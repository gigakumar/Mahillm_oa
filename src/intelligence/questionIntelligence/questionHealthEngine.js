/**
 * Question Health Engine
 * Compiles item health scores, timing stabilities, option balance, and review warnings.
 */

export function calculateQuestionHealth(stats, discriminationResult, questionMetadata = {}) {
  const answered = stats.answeredCount || 0;
  
  let discrimination = 0.5;
  if (discriminationResult) {
    discrimination = discriminationResult.discriminationScore;
  }

  // Consensus check: extreme agreement/disagreement
  const correctRatio = answered > 0 ? stats.correctCount / answered : 0.5;
  const answerConsensus = correctRatio > 0.98 || correctRatio < 0.02 ? 0.3 : 0.9;

  // Timing stability
  const meanTime = answered > 0 ? stats.totalResponseTime / answered : 60000;
  const variance = answered > 1 
    ? (stats.responseTimeSquaredSum / answered) - Math.pow(meanTime, 2)
    : 0;
  const stdDev = Math.sqrt(Math.max(0, variance));
  const timingStability = meanTime > 0 ? parseFloat(Math.max(0.2, 1.0 - (stdDev / meanTime)).toFixed(2)) : 0.8;

  // Challenge rate (timeouts/skips)
  const challengeRate = answered > 0 ? (stats.timeoutCount + stats.skippedCount) / answered : 0.0;

  // Option balance (uniformity check fallback)
  const optionBalance = 0.85; 

  // Metadata completeness
  const metadataCompleteness = questionMetadata.concepts && questionMetadata.concepts.length > 0 ? 0.95 : 0.4;

  const warnings = [];
  if (discrimination < 0.1) warnings.push("low_discrimination");
  if (discrimination < 0.0) warnings.push("negative_discrimination_risk");
  if (challengeRate > 0.4) warnings.push("excessive_timeout_rate");
  if (metadataCompleteness < 0.5) warnings.push("missing_concept_metadata");

  const healthScore = parseFloat(
    (
      Math.max(0, discrimination) * 0.30 +
      answerConsensus * 0.20 +
      timingStability * 0.15 +
      (1.0 - challengeRate) * 0.15 +
      optionBalance * 0.10 +
      metadataCompleteness * 0.10
    ).toFixed(2)
  );

  return {
    healthScore,
    dimensions: {
      discrimination: parseFloat(Math.max(0, discrimination).toFixed(2)),
      answerConsensus,
      timingStability,
      challengeRate: parseFloat(challengeRate.toFixed(2)),
      optionBalance,
      metadataCompleteness
    },
    warnings
  };
}
