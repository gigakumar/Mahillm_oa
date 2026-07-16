export function generateDailyRecommendations(masteryScores, spacedRepetition, questionProgress) {
  // Analyze data and return exactly 3 actionable, time-boxed tasks
  
  // Calculate average solve time
  let totalSolveTime = 0;
  let attemptCount = 0;
  
  if (questionProgress) {
    Object.values(questionProgress).forEach(prog => {
      if (prog.solveTimeMs) {
        totalSolveTime += prog.solveTimeMs;
        attemptCount++;
      }
    });
  }
  
  const avgSolveTimeMs = attemptCount > 0 ? totalSolveTime / attemptCount : 90000; // 1.5 mins default
  const avgSolveTimeMins = avgSolveTimeMs / 60000;
  
  const tasks = [];
  
  // Find weakest topic for review
  let weakestTopic = 'General Thermodynamics';
  let lowestScore = Infinity;
  
  if (masteryScores) {
    Object.keys(masteryScores).forEach(topic => {
      const score = masteryScores[topic]?.score || 0;
      if (score < lowestScore) {
        lowestScore = score;
        weakestTopic = topic;
      }
    });
  }
  
  tasks.push({
    title: `Review ${weakestTopic}`,
    type: "review",
    estimatedMinutes: Math.max(5, Math.round(avgSolveTimeMins * 5))
  });
  
  tasks.push({
    title: `Solve 12 ${weakestTopic} questions`,
    type: "practice",
    estimatedMinutes: Math.round(avgSolveTimeMins * 12)
  });
  
  tasks.push({
    title: "Revise active mistake notebook",
    type: "revise",
    estimatedMinutes: Math.max(5, Math.round(avgSolveTimeMins * 6))
  });
  
  return tasks;
}

export function generateCoachInsight(mistakes, topicElo) {
  // Mock intelligent insight based on user data
  return "I've noticed you answer calculation questions quickly but lose marks on conceptual thermodynamics. Spend some time on your weak areas today. Predicted improvement: +7% accuracy.";
}
