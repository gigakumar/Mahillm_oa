// inspectorPhysics.js (hardened)
// Governing equations for the 3D Component Inspector.

import { clampNumber, assertPositive } from './validators.js';
import mechanicalConstants from '../data/mechanicalConstants.json';

// ---- Centrifugal Pump ----
export function pumpHeadFromRPM(referenceHeadM, referenceRPM, currentRPM) {
  assertPositive(referenceRPM, 'referenceRPM');
  const n = clampNumber(currentRPM, 1, 20000, referenceRPM);
  const ratio = n / referenceRPM;
  return referenceHeadM * ratio ** 2;
}

export function pumpPowerFromRPM(referencePowerKW, referenceRPM, currentRPM) {
  assertPositive(referenceRPM, 'referenceRPM');
  const n = clampNumber(currentRPM, 1, 20000, referenceRPM);
  const ratio = n / referenceRPM;
  return referencePowerKW * ratio ** 3;
}

// ---- 4-Stroke IC Engine (ideal Otto cycle) ----
export function ottoCycleEfficiency(compressionRatio, gamma = mechanicalConstants.thermodynamics.airGamma.value) {
  const r = clampNumber(compressionRatio, 2, 25, 8); // realistic petrol-engine range guard
  const g = clampNumber(gamma, 1.1, 1.7, 1.4); // air-standard gamma bound
  return 1 - 1 / r ** (g - 1);
}

// ---- Pelton Wheel Impulse Turbine ----
const PELTON_SPEED_RATIO = mechanicalConstants.fluidMechanics.peltonOptimalRatio.value;

export function peltonOptimalBucketSpeed(jetVelocityMS) {
  const v1 = clampNumber(jetVelocityMS, 1, 300, 40);
  return v1 * PELTON_SPEED_RATIO;
}

export function peltonPowerOutput(jetVelocityMS, massFlowKgS, bucketSpeedMS) {
  const v1 = clampNumber(jetVelocityMS, 1, 300, 40);
  const m = clampNumber(massFlowKgS, 0.01, 10000, 1);
  const u = clampNumber(bucketSpeedMS, 0, v1, peltonOptimalBucketSpeed(v1));
  const betaRad = (165 * Math.PI) / 180;
  return m * u * (v1 - u) * (1 + Math.cos(betaRad));
}
