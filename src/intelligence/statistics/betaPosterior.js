/**
 * Weighted Beta Posterior calculations.
 * Used for empirical mastery uncertainty estimation based on evidence weights.
 */

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function evidenceWeight(questionElo, learnerElo) {
  const delta = questionElo - learnerElo;
  return clamp(1 + delta / 1000, 0.5, 1.5);
}

export function calculateBetaPosterior({
  successEvidence = 0,
  failureEvidence = 0,
  priorAlpha = 2,
  priorBeta = 2
}) {
  const alpha = priorAlpha + successEvidence;
  const beta = priorBeta + failureEvidence;

  const total = alpha + beta;
  const mean = alpha / total;

  // Standard deviation of Beta distribution
  const variance = (alpha * beta) / (Math.pow(total, 2) * (total + 1));
  const stdDev = Math.sqrt(variance);

  // 95% Credible Interval using Normal Approximation
  const margin = 1.96 * stdDev;
  const lowerBound = Math.max(0.0, parseFloat((mean - margin).toFixed(3)));
  const upperBound = Math.min(1.0, parseFloat((mean + margin).toFixed(3)));

  return {
    mean: parseFloat(mean.toFixed(3)),
    lowerBound,
    upperBound,
    uncertaintyRange: parseFloat((upperBound - lowerBound).toFixed(3)),
    isSufficientEvidence: (successEvidence + failureEvidence) >= 15
  };
}
