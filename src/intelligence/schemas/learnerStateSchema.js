/**
 * Learner State Schema
 * Defines the canonical state representation of a user's progress.
 */

export const LEARNER_STATE_SCHEMA = {
  version: "state-v2.0.0",
  fields: {
    userId: "string",
    concepts: {
      "conceptId": {
        pKnown: "number",
        evidenceCount: "number",
        supportingEvidence: "number",
        lastUpdatedAt: "string"
      }
    },
    pacing: {
      medianTimeMs: "number",
      madTimeMs: "number",
      iqrTimeMs: "number|optional"
    },
    retention: {
      "conceptId": "number"
    },
    insights: ["IntelligenceInsight"]
  }
};
