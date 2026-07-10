export function determineRequiredAgents(context) {
  const agents = [];

  // Difficulty Agent Invocation
  if (
    context.stats.totalAttempts < 20 ||
    context.difficulty.confidence < 0.7
  ) {
    agents.push("difficulty");
  }

  // Quality and Ambiguity Agent Invocation
  if (
    context.health.status !== "HEALTHY" ||
    context.discrimination.score < 0.1 ||
    context.stats.answerDisputeRate > 0.10
  ) {
    agents.push("quality");
    agents.push("ambiguity");
  }

  // Concept Agent Invocation
  if (
    !context.question.primaryConcept ||
    context.question.conceptConfidence < 0.8
  ) {
    agents.push("concept");
  }

  // Duplicate Agent Invocation
  if (
    context.question.duplicateStatus === "UNKNOWN"
  ) {
    agents.push("duplicate");
  }

  return agents;
}
