/**
 * Question Discrimination Engine
 * Calculates item discrimination (top 27% cohort accuracy vs bottom 27% cohort accuracy).
 */

export function calculateQuestionDiscrimination(questionAttempts = []) {
  const total = questionAttempts.length;

  if (total < 10) {
    return {
      top27PercentAccuracy: 0.70,
      bottom27PercentAccuracy: 0.40,
      discriminationScore: 0.30,
      status: "low_discrimination"
    };
  }

  // Sort attempts by user ELO or user readiness score descending
  const sorted = [...questionAttempts].sort((a, b) => {
    const scoreA = a.userReadiness !== undefined ? a.userReadiness : (a.userElo || 1000);
    const scoreB = b.userReadiness !== undefined ? b.userReadiness : (b.userElo || 1000);
    return scoreB - scoreA;
  });

  const cohortSize = Math.max(1, Math.round(total * 0.27));
  const topCohort = sorted.slice(0, cohortSize);
  const bottomCohort = sorted.slice(-cohortSize);

  const topCorrect = topCohort.filter(a => a.correct || a.outcome?.correct).length;
  const bottomCorrect = bottomCohort.filter(a => a.correct || a.outcome?.correct).length;

  const topAccuracy = topCorrect / cohortSize;
  const bottomAccuracy = bottomCorrect / cohortSize;

  const discriminationScore = parseFloat((topAccuracy - bottomAccuracy).toFixed(3));

  let status = "low_discrimination";
  if (discriminationScore < 0.0) status = "negative_discrimination";
  else if (discriminationScore >= 0.4) status = "high_discrimination";
  else if (discriminationScore >= 0.2) status = "acceptable_discrimination";

  return {
    top27PercentAccuracy: parseFloat(topAccuracy.toFixed(3)),
    bottom27PercentAccuracy: parseFloat(bottomAccuracy.toFixed(3)),
    discriminationScore,
    status
  };
}
