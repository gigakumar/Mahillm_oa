export const IntelligenceStatus = {
  PENDING: "PENDING",
  ANALYZING: "ANALYZING",
  CALIBRATED: "CALIBRATED",
  NEEDS_REVIEW: "NEEDS_REVIEW",
  QUARANTINED: "QUARANTINED",
  STALE: "STALE",
  FAILED: "FAILED",
  PROBATION: "PROBATION" // Used for generated questions
};

export const IntelligenceTask = {
  DIFFICULTY_ANALYSIS: "DIFFICULTY_ANALYSIS",
  QUALITY_ANALYSIS: "QUALITY_ANALYSIS",
  CONCEPT_ANALYSIS: "CONCEPT_ANALYSIS",
  AMBIGUITY_ANALYSIS: "AMBIGUITY_ANALYSIS",
  DUPLICATE_ANALYSIS: "DUPLICATE_ANALYSIS",
  QUESTION_GENERATION: "QUESTION_GENERATION",
  QUESTION_SOLVING: "QUESTION_SOLVING"
};

export const createInitialIntelligenceState = (questionId, source = "HUMAN") => ({
  questionId,
  intelligenceState: {
    status: source === "GENERATED" ? IntelligenceStatus.PROBATION : IntelligenceStatus.PENDING,
    version: 1,
    lastAnalyzedAt: null,
    nextAnalysisAt: null,
    analysisReason: "INITIAL_CALIBRATION",
    agentsRun: [],
    processingAttempts: 0,
    lastError: null,
  },
  difficulty: {
    semanticDifficulty: null,
    empiricalDifficulty: null,
    abilityAdjustedDifficulty: null,
    calibratedDifficulty: null,
    label: "unknown",
    confidence: 0
  },
  difficultyHistory: [],
  quality: {
    score: null,
    flags: [],
    answerConfidence: null,
    action: "KEEP",
  },
  reviewState: {
    required: false,
    priority: null,
    reasons: [],
    reviewedBy: null,
    reviewedAt: null,
    decision: null
  },
  questionLifecycle: {
    source: source,
    status: source === "GENERATED" ? "PROBATION" : "ACTIVE",
    probation: source === "GENERATED" ? {
      requiredAttempts: 30,
      currentAttempts: 0,
      minimumDiscrimination: 0.1,
      maximumDisputeRate: 0.15
    } : null
  },
  concepts: {
    primary: null,
    supporting: [],
    confidence: 0
  }
});
