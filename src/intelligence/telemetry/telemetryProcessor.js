import { deriveActivePacing } from './eventDerivations';

/**
 * Telemetry Processor
 * Converts raw, immutable event streams into fast-analytics attempt snapshots.
 */
export const CURRENT_TELEMETRY_VERSION = "telemetry-v1.0.0";

export function validateEventStream(events) {
  const eventIds = new Set();
  const sequences = new Set();

  for (const event of events) {
    if (eventIds.has(event.eventId)) {
      throw new Error("DUPLICATE_EVENT_ID");
    }
    if (sequences.has(event.sequence)) {
      throw new Error("DUPLICATE_EVENT_SEQUENCE");
    }
    if (!Number.isInteger(event.sequence) || event.sequence < 1) {
      throw new Error("INVALID_EVENT_SEQUENCE");
    }
    eventIds.add(event.eventId);
    sequences.add(event.sequence);
  }
  return true;
}

export function orderEventStream(events) {
  return [...events].sort((a, b) => a.sequence - b.sequence);
}

export function processAttemptEvents(rawAttemptData, questionMetadata = {}) {
  const { attemptId, events = [] } = rawAttemptData;
  const { questionId, questionVersion = 1, answerIndex } = questionMetadata;

  validateEventStream(events);
  const orderedEvents = orderEventStream(events);

  // Basic derivation logic
  const pacing = deriveActivePacing(orderedEvents);
  
  let firstOption = null;
  let finalOption = null;
  let firstCommitmentMs = null;
  let finalCommitmentMs = null;
  let switchCount = 0;
  let confidence = null;
  
  let startTime = null;

  orderedEvents.forEach(event => {
    if (event.type === 'QUESTION_OPENED' && !startTime) {
      startTime = event.timestamp;
    }
    
    if (event.type === 'OPTION_SELECTED') {
      const timeElapsed = startTime ? (new Date(event.timestamp).getTime() - new Date(startTime).getTime()) : 0;
      if (firstOption === null) {
        firstOption = event.payload?.option ?? event.option;
        firstCommitmentMs = timeElapsed;
      } else if (finalOption !== (event.payload?.option ?? event.option)) {
        switchCount++;
      }
      finalOption = event.payload?.option ?? event.option;
      finalCommitmentMs = timeElapsed;
    }

    if (event.type === 'CONFIDENCE_SELECTED') {
      confidence = event.payload?.confidence ?? event.confidence; // e.g. "SURE", "UNSURE"
    }
  });

  const firstAnswerCorrect = (firstOption !== null && answerIndex !== undefined) ? firstOption === answerIndex : null;
  const finalAnswerCorrect = (finalOption !== null && answerIndex !== undefined) ? finalOption === answerIndex : false;

  return {
    attemptId,
    questionId,
    source: {
      eventCount: orderedEvents.length,
      firstSequence: orderedEvents.length > 0 ? orderedEvents[0].sequence : null,
      lastSequence: orderedEvents.length > 0 ? orderedEvents[orderedEvents.length - 1].sequence : null,
      eventSchemaVersion: 1
    },
    derivation: {
      engineVersion: CURRENT_TELEMETRY_VERSION,
      derivedAt: new Date().toISOString()
    },
    derived: {
      activeTimeMs: pacing.activeTimeMs,
      idleTimeMs: pacing.idleTimeMs,
      firstOption,
      finalOption,
      switchCount,
      firstAnswerCorrect,
      finalAnswerCorrect,
      firstCommitmentMs,
      finalCommitmentMs,
      confidence
    }
  };
}
