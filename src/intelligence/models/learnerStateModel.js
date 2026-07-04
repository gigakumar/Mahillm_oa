import { calculateReadinessScore } from '../engines/readinessEngine';
import { analyzeCalibration } from '../engines/calibrationEngine';
import { classifyAttemptStrategy } from '../engines/strategyClassifier';
import { predictForgettingRisks } from '../engines/forgettingPredictor';
import { diagnoseRootWeakness } from '../engines/dependencyEngine';
import { compilePeerPercentiles } from '../engines/percentileEngine';
import { traceConceptAttempts } from './knowledgeTracingEngine';

/**
 * Derived Learner State Model.
 * Synthesizes student ELO scores, spaced repetition queues, and attempts
 * to build the derived student state object.
 */
export function compileLearnerState({
  userId,
  attempts = [],         // [{ topic, correct, solveTime, timeRatio, confidence, date, changedAnswer, events }]
  topicMasteryElo = {},  // { topicName: eloValue }
  srItems = [],          // SM-2 queue items
  recentMockScores = [], // [85, 78, 80]
  peerPool = []          // pool of active peers
}) {
  const totalAttempts = attempts.length;

  // 1. strategy rates using classifyAttemptStrategy
  let rushCount = 0;
  let timeSinkCount = 0;
  let secondGuessCount = 0;

  attempts.forEach(a => {
    const outcome = classifyAttemptStrategy({
      attemptEvents: a.events || [],
      questionId: a.id,
      topicName: a.topic,
      subjectName: a.category,
      isCorrect: a.correct
    });

    if (outcome.strategyType === 'RUSHED_MISTAKE') rushCount++;
    if (outcome.strategyType === 'TIME_SINK') timeSinkCount++;
    if (a.changedAnswer) secondGuessCount++;
  });

  const behaviour = {
    rushRate: totalAttempts > 0 ? parseFloat((rushCount / totalAttempts).toFixed(2)) : 0.0,
    timeSinkRate: totalAttempts > 0 ? parseFloat((timeSinkCount / totalAttempts).toFixed(2)) : 0.0,
    secondGuessRate: totalAttempts > 0 ? parseFloat((secondGuessCount / totalAttempts).toFixed(2)) : 0.0,
    guessDependency: totalAttempts > 0 ? parseFloat((attempts.filter(a => a.confidence === 'Guess').length / totalAttempts).toFixed(2)) : 0.0
  };

  // 2. Calibration Analysis
  const calibrationInfo = analyzeCalibration(attempts);

  // 3. Forgetting Risks & Retention
  const forgettingRisks = predictForgettingRisks(srItems);
  const retentionMap = {};
  forgettingRisks.forEach(item => {
    retentionMap[item.topic] = item.pRecall;
  });

  // 4. BKT Knowledge States per concept
  const knowledgeTracing = {};
  const uniqueTopics = [...new Set(attempts.map(a => a.topic).filter(Boolean))];
  
  uniqueTopics.forEach(topicName => {
    const topicAttempts = attempts.filter(a => a.topic === topicName);
    knowledgeTracing[topicName] = traceConceptAttempts(topicAttempts);
  });

  // 5. Calculate Readiness Score with uncertainty bounds
  const readinessResult = calculateReadinessScore({
    masteryMap: topicMasteryElo,
    attempts,
    retentionMap,
    strategyStats: behaviour,
    recentMockScores
  });

  // 6. Peer comparisons
  const currentMetrics = {
    accuracy: totalAttempts > 0 ? attempts.filter(a => a.correct).length / totalAttempts : 0.70,
    speedSeconds: totalAttempts > 0 ? attempts.reduce((sum, a) => sum + (a.solveTime || 60), 0) / totalAttempts : 60,
    coreMechanicalElo: topicMasteryElo["Thermodynamics"] || 1000,
    aptitudeElo: topicMasteryElo["Probability"] || 1000
  };
  const peerPercentiles = compilePeerPercentiles({
    studentMetrics: currentMetrics,
    allPeers: peerPool
  });

  // 7. Prerequisite Weakness Diagnosis
  const weaknessDiagnoses = {};
  const weakTopics = Object.keys(topicMasteryElo).filter(t => topicMasteryElo[t] < 900);
  
  const topicMasteryRate = {};
  Object.keys(topicMasteryElo).forEach(t => {
    topicMasteryRate[t] = topicMasteryElo[t] / 1500;
  });

  weakTopics.forEach(topic => {
    weaknessDiagnoses[topic] = diagnoseRootWeakness({
      topicMasteries: topicMasteryRate,
      failedTopic: topic
    });
  });

  return {
    userId,
    global: {
      readiness: readinessResult.status === "COMPLETE" ? readinessResult.score / 100 : null,
      readinessStatus: readinessResult.status,
      readinessUncertaintyRange: readinessResult.uncertaintyRange,
      consistency: parseFloat((1.0 - behaviour.rushRate).toFixed(2)),
      endurance: recentMockScores.length > 0 ? 0.80 : 0.50,
      calibration: parseFloat((1.0 - calibrationInfo.calibrationError).toFixed(2)),
      learningVelocity: 0.75
    },
    readinessComponents: readinessResult.components || {},
    readinessFeedback: readinessResult.feedback || "Readiness assessment in progress.",
    calibration: {
      status: calibrationInfo.status,
      message: calibrationInfo.message,
      metrics: calibrationInfo.metrics
    },
    behaviour,
    retentionMap,
    knowledgeTracing,
    forgettingRisks: forgettingRisks.slice(0, 5),
    weaknessDiagnoses,
    peerPercentiles,
    intelligenceVersion: readinessResult.intelligenceVersion
  };
}
