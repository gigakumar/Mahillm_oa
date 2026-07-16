/**
 * Item Response Theory (IRT) Engine
 *
 * Provides functions to estimate the probability of a user answering a question correctly
 * based on their BKT mastery (ability, theta) and the question's IRT parameters.
 */

/**
 * 3-Parameter Logistic (3PL) IRT Model.
 * Calculates the probability P(Correct | theta).
 *
 * @param {number} theta - User's ability (e.g., BKT pKnow from 0 to 1, scaled if necessary)
 * @param {number} a - Discrimination parameter (how well the question differentiates skill)
 * @param {number} b - Difficulty parameter
 * @param {number} c - Guessing parameter (pseudo-guessing chance)
 * @returns {number} Probability of correct response (0-1)
 */
export function calculateIRTProbability(theta, a, b, c) {
  // Map theta from [0, 1] (BKT) to a standard normal distribution roughly [-3, 3]
  // A simple linear mapping for now:
  const scaledTheta = (theta - 0.5) * 6; // 0 -> -3, 1 -> 3
  const scaledB = (b - 0.5) * 6;

  const exponent = -a * (scaledTheta - scaledB);
  const prob = c + (1 - c) / (1 + Math.exp(exponent));
  return prob;
}

/**
 * Get default IRT parameters based on a difficulty string.
 *
 * @param {string} difficulty - 'easy', 'medium', 'hard'
 * @returns {Object} { a, b, c }
 */
export function getDefaultIRTParams(difficulty) {
  const normDiff = (difficulty || 'medium').toLowerCase();
  
  // a (discrimination): typical range 0.5 to 2.5
  // b (difficulty): typical range 0 to 1 (which maps to -3 to 3)
  // c (guessing): typical 0.2 for 5 options
  
  if (normDiff === 'easy') {
    return { a: 1.0, b: 0.25, c: 0.2 };
  } else if (normDiff === 'hard') {
    return { a: 1.5, b: 0.85, c: 0.2 };
  } else {
    return { a: 1.2, b: 0.5, c: 0.2 };
  }
}
