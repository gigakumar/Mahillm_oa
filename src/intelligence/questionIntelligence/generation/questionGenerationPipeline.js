import { intelligenceProvider } from "../providers/providerRegistry.js";
import { IntelligenceTask, createInitialIntelligenceState, IntelligenceStatus } from "../schemas/questionIntelligenceSchema.js";

export async function questionGenerationPipeline(coverageGap) {
  // 1. Generate Question based on gap
  const generatedQuestion = await generateQuestion(coverageGap);

  // 2. Independent Solver Verification
  const isVerified = await verifyGeneratedQuestion(generatedQuestion);
  if (!isVerified) {
    console.warn("Generated question failed independent solver verification.");
    return null;
  }
  
  // 3. Staging and Probation
  // The initial state uses source = "GENERATED" which automatically puts it in PROBATION
  const intelligenceState = createInitialIntelligenceState(generatedQuestion.id, "GENERATED");
  
  return {
    question: generatedQuestion,
    intelligenceState
  };
}

async function generateQuestion(coverageGap) {
  const result = await intelligenceProvider.analyze({
    task: IntelligenceTask.QUESTION_GENERATION,
    question: {}, // Blank for generation
    context: { coverageGap }
  });
  
  return {
    id: `GEN_${Date.now()}`,
    text: result.text || "Generated Question Text",
    correctAnswer: result.correctAnswer || "42",
    subject: coverageGap.subject,
    topic: coverageGap.topic
  };
}

async function verifyGeneratedQuestion(question) {
  // Solver Agent A
  const solverA = await intelligenceProvider.analyze({
    task: IntelligenceTask.QUESTION_SOLVING,
    question,
    context: { agentRole: "SOLVER_A" }
  });

  // Solver Agent B
  const solverB = await intelligenceProvider.analyze({
    task: IntelligenceTask.QUESTION_SOLVING,
    question,
    context: { agentRole: "SOLVER_B" }
  });

  // Simplified consensus
  if (solverA.answer === solverB.answer && solverA.answer === question.correctAnswer) {
    return true;
  }
  return false;
}

export function evaluateProbationStatus(questionState, telemetryStats) {
  if (questionState.questionLifecycle.status !== "PROBATION") return false;
  
  const probation = questionState.questionLifecycle.probation;
  probation.currentAttempts = telemetryStats.totalAttempts || 0;
  
  if (
    probation.currentAttempts >= probation.requiredAttempts &&
    (telemetryStats.discriminationScore || 0) >= probation.minimumDiscrimination &&
    (telemetryStats.answerDisputeRate || 0) <= probation.maximumDisputeRate
  ) {
    questionState.questionLifecycle.status = "ACTIVE";
    questionState.intelligenceState.status = IntelligenceStatus.PENDING; // Needs calibration now
    return true; // Promoted
  }
  
  return false; // Still on probation
}
