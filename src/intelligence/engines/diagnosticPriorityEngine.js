export function calculateDiagnosticNeeds(topicMasteryElo = {}, evidenceSufficiency = {}, metacognition = {}, mistakes = {}) {
  const diagnosticNeeds = [];

  Object.keys(topicMasteryElo).forEach(topic => {
    const elo = topicMasteryElo[topic];
    const sufficiency = evidenceSufficiency[topic] || { score: 0.2, level: 'insufficient_data', missingEvidence: [] };
    const overconfident = metacognition.overconfidentTopics?.includes(topic);
    
    // Calculate diagnostic priority score:
    // priority = masteryUncertainty * 0.25 + evidenceGap * 0.20 + mistakePersistence * 0.20 + calibrationRisk * 0.15 + placementImportance * 0.15 + recencyRisk * 0.05;
    const evidenceGap = 1.0 - (sufficiency.score || 0);
    const masteryUncertainty = elo < 1000 ? 0.8 : 0.3;
    const calibrationRisk = overconfident ? 0.9 : 0.2;
    
    const priority = 
      masteryUncertainty * 0.25 +
      evidenceGap * 0.25 +
      calibrationRisk * 0.25 +
      (elo < 800 ? 0.25 : 0.05);

    // If priority is high or evidence is low, generate diagnostic need
    if (priority > 0.45) {
      const reasons = [];
      if (sufficiency.level?.includes('insufficient_data')) reasons.push('low_evidence');
      if (elo < 900) reasons.push('high_mastery_uncertainty');
      if (overconfident) reasons.push('overconfidence_detected');

      // Recommended profile
      const difficulty = elo < 900 ? 'easy' : elo < 1200 ? 'medium' : 'hard';

      diagnosticNeeds.push({
        topicId: topic,
        priority: parseFloat(Math.min(priority, 0.99).toFixed(2)),
        reasons,
        recommendedQuestionProfile: {
          difficulty,
          count: sufficiency.level?.includes('insufficient_data') ? 4 : 2
        }
      });
    }
  });

  // Sort diagnostic needs by priority descending
  return diagnosticNeeds.sort((a, b) => b.priority - a.priority);
}
export function calculateExpectedInformationGain(question, learnerState) {
  // Simple heuristic for question information gain
  const topic = question.topic;
  const sufficiency = learnerState.evidenceSufficiency?.[topic];
  if (!sufficiency) return { questionId: question.id, informationGain: 0.8 };
  
  // If we have insufficient evidence, information gain is high
  const gain = sufficiency.level?.includes('insufficient_data') ? 0.9 : 0.4;
  return {
    questionId: question.id,
    informationGain: parseFloat(gain.toFixed(2)),
    targets: [
      `${topic}_mastery`,
      'conceptual_error_hypothesis'
    ]
  };
}
