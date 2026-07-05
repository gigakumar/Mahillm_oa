import { createInitialStats, updateQuestionStats } from './questionStatsEngine.js';
import { calculateObservedDifficulty } from './questionDifficultyEngine.js';
import { rankQuestions } from './questionRankingEngine.js';
import { calculateQuestionDiscrimination } from './questionDiscriminationEngine.js';
import { calculateQuestionHealth } from './questionHealthEngine.js';
import { inferQuestionArchetype } from './questionArchetypeEngine.js';

export function compileQuestionPopulationIntelligence(questions = [], allAttempts = []) {
  // 1. Group attempts by question
  const attemptsByQuestion = {};
  allAttempts.forEach(a => {
    const qId = a.questionId || a.id;
    if (qId) {
      if (!attemptsByQuestion[qId]) attemptsByQuestion[qId] = [];
      attemptsByQuestion[qId].push(a);
    }
  });

  // 2. Compile stats, difficulty, discrimination for each question
  const compiledList = [];

  questions.forEach(q => {
    const qId = q.id || q.questionId;
    const questionAttempts = attemptsByQuestion[qId] || [];
    
    // Compile stats
    let stats = createInitialStats();
    questionAttempts.forEach(attempt => {
      const cohortId = attempt.userCohort || 'all_users';
      stats = updateQuestionStats(stats, attempt, cohortId);
    });

    // Bayesian difficulty
    const authorDiff = q.difficulty || 'medium';
    const difficultyResult = calculateObservedDifficulty(stats, authorDiff);

    // Discrimination
    const discriminationResult = calculateQuestionDiscrimination(questionAttempts);

    // Health
    const healthResult = calculateQuestionHealth(stats, discriminationResult, q);

    // Archetype
    const archetypeResult = inferQuestionArchetype(stats, difficultyResult.difficultyScore, discriminationResult.discriminationScore);

    compiledList.push({
      questionId: qId,
      topic: q.topic || 'General',
      concepts: q.concepts || [],
      difficulty: q.difficulty || 'medium',
      stats,
      ...difficultyResult,
      discrimination: discriminationResult,
      health: healthResult,
      archetype: archetypeResult
    });
  });

  // 3. Compile rankings across all questions
  const rankings = rankQuestions(compiledList);

  // Combine rankings back to question objects
  return compiledList.map(q => ({
    ...q,
    rank: rankings[q.questionId] || {
      globalRank: 1,
      topicRank: 1,
      difficultyPercentile: 50.0,
      rankConfidence: 0.0
    }
  }));
}
