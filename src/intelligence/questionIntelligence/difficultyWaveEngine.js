/**
 * Difficulty Wave Controller
 * Resolves non-monotonic target difficulty patterns for wave sequencing.
 */

const WAVE_PROFILES = {
  fragile_mastery_probe: [0.5, 0.65, 0.35, 0.78, 0.58, 0.82],
  confidence_calibration_wave: [0.4, 0.75, 0.45, 0.8, 0.5, 0.85],
  difficulty_ceiling_probe: [0.5, 0.6, 0.7, 0.8, 0.9, 0.4],
  recovery_confirmation_wave: [0.35, 0.3, 0.5, 0.4, 0.6, 0.5],
  pressure_resilience_wave: [0.5, 0.7, 0.75, 0.8, 0.85, 0.4]
};

export function getTargetWaveDifficulty(waveType, currentStepIndex = 0) {
  const profile = WAVE_PROFILES[waveType] || WAVE_PROFILES.fragile_mastery_probe;
  const index = currentStepIndex % profile.length;
  return profile[index];
}

export function selectOptimalWaveProfile(learnerState) {
  // Overconfident learners get confidence calibration wave
  if (learnerState.metacognition?.bias?.type === 'overconfident' || learnerState.metacognition?.global?.score < 60) {
    return 'confidence_calibration_wave';
  }
  
  // Learners with low ELO but low active mistakes get recovery validation
  const globalReadiness = learnerState.global?.readiness || 0.5;
  if (globalReadiness < 0.4) {
    return 'recovery_confirmation_wave';
  }

  // standard probe
  return 'fragile_mastery_probe';
}
