export class IntelligenceProvider {
  /**
   * @param {Object} params
   * @param {string} params.task - one of IntelligenceTask
   * @param {Object} params.question - The question object
   * @param {Object} params.context - Any additional context (deterministic features, telemetry)
   * @returns {Promise<Object>} The analysis result from the semantic model
   */
  async analyze({ task, question, context }) {
    throw new Error("analyze() must be implemented by the provider");
  }
}
