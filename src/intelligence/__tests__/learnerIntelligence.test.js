import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { calculateMedian, calculateMAD, calculateRobustZScore, resolveRobustScale } from '../statistics/robustStats';
import { updateKnowledgeState, BKT_DEFAULTS, updateConceptKnowledge } from '../models/knowledgeTracingEngine';
import { calculateBetaPosterior, evidenceWeight } from '../statistics/betaPosterior';
import { calculateReadinessScore } from '../engines/readinessEngine';
import { analyzeCalibration } from '../engines/calibrationEngine';
import { classifyAttemptStrategy } from '../engines/strategyClassifier';

describe('Robust Statistics (robustStats)', () => {
  it('calculates median correctly', () => {
    expect(calculateMedian([10, 20, 30])).toBe(20);
    expect(calculateMedian([10, 20, 30, 40])).toBe(25);
  });

  it('calculates MAD correctly', () => {
    // Median is 20. Abs deviations: [10, 0, 10]. Median of dev: 10
    expect(calculateMAD([10, 20, 30])).toBe(10);
  });

  it('calculates robust z-score with outline thresholds', () => {
    const list = [40, 45, 50, 55, 60];
    const median = calculateMedian(list);
    const mad = calculateMAD(list);
    const score = calculateRobustZScore(120, median, mad); // Outlier
    expect(score).toBeGreaterThan(1.5);
  });
  
  it('uses fallback scale if MAD is zero', () => {
    const scale = resolveRobustScale({ questionStats: { values: [60, 60, 60, 60, 60] } });
    expect(scale.source).toBe("INSUFFICIENT_VARIANCE");
    
    const scaleIqr = resolveRobustScale({ questionStats: { mad: 0, p75: 70, p25: 50 } }); // mock iqr > 0
    expect(scaleIqr.source).toBe("IQR");
    
    const score = calculateRobustZScore(120, 60, 0, scaleIqr.scale);
    expect(score).toBeGreaterThan(0);
  });
});

describe('Bayesian Knowledge Tracing (BKT)', () => {
  it('increases pKnown belief state after correct response', () => {
    const initial = { pKnown: 0.30 };
    const updated = updateKnowledgeState(initial, true);
    expect(updated.pKnown).toBeGreaterThan(0.30);
  });

  it('decreases pKnown belief state after incorrect response', () => {
    const initial = { pKnown: 0.60 };
    const updated = updateKnowledgeState(initial, false);
    expect(updated.pKnown).toBeLessThan(0.60);
  });

  it('preserves boundary bounds strictly between 0 and 1', () => {
    const initial = { pKnown: 0.9999 };
    const updated = updateKnowledgeState(initial, true);
    expect(updated.pKnown).toBeLessThan(1.0);
    expect(updated.pKnown).toBeGreaterThan(0.0);
  });
});

describe('BKT Concept Mapping (knowledgeTracingEngine)', () => {
  it('updates primary concept using standard BKT', () => {
    const states = {};
    const updated = updateConceptKnowledge('FM_MAJOR_PIPE_LOSS', [], true, states);
    expect(updated['FM_MAJOR_PIPE_LOSS'].pKnown).toBeGreaterThan(0.25);
  });

  it('updates supporting concepts using evidence counters only', () => {
    const states = {};
    const updated = updateConceptKnowledge('FM_MAJOR_PIPE_LOSS', ['FM_DARCY_WEISBACH'], true, states);
    expect(updated['FM_DARCY_WEISBACH'].supportingEvidence.weightedCorrect).toBeCloseTo(0.35);
    expect(updated['FM_DARCY_WEISBACH'].pKnown).toBe(0.25); // the default from BKT_DEFAULTS, no update happened for pKnown
  });
});

describe('Weighted Beta Posterior uncertainty intervals', () => {
  it('calculates credible intervals and boundaries', () => {
    const res = calculateBetaPosterior({ successEvidence: 10, failureEvidence: 2 });
    expect(res.mean).toBeCloseTo(12 / 16, 2);
    expect(res.lowerBound).toBeLessThan(res.mean);
    expect(res.upperBound).toBeGreaterThan(res.mean);
  });
  
  it('calculates evidence weights based on ELO delta', () => {
    expect(evidenceWeight(1200, 1000)).toBeCloseTo(1.2);
    expect(evidenceWeight(800, 1000)).toBeCloseTo(0.8);
    expect(evidenceWeight(2000, 1000)).toBeCloseTo(1.5); // clamped
    expect(evidenceWeight(0, 1000)).toBeCloseTo(0.5); // clamped
  });

});

describe('Readiness Engine (readinessEngine)', () => {
  it('returns Assessment In Progress if attempts count < 15', () => {
    const attempts = Array.from({ length: 10 }, () => ({ correct: true }));
    const score = calculateReadinessScore({ attempts });
    expect(score.status).toBe("ASSESSMENT_IN_PROGRESS");
    expect(score.score).toBeNull();
  });

  it('returns valid score and components if attempts >= 15', () => {
    const attempts = Array.from({ length: 20 }, () => ({ correct: true }));
    const score = calculateReadinessScore({
      attempts,
      masteryMap: { "Thermodynamics": 1200 },
      retentionMap: { "Thermodynamics": 0.80 },
      strategyStats: { rushRate: 0.1, timeSinkRate: 0.05, secondGuessRate: 0.1 }
    });
    expect(score.status).toBe("COMPLETE");
    expect(score.score).toBeGreaterThan(0);
    expect(score.intelligenceVersion).toBe("3.1.0");
  });
});

describe('Calibration Engine (calibrationEngine)', () => {
  it('detects overconfidence when Sure accuracy is too low', () => {
    const attempts = Array.from({ length: 10 }, () => ({ confidence: 'Sure', correct: false }));
    const res = analyzeCalibration(attempts);
    expect(res.status).toBe("OVERCONFIDENT");
  });
});

describe('Strategy & Pacing Classifier (strategyClassifier)', () => {
  it('classifies rushed attempts based on time ratios', () => {
    const events = [
      { type: "QUESTION_OPENED", timestamp: 1000 },
      { type: "OPTION_SELECTED", option: 1, timestamp: 1002 },
      { type: "ANSWER_SUBMITTED", timestamp: 1005 }
    ];
    const res = classifyAttemptStrategy({
      attemptEvents: events,
      questionId: 101,
      topicName: "Fluid Mechanics",
      subjectName: "Mechanical Engineering",
      isCorrect: false
    });
    expect(res.strategyType).toBe("RUSHED_MISTAKE");
  });
});

import { processAttemptEvents } from '../telemetry/telemetryProcessor';
import { generateObservations } from '../observations/observationFactory';

describe('Telemetry Processor (telemetryProcessor)', () => {
  it('correctly processes golden fixture panicSwitchAttempt', () => {
    const fixturePath = path.join(__dirname, '../__fixtures__/panicSwitchAttempt.json');
    const rawData = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    
    const snapshot = processAttemptEvents(rawData, { questionId: 30417, answerIndex: 3 });
    
    expect(snapshot.derived.activeTimeMs).toBe(64000); // 65000 - 1000
    expect(snapshot.derived.switchCount).toBe(3); // 1 -> 2, 2 -> 3, 3 -> 2
    expect(snapshot.derived.firstAnswerCorrect).toBe(false); // option 1 !== 3
    expect(snapshot.derived.finalAnswerCorrect).toBe(false); // option 2 !== 3
    expect(snapshot.derived.confidence).toBe("SURE");
  });
});

describe('Observation Factory (observationFactory)', () => {
  it('generates proper observations for panic switch', () => {
    const fixturePath = path.join(__dirname, '../__fixtures__/panicSwitchAttempt.json');
    const rawData = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    const snapshot = processAttemptEvents(rawData, { questionId: 30417, answerIndex: 3 });
    
    const observations = generateObservations(snapshot, { userId: 'u1', conceptIds: ['FM_1'] });
    
    // Should have INCORRECT, HIGH_CONFIDENCE_ERROR, PANIC_SWITCH
    const obsTypes = observations.map(o => o.observationType);
    expect(obsTypes).toContain("INCORRECT");
    expect(obsTypes).toContain("HIGH_CONFIDENCE_ERROR");
    expect(obsTypes).toContain("PANIC_SWITCH");
  });
});

import { compileAttemptFeatures } from '../engines/attemptFeatureCompiler.js';
import { extractAttemptSignals } from '../engines/signalExtractionEngine.js';
import { inferMistake } from '../engines/mistakeInferenceEngine.js';
import { detectMistakePersistence } from '../engines/mistakePersistenceEngine.js';
import { calculateConfidenceCalibration } from '../engines/metacognitionEngine.js';
import { calculateEvidenceStrength } from '../engines/evidenceStrengthEngine.js';
import { calculateDiagnosticNeeds } from '../engines/diagnosticPriorityEngine.js';

describe('Phase 3B.1 Diagnostic Integrity Hardening', () => {
  const dummyQuestionDb = [
    {
      id: 'Q1',
      topic: 'Probability',
      difficulty: 'hard',
      expectedTimeMs: 40000,
      correct: 'B',
      distractors: {
        'C': { type: 'unit_conversion' }
      }
    }
  ];

  it('compileAttemptFeatures: normalizes case and handles guess/Guess correctly', () => {
    const attempt1 = { id: 'Q1', correct: false, solveTime: 10, confidence: 'Guess' };
    const attempt2 = { id: 'Q1', correct: false, solveTime: 10, confidence: 'guess' };
    
    const feat1 = compileAttemptFeatures(attempt1, dummyQuestionDb);
    const feat2 = compileAttemptFeatures(attempt2, dummyQuestionDb);

    expect(feat1.confidence.tag).toBe('guess');
    expect(feat1.confidence.probability).toBeCloseTo(0.33);
    expect(feat2.confidence.tag).toBe('guess');
  });

  it('inferMistake: yields option_trap for distractor matches and changed correct answers', () => {
    const attempt = {
      id: 'Q1',
      correct: false,
      solveTime: 30,
      confidence: 'sure',
      events: [
        { type: 'OPTION_SELECTED', option: 'B', timestamp: 1000 },
        { type: 'OPTION_SELECTED', option: 'C', timestamp: 2000 }
      ]
    };
    const feat = compileAttemptFeatures(attempt, dummyQuestionDb);
    const signals = extractAttemptSignals(feat);
    const result = inferMistake(signals, feat);

    expect(result.primaryType).toBe('option_trap');
    expect(result.supportingSignals).toContain('distractor_match');
  });

  it('detectMistakePersistence: counts weighted shares and labels trends correctly', () => {
    const activeMistakes = [
      { id: 'm1', mistakeType: 'conceptual', confidence: 0.9 },
      { id: 'm2', mistakeType: 'conceptual', confidence: 0.9 },
      { id: 'm3', mistakeType: 'calculation', confidence: 0.6 }
    ];
    const result = detectMistakePersistence(activeMistakes);
    expect(result.totalMistakes).toBe(3);
    expect(result.distribution.conceptual.rawCount).toBe(2);
    expect(result.distribution.conceptual.share).toBeCloseTo(1.8 / 2.4, 2);
    expect(result.distribution.conceptual.trend).toBe('emerging'); // < 3 count
  });

  it('calculateConfidenceCalibration: computes Brier score and calibrates topic overconfidence', () => {
    // 3 attempts on same topic: all wrong but user marked "sure" (overconfident)
    const attempts = [
      { id: 'Q1', correct: false, solveTime: 30, confidence: 'sure' },
      { id: 'Q1', correct: false, solveTime: 30, confidence: 'sure' },
      { id: 'Q1', correct: false, solveTime: 30, confidence: 'sure' }
    ];
    const features = attempts.map(a => compileAttemptFeatures(a, dummyQuestionDb));
    const result = calculateConfidenceCalibration(features);

    expect(result.global.brierScore).toBeCloseTo(0.81, 2); // (0.9 - 0)^2 = 0.81
    expect(result.overconfidentTopics).toContain('Probability');
  });

  it('evidenceStrengthEngine: evaluates dimensions and identifies gaps', () => {
    const attempts = [
      { id: 'Q1', correct: true, solveTime: 30, confidence: 'sure' }
    ];
    const features = attempts.map(a => compileAttemptFeatures(a, dummyQuestionDb));
    const result = calculateEvidenceStrength(features, 'Probability');

    expect(result.level).toBe('insufficient_data');
    expect(result.missingEvidence).toContain('medium_difficulty_questions');
  });

  it('calculateDiagnosticNeeds: builds a priority sorting of topic drills', () => {
    const elos = { 'Probability': 800, 'Thermodynamics': 1400 };
    const sufficiency = {
      'Probability': { score: 0.1, level: 'insufficient_data' },
      'Thermodynamics': { score: 0.9, level: 'high_confidence' }
    };
    const metacognition = { overconfidentTopics: ['Probability'] };

    const needs = calculateDiagnosticNeeds(elos, sufficiency, metacognition, {});
    expect(needs[0].topicId).toBe('Probability');
    expect(needs[0].priority).toBeGreaterThan(0.6);
  });
});

