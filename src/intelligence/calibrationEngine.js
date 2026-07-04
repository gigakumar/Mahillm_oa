/**
 * Confidence Calibration Engine.
 * Analyzes accuracy vs reported confidence levels (Sure, Unsure, Guess).
 */

export function analyzeCalibration(attempts = []) {
  // Filters attempts with confidence markers
  const validAttempts = attempts.filter(a => a.confidence && ['Sure', 'Unsure', 'Guess'].includes(a.confidence));

  const stats = {
    Sure: { attempts: 0, correct: 0, accuracy: 0 },
    Unsure: { attempts: 0, correct: 0, accuracy: 0 },
    Guess: { attempts: 0, correct: 0, accuracy: 0 }
  };

  validAttempts.forEach(attempt => {
    const conf = attempt.confidence;
    stats[conf].attempts++;
    if (attempt.correct) {
      stats[conf].correct++;
    }
  });

  // Calculate actual accuracies
  Object.keys(stats).forEach(key => {
    const s = stats[key];
    s.accuracy = s.attempts > 0 ? parseFloat((s.correct / s.attempts).toFixed(2)) : 0;
  });

  // Ideal targets: Sure = 0.90, Unsure = 0.50, Guess = 0.25 (random)
  const targets = { Sure: 0.90, Unsure: 0.50, Guess: 0.25 };
  
  // Calculate aggregate calibration error (mean absolute deviation)
  let calibrationError = 0;
  let activeCategories = 0;
  
  Object.keys(targets).forEach(key => {
    if (stats[key].attempts > 0) {
      calibrationError += Math.abs(stats[key].accuracy - targets[key]);
      activeCategories++;
    }
  });

  const finalError = activeCategories > 0 ? parseFloat((calibrationError / activeCategories).toFixed(2)) : 0.0;

  // Classify anomalies
  let calibrationMessage = "Well calibrated. Confidence matches performance.";
  let status = "NORMAL";

  if (stats.Sure.attempts >= 5 && stats.Sure.accuracy < 0.70) {
    status = "OVERCONFIDENT";
    calibrationMessage = "You display overconfidence: your 'Sure' answers are incorrect more often than expected.";
  } else if (stats.Unsure.attempts >= 5 && stats.Unsure.accuracy > 0.75) {
    status = "UNDERCONFIDENT";
    calibrationMessage = "You display underconfidence: you tag solvable questions as 'Unsure' despite high accuracy.";
  }

  return {
    metrics: stats,
    calibrationError: finalError,
    status,
    message: calibrationMessage
  };
}
