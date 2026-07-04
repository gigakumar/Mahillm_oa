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

export function calculateRobustZScore(x, values = []) {
  if (values.length === 0) return 0.0;
  const median = calculateMedian(values);
  const mad = calculateMAD(values);

  if (mad === 0) {
    // Fallback to normal difference if MAD is zero
    return x === median ? 0.0 : (x > median ? 1.0 : -1.0);
  }

  // Robust Z-score: z = 0.6745 * (x - median) / MAD
  const z = (0.6745 * (x - median)) / mad;
  return parseFloat(z.toFixed(3));
}
