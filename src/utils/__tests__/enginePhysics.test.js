import { describe, it, expect } from 'vitest';
import { recallProbability, updateStability, getDecayReport, getDecayReportsSafe } from '../../intelligence/forgettingPredictor.js';
import { estimateAIRBand, getShortlistBand, predictAllOrgs } from '../gatePredictorEngine.js';
import { computeRoundScore, canRevealOpponentChoice, awardVictoryXP, getOpponentLabel } from '../duelEngine.js';
import { evaluateVivaAnswer, getSpeechSupportTier } from '../voiceCoachEngine.js';
import { ottoCycleEfficiency, peltonOptimalBucketSpeed, pumpHeadFromRPM } from '../inspectorPhysics.js';

describe('forgettingPredictor', () => {
  it('recall probability is 1 at t=0', () => {
    expect(recallProbability(0, 3)).toBe(1);
  });
  it('recall probability decreases monotonically with time', () => {
    expect(recallProbability(1, 3)).toBeGreaterThan(recallProbability(5, 3));
  });
  it('never returns a value outside [0,1] even with bad input', () => {
    expect(recallProbability(-5, 3)).toBeLessThanOrEqual(1);
    expect(recallProbability(9999, NaN)).toBeGreaterThanOrEqual(0);
  });
  it('stability grows on correct answers, shrinks on incorrect', () => {
    expect(updateStability(2, true)).toBeGreaterThan(2);
    expect(updateStability(2, false)).toBeLessThan(2);
  });
  it('isolates a malformed record in batch reports instead of throwing', () => {
    const good = { topic: 'Thermo', lastReviewedAt: new Date().toISOString(), stabilityDays: 3 };
    const bad = { topic: 'Bad', lastReviewedAt: 'not-a-date' };
    const results = getDecayReportsSafe([bad, good]);
    expect(results[0].status).toBe('error');
    expect(results[1].status).toBe('reviewed');
  });
});

describe('gatePredictorEngine', () => {
  const bandTable = [{ minScore: 800, maxScore: 1000, airLow: 1, airHigh: 500 }];
  it('finds a band for an in-range score', () => {
    expect(estimateAIRBand(850, bandTable).status).toBe('ok');
  });
  it('flags out-of-reference scores instead of extrapolating', () => {
    expect(estimateAIRBand(50, bandTable).status).toBe('outside_reference_range');
  });
  const cutoff = { org: 'IOCL', minScore: 650, safeMargin: 25, sourceURL: 'https://example.com' };
  it('classifies shortlist bands correctly around the cutoff', () => {
    expect(getShortlistBand(700, cutoff)).toBe('likely');
    expect(getShortlistBand(660, cutoff)).toBe('borderline');
    expect(getShortlistBand(500, cutoff)).toBe('unlikely');
  });
  it('isolates a malformed cutoff entry rather than crashing the whole table', () => {
    const preds = predictAllOrgs(700, [cutoff, { org: 'Broken' }]);
    expect(preds[1].band).toBe('unavailable');
  });
});

describe('duelEngine', () => {
  it('awards zero score for an incorrect answer regardless of time', () => {
    expect(computeRoundScore({ isCorrect: false, secondsRemainingWhenAnswered: 10 })).toBe(0);
  });
  it('clamps a negative time-remaining value instead of producing a negative score', () => {
    expect(computeRoundScore({ isCorrect: true, secondsRemainingWhenAnswered: -5 })).toBe(100);
  });
  it('blocks opponent reveal mid-round for a real (non-simulated) opponent', () => {
    expect(canRevealOpponentChoice({ roundLocked: false, isSimulatedOpponent: false })).toBe(false);
  });
  it('caps XP farming against a simulated opponent past the daily limit', () => {
    expect(awardVictoryXP({ isSimulatedOpponent: true, victoriesTodayCount: 15 }).xpAwarded).toBe(0);
  });
  it('always distinguishes bot vs live opponent in the label', () => {
    expect(getOpponentLabel(true).mode).toBe('practice');
    expect(getOpponentLabel(false).mode).toBe('live');
  });
});

describe('voiceCoachEngine', () => {
  it('returns a supported/unsupported tier without throwing in a non-browser env', () => {
    expect(['supported', 'unsupported']).toContain(getSpeechSupportTier().tier);
  });
  it('returns a qualitative band, not a bare numeric score', () => {
    const result = evaluateVivaAnswer({
      transcript: 'the pump increases head due to centrifugal force and impeller rotation',
      targetKeywords: ['head', 'centrifugal', 'impeller', 'flow rate'],
    });
    expect(['strong', 'developing', 'needs-work']).toContain(result.band);
  });
});

describe('inspectorPhysics', () => {
  it('matches the textbook Otto cycle efficiency at r=8, gamma=1.4 (~56.5%)', () => {
    expect(ottoCycleEfficiency(8, 1.4)).toBeCloseTo(0.5647, 3);
  });
  it('scales Pelton bucket speed linearly with jet velocity', () => {
    expect(peltonOptimalBucketSpeed(40)).toBeCloseTo(40 * 0.46, 5);
  });
  it('follows the affinity square law for pump head vs RPM', () => {
    expect(pumpHeadFromRPM(10, 1000, 2000)).toBe(40);
  });
});
