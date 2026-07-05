import { EVIDENCE_LEVELS } from '../config/intelligenceTaxonomy.js';

export function calculateEvidenceStrength(features = [], topicName, totalQuestionsInTopic = 10) {
  const topicFeatures = features.filter(f => f.topicId === topicName);
  const attemptsCount = topicFeatures.length;
  
  if (attemptsCount === 0) {
    return {
      score: 0.0,
      level: EVIDENCE_LEVELS.INSUFFICIENT,
      attempts: 0,
      uniqueQuestions: 0,
      difficultyCoverage: 0.0,
      questionDiversity: 0.0,
      dimensions: { volume: 0, uniqueness: 0, difficultyCoverage: 0, conceptCoverage: 0, recency: 0 },
      weakestDimensions: ['volume'],
      missingEvidence: ['any_attempts'],
      saturated: false
    };
  }

  // Volume score (0 to 1, caps at 10 attempts)
  const volumeScore = Math.min(attemptsCount / 10, 1.0);
  
  // Uniqueness ratio
  const uniqueQuestionIds = new Set(topicFeatures.map(f => f.questionId));
  const uniquenessScore = uniqueQuestionIds.size / attemptsCount;

  // Difficulty coverage
  const difficultiesSeen = new Set(topicFeatures.map(f => f.questionContext?.difficulty));
  const difficultyCoverage = difficultiesSeen.size / 3; // easy, medium, hard
  
  // Recency score (based on youngest attempt age)
  const ages = topicFeatures.map(f => f.temporal.ageDays);
  const minAge = Math.min(...ages);
  const recencyScore = parseFloat(Math.exp(-minAge / 14).toFixed(2)); // decays over 14 days

  // Concept coverage (simulated based on attempt unique ratio)
  const conceptCoverage = Math.min(uniqueQuestionIds.size / Math.max(1, totalQuestionsInTopic), 1.0);

  // Source quality and independence (heuristic fallback)
  const independenceScore = uniquenessScore >= 0.8 ? 0.9 : 0.5;
  const sourceQualityScore = 0.85;
  const consistencyScore = 0.75;

  // Weighted Evidence Strength Formula
  const score = 
    volumeScore * 0.20 +
    uniquenessScore * 0.15 +
    difficultyCoverage * 0.15 +
    conceptCoverage * 0.15 +
    independenceScore * 0.10 +
    recencyScore * 0.10 +
    sourceQualityScore * 0.10 +
    consistencyScore * 0.05;

  let level = EVIDENCE_LEVELS.INSUFFICIENT;
  if (attemptsCount >= 3) {
    if (score > 0.70) level = EVIDENCE_LEVELS.HIGH;
    else if (score > 0.35) level = EVIDENCE_LEVELS.MODERATE;
  }

  // Find missing evidence
  const missingEvidence = [];
  if (!difficultiesSeen.has('hard')) missingEvidence.push('hard_difficulty_questions');
  if (!difficultiesSeen.has('medium')) missingEvidence.push('medium_difficulty_questions');
  if (uniquenessScore < 0.7) missingEvidence.push('unique_question_evidence');
  if (recencyScore < 0.5) missingEvidence.push('recent_attempts');

  // Saturated if volume is very high and information gain is low
  const saturated = attemptsCount >= 20;

  // Weakest dimensions
  const dims = { volume: volumeScore, uniqueness: uniquenessScore, difficultyCoverage, conceptCoverage, recency: recencyScore };
  const weakestDimensions = Object.keys(dims).sort((a, b) => dims[a] - dims[b]).slice(0, 2);

  return {
    score: parseFloat(score.toFixed(2)),
    level,
    attempts: attemptsCount,
    uniqueQuestions: uniqueQuestionIds.size,
    difficultyCoverage: parseFloat(difficultyCoverage.toFixed(2)),
    questionDiversity: parseFloat(uniquenessScore.toFixed(2)),
    dimensions: dims,
    weakestDimensions,
    missingEvidence,
    saturated
  };
}
