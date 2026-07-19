/**
 * Cognitive Insight Engine
 * Generates evidence-backed learning insights from user telemetry.
 * 
 * Data sources:
 *  - ATTEMPT_HISTORY: derived from the local compiledAttempts[] array (client-side).
 *  - MISTAKE_NOTEBOOK: derived from Firestore mahi-oa collection (server-confirmed).
 * 
 * These are intentionally separate. Attempt-based insights can fire as soon as
 * 10 questions are answered; Mistake Notebook entries are only created after the
 * backend mistakeWorker processes the Pub/Sub event.
 */

export function deriveInsights(learnerState, attempts = [], mistakes = {}) {
  const insights = [];

  const totalAttempts = attempts.length;
  if (totalAttempts < 10) {
    return []; // Insufficient telemetry
  }

  // Helper to check standard deviations and rate ratios
  const mistakesList = Object.values(mistakes || {});

  // 1. Calculation Cascade Pattern (source: MISTAKE_NOTEBOOK)
  const calcMistakes = mistakesList.filter(m => m.mistakeType === 'calculation' || m.mistakeType === 'CALCULATION_CASCADE');
  const calcRate = mistakesList.length > 0 ? calcMistakes.length / mistakesList.length : 0;
  if (calcRate >= 0.35 && calcMistakes.length >= 3) {
    insights.push({
      insightId: "calc_cascade",
      type: "CALCULATION_CASCADE",
      dataSource: "MISTAKE_NOTEBOOK",
      severity: "HIGH",
      confidence: 0.85,
      title: "Calculation Cascade issues identified",
      summary: "You usually identify the correct method but make an early numerical error that propagates through the remaining solution.",
      evidence: {
        currentRate: Math.round(calcRate * 100),
        sampleSize: mistakesList.length,
        evidenceCount: calcMistakes.length
      },
      affectedConcepts: [...new Set(calcMistakes.map(m => m.topic).filter(Boolean))].slice(0, 3),
      recommendedIntent: "MISTAKE_REPAIR"
    });
  }

  // 2. Overconfident Error Pattern (source: ATTEMPT_HISTORY)
  // When they marked 'sure' but answered incorrectly
  const incorrectAttempts = attempts.filter(a => !a.correct);
  const sureIncorrect = incorrectAttempts.filter(a => a.confidence?.toLowerCase() === 'sure');
  const overconfidentRate = incorrectAttempts.length > 0 ? sureIncorrect.length / incorrectAttempts.length : 0;

  if (overconfidentRate >= 0.3 && sureIncorrect.length >= 3) {
    insights.push({
      insightId: "overconfident_errors",
      type: "OVERCONFIDENT_ERROR_PATTERN",
      dataSource: "ATTEMPT_HISTORY",
      severity: "HIGH",
      confidence: 0.90,
      title: "High-confidence errors are increasing",
      summary: "You are highly confident ('Sure') on incorrect answers. These represent core misconceptions rather than random errors.",
      evidence: {
        currentRate: Math.round(overconfidentRate * 100),
        sampleSize: incorrectAttempts.length,
        evidenceCount: sureIncorrect.length
      },
      affectedConcepts: [...new Set(sureIncorrect.map(a => a.topic).filter(Boolean))].slice(0, 3),
      recommendedIntent: "WEAKNESS_REPAIR"
    });
  }

  // 3. Hidden Strength Pattern (source: ATTEMPT_HISTORY)
  const correctAttempts = attempts.filter(a => a.correct);
  const correctLowConf = correctAttempts.filter(a => a.confidence?.toLowerCase() === 'guess' || a.confidence?.toLowerCase() === 'unsure');
  const lowConfRate = correctAttempts.length > 0 ? correctLowConf.length / correctAttempts.length : 0;

  if (lowConfRate >= 0.35 && correctLowConf.length >= 3) {
    insights.push({
      insightId: "hidden_strengths",
      type: "HIDDEN_STRENGTH",
      dataSource: "ATTEMPT_HISTORY",
      severity: "MEDIUM",
      confidence: 0.80,
      title: "Hidden strengths detected",
      summary: "You consistently underestimate your performance in some concepts. You answered correctly despite reporting low confidence.",
      evidence: {
        currentRate: Math.round(lowConfRate * 100),
        sampleSize: correctAttempts.length,
        evidenceCount: correctLowConf.length
      },
      affectedConcepts: [...new Set(correctLowConf.map(a => a.topic).filter(Boolean))].slice(0, 3),
      recommendedIntent: "STRETCH"
    });
  }

  // 4. Knowledge Decay Risk (source: ATTEMPT_HISTORY via retentionMap)
  const decayingTopics = Object.keys(learnerState.retentionMap || {}).filter(topic => {
    return learnerState.retentionMap[topic] < 0.6;
  });

  if (decayingTopics.length > 0) {
    insights.push({
      insightId: "knowledge_decay",
      type: "DECAY_RISK",
      dataSource: "ATTEMPT_HISTORY",
      severity: "MEDIUM",
      confidence: 0.75,
      title: "Active knowledge decay detected",
      summary: "Key concepts have not been reinforced recently, leading to memory retrieval decay risks.",
      evidence: {
        decayCount: decayingTopics.length,
        sampleSize: Object.keys(learnerState.retentionMap || {}).length,
        evidenceCount: decayingTopics.length
      },
      affectedConcepts: decayingTopics.slice(0, 3),
      recommendedIntent: "DECAY_RECOVERY"
    });
  }

  return insights;
}
