import { IntelligenceStatus } from "../schemas/questionIntelligenceSchema.js";

const LABEL_THRESHOLDS = {
  easy: { enter: 0.25, exit: 0.35 },
  medium: { enter: 0.35, exit: 0.65 },
  hard: { enter: 0.65, exit: 0.82 },
  very_hard: { enter: 0.82, exit: 1.0 } // Adding very_hard as per earlier spec
};

export function questionConsensusEngine({
  questionState,
  difficultyResult,
  qualityResult,
  conceptsResult,
  ambiguityResult,
  duplicateResult,
  telemetryContext
}) {
  const updatedState = { ...questionState };
  const currentTimestamp = Date.now();
  
  // 1. Difficulty Calibration
  if (difficultyResult) {
    const { semanticDifficulty } = difficultyResult;
    const empiricalDifficulty = telemetryContext.stats.empiricalDifficulty || 0.5; // Assume calculated externally using betaPosterior
    const totalAttempts = telemetryContext.stats.totalAttempts || 0;
    
    // Saturating empirical weight
    const MAX_WEIGHT = 0.8;
    const HALF_SATURATION = 40;
    const empiricalWeight = (MAX_WEIGHT * totalAttempts) / (totalAttempts + HALF_SATURATION);
    const semanticWeight = 1 - empiricalWeight;
    
    const calibratedDifficulty = (semanticDifficulty * semanticWeight) + (empiricalDifficulty * empiricalWeight);
    
    // Ability Adjusted foundation - placeholder logic for Phase 3B.2J
    const expectedFailureRate = telemetryContext.stats.expectedFailureRate || (1 - empiricalDifficulty);
    const actualFailureRate = telemetryContext.stats.errorRate || (1 - empiricalDifficulty);
    const unexpectedFailure = actualFailureRate - expectedFailureRate;
    
    // Simplistic ability adjustment for now
    const abilityAdjustedDifficulty = Math.min(1, Math.max(0, empiricalDifficulty + (unexpectedFailure * 0.5)));

    const proposedLabel = determineLabel(calibratedDifficulty, updatedState.difficulty.label);
    
    // Manage Hysteresis and History
    if (proposedLabel !== updatedState.difficulty.label && difficultyResult.confidence > 0.8 && totalAttempts >= 20) {
      updatedState.difficultyHistory.push({
        previous: updatedState.difficulty.label,
        proposed: proposedLabel,
        reason: "calibration update",
        semanticDifficulty,
        empiricalDifficulty,
        calibratedDifficulty,
        abilityAdjustedDifficulty,
        confidence: difficultyResult.confidence,
        timestamp: currentTimestamp
      });
      updatedState.difficulty.label = proposedLabel;
    }
    
    updatedState.difficulty = {
      ...updatedState.difficulty,
      semanticDifficulty,
      empiricalDifficulty,
      calibratedDifficulty,
      abilityAdjustedDifficulty,
      confidence: difficultyResult.confidence
    };
  }

  // 2. Quality and Quarantine handling
  if (qualityResult) {
    updatedState.quality = {
      score: qualityResult.score,
      flags: qualityResult.flags,
      answerConfidence: qualityResult.confidence,
      action: qualityResult.action
    };
    
    if (qualityResult.action === "QUARANTINE" || qualityResult.action === "REPAIR") {
      updatedState.intelligenceState.status = IntelligenceStatus.QUARANTINE;
      updatedState.reviewState = {
        required: true,
        priority: qualityResult.action === "QUARANTINE" ? "HIGH" : "MEDIUM",
        reasons: qualityResult.flags,
        reviewedBy: null,
        reviewedAt: null,
        decision: null
      };
    } else {
      updatedState.intelligenceState.status = IntelligenceStatus.CALIBRATED;
    }
  }

  // 3. Concepts handling
  if (conceptsResult) {
    updatedState.concepts = conceptsResult;
  }

  updatedState.intelligenceState.lastAnalyzedAt = currentTimestamp;
  
  return updatedState;
}

function determineLabel(score, currentLabel) {
  // If we have a current label, use exit thresholds (hysteresis)
  if (currentLabel && LABEL_THRESHOLDS[currentLabel]) {
    if (score < LABEL_THRESHOLDS[currentLabel].enter) {
      // Need to move down
      return determineLabelRaw(score);
    } else if (score > LABEL_THRESHOLDS[currentLabel].exit) {
      // Need to move up
      return determineLabelRaw(score);
    }
    return currentLabel; // Stay in current bucket
  }
  
  return determineLabelRaw(score);
}

function determineLabelRaw(score) {
  if (score < LABEL_THRESHOLDS.easy.exit) return "easy";
  if (score < LABEL_THRESHOLDS.medium.exit) return "medium";
  if (score < LABEL_THRESHOLDS.hard.exit) return "hard";
  return "very_hard";
}
