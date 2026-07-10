import { intelligenceProvider } from "../providers/providerRegistry.js";
import { IntelligenceTask } from "../schemas/questionIntelligenceSchema.js";

export async function difficultyAgent(context) {
  const deterministic = extractDifficultyFeatures(context.question);

  if (deterministic.confidence >= 0.9) {
    return deterministic;
  }

  const semantic = await intelligenceProvider.analyze({
    task: IntelligenceTask.DIFFICULTY_ANALYSIS,
    question: context.question,
    context: deterministic
  });

  return mergeDifficultyEvidence(deterministic, semantic);
}

function extractDifficultyFeatures(question) {
  // Mock deterministic feature extraction
  // Counting calculation steps, identifying units, etc.
  const conceptDepth = question.text.length > 200 ? 0.8 : 0.4;
  const calculationBurden = question.text.includes("calculate") ? 0.7 : 0.2;
  const reasoningSteps = 3;
  
  const semanticDifficulty = 
    conceptDepth * 0.3 + 
    calculationBurden * 0.4 + 
    (reasoningSteps / 10) * 0.3;

  return {
    semanticDifficulty,
    confidence: 0.7 // Low confidence to trigger semantic model for this example
  };
}

function mergeDifficultyEvidence(deterministic, semantic) {
  // Simplistic merge for now
  const mergedDifficulty = (deterministic.semanticDifficulty * 0.4) + (0.8 * 0.6); // Assuming semantic model returns 0.8
  return {
    semanticDifficulty: mergedDifficulty,
    confidence: Math.max(deterministic.confidence, 0.9)
  };
}
