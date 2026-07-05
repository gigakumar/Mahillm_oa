/**
 * Semantic Redundancy Engine
 * Penalizes templates, clusters, and solution patterns recently answered by the student.
 */

export function calculateSemanticPenalty(question, recentQuestionsList = []) {
  let penalty = 0.0;

  recentQuestionsList.forEach((q, index) => {
    // index 0 is the most recent attempt
    const recencyWeight = Math.max(0, 1.0 - (index * 0.25));
    if (recencyWeight <= 0) return;

    // 1. Exact duplicate ID guard
    if (q.id === question.id || q.questionId === question.id) {
      penalty += 1.0 * recencyWeight;
    }

    // 2. Semantic Cluster match
    if (question.semanticClusterId && q.semanticClusterId === question.semanticClusterId) {
      penalty += 0.5 * recencyWeight;
    }

    // 3. Template Family match
    if (question.templateFamilyId && q.templateFamilyId === question.templateFamilyId) {
      penalty += 0.4 * recencyWeight;
    }

    // 4. Solution Pattern match
    if (question.solutionPatternId && q.solutionPatternId === question.solutionPatternId) {
      penalty += 0.3 * recencyWeight;
    }
  });

  return parseFloat(Math.min(1.5, penalty).toFixed(2));
}
