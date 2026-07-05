/**
 * Bayesian Knowledge Tracing (BKT) Engine.
 * Models skill/concept mastery learning states dynamically.
 */

export const BKT_DEFAULTS = {
  pKnown: 0.25,  // initial prior
  pLearn: 0.12,  // transition probability
  pSlip: 0.10,   // slip probability (answering wrong despite knowing)
  pGuess: 0.20   // guess probability (answering right despite not knowing)
};

export function updateKnowledgeState(currentState = {}, isCorrect) {
  const pKnown = currentState.pKnown !== undefined ? currentState.pKnown : BKT_DEFAULTS.pKnown;
  const pLearn = currentState.pLearn !== undefined ? currentState.pLearn : BKT_DEFAULTS.pLearn;
  const pSlip = currentState.pSlip !== undefined ? currentState.pSlip : BKT_DEFAULTS.pSlip;
  const pGuess = currentState.pGuess !== undefined ? currentState.pGuess : BKT_DEFAULTS.pGuess;

  let pKnownGivenObservation = 0.0;

  if (isCorrect) {
    // Correct update equation
    const numerator = pKnown * (1 - pSlip);
    const denominator = numerator + (1 - pKnown) * pGuess;
    pKnownGivenObservation = numerator / denominator;
  } else {
    // Incorrect update equation
    const numerator = pKnown * pSlip;
    const denominator = numerator + (1 - pKnown) * (1 - pGuess);
    pKnownGivenObservation = numerator / denominator;
  }

  // Apply learning transition: P(K_next) = P(K | Obs) + (1 - P(K | Obs)) * P(T)
  const pKnownNext = pKnownGivenObservation + (1 - pKnownGivenObservation) * pLearn;

  // Protect bounds strictly between 0 and 1
  const finalPKnown = Math.min(Math.max(pKnownNext, 0.001), 0.999);

  return {
    pKnown: parseFloat(finalPKnown.toFixed(4)),
    evidenceCount: (currentState.evidenceCount || 0) + 1,
    parameters: { pLearn, pSlip, pGuess },
    lastUpdatedAt: Date.now()
  };
}

/**
 * Traces a sequence of attempts on a single concept/topic to output final knowledgeState.
 */
export function traceConceptAttempts(attempts = [], initialState = {}) {
  let state = { ...BKT_DEFAULTS, ...initialState, evidenceCount: 0 };
  attempts.forEach(attempt => {
    state = updateKnowledgeState(state, attempt.correct);
  });
  return state;
}

/**
 * Updates knowledge states based on primary and supporting concepts.
 * Primary concepts undergo standard BKT update.
 * Supporting concepts only receive evidence counter increments.
 * 
 * @param {string} primaryConceptId 
 * @param {string[]} supportingConceptIds 
 * @param {boolean} isCorrect 
 * @param {Object} currentStatesMap - Map of conceptId to its current BKT state
 * @returns {Object} Updated currentStatesMap
 */
export function updateConceptKnowledge(primaryConceptId, supportingConceptIds = [], isCorrect, currentStatesMap = {}) {
  const updatedStates = { ...currentStatesMap };

  // Update primary concept using standard BKT
  if (primaryConceptId) {
    const currentState = updatedStates[primaryConceptId] || { ...BKT_DEFAULTS, evidenceCount: 0 };
    updatedStates[primaryConceptId] = updateKnowledgeState(currentState, isCorrect);
  }

  // Update supporting concepts (contextual evidence counters only)
  supportingConceptIds.forEach(conceptId => {
    const currentState = updatedStates[conceptId] || {
      ...BKT_DEFAULTS, 
      evidenceCount: 0,
      supportingEvidence: {
        exposures: 0,
        weightedCorrect: 0,
        weightedIncorrect: 0
      }
    };

    const weight = 0.35;
    const currentSupporting = currentState.supportingEvidence || { exposures: 0, weightedCorrect: 0, weightedIncorrect: 0 };

    updatedStates[conceptId] = {
      ...currentState,
      supportingEvidence: {
        exposures: currentSupporting.exposures + 1,
        weightedCorrect: currentSupporting.weightedCorrect + (isCorrect ? weight : 0),
        weightedIncorrect: currentSupporting.weightedIncorrect + (!isCorrect ? weight : 0)
      },
      lastUpdatedAt: Date.now()
    };
  });

  return updatedStates;
}
