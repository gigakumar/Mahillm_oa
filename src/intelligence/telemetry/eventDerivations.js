/**
 * Pacing & Action derivation utilities from raw event streams.
 */

export function deriveSolveTime(events = []) {
  const openEvent = events.find(e => e.type === "QUESTION_OPENED");
  const submitEvent = events.find(e => e.type === "ANSWER_SUBMITTED" || e.type === "SUBMITTED" || e.type === "TIMEOUT");

  if (!openEvent || !submitEvent) return 0;
  return Math.max(0, (new Date(submitEvent.timestamp).getTime() - new Date(openEvent.timestamp).getTime()) / 1000);
}

export function deriveSwitchCount(events = []) {
  const selections = events.filter(e => e.type === "OPTION_SELECTED");
  let switchCount = 0;
  for (let i = 1; i < selections.length; i++) {
    if (selections[i].option !== selections[i - 1].option) {
      switchCount++;
    }
  }
  return switchCount;
}

export function deriveFirstAnswer(events = []) {
  const selection = events.find(e => e.type === "OPTION_SELECTED");
  return selection ? selection.option : null;
}

export function deriveIdleTimeMs(events = []) {
  let idleTime = 0;
  let lastBlur = null;

  events.forEach(e => {
    if (e.type === "WINDOW_BLUR") {
      lastBlur = e.timestamp;
    } else if (e.type === "WINDOW_FOCUS" && lastBlur !== null) {
      idleTime += Math.max(0, new Date(e.timestamp).getTime() - new Date(lastBlur).getTime());
      lastBlur = null;
    } else if (e.type === "ANSWER_SUBMITTED" || e.type === "SUBMITTED" || e.type === "TIMEOUT") {
      if (lastBlur !== null) {
        idleTime += Math.max(0, new Date(e.timestamp).getTime() - new Date(lastBlur).getTime());
        lastBlur = null;
      }
    }
  });

  return idleTime;
}

export function deriveActiveTimeMs(events = []) {
  const totalDuration = deriveSolveTime(events) * 1000;
  const idleDuration = deriveIdleTimeMs(events);
  return Math.max(0, totalDuration - idleDuration);
}

export function deriveAnswerSwitches(events = []) {
  const selections = events.filter(e => e.type === "OPTION_SELECTED");
  const list = [];
  for (let i = 1; i < selections.length; i++) {
    if (selections[i].option !== selections[i - 1].option) {
      list.push({
        from: selections[i - 1].option,
        to: selections[i].option,
        time: selections[i].timestamp
      });
    }
  }
  return list;
}

export function deriveActivePacing(events = []) {
  const idleTimeMs = deriveIdleTimeMs(events);
  const activeTimeMs = deriveActiveTimeMs(events);
  
  return {
    activeTimeMs,
    idleTimeMs
  };
}
