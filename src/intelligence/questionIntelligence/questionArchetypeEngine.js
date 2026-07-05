/**
 * Question Archetype Engine
 * Classifies questions into behavioral diagnostic profiles.
 */

export function inferQuestionArchetype(stats, difficultyScore, discriminationScore) {
  const answered = stats.answeredCount || 0;
  const correctRatio = answered > 0 ? stats.correctCount / answered : 0.5;
  const sureWrongRatio = stats.wrongCount > 0 ? stats.sureWrongCount / stats.wrongCount : 0.0;
  const timeoutRatio = answered > 0 ? stats.timeoutCount / answered : 0.0;
  const avgSolveTimeSeconds = answered > 0 ? (stats.totalResponseTime / answered) / 1000 : 45;

  let primary = "conceptual";
  let confidence = 0.5;
  const evidence = [];

  // 1. confidence_trap
  if (correctRatio < 0.5 && sureWrongRatio > 0.4) {
    primary = "confidence_trap";
    confidence = 0.85;
    evidence.push("high_confidence_wrong_ratio");
    if (difficultyScore > 0.6) evidence.push("strong_distractor_concentration");
  }
  // 2. time_sink
  else if (avgSolveTimeSeconds > 90 && correctRatio < 0.5) {
    primary = "time_sink";
    confidence = 0.8;
    evidence.push("high_average_solve_time");
    if (timeoutRatio > 0.15) evidence.push("time_budget_exceeded");
  }
  // 3. easy_separator
  else if (correctRatio > 0.7 && discriminationScore > 0.3) {
    primary = "easy_separator";
    confidence = 0.75;
    evidence.push("high_accuracy_top_cohort");
    evidence.push("positive_discrimination");
  }
  // 4. hard_discriminator
  else if (correctRatio < 0.4 && discriminationScore > 0.4) {
    primary = "hard_discriminator";
    confidence = 0.85;
    evidence.push("low_accuracy_bottom_cohort");
    evidence.push("high_discrimination_score");
  }
  // 5. recovery_question
  else if (correctRatio > 0.85) {
    primary = "recovery_question";
    confidence = 0.9;
    evidence.push("high_overall_correct_ratio");
  }
  // 6. calculation_heavy
  else if (avgSolveTimeSeconds > 75 && correctRatio >= 0.5 && correctRatio <= 0.75) {
    primary = "calculation_heavy";
    confidence = 0.7;
    evidence.push("moderate_accuracy_long_timing");
  }

  return {
    primary,
    confidence,
    evidence
  };
}
