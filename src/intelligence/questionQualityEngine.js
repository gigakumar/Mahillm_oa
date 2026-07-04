/**
 * Question Quality & Telemetry Engine.
 * Evaluates performance metrics, discrimination indices, and quarantines bad questions.
 */

export function analyzeQuestionQuality({
  attempts = [],             // all attempts for this question: [{ userId, correct, userMasteryScore }]
  medianMasteryScore = 1000, // median mastery of all users
  minAttemptsForAudit = 20
}) {
  const totalAttempts = attempts.length;
  if (totalAttempts === 0) {
    return { qualityScore: 100, quarantined: false, reasons: [], stats: {} };
  }

  const correctCount = attempts.filter(a => a.correct).length;
  const correctRate = correctCount / totalAttempts;

  // Split attempts into high-mastery and low-mastery groups
  const highMasteryGroup = attempts.filter(a => a.userMasteryScore >= medianMasteryScore);
  const lowMasteryGroup = attempts.filter(a => a.userMasteryScore < medianMasteryScore);

  let discriminationIndex = 0.0;
  let highMasteryErrorRate = 0.0;

  if (highMasteryGroup.length > 0 && lowMasteryGroup.length > 0) {
    const highAccuracy = highMasteryGroup.filter(a => a.correct).length / highMasteryGroup.length;
    const lowAccuracy = lowMasteryGroup.filter(a => a.correct).length / lowMasteryGroup.length;
    discriminationIndex = parseFloat((highAccuracy - lowAccuracy).toFixed(2));
    highMasteryErrorRate = parseFloat((1 - highAccuracy).toFixed(2));
  }

  // Quarantine checks
  const reasons = [];
  let quarantined = false;

  if (totalAttempts >= minAttemptsForAudit) {
    if (discriminationIndex < 0.10) {
      reasons.push("LOW_DISCRIMINATION");
    }
    if (correctRate < 0.12) {
      reasons.push("EXCESSIVELY_HARD_OR_BROKEN");
    }
    if (highMasteryErrorRate > 0.55) {
      reasons.push("HIGH_MASTERY_FAILURES_INDICATE_BAD_KEY");
    }
  }

  if (reasons.length > 0) {
    quarantined = true;
  }

  // Quality Score Calculation (0 to 100)
  let qualityScore = 100;
  if (quarantined) {
    qualityScore -= reasons.length * 25;
  }
  if (discriminationIndex < 0.20 && discriminationIndex >= 0.10) {
    qualityScore -= 10;
  }
  qualityScore = Math.max(0, qualityScore);

  return {
    qualityScore,
    quarantined,
    reasons,
    stats: {
      attempts: totalAttempts,
      correctRate: parseFloat(correctRate.toFixed(2)),
      discriminationIndex,
      highMasteryErrorRate
    }
  };
}
