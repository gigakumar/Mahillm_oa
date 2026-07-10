import { intelligenceProvider } from "../providers/providerRegistry.js";
import { IntelligenceTask } from "../schemas/questionIntelligenceSchema.js";

export async function duplicateAgent(context) {
  const embeddingMatch = findEmbeddingSimilarity(context.question);

  if (embeddingMatch.similarity < 0.7) {
    return { isDuplicate: false, confidence: 0.95, matches: [] };
  }

  const semantic = await intelligenceProvider.analyze({
    task: IntelligenceTask.DUPLICATE_ANALYSIS,
    question: context.question,
    context: { embeddingMatch }
  });

  return semantic; // In real implementation, merge logic here
}

function findEmbeddingSimilarity(question) {
  // Mock finding similar questions using vector DB
  return { similarity: 0.5, matches: [] };
}
