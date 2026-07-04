import { calculateRobustZScore } from '../statistics/robustStats';

export const GLOBAL_TIMING_DEFAULTS = {
  median: 60,
  mad: 20
};

export function getTimingBaseline(questionId, topicName, subjectName, baselines = {}) {
  // 1. Question level baseline (needs >= 50 attempts)
  if (baselines.questions && baselines.questions[questionId] && baselines.questions[questionId].attempts >= 50) {
    return {
      median: baselines.questions[questionId].median,
      mad: baselines.questions[questionId].mad,
      source: "QUESTION",
      confidence: "HIGH"
    };
  }

  // 2. Topic level baseline (needs >= 200 attempts)
  if (baselines.topics && baselines.topics[topicName] && baselines.topics[topicName].attempts >= 200) {
    return {
      median: baselines.topics[topicName].median,
      mad: baselines.topics[topicName].mad,
      source: "TOPIC",
      confidence: "MEDIUM"
    };
  }

  // 3. Subject level baseline (needs >= 500 attempts)
  if (baselines.subjects && baselines.subjects[subjectName] && baselines.subjects[subjectName].attempts >= 500) {
    return {
      median: baselines.subjects[subjectName].median,
      mad: baselines.subjects[subjectName].mad,
      source: "SUBJECT",
      confidence: "LOW"
    };
  }

  // 4. Global fallback
  return {
    median: GLOBAL_TIMING_DEFAULTS.median,
    mad: GLOBAL_TIMING_DEFAULTS.mad,
    source: "GLOBAL",
    confidence: "LOW"
  };
}

export function classifyAttemptStrategy({
  attemptEvents = [],
  questionId,
  topicName,
  subjectName,
  baselines = {},
  isCorrect
}) {
  const openEvent = attemptEvents.find(e => e.type === "QUESTION_OPENED");
  const submitEvent = attemptEvents.find(e => e.type === "ANSWER_SUBMITTED" || e.type === "TIMEOUT");

  if (!openEvent || !submitEvent) {
    return {
      strategyType: "INSUFFICIENT_DATA",
      pacingCategory: "NORMAL",
      timeRatio: 1.0,
      robustZ: 0.0
    };
  }

  // Derive time active
  const totalDuration = (submitEvent.timestamp - openEvent.timestamp) / 1000; // seconds
  let idleTimeMs = 0;
  let lastBlur = null;

  attemptEvents.forEach(e => {
    if (e.type === "WINDOW_BLUR") {
      lastBlur = e.timestamp;
    } else if (e.type === "WINDOW_FOCUS" && lastBlur !== null) {
      idleTimeMs += Math.max(0, e.timestamp - lastBlur);
      lastBlur = null;
    }
  });

  const activeSeconds = Math.max(1, totalDuration - (idleTimeMs / 1000));

  // Get baseline fallback
  const baseline = getTimingBaseline(questionId, topicName, subjectName, baselines);
  const timeRatio = activeSeconds / baseline.median;

  // Compile robust stats comparison values
  const simulatedTimes = Array.from({ length: 20 }, (_, i) => baseline.median + (i - 10) * (baseline.mad / 5));
  const robustZ = calculateRobustZScore(activeSeconds, [activeSeconds, ...simulatedTimes]);

  let pacingCategory = "NORMAL";
  if (robustZ < -1.2) pacingCategory = "RUSHED";
  else if (robustZ > 1.5 && robustZ <= 2.5) pacingCategory = "SLOW";
  else if (robustZ > 2.5) pacingCategory = "SEVERE_TIME_SINK";

  // Derive Switches
  const selections = attemptEvents.filter(e => e.type === "OPTION_SELECTED");
  const switchCount = selections.length > 0 ? selections.length - 1 : 0;

  const firstAnswer = selections.length > 0 ? selections[0].option : null;
  const finalAnswer = selections.length > 0 ? selections[selections.length - 1].option : null;
  
  // Last switch timing relative ratio
  let lastSwitchTimeRatio = 0.0;
  if (selections.length >= 2) {
    const lastSwitchTime = selections[selections.length - 1].timestamp;
    lastSwitchTimeRatio = (lastSwitchTime - openEvent.timestamp) / (submitEvent.timestamp - openEvent.timestamp);
  }

  let strategyType = "NORMAL_PROCESS";

  if (!isCorrect) {
    if (timeRatio > 2.0 || robustZ > 1.5) {
      strategyType = "TIME_SINK";
    } else if (timeRatio < 0.35 || robustZ < -1.2) {
      strategyType = "RUSHED_MISTAKE";
    } else if (switchCount >= 2 && lastSwitchTimeRatio > 0.75) {
      strategyType = "PANIC_SWITCH";
    } else if (activeSeconds < 8) {
      strategyType = "PREMATURE_COMMITMENT";
    }
  } else {
    // Correct outcome
    if (switchCount >= 1 && timeRatio > 1.2) {
      strategyType = "DELIBERATIVE_CORRECTION";
    } else if (timeRatio > 2.5 && switchCount === 0) {
      strategyType = "CALCULATION_STALL";
    }
  }

  return {
    strategyType,
    pacingCategory,
    timeRatio: parseFloat(timeRatio.toFixed(2)),
    robustZ,
    evidence: {
      activeSeconds,
      switchCount,
      firstAnswer,
      finalAnswer,
      lastSwitchTimeRatio: parseFloat(lastSwitchTimeRatio.toFixed(2)),
      baselineSource: baseline.source,
      baselineConfidence: baseline.confidence
    }
  };
}
