import { compileLearnerState as canonicalCompile } from './learnerStateCompiler.js';

/**
 * Backwards-compatible wrapper redirecting to the canonical student state compiler.
 */
export function compileLearnerState(params) {
  return canonicalCompile(params);
}
