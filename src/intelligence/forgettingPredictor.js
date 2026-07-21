// forgettingPredictor.js (hardened)
// Ebbinghaus forgetting curve: P(recall) = e^(-t/S)
//   t = days since last review
//   S = stability (half-life-like parameter, in days), adaptive per user+topic

import { clampNumber, EngineInputError } from '../utils/validators.js';

export const CONFIG = {
  MIN_STABILITY_DAYS: 0.5,      // floor: never let S collapse to ~0
  MAX_STABILITY_DAYS: 180,      // ceiling: prevents runaway S from an unbroken correct streak
  DEFAULT_STABILITY_DAYS: 1,    // starting point for a brand-new topic
  CORRECT_GROWTH_FACTOR: 1.5,   // S *= this on a correct answer
  INCORRECT_PENALTY_FACTOR: 0.4,// S *= this on a wrong answer
  URGENT_REVIEW_THRESHOLD: 0.75,// recall probability below this = "urgent" (raised from 0.6)
};

/**
 * Computes recall probability. Guards against t=0 (should be 1.0, not NaN),
 * negative t (clock skew / bad data), and S <= 0 (division by zero).
 */
export function recallProbability(daysSinceReview, stabilityDays) {
  const t = clampNumber(daysSinceReview, 0, 3650, 0); // clamp negative/absurd values, cap at ~10 years
  const s = clampNumber(
    stabilityDays,
    CONFIG.MIN_STABILITY_DAYS,
    CONFIG.MAX_STABILITY_DAYS,
    CONFIG.DEFAULT_STABILITY_DAYS
  );
  if (t === 0) return 1; // just reviewed = certain recall
  const p = Math.exp(-t / s);
  return clampNumber(p, 0, 1, 0); // guard against float overshoot above 1 or below 0
}

/**
 * Legacy compatibility export for existing components.
 */
export function calculateRetentionProbability({ lastReviewedTime, stabilityHours, currentTime = Date.now() }) {
  if (!lastReviewedTime) return 0.0;
  const elapsedDays = (currentTime - lastReviewedTime) / (1000 * 60 * 60 * 24);
  const stabilityDays = (stabilityHours || 24) / 24;
  return recallProbability(elapsedDays, stabilityDays);
}

/**
 * Updates a topic's stability after an attempt. Adaptive S learns the user's retention rate per topic.
 */
export function updateStability(currentStabilityDays, wasCorrect) {
  const s = clampNumber(
    currentStabilityDays,
    CONFIG.MIN_STABILITY_DAYS,
    CONFIG.MAX_STABILITY_DAYS,
    CONFIG.DEFAULT_STABILITY_DAYS
  );
  const factor = wasCorrect ? CONFIG.CORRECT_GROWTH_FACTOR : CONFIG.INCORRECT_PENALTY_FACTOR;
  return clampNumber(s * factor, CONFIG.MIN_STABILITY_DAYS, CONFIG.MAX_STABILITY_DAYS);
}

/**
 * Full topic decay report for the Study Planner UI.
 */
export function getDecayReport(topicRecord, now = new Date()) {
  if (!topicRecord || typeof topicRecord !== 'object') {
    throw new EngineInputError('topicRecord is required');
  }
  const { topic, lastReviewedAt, stabilityDays } = topicRecord;
  if (!topic) throw new EngineInputError('topicRecord.topic is required');

  if (!lastReviewedAt) {
    return { topic, status: 'unreviewed', recallProbability: null, riskBand: 'unknown' };
  }

  const lastReviewed = new Date(lastReviewedAt);
  if (Number.isNaN(lastReviewed.getTime())) {
    throw new EngineInputError(`Invalid lastReviewedAt for topic "${topic}"`);
  }

  const daysSince = (now.getTime() - lastReviewed.getTime()) / (1000 * 60 * 60 * 24);
  const p = recallProbability(daysSince, stabilityDays ?? CONFIG.DEFAULT_STABILITY_DAYS);

  let riskBand;
  if (p >= CONFIG.URGENT_REVIEW_THRESHOLD) riskBand = 'safe';
  else if (p >= CONFIG.URGENT_REVIEW_THRESHOLD - 0.25) riskBand = 'watch';
  else riskBand = 'urgent';

  return { topic, status: 'reviewed', recallProbability: p, riskBand, daysSinceReview: daysSince };
}

/**
 * Batch version for the 7-day timeline. Isolates per-topic errors so bad docs don't blank the page.
 */
export function getDecayReportsSafe(topicRecords, now = new Date()) {
  if (!Array.isArray(topicRecords)) return [];
  return topicRecords.map((record) => {
    try {
      return getDecayReport(record, now);
    } catch (err) {
      return {
        topic: record?.topic ?? 'unknown',
        status: 'error',
        recallProbability: null,
        riskBand: 'unknown',
        error: err.message,
      };
    }
  });
}
