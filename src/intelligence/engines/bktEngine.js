/**
 * Bayesian Knowledge Tracing (BKT) Engine
 *
 * Implements standard BKT math to track the posterior probability of a user
 * knowing a specific concept, given their history of correct/incorrect answers.
 */

/**
 * Standard Bayesian update for pKnow.
 *
 * @param {boolean} isCorrect - Did the user answer correctly?
 * @param {number} pKnow - Current probability of knowing the skill (0-1)
 * @param {number} pLearn - Probability of learning the skill after an attempt
 * @param {number} pGuess - Probability of guessing correctly without knowing
 * @param {number} pSlip - Probability of making a mistake despite knowing
 * @param {string} confidence - User's confidence level ('sure', 'unsure', 'guess', null)
 * @returns {Object} Updated { pKnow, pLearn, pGuess, pSlip }
 */
export function updateBKT(isCorrect, pKnow, pLearn, pGuess, pSlip, confidence = null) {
  // 1. Calculate the probability that the user knew the skill *before* learning during this step.
  // P(L_{t-1} | Obs)
  let pKnowGivenObs;
  
  if (isCorrect) {
    // P(L | Correct) = (P(L) * (1 - Slip)) / (P(L) * (1 - Slip) + (1 - P(L)) * Guess)
    const numerator = pKnow * (1 - pSlip);
    const denominator = numerator + ((1 - pKnow) * pGuess);
    pKnowGivenObs = denominator === 0 ? 0 : numerator / denominator;
  } else {
    // P(L | Incorrect) = (P(L) * Slip) / (P(L) * Slip + (1 - P(L)) * (1 - Guess))
    const numerator = pKnow * pSlip;
    const denominator = numerator + ((1 - pKnow) * (1 - pGuess));
    pKnowGivenObs = denominator === 0 ? 0 : numerator / denominator;
  }

  // Observation Reliability weighting
  let weight = 1.0;
  if (confidence === 'sure') {
    weight = 1.3;
  } else if (confidence === 'guess' || confidence === 'unsure') {
    weight = 0.7;
  }

  // Apply weight to pKnowGivenObs before calculating learning
  const weightedPKnowGivenObs = Math.max(0, Math.min(1, pKnowGivenObs * weight));

  // 2. Incorporate the probability of learning *during* this step.
  // P(L_t) = P(L_{t-1} | Obs) + (1 - P(L_{t-1} | Obs)) * P(Learn)
  const newPKnow = weightedPKnowGivenObs + ((1 - weightedPKnowGivenObs) * pLearn);

  // Return bounded values
  return {
    pKnow: Math.max(0.01, Math.min(0.99, newPKnow)),
    pLearn,
    pGuess,
    pSlip
  };
}

export function applyDecay(pKnow, daysSinceLastReview) {
  return pKnow * Math.exp(-0.01 * daysSinceLastReview);
}

/**
 * Migrates a legacy heuristic score to BKT parameters.
 */
export function migrateScoreToBKT(legacyScore) {
  const boundedScore = Math.max(0.05, Math.min(0.95, legacyScore || 0.3));
  return {
    pKnow: boundedScore,
    pLearn: 0.1,  // Standard learning rate
    pGuess: 0.2,  // Default 20% guess rate (typical for 5-option MCQ)
    pSlip: 0.1,   // Default 10% slip rate
  };
}
