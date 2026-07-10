export function analyzeCoverageGaps(questionBank) {
  // Mock aggregation of question bank data
  const coverageMap = new Map();

  for (const question of questionBank) {
    if (!question.concepts || !question.concepts.primary) continue;
    
    const concept = question.concepts.primary;
    if (!coverageMap.has(concept)) {
      coverageMap.set(concept, {
        subject: question.subject || "Unknown",
        topic: question.topic || "Unknown",
        concept: concept,
        currentQuestions: 0,
        difficultyDistribution: { easy: 0, medium: 0, hard: 0, very_hard: 0 }
      });
    }

    const gap = coverageMap.get(concept);
    gap.currentQuestions++;
    
    const diffLabel = question.difficulty?.label || "medium";
    if (gap.difficultyDistribution[diffLabel] !== undefined) {
      gap.difficultyDistribution[diffLabel]++;
    }
  }

  const gaps = [];
  // Example threshold logic
  for (const [concept, data] of coverageMap.entries()) {
    if (data.difficultyDistribution.hard < 2) {
      gaps.push({
        ...data,
        targetDifficulty: "hard",
        reason: "Insufficient hard questions for concept"
      });
    }
  }

  return gaps;
}
