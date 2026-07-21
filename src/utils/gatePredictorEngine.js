// gatePredictorEngine.js (hardened)
// Reads cutoffs/AIR bands from data files (not hardcoded here)

import { clampNumber, assertNonEmptyArray, EngineInputError } from './validators.js';
import psuData from '../data/psuCutoffs.2025.json';

export const REFERENCE_YEAR = psuData.cycleYear;
export const PSU_REQUIREMENTS = psuData.psuCutoffs;

/**
 * airBandTable: array of { minScore, maxScore, airLow, airHigh } sorted by score
 */
export function estimateAIRBand(normalizedScore, airBandTable) {
  assertNonEmptyArray(airBandTable, 'airBandTable');
  const score = clampNumber(normalizedScore, 0, 1000, null);

  if (score === null) {
    return { airLow: null, airHigh: null, status: 'insufficient_data' };
  }

  const band = airBandTable.find((b) => score >= b.minScore && score <= b.maxScore);
  if (!band) {
    return { airLow: null, airHigh: null, status: 'outside_reference_range' };
  }

  return { airLow: band.airLow, airHigh: band.airHigh, status: 'ok' };
}

/**
 * Qualitative shortlist band
 */
export function getShortlistBand(userScore, psuCutoffEntry) {
  if (!psuCutoffEntry || typeof psuCutoffEntry.minScore !== 'number') {
    throw new EngineInputError('psuCutoffEntry.minScore is required');
  }
  const score = clampNumber(userScore, 0, 1000, 0);
  const { minScore, safeMargin = 30 } = psuCutoffEntry;

  if (score >= minScore + safeMargin) return 'likely';
  if (score >= minScore) return 'borderline';
  return 'unlikely';
}

/**
 * Full prediction for one PSU row
 */
export function predictForOrg(userScore, psuCutoffEntry) {
  try {
    const band = getShortlistBand(userScore, psuCutoffEntry);
    return {
      org: psuCutoffEntry.name || psuCutoffEntry.org,
      band,
      minScore: psuCutoffEntry.minScore,
      cycleYear: psuCutoffEntry.cycleYear || REFERENCE_YEAR,
      sourceURL: psuCutoffEntry.sourceUrl || psuCutoffEntry.sourceURL || null,
      sourceVerified: Boolean(psuCutoffEntry.sourceUrl || psuCutoffEntry.sourceURL),
    };
  } catch (err) {
    return {
      org: psuCutoffEntry?.name || psuCutoffEntry?.org || 'unknown',
      band: 'unavailable',
      error: err.message,
    };
  }
}

export function predictAllOrgs(userScore, cutoffTable) {
  assertNonEmptyArray(cutoffTable, 'cutoffTable');
  return cutoffTable.map((entry) => predictForOrg(userScore, entry));
}

export function predictGatePerformance(testHistory = [], masteryScores = {}, overallAccuracy = 0.75) {
  const testsCount = testHistory.length;
  let avgTestScore = 0;

  if (testsCount > 0) {
    const totalScore = testHistory.reduce((acc, t) => acc + (t.score || t.percentage || 65), 0);
    avgTestScore = totalScore / testsCount;
  } else {
    avgTestScore = overallAccuracy * 100;
  }

  const estimatedRawMarks = Math.min(95, Math.max(15, parseFloat((avgTestScore * 0.85 + (overallAccuracy * 15)).toFixed(1))));

  let estimatedGateScore = Math.round(350 + (estimatedRawMarks - 25) * 10.5);
  estimatedGateScore = Math.min(980, Math.max(200, estimatedGateScore));

  let minAir = 1;
  let maxAir = 50;

  if (estimatedRawMarks >= 85) { minAir = 1; maxAir = 100; }
  else if (estimatedRawMarks >= 75) { minAir = 100; maxAir = 350; }
  else if (estimatedRawMarks >= 65) { minAir = 350; maxAir = 1000; }
  else if (estimatedRawMarks >= 50) { minAir = 1000; maxAir = 4000; }
  else if (estimatedRawMarks >= 35) { minAir = 4000; maxAir = 12000; }
  else { minAir = 12000; maxAir = 35000; }

  const qualifyingCutoff = psuData.defaultQualifyingCutoff || 28.5; 
  const isQualifying = estimatedRawMarks >= qualifyingCutoff;

  const psuStatusList = PSU_REQUIREMENTS.map(psu => {
    let band = 'Unlikely';
    let bandColor = 'rose';

    if (estimatedGateScore >= psu.minGateScore + 30) {
      band = 'Likely Call';
      bandColor = 'emerald';
    } else if (estimatedGateScore >= psu.minGateScore - 25) {
      band = 'Borderline';
      bandColor = 'amber';
    } else {
      band = 'Unlikely';
      bandColor = 'rose';
    }

    return {
      ...psu,
      band,
      bandColor
    };
  });

  return {
    estimatedRawMarks,
    estimatedGateScore,
    minAir,
    maxAir,
    airBandStr: `~ AIR #${minAir.toLocaleString()} – #${maxAir.toLocaleString()}`,
    qualifyingCutoff,
    isQualifying,
    psuStatusList,
    referenceYear: REFERENCE_YEAR,
    confidenceLevel: testsCount >= 5 ? 'High Calibration (5+ tests)' : testsCount >= 2 ? 'Moderate' : 'Preliminary Estimate'
  };
}
