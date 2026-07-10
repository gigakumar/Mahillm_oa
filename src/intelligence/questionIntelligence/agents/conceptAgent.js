import { intelligenceProvider } from "../providers/providerRegistry.js";
import { IntelligenceTask } from "../schemas/questionIntelligenceSchema.js";

export async function conceptAgent(context) {
  const taxonomyMatch = matchExistingTaxonomy(context.question);

  if (taxonomyMatch.confidence >= 0.95) {
    return taxonomyMatch;
  }

  const semantic = await intelligenceProvider.analyze({
    task: IntelligenceTask.CONCEPT_ANALYSIS,
    question: context.question,
    context: taxonomyMatch
  });

  return mergeConceptEvidence(taxonomyMatch, semantic);
}

function matchExistingTaxonomy(question) {
  // Keyword based heuristic
  if (question.text.toLowerCase().includes("entropy")) {
    return {
      primary: "thermodynamics_entropy",
      supporting: ["second_law"],
      confidence: 0.8
    };
  }
  
  return { primary: null, supporting: [], confidence: 0.1 };
}

function mergeConceptEvidence(deterministic, semantic) {
  return deterministic.confidence >= 0.8 ? deterministic : {
    primary: "inferred_concept",
    supporting: [],
    confidence: 0.9
  };
}
