export function getActiveSessionConfig(locationState = null) {
  // 1. Try locationState
  if (locationState && typeof locationState === 'object') {
    if (validateConfig(locationState)) {
      // Save it to sessionStorage for refresh survival
      persistSessionConfig(locationState);
      return locationState;
    }
  }

  // 2. Try sessionStorage
  const sessionSaved = sessionStorage.getItem('active_session_config');
  if (sessionSaved) {
    try {
      const parsed = JSON.parse(sessionSaved);
      if (validateConfig(parsed)) return parsed;
    } catch (e) {}
  }

  // 3. Try localStorage (legacy compatibility)
  const localSaved = localStorage.getItem('current_test_config');
  if (localSaved) {
    try {
      const parsed = JSON.parse(localSaved);
      if (validateConfig(parsed)) {
        persistSessionConfig(parsed);
        return parsed;
      }
    } catch (e) {}
  }

  // 4. Default safe baseline calibration config fallback
  const defaultFallback = {
    valid: true,
    mode: 'adaptive',
    intent: 'ASSESSMENT',
    category: 'Mechanical Engineering',
    duration: 18,
    count: 12,
    distribution: {
      'Mechanical Engineering': 100
    }
  };
  persistSessionConfig(defaultFallback);
  return defaultFallback;
}

export function persistSessionConfig(config) {
  try {
    const serialized = JSON.stringify(config);
    sessionStorage.setItem('active_session_config', serialized);
    localStorage.setItem('current_test_config', serialized);
  } catch (e) {
    console.error("Failed to persist session config:", e);
  }
}

function validateConfig(config) {
  if (!config || typeof config !== 'object') return false;
  if (!config.category) {
    config.category = 'Mechanical Engineering';
  }
  if (!config.intent) {
    config.intent = 'OPTIMAL';
  }
  if (!config.count || isNaN(config.count)) {
    config.count = 12;
  }
  if (!config.duration || isNaN(config.duration)) {
    config.duration = 18;
  }
  if (!config.distribution) {
    config.distribution = {
      [config.category]: 100
    };
  }
  return true;
}
