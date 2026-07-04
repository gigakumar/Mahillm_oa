import { calculateReadinessScore } from './readinessEngine';
import { analyzeCalibration } from './calibrationEngine';
import { classifyStrategy } from './strategyClassifier';
import { predictForgettingRisks } from './forgettingPredictor';
import { diagnoseRootWeakness } from './dependencyEngine';
import { compilePeerPercentiles } from './percentileEngine';

/**
 * Derived Learner State Model.
 * Compiles all raw database attempt logs, ELO tables, and SR intervals into
 * a highly detailed derived learner telemetry profile.
 */
export function compileLearnerState({
  userId,
  attempts = [],         // [{ topic, correct, solveTime, timeRatio, confidence, date, changedAnswer }]
  topicMasteryElo = {},  // { topicName: eloValue }
  srItems = [],          // SM-2 entries
  recentMockScores = [], // [80, 85, 75]
  peerPool = []          // pool of other student aggregates
}) {
  // 1. Calculate strategy rates
  const recentAttempts = attempts.slice(-100);
  const total = recentAttempts.length;
  
  let rushCount = 0;
  let timeSinkCount = 0;
  let secondGuessCount = 0;
  
  recentAttempts.forEach(a => {
    // Classify attempt pacing/switches
    const outcome = classifyStrategy({
      solveTime: a.solveTime || 60,
      medianSolveTime: 60,
      timeStdDev: 20,
      correct: a.correct,
      answerSwitches: a.changedAnswer ? [{ from: 'X', to: 'Y', time: 30 }] : []
    });

    if (outcome.strategyType === 'RUSHED_MISTAKE') rushCount++;
    if (outcome.strategyType === 'TIME_SINK') timeSinkCount++;
    if (a.changedAnswer) secondGuessCount++;
  });

  const behaviour = {
    rushRate: total > 0 ? parseFloat((rushCount / total).toFixed(2)) : 0.0,
    timeSinkRate: total > 0 ? parseFloat((timeSinkCount / total).toFixed(2)) : 0.0,
    secondGuessRate: total > 0 ? parseFloat((secondGuessCount / total).toFixed(2)) : 0.0,
    guessDependency: total > 0 ? parseFloat((recentAttempts.filter(a => a.confidence === 'Guess').length / total).toFixed(2)) : 0.0
  };

  // 2. Calibration Analysis
  const calibrationInfo = analyzeCalibration(attempts);

  // 3. Forgetting & Retention
  const forgettingRisks = predictForgettingRisks(srItems);
  const retentionMap = {};
  forgettingRisks.forEach(riskItem => {
    retentionMap[riskItem.topic] = riskItem.pRecall;
  });

  // 4. Calculate Readiness
  const readinessResult = calculateReadinessScore({
    masteryMap: topicMasteryElo,
    attempts,
    retentionMap,
    strategyStats: behaviour,
    recentMockScores
  });

  // 5. Peer percentiles
  const currentStudentMetrics = {
    accuracy: total > 0 ? recentAttempts.filter(a => a.correct).length / total : 0.70,
    speedSeconds: total > 0 ? recentAttempts.reduce((sum, a) => sum + (a.solveTime || 60), 0) / total : 60,
    coreMechanicalElo: topicMasteryElo["Thermodynamics"] || 1000,
    aptitudeElo: topicMasteryElo["Probability"] || 1000
  };
  const peerPercentiles = compilePeerPercentiles({
    studentMetrics: currentStudentMetrics,
    allPeers: peerPool
  });

  // 6. Upstream weakness diagnoses
  const weaknessDiagnoses = {};
  const weakTopics = Object.keys(topicMasteryElo).filter(t => topicMasteryElo[t] < 900);
  
  // Calculate average mastery rate for dependencies
  const topicMasteryRate = {};
  Object.keys(topicMasteryElo).forEach(t => {
    topicMasteryRate[t] = topicMasteryElo[t] / 1500; // normalize to 0-1
  });

  weakTopics.forEach(topic => {
    weaknessDiagnoses[topic] = diagnoseRootWeakness({
      topicMasteries: topicMasteryRate,
      failedTopic: topic
    });
  });

  // 7. Output unified derived student state
  return {
    userId,
    global: {
      readiness: readinessResult.score / 100,
      consistency: parseFloat((1.0 - behaviour.rushRate).toFixed(2)),
      endurance: recentMockScores.length > 0 ? 0.80 : 0.50, // based on mock attempts
      calibration: parseFloat((1.0 - calibrationInfo.calibrationError).toFixed(2)),
      learningVelocity: 0.75 // standard progression constant
    },
    readinessComponents: readinessResult.components,
    readinessFeedback: readinessResult.feedback,
    calibration: {
      status: calibrationInfo.status,
      message: calibrationInfo.message,
      metrics: calibrationInfo.metrics
    },
    behaviour,
    retentionMap,
    forgettingRisks: forgettingRisks.slice(0, 5), // top 5 forgetting risks
    weaknessDiagnoses,
    peerPercentiles
  };
}
