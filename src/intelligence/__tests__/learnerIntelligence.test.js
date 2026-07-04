import { describe, it, expect } from 'vitest';
import { calculateMedian, calculateMAD, calculateRobustZScore } from '../statistics/robustStats';
import { updateKnowledgeState, BKT_DEFAULTS } from '../models/knowledgeTracingEngine';
import { calculateBetaBinomialCredibleInterval } from '../statistics/betaBinomial';
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
    const score = calculateRobustZScore(120, list); // Outlier
    expect(score).toBeGreaterThan(1.5);
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

describe('Beta-Binomial uncertainty intervals', () => {
  it('calculates credible intervals and boundaries', () => {
    const res = calculateBetaBinomialCredibleInterval({ successes: 10, failures: 2 });
    expect(res.mean).toBeCloseTo(12 / 16, 2);
    expect(res.lowerBound).toBeLessThan(res.mean);
    expect(res.upperBound).toBeGreaterThan(res.mean);
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
