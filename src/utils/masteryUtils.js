/**
 * Mastery Utilities — Heatmap Data Builder
 *
 * Transforms raw question data + user mastery scores into hierarchical
 * structures for the Exam Readiness Heatmap.
 */

import { buildCompositeKey } from './adaptiveEngine';
import { QuestionBankRegistry } from '../data/questionBankRegistry';

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
 * Build heatmap data from the static QuestionBankRegistry and user mastery.
 */
export function buildHeatmapData(allQuestions, userMastery = {}) {
  const heatmap = [];

  for (const bank of QuestionBankRegistry) {
    const topicsList = [];
    
    // For Mechanical, use topicGroups or flat topics list
    if (bank.id === 'mechanical' && bank.topicGroups) {
      bank.topicGroups.forEach(g => {
        g.topics.forEach(t => {
          const compositeKey = buildCompositeKey(bank.categoryKey, t.name);
          const mastery = userMastery[compositeKey];
          
          const masteryScore = mastery ? (mastery.score || mastery.probabilityKnown || 0) : 0;
          const questionsAttempted = mastery ? (mastery.attempts || mastery.attemptsCount || 0) : 0;
          const correctCount = mastery ? (mastery.correctCount || 0) : 0;
          const accuracy = questionsAttempted > 0 ? Math.round((correctCount / questionsAttempted) * 100) : 0;
          const status = getMasteryStatus(masteryScore, questionsAttempted);

          topicsList.push({
            topic: t.name,
            masteryScore,
            questionsAttempted,
            totalQuestions: t.count,
            correctCount,
            accuracy,
            status,
            compositeKey,
          });
        });
      });
    } else {
      // Other categories
      const topics = bank.topics || [];
      // Estimate question count per topic equally or use standard defaults
      const estCountPerTopic = Math.round(bank.estimatedCount / Math.max(1, topics.length));
      
      topics.forEach(topicName => {
        const compositeKey = buildCompositeKey(bank.categoryKey, topicName);
        const mastery = userMastery[compositeKey];
        
        const masteryScore = mastery ? (mastery.score || mastery.probabilityKnown || 0) : 0;
        const questionsAttempted = mastery ? (mastery.attempts || mastery.attemptsCount || 0) : 0;
        const correctCount = mastery ? (mastery.correctCount || 0) : 0;
        const accuracy = questionsAttempted > 0 ? Math.round((correctCount / questionsAttempted) * 100) : 0;
        const status = getMasteryStatus(masteryScore, questionsAttempted);

        topicsList.push({
          topic: topicName,
          masteryScore,
          questionsAttempted,
          totalQuestions: estCountPerTopic,
          correctCount,
          accuracy,
          status,
          compositeKey,
        });
      });
    }

    let catAttempted = 0;
    let catScoreSum = 0;
    let catScoredTopics = 0;
    
    topicsList.forEach(t => {
      catAttempted += t.questionsAttempted;
      if (t.questionsAttempted > 0) {
        catScoreSum += t.masteryScore;
        catScoredTopics++;
      }
    });

    const catMasteryScore = catScoredTopics > 0 ? catScoreSum / catScoredTopics : 0;
    const catStatus = getMasteryStatus(catMasteryScore, catAttempted);

    heatmap.push({
      category: bank.categoryKey,
      masteryScore: catMasteryScore,
      questionsAttempted: catAttempted,
      totalQuestions: bank.estimatedCount,
      status: catStatus,
      topics: topicsList,
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

/**
 * Compute Ability Tier string based on attempts and accuracy
 */
export function computeAbilityTier(attempts, learnerState) {
  if (!attempts || attempts.length < 10) return "CALIBRATING";
  
  const correctCount = attempts.filter(a => a.correct).length;
  const accuracy = correctCount / attempts.length;
  
  if (attempts.length < 30) return "EMERGING";
  
  let avgElo = 600;
  if (learnerState?.topicMasteryElo) {
    const elos = Object.values(learnerState.topicMasteryElo);
    if (elos.length > 0) {
      avgElo = elos.reduce((a, b) => a + b, 0) / elos.length;
    }
  }

  if (accuracy < 0.4) return "BEGINNER";
  if (accuracy < 0.6) return "DEVELOPING";
  
  if (accuracy < 0.75) {
    return avgElo < 950 ? "INTERMEDIATE" : "ADVANCED";
  }
  
  if (attempts.length >= 50 && accuracy >= 0.8 && avgElo >= 1100) {
    return "EXPERT";
  }
  
  return "ADVANCED";
}
