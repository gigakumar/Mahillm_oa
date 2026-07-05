/**
 * Question Ranking Engine
 * Sorts and assigns global, topic, and concept difficulty ranks and percentiles.
 */

export function rankQuestions(questionsWithDifficultyList = []) {
  // Sort by difficultyScore descending
  const sorted = [...questionsWithDifficultyList].sort((a, b) => b.difficultyScore - a.difficultyScore);
  const total = sorted.length;

  const topicGroups = {};
  const conceptGroups = {};

  // Group by topic and concept
  sorted.forEach(q => {
    const topic = q.topic || 'General';
    if (!topicGroups[topic]) topicGroups[topic] = [];
    topicGroups[topic].push(q);

    (q.concepts || []).forEach(concept => {
      if (!conceptGroups[concept]) conceptGroups[concept] = [];
      conceptGroups[concept].push(q);
    });
  });

  const questionRanks = {};

  sorted.forEach((q, index) => {
    const globalRank = index + 1;
    const difficultyPercentile = total > 1 
      ? parseFloat(((1.0 - (index / (total - 1))) * 100).toFixed(1))
      : 100.0;

    const topic = q.topic || 'General';
    const topicRank = topicGroups[topic].indexOf(q) + 1;

    const conceptRanks = {};
    (q.concepts || []).forEach(c => {
      conceptRanks[c] = conceptGroups[c].indexOf(q) + 1;
    });

    // Rank confidence based on sample size
    const sampleSize = q.stats?.answeredCount || 0;
    const rankConfidence = parseFloat(Math.min(sampleSize / 30, 0.95).toFixed(2));

    questionRanks[q.questionId] = {
      questionId: q.questionId,
      globalRank,
      topicRank,
      conceptRanks,
      difficultyPercentile,
      rankConfidence,
      provisionalRank: sampleSize < 10,
      confidenceInterval: {
        lowerPercentile: parseFloat(Math.max(0, difficultyPercentile - (10 * (1 - rankConfidence))).toFixed(1)),
        upperPercentile: parseFloat(Math.min(100, difficultyPercentile + (10 * (1 - rankConfidence))).toFixed(1))
      }
    };
  });

  return questionRanks;
}
