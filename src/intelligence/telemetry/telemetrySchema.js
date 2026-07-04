/**
 * Telemetry Schema Contracts.
 * Defines the canonical attempt structure and event models.
 */

export const SCHEMA_VERSION = 1;

export function validateTelemetryEvent(event) {
  const required = ['type', 'timestamp'];
  for (const field of required) {
    if (event[field] === undefined) {
      throw new Error(`Invalid telemetry event: missing required field "${field}"`);
    }
  }
  return true;
}

export function validateAttemptTelemetry(telemetry) {
  const required = ['attemptId', 'userId', 'questionId', 'events'];
  for (const field of required) {
    if (telemetry[field] === undefined) {
      throw new Error(`Invalid attempt telemetry: missing required field "${field}"`);
    }
  }

  if (!Array.isArray(telemetry.events)) {
    throw new Error('Invalid attempt telemetry: "events" must be an array');
  }

  telemetry.events.forEach(validateTelemetryEvent);
  return true;
}

export function createInitialAttempt({
  attemptId,
  sessionId,
  userId,
  questionId,
  questionVersion = 1,
  mode = "PRACTICE"
}) {
  return {
    schemaVersion: SCHEMA_VERSION,
    attemptId,
    sessionId,
    userId,
    questionId,
    questionVersion,
    context: {
      mode,
      createdAt: Date.now()
    },
    timing: {
      openedAt: Date.now(),
      firstInteractionAt: null,
      submittedAt: null,
      activeTimeMs: 0,
      idleTimeMs: 0
    },
    answer: {
      finalOption: null,
      correctOption: null,
      isCorrect: null
    },
    confidence: null,
    events: [
      {
        type: "QUESTION_OPENED",
        timestamp: Date.now()
      }
    ]
  };
}
