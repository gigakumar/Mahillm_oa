export const INTELLIGENCE_INSIGHT_SCHEMA = {
  id: "string",
  type: "string",
  severity: "LOW|MEDIUM|HIGH",
  confidence: "LOW|MEDIUM|HIGH",
  scope: {
    level: "GLOBAL|SUBJECT|TOPIC|CONCEPT",
    id: "string|optional"
  },
  status: "ACTIVE|IMPROVING|RESOLVED|STALE",
  evidence: "object",
  explanation: "string",
  recommendedAction: {
    type: "string",
    targetId: "string|optional",
    questionCount: "number|optional"
  },
  engineVersion: "string",
  firstDetectedAt: "string",
  lastObservedAt: "string",
  resolvedAt: "string|optional",
  lifecycle: {
    reactivationCount: "number",
    lastReactivatedAt: "string|optional"
  }
};
