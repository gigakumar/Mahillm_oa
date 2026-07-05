import { describe, it, expect } from 'vitest';
import { createInitialStats, updateQuestionStats } from '../questionIntelligence/questionStatsEngine.js';
import { calculateObservedDifficulty } from '../questionIntelligence/questionDifficultyEngine.js';
import { calculateQuestionDiscrimination } from '../questionIntelligence/questionDiscriminationEngine.js';
import { calculateQuestionHealth } from '../questionIntelligence/questionHealthEngine.js';
import { inferQuestionArchetype } from '../questionIntelligence/questionArchetypeEngine.js';
import { buildQuestionSequence } from '../questionIntelligence/cognitiveQuestionJumbler.js';
import { compileQuestionPopulationIntelligence } from '../questionIntelligence/questionIntelligenceCompiler.js';

describe('Phase 3B.2I Question Intelligence & Cognitive Jumbler', () => {

  describe('questionDifficultyEngine: Bayesian smoothing & drift', () => {
    it('applies Bayesian smoothing differently for low-volume vs high-volume questions', () => {
      // 1. Low volume: 1 attempt (wrong). Raw wrong ratio = 100%. Bayesian smoothed wrong ratio should pull towards prior (50%)
      let statsLow = createInitialStats();
      statsLow = updateQuestionStats(statsLow, { correct: false, solveTime: 40 });
      const resultLow = calculateObservedDifficulty(statsLow, 'medium');

      // 2. High volume: 100 attempts (95 wrong, all sure, all slow). Raw wrong ratio = 95%.
      let statsHigh = createInitialStats();
      for (let i = 0; i < 95; i++) statsHigh = updateQuestionStats(statsHigh, { correct: false, solveTime: 100, confidence: 'sure' });
      for (let i = 0; i < 5; i++) statsHigh = updateQuestionStats(statsHigh, { correct: true, solveTime: 100, confidence: 'sure' });
      const resultHigh = calculateObservedDifficulty(statsHigh, 'medium');

      expect(resultLow.difficultyScore).toBeLessThan(0.40); // smoothed down toward prior
      expect(resultHigh.difficultyScore).toBeGreaterThan(0.70); // high volume of failures overrides prior
    });

    it('correctly calculates observed difficulty drift vs author definitions', () => {
      let stats = createInitialStats();
      // 30 attempts, 29 wrong, all sure, slow timing
      for (let i = 0; i < 29; i++) stats = updateQuestionStats(stats, { correct: false, solveTime: 100, confidence: 'sure' });
      stats = updateQuestionStats(stats, { correct: true, solveTime: 100, confidence: 'sure' });
      
      const result = calculateObservedDifficulty(stats, 'easy'); // author labeled "easy" (0.25)
      expect(result.status).toBe('misclassified');
      expect(result.drift).toBeGreaterThan(0.35);
    });
  });

  describe('questionDiscriminationEngine: cohort separator quality', () => {
    it('separates strong vs weak cohorts and flags negative discrimination', () => {
      const attempts = [
        // Top cohort (high ELO) gets it wrong, bottom cohort (low ELO) gets it right (negative discrimination)
        { correct: false, userElo: 1400 },
        { correct: false, userElo: 1350 },
        { correct: false, userElo: 1300 },
        { correct: true, userElo: 800 },
        { correct: true, userElo: 750 },
        { correct: true, userElo: 700 },
        // Filler attempts
        { correct: true, userElo: 1000 },
        { correct: true, userElo: 1050 },
        { correct: false, userElo: 950 },
        { correct: false, userElo: 900 }
      ];

      const result = calculateQuestionDiscrimination(attempts);
      expect(result.discriminationScore).toBeLessThan(0.0);
      expect(result.status).toBe('negative_discrimination');
    });
  });

  describe('cognitiveQuestionJumbler: multi-weighted selections and redundancy', () => {
    it('ranks candidate questions optimally based on wave difficulty target and diagnostic priority', () => {
      const learnerState = {
        global: { readiness: 0.6 },
        metacognition: { global: { score: 85 }, bias: { type: 'calibrated' } },
        evidenceSufficiency: {
          'Probability': { level: 'insufficient_data', missingEvidence: ['hard_difficulty_questions'] }
        }
      };

      const diagnosticNeeds = [
        { topicId: 'Probability', priority: 0.9 }
      ];

      const candidates = [
        { id: 'Q_PROB_EASY', topic: 'Probability', difficulty: 'easy', difficultyScore: 0.25 },
        { id: 'Q_PROB_HARD', topic: 'Probability', difficulty: 'hard', difficultyScore: 0.8 },
        { id: 'Q_THERMO', topic: 'Thermodynamics', difficulty: 'medium', difficultyScore: 0.5 }
      ];

      // Since topic is Probability, first step index is 0, fragile_mastery_probe target difficulty at step 0 is 0.5.
      // Q_PROB_HARD matches high diagnostic priority and fills missing hard difficulty gap.
      const result = buildQuestionSequence({
        learnerState,
        diagnosticNeeds,
        recentFeatures: [],
        candidateQuestions: candidates
      });

      expect(result.sequence[0].questionId).toBe('Q_PROB_HARD');
    });

    it('applies templates, clusters, and solution pattern exposure penalties', () => {
      const recentAttempts = [
        {
          questionId: 'Q1',
          questionContext: {
            semanticClusterId: 'CLUSTER_PROB',
            templateFamilyId: 'FAMILY_PROB',
            solutionPatternId: 'PATTERN_PROB'
          }
        }
      ];

      const candidates = [
        {
          id: 'Q2',
          topic: 'Probability',
          semanticClusterId: 'CLUSTER_PROB',
          templateFamilyId: 'FAMILY_PROB',
          solutionPatternId: 'PATTERN_PROB'
        },
        {
          id: 'Q3',
          topic: 'Probability',
          semanticClusterId: 'CLUSTER_THERMO',
          templateFamilyId: 'FAMILY_THERMO',
          solutionPatternId: 'PATTERN_THERMO'
        }
      ];

      const result = buildQuestionSequence({
        learnerState: {},
        diagnosticNeeds: [],
        // We simulate compileAttemptFeatures using mapper
        recentFeatures: recentAttempts.map(a => ({
          questionId: a.questionId,
          questionContext: a.questionContext,
          confidence: { tag: 'sure' },
          timing: { normalizedTimeRatio: 1.0 },
          answerBehaviour: {}
        })),
        candidateQuestions: candidates
      });

      // Q2 has same semantic/template ID cluster as Q1, so it should receive a strong penalty and rank lower than Q3
      expect(result.sequence.find(s => s.questionId === 'Q2').semanticPenalty).toBeGreaterThan(0.8);
      expect(result.sequence[0].questionId).toBe('Q3');
    });
  });

});
