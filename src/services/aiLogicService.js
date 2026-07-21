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
 * Executes a server-side prompt template configured in Firebase Console.
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
 * Example helper function to generate custom study questions
 * using server-side prompt template 'question-generator-v1'.
 */
export async function generateStudyQuestions(subject = 'Database Security', difficulty = 'intermediate') {
  return executePromptTemplate('question-generator-v1', {
    subject,
    difficulty
  });
}

export { ai, templateModel };
