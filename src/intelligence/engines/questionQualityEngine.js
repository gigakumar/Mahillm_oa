/**
 * Question Quality & Automatic Quarantine Engine.
 * Evaluates performance metrics, discrimination indices, and quarantines bad questions.
 */

export function analyzeQuestionQuality({
  attempts = [],             // [{ userId, correct, userMasteryScore }]
  medianMasteryScore = 1000,
  minAttemptsForAudit = 50
}) {
  const totalAttempts = attempts.length;
  if (totalAttempts === 0) {
    return { status: "HEALTHY", qualityScore: 100, quarantined: false, flags: [] };
  }

  const correctCount = attempts.filter(a => a.correct).length;
  const correctRate = correctCount / totalAttempts;

  // Split into high and low mastery cohorts
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

  const flags = [];
  
  if (totalAttempts >= minAttemptsForAudit) {
    if (discriminationIndex < 0.10) {
      flags.push({ type: "LOW_DISCRIMINATION", severity: "HIGH", value: discriminationIndex });
    }
    if (correctRate < 0.12) {
      flags.push({ type: "EXCESSIVELY_HARD_OR_BROKEN", severity: "MEDIUM", value: correctRate });
    }
    if (highMasteryErrorRate > 0.55) {
      flags.push({ type: "EXPERT_FAILURE_ANOMALY", severity: "HIGH", value: highMasteryErrorRate });
    }
  }

  // Multi-stage state machine
  let status = "HEALTHY";
  let quarantined = false;

  if (flags.length > 0) {
    status = "WATCH";
    if (flags.some(f => f.severity === "HIGH")) {
      status = "FLAGGED";
    }
  }

  // Strict quarantine criteria (requires attempts >= 100)
  if (totalAttempts >= 100) {
    if (discriminationIndex < -0.1 || highMasteryErrorRate > 0.65) {
      status = "QUARANTINED";
      quarantined = true;
    }
  }

  let qualityScore = 100;
  if (quarantined) {
    qualityScore = 0;
  } else {
    qualityScore -= flags.length * 20;
    qualityScore = Math.max(0, qualityScore);
  }

  return {
    status,
    qualityScore,
    quarantined,
    flags,
    stats: {
      attempts: totalAttempts,
      correctRate: parseFloat(correctRate.toFixed(2)),
      discriminationIndex,
      highMasteryErrorRate
    }
  };
}
