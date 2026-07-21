/**
 * Shared Defensive Engine Validators & Helpers
 */

export class EngineInputError extends Error {
  constructor(message) {
    super(message);
    this.name = 'EngineInputError';
  }
}

/**
 * Clamp a number into [min, max]. Returns `fallback` if value isn't a finite number.
 */
export function clampNumber(value, min, max, fallback = min) {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, value));
}

/**
 * Ensures a value is a positive number (> 0). Throws a descriptive error
 * instead of silently returning Infinity/NaN downstream.
 */
export function assertPositive(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new EngineInputError(`${name} must be a positive finite number, got: ${value}`);
  }
  return value;
}

/**
 * Ensures an array is non-empty before reduce/average operations.
 */
export function assertNonEmptyArray(arr, name) {
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new EngineInputError(`${name} must be a non-empty array`);
  }
  return arr;
}

/**
 * Safely computes the average of an array of numbers.
 */
export function safeAverage(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  const validNums = arr.filter(n => typeof n === 'number' && Number.isFinite(n));
  if (validNums.length === 0) return 0;
  const sum = validNums.reduce((a, b) => a + b, 0);
  return sum / validNums.length;
}
