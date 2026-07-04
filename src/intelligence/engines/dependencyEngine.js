import { topicDependencies } from '../../config/topicDependencies';

/**
 * Dependency Graph weakness diagnosis engine.
 * Recursively scans prerequisites to pinpoint likely root causes of failures.
 */
export function diagnoseRootWeakness({
  topicMasteries = {},  // { topicName: value (0 to 1) }
  failedTopic
}) {
  const prerequisites = topicDependencies[failedTopic];
  if (!prerequisites || prerequisites.length === 0) {
    return {
      failedTopic,
      rootWeakness: failedTopic,
      confidence: "LOW_NO_PREREQS",
      message: `Direct concept deficit in ${failedTopic}.`
    };
  }

  let lowestMastery = 1.0;
  let probableRoot = failedTopic;

  const queue = [...prerequisites];
  const visited = new Set();

  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);

    const mastery = topicMasteries[current] !== undefined ? topicMasteries[current] : 0.70;

    if (mastery < lowestMastery) {
      lowestMastery = mastery;
      probableRoot = current;
    }

    const nested = topicDependencies[current] || [];
    nested.forEach(p => queue.push(p));
  }

  if (lowestMastery < 0.65 && probableRoot !== failedTopic) {
    return {
      failedTopic,
      rootWeakness: probableRoot,
      confidence: "HIGH_PREREQ_DEFICIT",
      message: `Your errors in ${failedTopic} may originate from a prerequisite deficit in ${probableRoot} (Mastery: ${Math.round(lowestMastery * 100)}%).`
    };
  }

  return {
    failedTopic,
    rootWeakness: failedTopic,
    confidence: "MEDIUM_DIRECT",
    message: `Direct conceptual gap in ${failedTopic}. Focus on local drills.`
  };
}
