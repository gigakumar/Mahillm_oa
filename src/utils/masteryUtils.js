/**
 * Mastery Utilities — Heatmap Data Builder
 *
 * Transforms raw question data + user mastery scores into hierarchical
 * structures for the Exam Readiness Heatmap.
 */

import { buildCompositeKey } from './adaptiveEngine';

// Mastery status thresholds
const THRESHOLDS = {
  strong: 0.7,
  unstable: 0.4,
  // below 0.4 = weak
  // 0 attempts = unattempted
};

/**
 * Get the mastery status label from a score and attempt count.
 *
 * @param {number} score    Mastery score (0–1)
 * @param {number} attempts Number of questions attempted
 * @returns {'strong'|'unstable'|'weak'|'unattempted'}
 */
export function getMasteryStatus(score, attempts) {
  if (attempts === 0) return 'unattempted';
  if (score >= THRESHOLDS.strong) return 'strong';
  if (score >= THRESHOLDS.unstable) return 'unstable';
  return 'weak';
}

/**
 * Get the colour associated with a mastery status.
 *
 * @param {'strong'|'unstable'|'weak'|'unattempted'} status
 * @returns {string} CSS colour value
 */
export function getStatusColor(status) {
  switch (status) {
    case 'strong': return '#00b894';
    case 'unstable': return '#fdcb6e';
    case 'weak': return '#d63031';
    case 'unattempted': return '#636e72';
    default: return '#636e72';
  }
}

/**
 * Build heatmap data from the full question pool and user mastery.
 *
 * Returns a hierarchical structure:
 * [
 *   {
 *     category: "Mechanical Engineering",
 *     masteryScore: 0.55,
 *     questionsAttempted: 120,
 *     totalQuestions: 500,
 *     status: "unstable",
 *     topics: [
 *       { topic: "Thermodynamics", masteryScore: 0.3, questionsAttempted: 10, totalQuestions: 80, status: "weak" },
 *       ...
 *     ]
 *   },
 *   ...
 * ]
 *
 * @param {Array}  allQuestions Full question pool
 * @param {Object} userMastery  Map of compositeKey → { score, attempts, correctCount, ... }
 * @returns {Array} Hierarchical heatmap data
 */
export function buildHeatmapData(allQuestions, userMastery = {}) {
  // Step 1: Count questions by category → topic
  const taxonomy = {};

  for (const q of allQuestions) {
    const cat = q.category || 'Uncategorized';
    const top = q.topic || 'General';

    if (!taxonomy[cat]) {
      taxonomy[cat] = {};
    }
    if (!taxonomy[cat][top]) {
      taxonomy[cat][top] = 0;
    }
    taxonomy[cat][top]++;
  }

  // Step 2: Merge with mastery data
  const heatmap = [];

  // Category ordering for consistent display
  const categoryOrder = [
    'Mechanical Engineering',
    'Quantitative Aptitude',
    'Logical Reasoning',
    'Data Interpretation',
    'DILR',
  ];

  const sortedCategories = Object.keys(taxonomy).sort((a, b) => {
    const idxA = categoryOrder.indexOf(a);
    const idxB = categoryOrder.indexOf(b);
    if (idxA === -1 && idxB === -1) return a.localeCompare(b);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  for (const category of sortedCategories) {
    const topics = taxonomy[category];
    const topicEntries = [];

    let catTotalQuestions = 0;
    let catAttempted = 0;
    let catScoreSum = 0;
    let catScoredTopics = 0;

    const sortedTopics = Object.keys(topics).sort();

    for (const topic of sortedTopics) {
      const totalQuestions = topics[topic];
      const compositeKey = buildCompositeKey(category, topic);
      const mastery = userMastery[compositeKey];

      const masteryScore = mastery ? mastery.score : 0;
      const questionsAttempted = mastery ? mastery.attempts : 0;
      const correctCount = mastery ? (mastery.correctCount || 0) : 0;
      const accuracy = questionsAttempted > 0 ? Math.round((correctCount / questionsAttempted) * 100) : 0;
      const status = getMasteryStatus(masteryScore, questionsAttempted);

      topicEntries.push({
        topic,
        masteryScore,
        questionsAttempted,
        totalQuestions,
        correctCount,
        accuracy,
        status,
        compositeKey,
      });

      catTotalQuestions += totalQuestions;
      catAttempted += questionsAttempted;
      if (questionsAttempted > 0) {
        catScoreSum += masteryScore;
        catScoredTopics++;
      }
    }

    const catMasteryScore = catScoredTopics > 0 ? catScoreSum / catScoredTopics : 0;
    const catStatus = getMasteryStatus(catMasteryScore, catAttempted);

    heatmap.push({
      category,
      masteryScore: catMasteryScore,
      questionsAttempted: catAttempted,
      totalQuestions: catTotalQuestions,
      status: catStatus,
      topics: topicEntries,
    });
  }

  return heatmap;
}

/**
 * Get statistics for a specific topic.
 *
 * @param {Array}  allQuestions Full question pool
 * @param {string} category    Category to filter
 * @param {string} topic       Topic to filter
 * @returns {{ count: number, types: Object, ids: Array }}
 */
export function getTopicStats(allQuestions, category, topic) {
  const matching = allQuestions.filter(
    q => q.category === category && q.topic === topic
  );

  const types = {};
  matching.forEach(q => {
    types[q.type] = (types[q.type] || 0) + 1;
  });

  return {
    count: matching.length,
    types,
    ids: matching.map(q => q.id),
  };
}

/**
 * Get overall readiness summary across all categories.
 *
 * @param {Array} heatmapData Output from buildHeatmapData
 * @returns {{ overallScore: number, strong: number, unstable: number, weak: number, unattempted: number, totalTopics: number }}
 */
export function getReadinessSummary(heatmapData) {
  let strong = 0, unstable = 0, weak = 0, unattempted = 0;
  let totalScore = 0, scoredTopics = 0;

  for (const cat of heatmapData) {
    for (const topic of cat.topics) {
      switch (topic.status) {
        case 'strong': strong++; break;
        case 'unstable': unstable++; break;
        case 'weak': weak++; break;
        case 'unattempted': unattempted++; break;
      }
      if (topic.questionsAttempted > 0) {
        totalScore += topic.masteryScore;
        scoredTopics++;
      }
    }
  }

  return {
    overallScore: scoredTopics > 0 ? totalScore / scoredTopics : 0,
    strong,
    unstable,
    weak,
    unattempted,
    totalTopics: strong + unstable + weak + unattempted,
  };
}
