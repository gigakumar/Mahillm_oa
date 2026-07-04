/**
 * Peer Percentile Engine.
 * Compares student performance against aggregate distributions.
 */

export function calculatePercentile(userVal, distribution = []) {
  if (distribution.length === 0) return 50; // default average

  const sorted = [...distribution].sort((a, b) => a - b);
  const index = sorted.findIndex(v => v >= userVal);

  if (index === -1) return 99; // Top performer
  
  const percentile = (index / sorted.length) * 100;
  return Math.round(percentile);
}

/**
 * Returns a complete peer comparison dataset.
 */
export function compilePeerPercentiles({
  studentMetrics = { accuracy: 0.7, speedSeconds: 60, coreMechanicalElo: 1000, aptitudeElo: 900 },
  allPeers = [] // array of peer metric objects
}) {
  const distributions = {
    accuracy: allPeers.map(p => p.accuracy || 0.5),
    speed: allPeers.map(p => p.speedSeconds || 75),
    core: allPeers.map(p => p.coreMechanicalElo || 800),
    aptitude: allPeers.map(p => p.aptitudeElo || 800)
  };

  // Speed percentile: lower time is better, so reverse comparison values
  const accuracyPercentile = calculatePercentile(studentMetrics.accuracy, distributions.accuracy);
  // Compare negative speed values to find speed percentile (faster is better)
  const speedPercentile = calculatePercentile(-studentMetrics.speedSeconds, distributions.speed.map(s => -s));
  
  const corePercentile = calculatePercentile(studentMetrics.coreMechanicalElo, distributions.core);
  const aptitudePercentile = calculatePercentile(studentMetrics.aptitudeElo, distributions.aptitude);

  const overallPercentile = Math.round(
    (accuracyPercentile * 0.4 + speedPercentile * 0.2 + corePercentile * 0.2 + aptitudePercentile * 0.2)
  );

  return {
    overall: overallPercentile,
    accuracy: accuracyPercentile,
    speed: speedPercentile,
    coreMechanical: corePercentile,
    aptitude: aptitudePercentile
  };
}
