/**
 * Strategy & Pacing Classifier.
 * Classifies learner attempt behavior based on solve time, options toggled, and outcomes.
 */

export function classifyStrategy({
  solveTime,                   // in seconds
  medianSolveTime = 60,        // default or empirical median for question
  timeStdDev = 20,             // standard deviation
  correct,                     // boolean
  answerSwitches = [],         // array of { from, to, time }
  totalAttempts = 1
}) {
  const timeRatio = solveTime / medianSolveTime;
  const zScore = timeStdDev > 0 ? (solveTime - medianSolveTime) / timeStdDev : 0;

  // Basic pacing category
  let pacingCategory = "NORMAL";
  if (zScore < -1.2) pacingCategory = "RUSHED";
  else if (zScore > 1.5 && zScore <= 2.5) pacingCategory = "SLOW";
  else if (zScore > 2.5) pacingCategory = "SEVERE_TIME_SINK";

  // Complex strategic classifications
  let strategyType = "NORMAL_PROCESS";
  
  if (!correct) {
    if (timeRatio > 2.0 || zScore > 1.5) {
      strategyType = "TIME_SINK";
    } else if (timeRatio < 0.35 || zScore < -1.2) {
      strategyType = "RUSHED_MISTAKE";
    } else if (answerSwitches.length >= 2) {
      strategyType = "PANIC_SWITCH";
    } else if (solveTime < 10) {
      strategyType = "PREMATURE_COMMITMENT";
    }
  } else {
    // Correct answers
    if (answerSwitches.length >= 1 && timeRatio > 1.2) {
      strategyType = "DELIBERATIVE_CORRECTION";
    } else if (timeRatio > 2.5 && answerSwitches.length === 0) {
      strategyType = "CALCULATION_STALL";
    }
  }

  return {
    timeRatio: parseFloat(timeRatio.toFixed(2)),
    zScore: parseFloat(zScore.toFixed(2)),
    pacingCategory,
    strategyType,
    details: {
      solveTime,
      medianSolveTime,
      switchesCount: answerSwitches.length
    }
  };
}
