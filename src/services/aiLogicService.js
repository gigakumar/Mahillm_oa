import { getAI, getGenerativeModel, getTemplateGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { app, db } from '../firebase';

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
 * Generates text output for a raw text prompt using getGenerativeModel and gemini-3.5-flash.
 * 
 * @param {string} prompt - Raw prompt text
 * @param {string} modelName - Model name (default: 'gemini-3.5-flash')
 * @returns {Promise<string>} Generated text output
 */
export async function generateRawTextPrompt(prompt, modelName = 'gemini-3.5-flash') {
  if (!ai) {
    throw new Error("Firebase AI Logic service is not initialized.");
  }

  try {
    const generativeModel = getGenerativeModel(ai, { model: modelName });
    const result = await generativeModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI Logic Raw Prompt Execution Error:", error);
    throw error;
  }
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
 * Starts a stateful multi-turn clarification chat session with the AI tutor template.
 */
export function startTutorChatSession(initialHistory = []) {
  if (!templateModel) {
    throw new Error("Firebase AI Logic model is not initialized.");
  }
  
  return templateModel.startChat({
    history: initialHistory
  });
}

/**
 * Sends a follow-up clarification message to an active tutor chat session with real-time streaming.
 */
export async function sendTutorChatMessageStream(chatSession, userMessage, onChunk = null, onFirstChunk = null) {
  try {
    if (!chatSession || typeof chatSession.sendMessageStream !== 'function') {
      throw new Error("Invalid active chat session.");
    }

    const result = await chatSession.sendMessageStream(userMessage);

    let fullResponse = '';
    let isFirst = true;

    for await (const chunk of result.stream) {
      if (isFirst && typeof onFirstChunk === 'function') {
        isFirst = false;
        onFirstChunk();
      }

      const chunkText = chunk.text();
      fullResponse += chunkText;
      if (typeof onChunk === 'function') {
        onChunk(chunkText, fullResponse);
      }
    }

    return fullResponse;
  } catch (error) {
    console.warn("AI Chat Streaming fallback engaged:", error?.message || error);
    if (typeof onFirstChunk === 'function') onFirstChunk();
    const fallbackText = `💡 **Step-by-Step AI Guidance:**\n1. Read the problem statement and list known variables.\n2. Identify the primary governing equation.\n3. Substitute numerical values, check unit dimensions, and simplify step-by-step.`;
    return simulateStreamFallback(fallbackText, onChunk);
  }
}

/**
 * Firestore Caching Tutor Strategy
 */
export async function streamCachedTutorHint(questionId, questionData, hintNumber = 1, onChunk = null) {
  const cacheDocId = `hint_${hintNumber}`;
  
  if (db && questionId) {
    try {
      const cacheRef = doc(db, 'questions', String(questionId), 'cachedHints', cacheDocId);
      const cacheSnap = await getDoc(cacheRef);
      if (cacheSnap.exists() && cacheSnap.data()?.hintText) {
        const cachedText = cacheSnap.data().hintText;
        return await simulateStreamFallback(cachedText, onChunk);
      }
    } catch (cacheErr) {
      console.warn("Firestore hint cache read skipped/failed:", cacheErr);
    }
  }

  const templateParams = {
    question: questionData.text || questionData.question || '',
    correctAnswer: String(questionData.correctAnswer ?? questionData.correct ?? ''),
    hintNumber: hintNumber
  };

  let generatedHint = '';
  try {
    generatedHint = await executePromptTemplateStream('tutor-hint', templateParams, onChunk);
  } catch (err) {
    const fallbackText = `💡 **Tutor Hint #${hintNumber}:** Re-read the question carefully: "${templateParams.question}". Focus on the fundamental definitions and key assumptions before picking an option.`;
    generatedHint = await simulateStreamFallback(fallbackText, onChunk);
  }

  if (db && questionId && generatedHint) {
    try {
      const cacheRef = doc(db, 'questions', String(questionId), 'cachedHints', cacheDocId);
      await setDoc(cacheRef, {
        hintText: generatedHint,
        hintNumber: hintNumber,
        cachedAt: Date.now()
      }, { merge: true });
    } catch (saveErr) {
      console.warn("Failed to cache generated hint to Firestore:", saveErr);
    }
  }

  return generatedHint;
}

/**
 * 1. Instant Explanations for Mistakes
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
    const fallbackText = `**Analysis of Selected Option:** You chose option (${userAnswer}). In ${params.subject}, this commonly occurs when confusing boundary conditions or sign conventions. **Key Correction:** Review the governing formula and verify unit dimensions before calculating the final value.`;
    return simulateStreamFallback(fallbackText, onChunk);
  }
}

/**
 * 2. Contextual Hint Generation
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
    await new Promise(r => setTimeout(r, 20));
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
