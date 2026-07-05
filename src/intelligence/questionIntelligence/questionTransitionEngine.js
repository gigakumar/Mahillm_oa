/**
 * Question Transition Engine
 * Evaluates cognitive transition smoothness between question A and question B.
 */

export function calculateTransitionScore(questionA, questionB, learnerState = {}) {
  // 1. Concept / Topic distance
  const sameTopic = questionA.topic === questionB.topic;
  const sameConcepts = (questionA.concepts || []).some(c => (questionB.concepts || []).includes(c));
  
  let conceptDistance = 1.0;
  if (sameConcepts) conceptDistance = 0.0;
  else if (sameTopic) conceptDistance = 0.3;

  // 2. Difficulty delta
  const diffA = typeof questionA.difficultyScore === 'number' ? questionA.difficultyScore : 0.5;
  const diffB = typeof questionB.difficultyScore === 'number' ? questionB.difficultyScore : 0.5;
  const difficultyDelta = Math.abs(diffA - diffB);

  // 3. Format shift
  const formatA = questionA.format || questionA.sourceType || 'standard';
  const formatB = questionB.format || questionB.sourceType || 'standard';
  const formatShift = formatA !== formatB;

  // Transition scoring logic:
  // We want to avoid radical shifts in difficulty (e.g. delta > 0.4) unless deliberate,
  // and we want smooth concept progression (distance around 0.3 is optimal for reinforcement,
  // whereas distance 0.0 is exact repetition, and 1.0 is a complete jump).
  let transitionType = "near_transfer";
  let score = 1.0;

  if (sameConcepts) {
    transitionType = "repetition";
    score = 0.5; // penalize exact concept repetition slightly to avoid loops
  } else if (sameTopic) {
    transitionType = "near_transfer";
    score = 0.9;
  } else {
    transitionType = "far_transfer";
    score = 0.65;
  }

  // Penalty for extreme difficulty jumps
  if (difficultyDelta > 0.4) {
    score -= 0.25;
  }

  return {
    transitionScore: parseFloat(Math.max(0.1, score).toFixed(2)),
    transitionType,
    difficultyDelta: parseFloat(difficultyDelta.toFixed(2)),
    conceptDistance
  };
}
