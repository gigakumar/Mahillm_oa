import pLimit from "p-limit";
import { determineRequiredAgents } from "./policies/agentInvocationPolicy.js";
import { difficultyAgent } from "./agents/difficultyAgent.js";
import { qualityAgent } from "./agents/qualityAgent.js";
import { conceptAgent } from "./agents/conceptAgent.js";
import { ambiguityAgent } from "./agents/ambiguityAgent.js";
import { duplicateAgent } from "./agents/duplicateAgent.js";
import { questionConsensusEngine } from "./consensus/questionConsensusEngine.js";
import { IntelligenceStatus, createInitialIntelligenceState } from "./schemas/questionIntelligenceSchema.js";

// Ensure we don't blow up our API / provider with 25k requests at once
const limit = pLimit(10);

export async function processQuestionBatch(questions, contextMap) {
  const batches = chunkArray(questions, 50);

  for (const batch of batches) {
    await Promise.all(
      batch.map(question =>
        limit(() => analyzeQuestion(question, contextMap[question.id]))
      )
    );
  }
}

async function analyzeQuestion(question, context) {
  let questionState = context.questionState || createInitialIntelligenceState(question.id);
  
  if (questionState.intelligenceState.status !== IntelligenceStatus.PENDING &&
      questionState.intelligenceState.status !== IntelligenceStatus.STALE) {
      // Skip if already processing or calibrated recently and not stale
      return questionState;
  }
  
  questionState.intelligenceState.status = IntelligenceStatus.ANALYZING;

  const requiredAgents = determineRequiredAgents(context);
  questionState.intelligenceState.agentsRun = requiredAgents;

  const agentPromises = [];
  
  // Conditionally execute agents based on policy
  let difficultyPromise = requiredAgents.includes("difficulty") ? difficultyAgent(context) : Promise.resolve(null);
  let qualityPromise = requiredAgents.includes("quality") ? qualityAgent(context) : Promise.resolve(null);
  let conceptPromise = requiredAgents.includes("concept") ? conceptAgent(context) : Promise.resolve(null);
  let ambiguityPromise = requiredAgents.includes("ambiguity") ? ambiguityAgent(context) : Promise.resolve(null);
  let duplicatePromise = requiredAgents.includes("duplicate") ? duplicateAgent(context) : Promise.resolve(null);

  try {
    const [
      difficultyResult,
      qualityResult,
      conceptsResult,
      ambiguityResult,
      duplicateResult
    ] = await Promise.all([
      difficultyPromise,
      qualityPromise,
      conceptPromise,
      ambiguityPromise,
      duplicatePromise
    ]);

    const finalState = questionConsensusEngine({
      questionState,
      difficultyResult,
      qualityResult,
      conceptsResult,
      ambiguityResult,
      duplicateResult,
      telemetryContext: context
    });
    
    // In a real system, persist `finalState` here
    return finalState;
  } catch (error) {
    questionState.intelligenceState.status = IntelligenceStatus.FAILED;
    questionState.intelligenceState.lastError = error.message;
    return questionState;
  }
}

// Utility to chunk arrays
function chunkArray(array, size) {
  const chunked_arr = [];
  let index = 0;
  while (index < array.length) {
    chunked_arr.push(array.slice(index, size + index));
    index += size;
  }
  return chunked_arr;
}

// STALE invalidation check
export function shouldInvalidateIntelligence({ previousStats, currentStats }) {
  const attemptDelta = currentStats.totalAttempts - previousStats.totalAttempts;
  const errorRateShift = Math.abs(currentStats.errorRate - previousStats.errorRate);

  return attemptDelta >= 25 || errorRateShift >= 0.10;
}
