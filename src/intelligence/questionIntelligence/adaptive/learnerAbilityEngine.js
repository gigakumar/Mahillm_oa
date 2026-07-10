export function estimateLearnerAbility(learnerState) {
  // In a real system, this pulls from BKT or IRT engines
  const baseAbility = learnerState.averageAccuracy || 0.5;
  const confidenceModifier = learnerState.confidenceCalibration ? (learnerState.confidenceCalibration - 0.5) * 0.1 : 0;
  
  return Math.max(0, Math.min(1, baseAbility + confidenceModifier));
}

export function getTargetDifficulty(learnerAbility) {
  // Target questions slightly above ability to promote growth
  return Math.min(1, learnerAbility + 0.08);
}
