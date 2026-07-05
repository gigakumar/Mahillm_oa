import { CURRENT_TELEMETRY_VERSION, orderEventStream } from './telemetryProcessor';

export const ATTEMPT_SNAPSHOT_SCHEMA = {
  version: "telemetry-v1.0.0",
  fields: {
    attemptId: "string",
    questionId: "number",
    source: {
      eventCount: "number",
      firstSequence: "number|null",
      lastSequence: "number|null",
      eventSchemaVersion: "number"
    },
    derivation: {
      engineVersion: "string",
      derivedAt: "string"
    },
    derived: {
      activeTimeMs: "number",
      idleTimeMs: "number",
      firstOption: "number|null",
      finalOption: "number|null",
      switchCount: "number",
      firstAnswerCorrect: "boolean|null",
      finalAnswerCorrect: "boolean",
      firstCommitmentMs: "number|null",
      finalCommitmentMs: "number|null",
      confidence: "string|null"
    }
  }
};

export function isSnapshotStale(snapshot, events) {
  if (!snapshot) return true;
  if (!events || events.length === 0) return false;
  
  const orderedEvents = orderEventStream(events);
  
  return (
    snapshot.source?.eventCount !== orderedEvents.length ||
    snapshot.source?.lastSequence !== orderedEvents[orderedEvents.length - 1]?.sequence ||
    snapshot.derivation?.engineVersion !== CURRENT_TELEMETRY_VERSION
  );
}
