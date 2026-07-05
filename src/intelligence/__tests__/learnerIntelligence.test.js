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
