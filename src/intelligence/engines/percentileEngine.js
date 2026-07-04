/**
 * Peer Percentile Engine.
 * Compares student performance against aggregate distributions.
 */

export const MIN_COHORT_SIZE = 100;

export function calculatePercentile(userVal, distribution = []) {
  if (distribution.length < MIN_COHORT_SIZE) {
    return null; // Postpone percentile calculations
  }

  const sorted = [...distribution].sort((a, b) => a - b);
  const index = sorted.findIndex(v => v >= userVal);

  if (index === -1) return 99;
  
  const percentile = (index / sorted.length) * 100;
  return Math.round(percentile);
}

export function compilePeerPercentiles({
  studentMetrics = { accuracy: 0.7, speedSeconds: 60, coreMechanicalElo: 1000, aptitudeElo: 900 },
  allPeers = [] // peers belonging to ACTIVE_30_DAY_USERS with attempts >= 200
}) {
  if (allPeers.length < MIN_COHORT_SIZE) {
    return {
      status: "INSUFFICIENT_COHORT_SIZE",
      minCohortNeeded: MIN_COHORT_SIZE,
      currentCohortSize: allPeers.length,
      overall: null,
      accuracy: null,
      speed: null,
      coreMechanical: null,
      aptitude: null
    };
  }

  const distributions = {
    accuracy: allPeers.map(p => p.accuracy || 0.5),
    speed: allPeers.map(p => p.speedSeconds || 75),
    core: allPeers.map(p => p.coreMechanicalElo || 800),
    aptitude: allPeers.map(p => p.aptitudeElo || 800)
  };

  const accuracyPercentile = calculatePercentile(studentMetrics.accuracy, distributions.accuracy);
  const speedPercentile = calculatePercentile(-studentMetrics.speedSeconds, distributions.speed.map(s => -s));
  const corePercentile = calculatePercentile(studentMetrics.coreMechanicalElo, distributions.core);
  const aptitudePercentile = calculatePercentile(studentMetrics.aptitudeElo, distributions.aptitude);

  const overallPercentile = Math.round(
    (accuracyPercentile * 0.4 + speedPercentile * 0.2 + corePercentile * 0.2 + aptitudePercentile * 0.2)
  );

  return {
    status: "COMPLETE",
    overall: overallPercentile,
    accuracy: accuracyPercentile,
    speed: speedPercentile,
    coreMechanical: corePercentile,
    aptitude: aptitudePercentile
  };
}
