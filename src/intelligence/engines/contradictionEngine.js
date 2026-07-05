export function detectLearnerStateContradictions(knowledgeState, behaviour, mistakeProfile, metacognition) {
  const contradictions = [];

  // 1. High confidence but low accuracy (calibration mismatch)
  if (metacognition.global?.score < 50 && behaviour.guessDependency > 0.3) {
    contradictions.push({
      type: 'confidence_calibration_conflict',
      severity: 0.75,
      message: 'High guessing dependency paired with poor metacognitive alignment.',
      action: 'recalibrate_confidence'
    });
  }

  // 2. High mastery but high persistent mistake rate
  Object.keys(knowledgeState).forEach(topic => {
    const elo = knowledgeState[topic];
    if (elo > 1200 && mistakeProfile.totalMistakes > 4 && mistakeProfile.primaryErrorType === 'conceptual') {
      contradictions.push({
        type: 'mastery_error_conflict',
        topicId: topic,
        severity: 0.65,
        message: `High ELO rating for ${topic} conflicting with persistent active conceptual errors.`,
        action: 'reassess_mastery'
      });
    }
  });

  return contradictions;
}
