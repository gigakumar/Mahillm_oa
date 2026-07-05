import { MISTAKE_TYPES } from '../config/intelligenceTaxonomy.js';

export function detectMistakePersistence(mistakesList = []) {
  const result = {};
  
  const types = [
    MISTAKE_TYPES.CONCEPTUAL,
    MISTAKE_TYPES.CALCULATION,
    MISTAKE_TYPES.MISREAD,
    MISTAKE_TYPES.FORMULA_RECALL,
    MISTAKE_TYPES.OPTION_TRAP,
    MISTAKE_TYPES.TIME_PRESSURE,
    MISTAKE_TYPES.GUESS
  ];

  types.forEach(t => {
    result[t] = {
      rawCount: 0,
      weightedCount: 0,
      share: 0,
      persistence: 0,
      trend: 'stable'
    };
  });

  let totalWeighted = 0;
  let totalActiveCount = 0;

  mistakesList.forEach(m => {
    if (m.isResolved) return;
    totalActiveCount++;
    const type = m.userOverrideType || m.mistakeType || 'conceptual';
    // Normalize type
    let normType = type;
    if (type === 'formula') normType = MISTAKE_TYPES.FORMULA_RECALL;
    if (type === 'time_pressure') normType = MISTAKE_TYPES.TIME_PRESSURE;
    if (type === 'option_trap') normType = MISTAKE_TYPES.OPTION_TRAP;
    
    if (result[normType]) {
      result[normType].rawCount++;
      const confidence = m.confidence !== undefined ? m.confidence : 0.8;
      result[normType].weightedCount += confidence;
      totalWeighted += confidence;
    }
  });

  // Compute shares & persistence
  if (totalWeighted > 0) {
    types.forEach(t => {
      const stats = result[t];
      stats.share = parseFloat((stats.weightedCount / totalWeighted).toFixed(2));
      stats.persistence = parseFloat(Math.min(stats.weightedCount * 0.25, 0.95).toFixed(2));
      
      // Determine trend based on count
      if (stats.rawCount >= 5) stats.trend = 'worsening';
      else if (stats.rawCount >= 3) stats.trend = 'stable';
      else if (stats.rawCount > 0) stats.trend = 'emerging';
      else stats.trend = 'resolved';
    });
  }

  return {
    distribution: result,
    totalMistakes: totalActiveCount,
    totalWeighted: parseFloat(totalWeighted.toFixed(2))
  };
}
