/**
 * Cognitive Observation Schema
 * The intermediate semantic layer translating attempt snapshots into model inputs.
 */

export const COGNITIVE_OBSERVATION_SCHEMA = {
  id: "string",
  userId: "string",
  attemptId: "string",
  questionId: "number",
  conceptId: "string",
  observationType: "string", // e.g. "CORRECT", "INCORRECT", "RUSHED_ERROR", etc.
  value: "number|optional",
  evidenceWeight: "number",
  sourceEngine: "string",
  observedAt: "string"
};
