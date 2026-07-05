import { calculateReadinessScore } from './readinessEngine.js';
import { predictForgettingRisks } from './forgettingPredictor.js';
import { compilePeerPercentiles } from './percentileEngine.js';
import { diagnoseRootWeakness } from './dependencyEngine.js';

import { compileAttemptFeatures } from './engines/attemptFeatureCompiler.js';
import { extractAttemptSignals } from './engines/signalExtractionEngine.js';
import { inferMistake } from './engines/mistakeInferenceEngine.js';
import { detectMistakePersistence } from './engines/mistakePersistenceEngine.js';
import { calculateConfidenceCalibration } from './engines/metacognitionEngine.js';
import { calculateEvidenceStrength } from './engines/evidenceStrengthEngine.js';
import { detectLearnerStateContradictions } from './engines/contradictionEngine.js';
import { calculateDiagnosticNeeds } from './engines/diagnosticPriorityEngine.js';

export function compileLearnerState({
  userId,
  attempts = [],
  topicMasteryElo = {},
  srItems = [],
  recentMockScores = [],
  peerPool = [],
  mistakes = {},
  questionDb = []
}) {
  // 1. Compile Canonical Features & extract signals
  const canonicalFeatures = attempts.map(a => compileAttemptFeatures(a, questionDb));

  // 2. Mistake persistence
  const activeMistakesList = Object.values(mistakes || {});
  const mistakeFingerprintResult = detectMistakePersistence(activeMistakesList);

  // Determine primary error type
  let primaryErrorType = 'conceptual';
  let primaryErrorConfidence = 0.8;
  let maxShare = 0.0;
  Object.keys(mistakeFingerprintResult.distribution).forEach(t => {
    if (mistakeFingerprintResult.distribution[t].share > maxShare) {
      maxShare = mistakeFingerprintResult.distribution[t].share;
      primaryErrorType = t;
      primaryErrorConfidence = mistakeFingerprintResult.distribution[t].persistence;
    }
  });

  const recommendationMessages = {
    guess: "High rate of guessing. Focus on building concept confidence before selecting answers.",
    time_pressure: "Time pressure issues detected. Practice pacing strategies on mock exams.",
    calculation: "Calculation errors are dominant. Double-check your arithmetic work and scratch pad.",
    formula_recall: "Prone to formula recall gaps. Revise cheat sheets and formula tables.",
    option_trap: "Falling into option traps. Read all choices carefully before committing.",
    misread: "Slight misreading of problem details. Slow down during initial context reading.",
    conceptual: "Conceptual gaps identified. Revise core lecture notes and foundation questions.",
    unknown: "No dominant mistake types identified. Excellent accuracy consistency!"
  };

  const mistakeProfile = {
    distribution: mistakeFingerprintResult.distribution,
    totalMistakes: mistakeFingerprintResult.totalMistakes,
    primaryErrorType,
    primaryErrorConfidence,
    recommendation: {
      message: recommendationMessages[primaryErrorType] || recommendationMessages.conceptual
    }
  };

  // 3. Metacognition (Confidence Calibration)
  const metacognition = calculateConfidenceCalibration(canonicalFeatures);

  // 4. Evidence Sufficiency mapping
  const evidenceSufficiency = {};
  Object.keys(topicMasteryElo).forEach(topic => {
    evidenceSufficiency[topic] = calculateEvidenceStrength(canonicalFeatures, topic);
  });

  // 5. Readiness and strategy stats
  const totalAttempts = canonicalFeatures.length;
  let rushCount = 0;
  let timeSinkCount = 0;
  let secondGuessCount = 0;
  canonicalFeatures.forEach(f => {
    if (f.timing.normalizedTimeRatio < 0.35 && !f.outcome.correct) rushCount++;
    if (f.timing.normalizedTimeRatio > 2.0 && !f.outcome.correct) timeSinkCount++;
    if (f.answerBehaviour.changedAnswer) secondGuessCount++;
  });

  const behaviour = {
    rushRate: totalAttempts > 0 ? parseFloat((rushCount / totalAttempts).toFixed(2)) : 0.0,
    timeSinkRate: totalAttempts > 0 ? parseFloat((timeSinkCount / totalAttempts).toFixed(2)) : 0.0,
    secondGuessRate: totalAttempts > 0 ? parseFloat((secondGuessCount / totalAttempts).toFixed(2)) : 0.0,
    guessDependency: totalAttempts > 0 ? parseFloat((canonicalFeatures.filter(f => f.confidence.tag === 'guess').length / totalAttempts).toFixed(2)) : 0.0
  };

  // Forgetting risks
  const forgettingRisks = predictForgettingRisks(srItems);
  const retentionMap = {};
  forgettingRisks.forEach(riskItem => {
    retentionMap[riskItem.topic] = riskItem.pRecall;
  });

  const readinessResult = calculateReadinessScore({
    masteryMap: topicMasteryElo,
    attempts,
    retentionMap,
    strategyStats: behaviour,
    recentMockScores
  });

  // Peer Percentiles
  const currentStudentMetrics = {
    accuracy: totalAttempts > 0 ? canonicalFeatures.filter(f => f.outcome.correct).length / totalAttempts : 0.70,
    speedSeconds: totalAttempts > 0 ? canonicalFeatures.reduce((sum, f) => sum + (f.timing.responseTimeMs / 1000), 0) / totalAttempts : 60,
    coreMechanicalElo: topicMasteryElo["Thermodynamics"] || 1000,
    aptitudeElo: topicMasteryElo["Probability"] || 1000
  };
  const peerPercentiles = compilePeerPercentiles({
    studentMetrics: currentStudentMetrics,
    allPeers: peerPool
  });

  // Weakness Diagnoses ELO based
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

  // 6. Contradiction Audits
  const contradictions = detectLearnerStateContradictions(topicMasteryElo, behaviour, mistakeProfile, metacognition);

  // 7. Diagnostic Needs
  const diagnosticNeeds = calculateDiagnosticNeeds(topicMasteryElo, evidenceSufficiency, metacognition, mistakes);

  // 8. Learner State Integrity Score
  const integrityScore = parseFloat(Math.max(0.2, 1.0 - (contradictions.length * 0.15) - (Object.values(evidenceSufficiency).filter(s => s.level === 'insufficient_data').length * 0.05)).toFixed(2));

  return {
    userId,
    global: {
      readiness: readinessResult.score / 100,
      consistency: parseFloat((1.0 - behaviour.rushRate).toFixed(2)),
      endurance: recentMockScores.length > 0 ? 0.80 : 0.50,
      calibration: parseFloat(metacognition.global.score / 100),
      learningVelocity: 0.75
    },
    readinessComponents: readinessResult.components,
    readinessFeedback: readinessResult.feedback,
    behaviour,
    retentionMap,
    forgettingRisks: forgettingRisks.slice(0, 5),
    weaknessDiagnoses,
    peerPercentiles,
    
    // Hardened Phase 3B.1 parameters
    mistakeProfile,
    metacognition,
    evidenceSufficiency,
    contradictions,
    diagnosticNeeds,
    
    integrity: {
      score: integrityScore,
      warnings: contradictions.map(c => c.message),
      conflicts: contradictions.length,
      telemetryCompleteness: totalAttempts > 0 ? 0.95 : 0.0
    },
    metadata: {
      schemaVersion: "3.1",
      compiledAt: new Date().toISOString()
    }
  };
}
