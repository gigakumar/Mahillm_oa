import { intelligenceProvider } from "../providers/providerRegistry.js";
import { IntelligenceTask } from "../schemas/questionIntelligenceSchema.js";

export async function ambiguityAgent(context) {
  // Ambiguity is hard to do deterministically beyond simple heuristics (like multiple "which of the following" phrases)
  const semantic = await intelligenceProvider.analyze({
    task: IntelligenceTask.AMBIGUITY_ANALYSIS,
    question: context.question,
    context: {}
  });

  // Mocking semantic return
  return {
    score: 0.05,
    confidence: 0.9,
    flags: []
  };
}
