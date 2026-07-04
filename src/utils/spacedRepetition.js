/**
 * Spaced Repetition — SM-2 Variant
 *
 * Fixed intervals: 1 → 3 → 7 → 14 → 30 days.
 * Incorrect answers reset to 1 day.
 * Ease factor adjusts for individual question difficulty.
 */

const INTERVALS = [1, 3, 7, 14, 30];

/**
 * Schedule the next review for a question.
 *
 * @param {boolean} isCorrect       Whether the user answered correctly
 * @param {number}  currentInterval Current interval in days (default 0 for new items)
 * @param {number}  easeFactor      Current ease factor (default 2.5)
 * @param {number}  repetitionCount How many successful reviews so far
 * @returns {{ nextReviewDate: number, interval: number, easeFactor: number, repetitionCount: number }}
 */
export function scheduleReview(isCorrect, currentInterval = 0, easeFactor = 2.5, repetitionCount = 0) {
  const now = Date.now();

  if (!isCorrect) {
    // Reset on failure
    return {
      nextReviewDate: now + 1 * 24 * 60 * 60 * 1000, // 1 day from now
      interval: 1,
      easeFactor: Math.max(1.3, easeFactor - 0.2),
      repetitionCount: 0,
    };
  }

  // Correct answer — advance through the interval ladder
  const nextRep = repetitionCount + 1;
  const intervalIndex = Math.min(nextRep - 1, INTERVALS.length - 1);
  const nextInterval = INTERVALS[intervalIndex];

  // Adjust ease factor (SM-2 style, quality = 4 for correct answer)
  const quality = 4;
  const newEF = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  return {
    nextReviewDate: now + nextInterval * 24 * 60 * 60 * 1000,
    interval: nextInterval,
    easeFactor: parseFloat(newEF.toFixed(2)),
    repetitionCount: nextRep,
  };
}


/**
 * Create initial spaced repetition entry for a newly incorrect question.
 *
 * @param {number} questionId The question's unique ID
 * @returns {Object} Spaced repetition document structure
 */
export function createInitialEntry(questionId) {
  const now = Date.now();
  return {
    questionId,
    interval: 1,
    easeFactor: 2.5,
    nextReviewDate: now + 1 * 24 * 60 * 60 * 1000,
    repetitionCount: 0,
    lastReviewDate: now,
    lastResult: 'incorrect',
  };
}


/**
 * Get all questions due for review today.
 *
 * @param {Object} spacedRepEntries Map of questionId → { nextReviewDate, ... }
 * @param {number} [today]          Optional timestamp for "today" (defaults to Date.now())
 * @returns {Array} Array of { questionId, ...entry } sorted by most overdue first
 */
export function getDueQuestions(spacedRepEntries, today = Date.now()) {
  if (!spacedRepEntries || typeof spacedRepEntries !== 'object') {
    return [];
  }

  return Object.entries(spacedRepEntries)
    .filter(([_, entry]) => entry.nextReviewDate <= today)
    .map(([qId, entry]) => ({
      questionId: typeof qId === 'string' ? (isNaN(Number(qId)) ? qId : Number(qId)) : qId,
      ...entry,
      overdueByMs: today - entry.nextReviewDate,
    }))
    .sort((a, b) => b.overdueByMs - a.overdueByMs); // most overdue first
}


/**
 * Get a summary of the revision queue status.
 *
 * @param {Object} spacedRepEntries Map of questionId → { nextReviewDate, ... }
 * @param {number} [today]          Optional timestamp for "today"
 * @returns {{ dueToday: number, overdue: number, upcoming: number, nextDueDate: number|null }}
 */
export function getRevisionSummary(spacedRepEntries, today = Date.now()) {
  if (!spacedRepEntries || typeof spacedRepEntries !== 'object') {
    return { dueToday: 0, overdue: 0, upcoming: 0, nextDueDate: null };
  }

  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  let dueToday = 0;
  let overdue = 0;
  let upcoming = 0;
  let nextDueDate = null;

  Object.values(spacedRepEntries).forEach(entry => {
    if (entry.nextReviewDate <= todayStart.getTime()) {
      overdue++;
    } else if (entry.nextReviewDate <= todayEnd.getTime()) {
      dueToday++;
    } else {
      upcoming++;
      if (nextDueDate === null || entry.nextReviewDate < nextDueDate) {
        nextDueDate = entry.nextReviewDate;
      }
    }
  });

  return {
    dueToday: dueToday + overdue, // total due including overdue
    overdue,
    upcoming,
    nextDueDate,
  };
}


/**
 * Format an interval for display.
 *
 * @param {number} days Interval in days
 * @returns {string} Human-readable interval string
 */
export function formatInterval(days) {
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days === 7) return '1 week';
  if (days === 14) return '2 weeks';
  if (days === 30) return '1 month';
  return `${days} days`;
}
