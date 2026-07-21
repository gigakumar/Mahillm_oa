import { getAI, getTemplateGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import { app } from '../firebase';

// Initialize Firebase AI Logic with the Gemini Developer API backend (GoogleAIBackend)
let ai;
let templateModel;

try {
  ai = getAI(app, {
    backend: new GoogleAIBackend()
  });
  templateModel = getTemplateGenerativeModel(ai);
} catch (err) {
  console.warn("Firebase AI Logic initialization notice:", err);
}

/**
 * Executes a server-side prompt template configured in Firebase Console (Single response).
 */
export async function executePromptTemplate(templateId = 'question-generator-v1', inputParams = {}) {
  if (!templateModel) {
    throw new Error("Firebase AI Logic model is not initialized.");
  }

  try {
    const result = await templateModel.generateContent(
      templateId,
      inputParams
    );

    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI Logic Execution Error:", error);
    throw error;
  }
}

/**
 * Executes a server-side prompt template with real-time streaming chunks.
 * Uses generateContentStream and a for await...of loop for typing-effect rendering.
 */
export async function executePromptTemplateStream(templateId = 'question-generator-v1', inputParams = {}, onChunk = null) {
  if (!templateModel) {
    throw new Error("Firebase AI Logic model is not initialized.");
  }

  try {
    const result = await templateModel.generateContentStream(
      templateId,
      inputParams
    );

    let fullResponse = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
      if (typeof onChunk === 'function') {
        onChunk(chunkText, fullResponse);
      }
    }

    return fullResponse;
  } catch (error) {
    console.error("AI Logic Streaming Error:", error);
    throw error;
  }
}

/**
 * 1. Instant Explanations for Mistakes
 * Streams a personalized error breakdown explaining why the selected option was wrong.
 */
export async function streamAnswerExplanation(question, userAnswer, onChunk = null) {
  const params = {
    questionText: question.question || question.text || '',
    options: JSON.stringify(question.options || []),
    correctAnswer: question.correctAnswer || question.correct || 0,
    userAnswer: userAnswer,
    subject: question.subject || question.category || 'Mechanical Engineering'
  };

  try {
    return await executePromptTemplateStream('explain-mistake-template', params, onChunk);
  } catch (err) {
    // Client-side fallback streamer if template is not deployed yet in console
    const fallbackText = `**Analysis of Selected Option:** You chose option (${userAnswer}). In ${params.subject}, this commonly occurs when confusing boundary conditions or sign conventions. **Key Correction:** Review the governing formula and verify unit dimensions before calculating the final value.`;
    return simulateStreamFallback(fallbackText, onChunk);
  }
}

/**
 * 2. Contextual Hint Generation
 * Streams a step-by-step hint without revealing the direct answer.
 */
export async function streamQuestionHint(question, onChunk = null) {
  const params = {
    questionText: question.question || question.text || '',
    subject: question.subject || question.category || 'Mechanical Engineering'
  };

  try {
    return await executePromptTemplateStream('generate-hint-template', params, onChunk);
  } catch (err) {
    const fallbackText = `💡 **AI Hint Step 1:** Identify the primary governing equation for ${params.subject}. Step 2: Pay attention to any assumptions (e.g. ideal gas, incompressible flow, or neutral axis bounds). Step 3: Substitute known parameters into the equation.`;
    return simulateStreamFallback(fallbackText, onChunk);
  }
}

/**
 * 3. Smart "Spaced Repetition" Practice
 * Generates a fresh, structurally identical remedial question for previously failed items.
 */
export async function streamRemedialQuestion(failedQuestion, onChunk = null) {
  const params = {
    originalQuestion: failedQuestion.question || failedQuestion.text || '',
    subject: failedQuestion.subject || failedQuestion.category || 'Mechanical Engineering'
  };

  try {
    return await executePromptTemplateStream('remedial-question-template', params, onChunk);
  } catch (err) {
    const fallbackText = `🔄 **Remedial Concept Challenge (${params.subject}):** A structurally similar problem to reinforce your understanding. Verify the new parameter values and select the correct option.`;
    return simulateStreamFallback(fallbackText, onChunk);
  }
}

/**
 * Helper to simulate token streaming typing effect when offline or template is provisioning.
 */
async function simulateStreamFallback(fullText, onChunk) {
  const words = fullText.split(' ');
  let compiled = '';
  for (let i = 0; i < words.length; i++) {
    const token = (i === 0 ? '' : ' ') + words[i];
    compiled += token;
    if (typeof onChunk === 'function') {
      onChunk(token, compiled);
    }
    await new Promise(r => setTimeout(r, 25));
  }
  return compiled;
}

export async function streamStudyQuestions(subject = 'Database Security', difficulty = 'intermediate', onChunk = null) {
  return executePromptTemplateStream('question-generator-v1', { subject, difficulty }, onChunk);
}

export async function generateStudyQuestions(subject = 'Database Security', difficulty = 'intermediate') {
  return executePromptTemplate('question-generator-v1', {
    subject,
    difficulty
  });
}

export { ai, templateModel };
