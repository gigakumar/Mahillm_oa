/**
 * Robust Statistics Utilities.
 * Uses Median and Median Absolute Deviation (MAD) to filter out outliers.
 */

export function calculateMedian(values = []) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

export function calculateMAD(values = []) {
  if (values.length === 0) return 0;
  const median = calculateMedian(values);
  const absoluteDeviations = values.map(v => Math.abs(v - median));
  return calculateMedian(absoluteDeviations);
}

export function calculatePercentile(values = [], p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export function resolveRobustScale({ questionStats = {}, subjectStats = {}, globalStats = {} }) {
  if (questionStats.mad > 0) {
    return {
      scale: questionStats.mad / 0.6745,
      source: "MAD"
    };
  }

  const p75 = questionStats.p75 !== undefined ? questionStats.p75 : calculatePercentile(questionStats.values, 0.75);
  const p25 = questionStats.p25 !== undefined ? questionStats.p25 : calculatePercentile(questionStats.values, 0.25);
  const iqr = p75 - p25;

  if (Number.isFinite(iqr) && iqr > 0) {
    return {
      scale: iqr / 1.349,
      source: "IQR"
    };
  }

  if (subjectStats.robustScale > 0) {
    return {
      scale: subjectStats.robustScale,
      source: "SUBJECT"
    };
  }

  if (globalStats.robustScale > 0) {
    return {
      scale: globalStats.robustScale,
      source: "GLOBAL"
    };
  }

  return {
    scale: null,
    source: "INSUFFICIENT_VARIANCE"
  };
}

export function calculateRobustZScore(value, median, mad, fallbackScale = null) {
  if (!Number.isFinite(value)) {
    return null;
  }

  if (!Number.isFinite(median)) {
    return null;
  }

  if (mad > 0) {
    return (0.6745 * (value - median)) / mad;
  }

  if (fallbackScale && fallbackScale > 0) {
    return (value - median) / fallbackScale;
  }

  return 0.0;
}
