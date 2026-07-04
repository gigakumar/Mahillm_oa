/**
 * Calibration Analytics Engine.
 * Compares user confidence declarations against actual correctness results.
 */

export function analyzeCalibration(attempts = []) {
  const stats = {
    Sure: { attempts: 0, correct: 0, accuracy: 0.0 },
    Unsure: { attempts: 0, correct: 0, accuracy: 0.0 },
    Guess: { attempts: 0, correct: 0, accuracy: 0.0 }
  };

  attempts.forEach(a => {
    const conf = a.confidence;
    if (conf && stats[conf]) {
      stats[conf].attempts++;
      if (a.correct) {
        stats[conf].correct++;
      }
    }
  });

  // Calculate actual accuracies
  Object.keys(stats).forEach(key => {
    const s = stats[key];
    s.accuracy = s.attempts > 0 ? parseFloat((s.correct / s.attempts).toFixed(3)) : 0.0;
  });

  // Target calibrations
  const targets = { Sure: 0.90, Unsure: 0.50, Guess: 0.25 };
  let errorSum = 0;
  let categoriesCount = 0;

  Object.keys(targets).forEach(key => {
    if (stats[key].attempts > 0) {
      errorSum += Math.abs(stats[key].accuracy - targets[key]);
      categoriesCount++;
    }
  });

  const calibrationError = categoriesCount > 0 ? parseFloat((errorSum / categoriesCount).toFixed(3)) : 0.0;

  let status = "NORMAL";
  let message = "Well calibrated. Confidence levels align with accuracy.";

  if (stats.Sure.attempts >= 5 && stats.Sure.accuracy < 0.70) {
    status = "OVERCONFIDENT";
    message = "High overconfidence: your 'Sure' answers are incorrect more often than expected.";
  } else if (stats.Unsure.attempts >= 5 && stats.Unsure.accuracy > 0.75) {
    status = "UNDERCONFIDENT";
    message = "High second-guessing: your 'Unsure' answers are correct in over 75% of attempts.";
  }

  return {
    metrics: stats,
    calibrationError,
    status,
    message
  };
}
