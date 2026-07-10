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
  const questionQuality = question.quality?.score || 0.5;

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
  const targetDifficulty = Math.min(1, (learnerAbility || 0.5) + 0.08); // Target slightly above ability
  const distance = Math.abs((questionDifficulty || 0.5) - targetDifficulty);
  return Math.max(0, 1 - distance); 
}

function calculateConceptNeed(concepts, mastery) { return 0.5; }
function calculateMistakeRelevance(question, mistakes) { return 0.5; }
function calculateInformationGain(question, learnerState) { return 0.5; }
function calculateFreshness(question, exposure) { return 0.8; }

/**
 * Perform dynamic adaptive question selection based on learner state and selection configuration.
 * Gracefully degrades through a 6-level fallback ladder if constraints collapse the candidate pool.
 */
export function selectAdaptiveQuestions(config, pools, learnerState) {
  const categories = Object.keys(pools);
  
  // Combine all questions from loaded pools
  let allQuestions = [];
  categories.forEach(cat => {
    const list = pools[cat] || [];
    list.forEach(q => { 
      q.category = q.category || cat; 
    });
    allQuestions = allQuestions.concat(list);
  });

  const configCount = config.count || 12;
  let selectionResult = null;
  let fallbackLevel = 1;
  const diagnostics = {};

  for (let level = 1; level <= 6; level++) {
    try {
      const result = runSelectionLevel(level, allQuestions, config, learnerState, diagnostics);
      if (result && result.length >= configCount) {
        // Shuffle the final slice to keep selection order fresh
        selectionResult = result.slice(0, configCount).sort(() => 0.5 - Math.random());
        fallbackLevel = level;
        break;
      }
    } catch (e) {
      console.warn(`[Adaptive Selection] Level ${level} collapsed:`, e.message);
    }
  }

  // Final fallback: if even level 6 could not find enough, take whatever is available from requested category
  if (!selectionResult || selectionResult.length < configCount) {
    const fallbackCategory = config.category || categories[0];
    const rawCategoryPool = pools[fallbackCategory] || [];
    if (rawCategoryPool.length > 0) {
      selectionResult = rawCategoryPool.slice(0, configCount);
      fallbackLevel = 7; // Absolute emergency fallback
    } else if (allQuestions.length > 0) {
      selectionResult = allQuestions.slice(0, configCount);
      fallbackLevel = 8; // Absolute global pool emergency fallback
    } else {
      throw new Error('NO_ELIGIBLE_QUESTIONS');
    }
  }

  return {
    questions: selectionResult,
    fallbackLevel,
    diagnostics
  };
}

function runSelectionLevel(level, allQuestions, config, learnerState, diagnostics) {
  let list = [...allQuestions];
  const stageCounts = { initialQuestions: list.length };

  // Stage 1: Domain / Category Filter
  const targetCategory = config.category;
  if (targetCategory && targetCategory !== 'all') {
    list = list.filter(q => q.category === targetCategory);
  }
  stageCounts.afterDomainFilter = list.length;
  if (list.length === 0) throwCollapse('DOMAIN_FILTER', stageCounts);

  // Stage 2: Lifecycle Filter
  if (level < 6) {
    list = list.filter(q => {
      // Calibrated, Active, or legacy valid (no quarantine/probation)
      if (q.intelligenceState) {
        return q.intelligenceState.status === 'CALIBRATED' || q.intelligenceState.status === 'ACTIVE';
      }
      return q.validationStatus !== 'quarantined' && q.validationStatus !== 'probation';
    });
  } else {
    // Just remove quarantined
    list = list.filter(q => q.validationStatus !== 'quarantined');
  }
  stageCounts.afterLifecycleFilter = list.length;
  if (list.length === 0) throwCollapse('LIFECYCLE_FILTER', stageCounts);

  // Stage 3: Quality Filter
  if (level < 5) {
    list = list.filter(q => {
      const qScore = q.qualityScore !== undefined ? q.qualityScore : (q.quality?.score ? q.quality.score * 100 : 70);
      return qScore >= 60; // quality threshold
    });
  }
  stageCounts.afterQualityFilter = list.length;
  if (list.length === 0) throwCollapse('QUALITY_FILTER', stageCounts);

  // Stage 4: Concept Filter (For CONCEPT_REPAIR target)
  if (config.intent === 'CONCEPT_REPAIR' && config.targetConcept && level < 4) {
    list = list.filter(q => q.topic === config.targetConcept);
  }
  stageCounts.afterConceptFilter = list.length;
  if (list.length === 0) throwCollapse('CONCEPT_FILTER', stageCounts);

  // Stage 5: Difficulty Filter
  const totalAttempts = learnerState?.attempts?.length || 0;
  const isColdStart = totalAttempts < 10;

  if (level < 3) {
    if (isColdStart) {
      // Cold-start calibration questions: target observed difficulty between 0.35 and 0.65 (Medium)
      list = list.filter(q => {
        const obsDiff = q.observedDifficulty !== undefined 
          ? q.observedDifficulty 
          : (q.difficulty === 'Medium' ? 0.5 : (q.difficulty === 'Easy' ? 0.3 : 0.8));
        const margin = level === 1 ? 0.15 : 0.30;
        return Math.abs(obsDiff - 0.5) <= margin;
      });
    } else {
      // Established learner: filter based on readiness estimated ability
      const userElo = learnerState?.readinessScore || 50; // default baseline ELO
      list = list.filter(q => {
        const qDiff = q.observedDifficulty !== undefined 
          ? q.observedDifficulty * 100 
          : (q.difficulty === 'Hard' ? 75 : (q.difficulty === 'Medium' ? 50 : 25));
        const margin = level === 1 ? 15 : 35;
        return Math.abs(qDiff - userElo) <= margin;
      });
    }
  }
  stageCounts.afterDifficultyFilter = list.length;
  if (list.length === 0) throwCollapse('DIFFICULTY_FILTER', stageCounts);

  // Stage 6: Freshness / Exposure Filter
  if (level === 1 && learnerState?.attempts) {
    const attemptedIds = new Set(learnerState.attempts.map(a => a.id.toString()));
    list = list.filter(q => !attemptedIds.has(q.id.toString()));
  }
  stageCounts.afterExposureFilter = list.length;
  if (list.length === 0) throwCollapse('EXPOSURE_FILTER', stageCounts);

  // Record stage counts
  diagnostics[`level_${level}`] = stageCounts;

  return list.sort(() => 0.5 - Math.random());
}

function throwCollapse(stage, counts) {
  const err = new Error(`Filter collapsed at stage: ${stage}`);
  err.code = 'CANDIDATE_POOL_COLLAPSE';
  err.collapseStage = stage;
  err.counts = counts;
  throw err;
}
