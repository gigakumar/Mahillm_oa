/**
 * Observation Factory
 * Generates an array of CognitiveObservations from an Attempt Snapshot.
 */

export function createObservationId({ attemptId, observationType, conceptId }) {
  return [
    attemptId,
    observationType,
    conceptId ?? "GLOBAL"
  ].map(encodeURIComponent).join(":");
}

export function generateObservations(snapshot, context = {}) {
  const { userId = "unknown", conceptIds = [] } = context;
  const { derived, attemptId, questionId } = snapshot;
  
  const observations = [];
  const timestamp = new Date().toISOString();
  
  const createObs = (type, weight = 1.0, value = undefined) => {
    // For simplicity, we emit one observation per concept, or just one global if no concepts
    const conceptsToEmit = conceptIds.length > 0 ? conceptIds : ["GLOBAL"];
    
    conceptsToEmit.forEach(conceptId => {
      observations.push({
        id: createObservationId({ attemptId, observationType: type, conceptId }),
        userId,
        attemptId,
        questionId,
        conceptId,
        observationType: type,
        value,
        evidenceWeight: weight,
        sourceEngine: "ObservationFactory",
        observedAt: timestamp
      });
    });
  };

  // Base correctness observation
  if (derived.finalAnswerCorrect) {
    createObs("CORRECT");
  } else {
    createObs("INCORRECT");
  }

  // Strategy observations
  if (!derived.finalAnswerCorrect && derived.activeTimeMs < 15000) {
    createObs("RUSHED_ERROR");
  }
  
  if (!derived.finalAnswerCorrect && derived.activeTimeMs > 90000) {
    createObs("SLOW_ERROR");
  }

  // Confidence & Switch observations
  if (derived.switchCount > 2) {
    createObs("PANIC_SWITCH", 1.0, derived.switchCount);
  }

  if (derived.firstAnswerCorrect && !derived.finalAnswerCorrect) {
    createObs("SECOND_GUESS_ERROR");
  }

  if (!derived.firstAnswerCorrect && derived.finalAnswerCorrect) {
    createObs("DELIBERATIVE_CORRECTION");
  }

  if (!derived.finalAnswerCorrect && derived.confidence === "SURE") {
    createObs("HIGH_CONFIDENCE_ERROR");
  }

  if (derived.finalAnswerCorrect && derived.confidence === "UNSURE") {
    createObs("LOW_CONFIDENCE_SUCCESS");
  }

  return observations;
}
