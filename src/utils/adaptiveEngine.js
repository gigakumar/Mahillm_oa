/**
 * Adaptive Practice Engine — Pure Functions
 *
 * Provides deterministic question selection based on mastery data,
 * mastery score updates after each answer, and automatic mistake
 * classification heuristics.
 *
 * All functions are pure — no side effects, no React, no Firebase.
 */

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const WEIGHTS = {
  weakness: 0.35,
  mistakes: 0.25,
  recency: 0.15,
  unseen: 0.15,
  diversity: 0.10,
};

const MASTERY_K = 0.12; // learning rate for mastery updates
const RECENCY_HALF_LIFE_DAYS = 3;
const MAX_TOPIC_CONCENTRATION = 0.4; // no more than 40% from one topic

// ──────────────────────────────────────────────
// Question Selection Algorithm
// ──────────────────────────────────────────────

/**
 * Select the next N questions optimised for the user's weaknesses.
 *
 * @param {Array}  allQuestions  Full question pool
 * @param {Object} userMastery   Map of compositeKey → { score, attempts, lastAttempted, ... }
 * @param {Object} userHistory   Map of questionId → { totalAttempts, correctCount, lastAttempted }
 * @param {Object} userMistakes  Map of questionId → { timesIncorrect, ... }
 * @param {number} count         Number of questions to select (default 20)
 * @returns {{ questions: Array, reasons: Object }}
 */
export function selectNextQuestions(allQuestions, userMastery = {}, userHistory = {}, userMistakes = {}, count = 20) {
  if (!allQuestions || allQuestions.length === 0) {
    return { questions: [], reasons: {} };
  }

  const now = Date.now();
  const topicScoreSums = {};  // track how many of each topic are selected for diversity
  const reasons = {};

  // Score each question
  const scored = allQuestions.map(q => {
    const compositeKey = buildCompositeKey(q.category, q.topic);
    const mastery = userMastery[compositeKey] || null;
    const history = userHistory[q.id] || null;
    const mistake = userMistakes[q.id] || null;

    let score = 0;
    let reason = '';

    // 1. Weakness score — lower mastery = higher priority
    const masteryScore = mastery ? mastery.score : 0.5; // default 0.5 for unseen topics
    const weaknessScore = 1 - masteryScore;
    score += WEIGHTS.weakness * weaknessScore;
    if (masteryScore < 0.4) {
      reason = `Weak topic: ${q.topic} (${Math.round(masteryScore * 100)}%)`;
    }

    // 2. Mistake score — repeated mistakes boost priority
    if (mistake && mistake.timesIncorrect >= 2) {
      score += WEIGHTS.mistakes * Math.min(mistake.timesIncorrect / 5, 1);
      reason = `Repeated mistakes in ${q.topic} (${mistake.timesIncorrect}×)`;
    } else if (mistake && mistake.timesIncorrect === 1) {
      score += WEIGHTS.mistakes * 0.3;
    }

    // 3. Recency score — prefer topics not seen recently
    if (mastery && mastery.lastAttempted) {
      const daysSince = (now - mastery.lastAttempted) / (1000 * 60 * 60 * 24);
      const recencyScore = 1 - Math.exp(-daysSince / RECENCY_HALF_LIFE_DAYS);
      score += WEIGHTS.recency * recencyScore;
      if (daysSince > 5 && !reason) {
        reason = `Not practiced in ${Math.round(daysSince)} days`;
      }
    } else {
      score += WEIGHTS.recency * 0.8; // never attempted gets high recency
    }

    // 4. Unseen score — prefer questions never attempted
    if (!history || history.totalAttempts === 0) {
      score += WEIGHTS.unseen * 1.0;
      if (!reason) {
        reason = 'New question — never attempted';
      }
    } else {
      score += WEIGHTS.unseen * 0.1;
    }

    // 5. Diversity penalty applied during selection (not here)

    if (!reason) {
      reason = 'Balanced practice';
    }

    return { question: q, score, reason, topic: q.topic };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Select with diversity constraint
  const selected = [];
  const maxPerTopic = Math.ceil(count * MAX_TOPIC_CONCENTRATION);

  for (const item of scored) {
    if (selected.length >= count) break;

    const topicCount = topicScoreSums[item.topic] || 0;
    if (topicCount >= maxPerTopic) {
      continue; // skip — this topic is already well-represented
    }

    selected.push(item);
    topicScoreSums[item.topic] = topicCount + 1;
    reasons[item.question.id] = item.reason;
  }

  // If we didn't fill the quota due to diversity constraints, relax and fill
  if (selected.length < count) {
    for (const item of scored) {
      if (selected.length >= count) break;
      if (!selected.includes(item)) {
        selected.push(item);
        reasons[item.question.id] = item.reason;
      }
    }
  }

  // Shuffle the final selection so it's not just hardest-first
  const shuffled = shuffleArray(selected);

  return {
    questions: shuffled.map(s => s.question),
    reasons,
  };
}


// ──────────────────────────────────────────────
// Mastery Score Update
// ──────────────────────────────────────────────

/**
 * Compute the updated mastery score after answering a question.
 *
 * @param {number} currentScore  Current mastery score (0–1)
 * @param {boolean} isCorrect    Whether the answer was correct
 * @param {number} solveTimeMs   Time taken to solve (milliseconds)
 * @param {number} streak        Current consecutive correct answers in this topic
 * @returns {number} Updated mastery score (0–1)
 */
export function updateMasteryScore(currentScore, isCorrect, solveTimeMs = 0, streak = 0) {
  let score = currentScore;

  if (isCorrect) {
    // Base gain: diminishing returns as mastery increases
    let gain = MASTERY_K * (1 - score);

    // Speed bonus: solving in < 45s gives up to 10% extra
    if (solveTimeMs > 0 && solveTimeMs < 45000) {
      gain *= 1.1;
    }

    // Streak bonus: consecutive correct answers in the same topic
    const streakBonus = Math.min(streak * 0.02, 0.1);
    gain += streakBonus * (1 - score);

    score += gain;
  } else {
    // Mistakes hurt more than correct answers help (asymmetric)
    const loss = MASTERY_K * score * 1.2;
    score -= loss;
  }

  return Math.max(0, Math.min(1, score));
}


// ──────────────────────────────────────────────
// Mistake Auto-Classification
// ──────────────────────────────────────────────

const TECHNICAL_TOPICS = new Set([
  'Strength of Materials', 'SOM', 'Thermodynamics', 'Fluid Mechanics',
  'Heat Transfer', 'Machine Design', 'Engineering Mechanics',
  'Theory of Machines', 'Manufacturing Engineering', 'Engineering Materials',
  'Industrial Engineering',
]);

/**
 * Heuristically classify why a mistake was made.
 *
 * @param {Object}  question       The question object
 * @param {*}       userAnswer     The user's selected answer
 * @param {number}  solveTimeMs    Time taken (ms)
 * @param {string}  confidence     'sure' | 'unsure' | 'guess' | null
 * @param {boolean} changedAnswer  Whether the user changed their option
 * @returns {string} One of: conceptual, calculation, formula recall, option trap, misread, time pressure, guess
 */
export function classifyMistake(question, userAnswer, solveTimeMs = 0, confidence = null, changedAnswer = false) {
  const normConfidence = typeof confidence === 'string' ? confidence.toLowerCase() : null;

  // 1. Guess — explicit or very fast
  if (normConfidence === 'guess' || (solveTimeMs > 0 && solveTimeMs < 5000)) {
    return 'guess';
  }

  // 2. Time pressure — fast + not confident
  if (solveTimeMs > 0 && solveTimeMs < 15000 && normConfidence !== 'sure') {
    return 'time pressure';
  }

  // 3. Option trap — explicit trap option or panic choice switch
  if (question.trapOption !== undefined && userAnswer === question.trapOption) {
    return 'option trap';
  }
  if (changedAnswer && normConfidence === 'unsure') {
    return 'option trap';
  }

  // 4. Misread — DI/DILR questions with shared context, answered quickly
  if (question.contextHtml && solveTimeMs > 0 && solveTimeMs < 20000) {
    return 'misread';
  }

  // 5. Formula recall — technical question with formula-based topic
  if (TECHNICAL_TOPICS.has(question.topic) && question.type === 'MCQ') {
    // If user picked an option adjacent to the correct one, likely calculation error
    if (typeof userAnswer === 'number' && typeof question.correct === 'number') {
      const diff = Math.abs(userAnswer - question.correct);
      if (diff === 1) {
        return 'calculation';
      }
    }
    return 'formula recall';
  }

  // 6. Calculation — quantitative topic
  if (question.category === 'Quantitative Aptitude' || question.type === 'NAT') {
    return 'calculation';
  }

  // 7. Default — conceptual
  return 'conceptual';
}


// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/**
 * Build a composite key for mastery tracking.
 * Format: "Category__Topic" (double underscore separator)
 */
export function buildCompositeKey(category, topic) {
  return `${category || 'Unknown'}__${topic || 'General'}`;
}

/**
 * Parse a composite key back to category and topic.
 */
export function parseCompositeKey(compositeKey) {
  const parts = compositeKey.split('__');
  return {
    category: parts[0] || 'Unknown',
    topic: parts[1] || 'General',
  };
}

/**
 * Get the top N weakest topics from mastery data.
 *
 * @param {Object} userMastery Map of compositeKey → { score, ... }
 * @param {number} n           Number of weak topics to return
 * @returns {Array} Array of { category, topic, score }
 */
export function getWeakestTopics(userMastery, n = 5) {
  const entries = Object.entries(userMastery)
    .map(([key, data]) => ({
      ...parseCompositeKey(key),
      score: data.score,
      attempts: data.attempts,
    }))
    .filter(e => e.attempts > 0) // exclude unattempted
    .sort((a, b) => a.score - b.score);

  return entries.slice(0, n);
}

/**
 * Generate a summary of the adaptive selection for display.
 *
 * @param {Object} userMastery Mastery data
 * @returns {Array} Array of { category, topic, score, label }
 */
export function getAdaptiveSummary(userMastery) {
  const weakest = getWeakestTopics(userMastery, 3);
  return weakest.map(w => ({
    ...w,
    label: `${w.topic} (${Math.round(w.score * 100)}%)`,
  }));
}

// Fisher-Yates shuffle
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
