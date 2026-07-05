export function calculateConfidenceCalibration(features = []) {
  let totalTagged = 0;
  let sumBrierError = 0.0;
  
  const byTopic = {};
  const byDifficulty = {
    easy: { score: 75, bias: 'well_calibrated', attempts: 0, correct: 0, predictedSum: 0 },
    medium: { score: 75, bias: 'well_calibrated', attempts: 0, correct: 0, predictedSum: 0 },
    hard: { score: 75, bias: 'well_calibrated', attempts: 0, correct: 0, predictedSum: 0 }
  };

  let totalBiasSum = 0;

  features.forEach(f => {
    const { confidence, outcome, topicId, questionContext } = f;
    if (!confidence || !confidence.tag) return;
    
    totalTagged++;
    const actual = outcome.correct ? 1 : 0;
    const predicted = confidence.probability; // sure=0.9, unsure=0.6, guess=0.33
    
    // Brier score: (p - o)^2
    const brierError = Math.pow(predicted - actual, 2);
    sumBrierError += brierError;
    totalBiasSum += (predicted - actual);

    // Topic breakdown
    if (topicId) {
      if (!byTopic[topicId]) {
        byTopic[topicId] = { attempts: 0, correct: 0, predictedSum: 0, brierErrorSum: 0 };
      }
      const t = byTopic[topicId];
      t.attempts++;
      if (outcome.correct) t.correct++;
      t.predictedSum += predicted;
      t.brierErrorSum += brierError;
    }

    // Difficulty breakdown
    const diff = questionContext.difficulty || 'medium';
    if (byDifficulty[diff]) {
      const d = byDifficulty[diff];
      d.attempts++;
      if (outcome.correct) d.correct++;
      d.predictedSum += predicted;
    }
  });

  const brierScore = totalTagged > 0 ? parseFloat((sumBrierError / totalTagged).toFixed(4)) : 0.25;
  const bias = totalTagged > 0 ? parseFloat((totalBiasSum / totalTagged).toFixed(3)) : 0.0;
  
  let biasType = 'well_calibrated';
  if (bias > 0.15) biasType = 'overconfident';
  else if (bias < -0.15) biasType = 'underconfident';

  // Scale Brier prediction error to a standard 0-100 score index
  const metacognitionScore = totalTagged > 0 ? Math.max(0, Math.min(100, Math.round((1.0 - (brierScore / 0.5)) * 100))) : 75;

  // Process Topic breakdown
  const overconfidentTopics = [];
  const underconfidentTopics = [];
  
  Object.keys(byTopic).forEach(topic => {
    const t = byTopic[topic];
    if (t.attempts >= 3) {
      const avgBrier = t.brierErrorSum / t.attempts;
      const topicBias = (t.predictedSum - t.correct) / t.attempts;
      
      let tBiasType = 'well_calibrated';
      if (topicBias > 0.15) {
        tBiasType = 'overconfident';
        overconfidentTopics.push(topic);
      } else if (topicBias < -0.15) {
        tBiasType = 'underconfident';
        underconfidentTopics.push(topic);
      }
      
      byTopic[topic] = {
        score: Math.max(0, Math.min(100, Math.round((1.0 - (avgBrier / 0.5)) * 100))),
        bias: tBiasType,
        evidenceCount: t.attempts
      };
    } else {
      delete byTopic[topic];
    }
  });

  // Process Difficulty breakdown
  Object.keys(byDifficulty).forEach(diff => {
    const d = byDifficulty[diff];
    if (d.attempts > 0) {
      const avgOutcome = d.correct / d.attempts;
      const avgPredicted = d.predictedSum / d.attempts;
      const diffBias = avgPredicted - avgOutcome;
      let dBiasType = 'well_calibrated';
      if (diffBias > 0.15) dBiasType = 'overconfident';
      else if (diffBias < -0.15) dBiasType = 'underconfident';

      d.score = Math.max(0, Math.min(100, Math.round((1.0 - (Math.pow(avgPredicted - avgOutcome, 2) / 0.5)) * 100)));
      d.bias = dBiasType;
    } else {
      d.score = 75;
      d.bias = 'well_calibrated';
    }
  });

  return {
    global: {
      score: metacognitionScore,
      brierScore
    },
    bias: {
      score: bias,
      type: biasType
    },
    byTopic,
    byDifficulty,
    overconfidentTopics,
    underconfidentTopics,
    evidenceCount: totalTagged
  };
}
