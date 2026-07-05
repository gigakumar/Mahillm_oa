/**
 * Question Difficulty Engine
 * Calculates Bayesian-smoothed difficulty scores, difficulty bands, and author drift.
 */

const PRIOR_WRONG_RATIO = 0.5; // default average difficulty prior
const PRIOR_STRENGTH = 10;     // equivalent sample weight for prior smoothing

export function calculateObservedDifficulty(stats, authorDifficulty = 0.5) {
  const answered = stats.answeredCount || 0;
  const wrong = stats.wrongCount || 0;
  
  if (answered === 0) {
    return {
      difficultyScore: authorDifficulty,
      difficultyBand: authorDifficulty > 0.7 ? "hard" : authorDifficulty > 0.35 ? "medium" : "easy",
      drift: 0.0,
      status: "aligned"
    };
  }

  // 1. Bayesian-smoothed wrong ratio
  const smoothedWrongRatio = (wrong + PRIOR_WRONG_RATIO * PRIOR_STRENGTH) / (answered + PRIOR_STRENGTH);

  // 2. Timeout and response time ratios
  const timeoutRatio = stats.timeoutCount / answered;
  const skipRatio = stats.skippedCount / answered;
  const highConfidenceWrongRatio = stats.sureWrongCount / Math.max(1, wrong);

  // Average solve time
  const avgSolveTimeSeconds = (stats.totalResponseTime / answered) / 1000;
  // Normalized solve time (caps at 1.0 at 120s response time)
  const normalizedSolveTime = Math.min(avgSolveTimeSeconds / 120, 1.0);

  // Trap strength (high confidence errors)
  const trapStrength = highConfidenceWrongRatio;

  // 3. Combined Observed Difficulty Index
  const difficultyScore = parseFloat(
    (
      smoothedWrongRatio * 0.55 +
      timeoutRatio * 0.15 +
      normalizedSolveTime * 0.10 +
      highConfidenceWrongRatio * 0.10 +
      skipRatio * 0.05 +
      trapStrength * 0.05
    ).toFixed(3)
  );

  // Determine band
  let difficultyBand = "medium";
  if (difficultyScore > 0.70) difficultyBand = "hard";
  else if (difficultyScore < 0.35) difficultyBand = "easy";

  // Author drift
  let authorNumeric = 0.5;
  if (authorDifficulty === 'easy') authorNumeric = 0.25;
  else if (authorDifficulty === 'medium') authorNumeric = 0.5;
  else if (authorDifficulty === 'hard') authorNumeric = 0.8;
  else if (typeof authorDifficulty === 'number') authorNumeric = authorDifficulty;

  const drift = parseFloat((difficultyScore - authorNumeric).toFixed(3));
  const status = Math.abs(drift) > 0.25 ? "misclassified" : "aligned";

  // Cohort-specific difficulties
  const difficultyByCohort = {};
  Object.keys(stats.cohorts || {}).forEach(cohortId => {
    const c = stats.cohorts[cohortId];
    if (c.answered >= 5) {
      difficultyByCohort[cohortId] = parseFloat(((c.answered - c.correct) / c.answered).toFixed(3));
    }
  });

  return {
    difficultyScore,
    difficultyBand,
    drift,
    status,
    difficultyByCohort
  };
}
