import { calculateTransitionScore } from './questionTransitionEngine.js';
import { calculateSemanticPenalty } from './semanticRedundancyEngine.js';
import { getTargetWaveDifficulty, selectOptimalWaveProfile } from './difficultyWaveEngine.js';

export function buildQuestionSequence({
  learnerState = {},
  diagnosticNeeds = [],
  recentFeatures = [], // normalized canonical features of recent attempts
  candidateQuestions = [], // array of raw/compiled questions in target pool
  assessmentConstraints = {}
}) {
  const currentStepIndex = recentFeatures.length;
  const waveType = selectOptimalWaveProfile(learnerState);
  const targetDifficulty = getTargetWaveDifficulty(waveType, currentStepIndex);

  const lastAttemptFeature = recentFeatures[recentFeatures.length - 1];

  const scoredQuestions = candidateQuestions.map(q => {
    // 1. Difficulty Fit: Gaussian density centered around target wave difficulty
    const diff = q.observedDifficulty !== undefined ? q.observedDifficulty : (q.difficultyScore || 0.5);
    const difficultyFit = parseFloat(Math.exp(-Math.pow(diff - targetDifficulty, 2) / 0.08).toFixed(3));

    // 2. Learner Need Match: priority matching if question topic is in diagnostic needs
    const matchingNeed = diagnosticNeeds.find(n => n.topicId === q.topic);
    const learnerNeedMatch = matchingNeed ? matchingNeed.priority : 0.0;

    // 3. Concept Transition Value
    let conceptTransitionValue = 0.5;
    if (lastAttemptFeature) {
      const transition = calculateTransitionScore(lastAttemptFeature, q, learnerState);
      conceptTransitionValue = transition.transitionScore;
    }

    // 4. Evidence Gap Value: if question targets missing evidence fields
    let evidenceGapValue = 0.0;
    if (matchingNeed && learnerState.evidenceSufficiency?.[q.topic]) {
      const sufficiency = learnerState.evidenceSufficiency[q.topic];
      const missing = sufficiency.missingEvidence || [];
      if (q.difficulty === 'hard' && missing.includes('hard_difficulty_questions')) {
        evidenceGapValue = 0.8;
      } else if (q.difficulty === 'medium' && missing.includes('medium_difficulty_questions')) {
        evidenceGapValue = 0.6;
      }
    }

    // Heuristic foundations
    const diagnosticValue = learnerNeedMatch > 0 ? 0.8 : 0.2;
    const informationGain = q.healthScore || 0.7;
    const transferTestValue = q.archetype?.primary === 'transfer_probe' ? 0.9 : 0.4;
    const placementRelevance = q.sourceType === 'pyq' ? 0.95 : 0.5;

    // Base Selection Score formula
    let selectionScore =
      diagnosticValue * 0.22 +
      informationGain * 0.18 +
      learnerNeedMatch * 0.17 +
      difficultyFit * 0.13 +
      conceptTransitionValue * 0.10 +
      transferTestValue * 0.08 +
      evidenceGapValue * 0.07 +
      placementRelevance * 0.05;

    // 5. Subtract penalties
    // Semantic redundancy penalty
    const recentQuestionsList = recentFeatures.map(f => ({
      id: f.questionId,
      semanticClusterId: f.questionContext?.semanticClusterId,
      templateFamilyId: f.questionContext?.templateFamilyId,
      solutionPatternId: f.questionContext?.solutionPatternId
    }));
    const semanticPenalty = calculateSemanticPenalty(q, recentQuestionsList);
    
    // Exposure risk penalty
    const exposurePenalty = q.exposure?.overexposureRisk ? q.exposure.overexposureRisk * 0.3 : 0.0;

    selectionScore = parseFloat((selectionScore - semanticPenalty - exposurePenalty).toFixed(3));

    return {
      questionId: q.id || q.questionId,
      objective: matchingNeed ? `remedy_${matchingNeed.topicId.toLowerCase()}` : "explore_mastery",
      selectionScore,
      difficultyFit,
      learnerNeedMatch,
      semanticPenalty
    };
  });

  // Sort by selectionScore descending
  const sorted = scoredQuestions.sort((a, b) => b.selectionScore - a.selectionScore);

  return {
    waveType,
    targetDifficulty: parseFloat(targetDifficulty.toFixed(2)),
    sequence: sorted
  };
}
