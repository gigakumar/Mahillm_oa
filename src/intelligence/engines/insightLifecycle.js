const INSIGHT_TRANSITIONS = {
  ACTIVE: ["ACTIVE", "IMPROVING", "RESOLVED", "STALE"],
  IMPROVING: ["ACTIVE", "IMPROVING", "RESOLVED", "STALE"],
  RESOLVED: ["RESOLVED", "ACTIVE"],
  STALE: ["STALE", "ACTIVE"]
};

export function canTransition(fromStatus, toStatus) {
  return INSIGHT_TRANSITIONS[fromStatus]?.includes(toStatus) || false;
}

export function createInsightId({ userId, type, scopeLevel, scopeId }) {
  return [
    userId,
    type,
    scopeLevel,
    scopeId ?? "GLOBAL"
  ].map(encodeURIComponent).join(":");
}

export function transitionInsight(existingInsight, nextStatus, timestamp) {
  if (!existingInsight) return null;
  
  if (!canTransition(existingInsight.status, nextStatus)) {
    throw new Error("INVALID_INSIGHT_TRANSITION");
  }

  const updated = {
    ...existingInsight,
    status: nextStatus,
    lastObservedAt: nextStatus === "STALE" ? existingInsight.lastObservedAt : timestamp,
    resolvedAt: nextStatus === "RESOLVED" ? timestamp : (nextStatus === "ACTIVE" || nextStatus === "IMPROVING" ? null : existingInsight.resolvedAt)
  };

  if (existingInsight.status === "RESOLVED" && nextStatus === "ACTIVE") {
    updated.lifecycle = {
      reactivationCount: (existingInsight.lifecycle?.reactivationCount || 0) + 1,
      lastReactivatedAt: timestamp
    };
  }

  return updated;
}
