import { topicDependencies } from '../config/topicDependencies';

/**
 * Dependency Graph weakness diagnosis engine.
 * Scans prerequisite graph upstream to identify probable root cause of topic failures.
 */
export function diagnoseRootWeakness({
  topicMasteries = {},  // { topicName: accuracy (0 to 1) }
  failedTopic           // string topic that triggered failure
}) {
  const prerequisites = topicDependencies[failedTopic];
  if (!prerequisites || prerequisites.length === 0) {
    return {
      failedTopic,
      rootWeakness: failedTopic,
      confidence: "LOW_NO_PREREQS",
      message: `Direct weakness in ${failedTopic}.`
    };
  }

  // Iterate over prerequisites recursively to find lowest mastery score
  let lowestMastery = 1.0;
  let probableRoot = failedTopic;

  const queue = [...prerequisites];
  const visited = new Set();

  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);

    const mastery = topicMasteries[current] !== undefined ? topicMasteries[current] : 0.70; // assume neutral baseline if unseen

    if (mastery < lowestMastery) {
      lowestMastery = mastery;
      probableRoot = current;
    }

    // Add nested dependencies
    const nested = topicDependencies[current] || [];
    nested.forEach(p => queue.push(p));
  }

  // If the lowest mastery prerequisite has low score, recommend it
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
