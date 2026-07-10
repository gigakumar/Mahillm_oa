import { intelligenceProvider } from "../providers/providerRegistry.js";
import { IntelligenceTask } from "../schemas/questionIntelligenceSchema.js";

export async function qualityAgent(context) {
  const deterministic = evaluateQualityTelemetry(context);

  if (deterministic.confidence >= 0.9 && deterministic.action === "QUARANTINE") {
    // Fast fail for obviously broken questions
    return deterministic;
  }

  const semantic = await intelligenceProvider.analyze({
    task: IntelligenceTask.QUALITY_ANALYSIS,
    question: context.question,
    context: deterministic
  });

  return mergeQualityEvidence(deterministic, semantic);
}

function evaluateQualityTelemetry(context) {
  let score = 0.8;
  let action = "KEEP";
  let confidence = 0.6;
  
  const suspicious = 
    context.stats.answerDisputeRate > 0.15 ||
    context.stats.skipRate > 0.40 ||
    context.discrimination.score < 0 ||
    (context.stats.optionEntropy && context.stats.optionEntropy < 0.20);
    
  if (suspicious) {
    score = 0.4;
    action = "QUARANTINE";
    confidence = 0.85; // Still might want semantic confirmation
  }
  
  return { score, action, confidence, flags: suspicious ? ["TELEMETRY_FLAGGED"] : [] };
}

function mergeQualityEvidence(deterministic, semantic) {
  // In a real implementation, merge logic goes here.
  return {
    score: deterministic.score,
    flags: deterministic.flags,
    action: deterministic.action,
    confidence: Math.max(deterministic.confidence, 0.9)
  };
}
