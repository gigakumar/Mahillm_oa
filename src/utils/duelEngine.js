// duelEngine.js (hardened)
// Scoring, timing, and XP logic for PeerDuel — separated from PeerDuel.jsx
// so it can be unit tested without mounting React/DOM.

import { clampNumber, EngineInputError } from './validators.js';

export const CONFIG = {
  ROUND_SECONDS: 12,
  SPEED_BONUS_PER_SEC: 10,
  BASE_CORRECT_POINTS: 100,
  VICTORY_XP: 50,
  MAX_DUELS_PER_DAY_FOR_XP: 10, // anti-farming guard
};

/**
 * Score for a single answered round. Clamps time-remaining into a valid window.
 */
export function computeRoundScore({ isCorrect, secondsRemainingWhenAnswered }) {
  if (typeof isCorrect !== 'boolean') {
    throw new EngineInputError('isCorrect must be a boolean');
  }
  if (!isCorrect) return 0;

  const secondsRemaining = clampNumber(secondsRemainingWhenAnswered, 0, CONFIG.ROUND_SECONDS, 0);
  return CONFIG.BASE_CORRECT_POINTS + secondsRemaining * CONFIG.SPEED_BONUS_PER_SEC;
}

/**
 * Determines whether the opponent reveal is safe to show (anti-race-condition guard).
 */
export function canRevealOpponentChoice({ roundLocked, isSimulatedOpponent }) {
  if (isSimulatedOpponent) return true;
  return Boolean(roundLocked);
}

/**
 * XP award with a soft anti-farming cap for simulated bot opponents.
 */
export function awardVictoryXP({ isSimulatedOpponent, victoriesTodayCount }) {
  const count = clampNumber(victoriesTodayCount, 0, 100000, 0);
  if (isSimulatedOpponent && count >= CONFIG.MAX_DUELS_PER_DAY_FOR_XP) {
    return { xpAwarded: 0, reason: 'daily_bot_xp_cap_reached' };
  }
  return { xpAwarded: CONFIG.VICTORY_XP, reason: 'victory' };
}

/**
 * UI label helper — makes the bot-vs-real distinction transparent.
 */
export function getOpponentLabel(isSimulatedOpponent) {
  return isSimulatedOpponent
    ? { mode: 'practice', displayName: 'AI Practice Opponent', badge: 'Practice Mode' }
    : { mode: 'live', displayName: null, badge: 'Live Peer Match' };
}
