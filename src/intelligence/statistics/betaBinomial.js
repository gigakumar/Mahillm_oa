/**
 * Beta-Binomial Credible Interval calculations.
 * Used to model cognitive uncertainty and readiness ranges.
 */

export function calculateBetaBinomialCredibleInterval({
  successes = 0,
  failures = 0,
  priorAlpha = 2,
  priorBeta = 2
}) {
  const alpha = priorAlpha + successes;
  const beta = priorBeta + failures;

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
    isSufficientEvidence: (successes + failures) >= 15
  };
}
