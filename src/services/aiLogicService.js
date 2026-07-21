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
 * 
 * @param {string} templateId - Template ID defined in Firebase Console (e.g., 'question-generator-v1')
 * @param {object} inputParams - Input variables for the template (e.g., { subject, difficulty })
 * @returns {Promise<string>} Generated text response
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
 * 
 * @param {string} templateId - Template ID in Firebase Console (e.g. 'question-generator-v1')
 * @param {object} inputParams - Input parameters (e.g. { subject, difficulty })
 * @param {function} onChunk - Callback receiving (chunkText, compiledFullText) as tokens arrive
 * @returns {Promise<string>} Compiled full response
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
 * Stream study questions in real-time chunk-by-chunk using 'question-generator-v1'.
 */
export async function streamStudyQuestions(subject = 'Database Security', difficulty = 'intermediate', onChunk = null) {
  return executePromptTemplateStream('question-generator-v1', { subject, difficulty }, onChunk);
}

/**
 * Example helper function to generate custom study questions (non-streaming)
 */
export async function generateStudyQuestions(subject = 'Database Security', difficulty = 'intermediate') {
  return executePromptTemplate('question-generator-v1', {
    subject,
    difficulty
  });
}

export { ai, templateModel };
