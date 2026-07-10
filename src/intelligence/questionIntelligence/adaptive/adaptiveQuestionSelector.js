export function getExplorationDistribution({
  masteryStability,
  recentAccuracy,
  confidenceCalibration
}) {
  if (masteryStability < 0.4) {
    return {
      belowAbility: 0.35,
      targetAbility: 0.55,
      aboveAbility: 0.10
    };
  }

  if (recentAccuracy > 0.8 && confidenceCalibration > 0.75) {
    return {
      belowAbility: 0.10,
      targetAbility: 0.55,
      aboveAbility: 0.35
    };
  }

  // Default exploration split
  return {
    belowAbility: 0.20,
    targetAbility: 0.60,
    aboveAbility: 0.20
  };
}

export function calculateSelectionScore({
  question,
  learnerAbility,
  learnerState
}) {
  // Extract features
  const difficultyMatch = calculateDifficultyMatch(question.difficulty.calibratedDifficulty, learnerAbility);
  const conceptNeed = calculateConceptNeed(question.concepts, learnerState.mastery);
  const mistakeRelevance = calculateMistakeRelevance(question, learnerState.recentMistakes);
  const informationGain = calculateInformationGain(question, learnerState);
  const freshness = calculateFreshness(question, learnerState.exposure);
  const questionQuality = question.quality.score || 0.5;

  const selectionScore =
    difficultyMatch * 0.25 +
    conceptNeed * 0.25 +
    mistakeRelevance * 0.15 +
    informationGain * 0.15 +
    freshness * 0.10 +
    questionQuality * 0.10;

  return selectionScore;
}

function calculateDifficultyMatch(questionDifficulty, learnerAbility) {
  // A simplistic difficulty match - lower distance is better
  const targetDifficulty = Math.min(1, learnerAbility + 0.08); // Target slightly above ability
  const distance = Math.abs(questionDifficulty - targetDifficulty);
  return Math.max(0, 1 - distance); 
}

// Mocked helper functions for the multi-factor selection score
function calculateConceptNeed(concepts, mastery) { return 0.5; }
function calculateMistakeRelevance(question, mistakes) { return 0.5; }
function calculateInformationGain(question, learnerState) { return 0.5; }
function calculateFreshness(question, exposure) { return 0.8; }
