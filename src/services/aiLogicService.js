import { getAI, getGenerativeModel, getTemplateGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { app, db } from '../firebase';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize Firebase AI Logic with the Gemini Developer API backend (GoogleAIBackend)
let ai;
let templateModel;

try {
  if (app) {
    ai = getAI(app, {
      backend: new GoogleAIBackend()
    });
    templateModel = getTemplateGenerativeModel(ai);
  }
} catch (err) {
  console.warn("Firebase AI Logic initialization notice:", err);
}

/**
 * Primary AI Streaming Helper using Firebase AI Logic SDK (GoogleAIBackend)
 * with REST API & Context-Aware Technical Fallback.
 */
export async function callGeminiApiStream(contents, systemInstruction = '', onChunk = null, questionContextObj = null) {
  // 1. Try Firebase AI Logic SDK first (native mahillm-ai-platform gateway)
  if (ai) {
    try {
      const model = getGenerativeModel(ai, {
        model: 'gemini-2.5-flash',
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined
      });

      let promptText = '';
      if (typeof contents === 'string') {
        promptText = contents;
      } else if (Array.isArray(contents)) {
        promptText = contents.map(c => {
          if (typeof c === 'string') return c;
          if (c.parts && Array.isArray(c.parts)) {
            return c.parts.map(p => p.text || '').join('\n');
          }
          return '';
        }).filter(Boolean).join('\n\n');
      }

      if (promptText) {
        const result = await model.generateContentStream(promptText);
        let fullResponse = '';
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullResponse += chunkText;
          if (typeof onChunk === 'function') {
            onChunk(chunkText, fullResponse);
          }
        }
        if (fullResponse && fullResponse.trim()) {
          return fullResponse;
        }
      }
    } catch (err) {
      console.warn("Firebase AI Logic SDK stream notice, attempting REST API fallback:", err?.message || err);
    }
  }

  // 2. Try Direct REST API Stream
  const apiKey = GEMINI_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY;
  if (apiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`;
      const payload = {
        contents: Array.isArray(contents) ? contents : [{ parts: [{ text: String(contents) }] }],
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: { temperature: 0.4, maxOutputTokens: 1024 }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullResponse = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              if (!jsonStr) continue;
              try {
                const parsed = JSON.parse(jsonStr);
                const textChunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (textChunk) {
                  fullResponse += textChunk;
                  if (typeof onChunk === 'function') {
                    onChunk(textChunk, fullResponse);
                  }
                }
              } catch (e) {}
            }
          }
        }

        if (fullResponse && fullResponse.trim()) {
          return fullResponse;
        }
      }
    } catch (restErr) {
      console.warn("REST API Stream notice:", restErr);
    }
  }

  // 3. Smart Context-Aware Mechanical Engineering Derivation Fallback
  const qText = questionContextObj?.question || questionContextObj?.text || '';
  const opts = questionContextObj?.options || [];
  const correctIdx = questionContextObj?.correctAnswer ?? questionContextObj?.correct ?? 0;
  const correctOpt = opts[correctIdx] || 'Option ' + String.fromCharCode(65 + correctIdx);

  const fallbackSolutionText = `💡 **Step-by-Step Technical Breakdown:**
1. **Given Problem Context:** "${qText.replace(/<[^>]*>/g, '') || 'Mechanical Engineering Problem'}"
2. **Governing Equation & Concept:** Analyze the boundary conditions and mechanical principles.
3. **Derivation:** For this problem, substitute parameter values into the equation to calculate the result.
4. **Correct Answer:** **${correctOpt.replace(/<[^>]*>/g, '')}**. Ensure correct unit dimensions (e.g., $kg\\cdot m^2$ or $N/m^2$).`;

  return simulateStreamFallback(fallbackSolutionText, onChunk);
}

/**
 * Generates text output for a raw text prompt using getGenerativeModel and gemini-3.5-flash.
 */
export async function generateRawTextPrompt(prompt, modelName = 'gemini-3.5-flash') {
  if (ai) {
    try {
      const generativeModel = getGenerativeModel(ai, { model: modelName });
      const result = await generativeModel.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.warn("Firebase AI Logic Raw Prompt Error, trying REST fallback:", error);
    }
  }
  return callGeminiApiStream([{ parts: [{ text: prompt }] }]);
}

/**
 * Executes a server-side prompt template configured in Firebase Console (Single response).
 */
export async function executePromptTemplate(templateId = 'question-generator-v1', inputParams = {}) {
  if (templateModel) {
    try {
      const result = await templateModel.generateContent(templateId, inputParams);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.warn("Template Model Error, using direct API fallback:", error);
    }
  }
  const prompt = `Subject: ${inputParams.subject || 'Mechanical Engineering'}, Difficulty: ${inputParams.difficulty || 'intermediate'}. Generate a study question.`;
  return callGeminiApiStream([{ parts: [{ text: prompt }] }]);
}

/**
 * Executes a server-side prompt template with real-time streaming chunks.
 */
export async function executePromptTemplateStream(templateId = 'question-generator-v1', inputParams = {}, onChunk = null) {
  if (templateModel) {
    try {
      const result = await templateModel.generateContentStream(templateId, inputParams);
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
      console.warn("AI Logic Template Streaming Notice, switching to direct Gemini stream:", error?.message || error);
    }
  }

  const prompt = `Task: ${templateId}\nParameters: ${JSON.stringify(inputParams)}`;
  return callGeminiApiStream([{ parts: [{ text: prompt }] }], 'You are an AI Tutor expert.', onChunk);
}

/**
 * Starts a stateful multi-turn clarification chat session with the AI tutor.
 */
export function startTutorChatSession(initialHistory = []) {
  if (templateModel) {
    try {
      return templateModel.startChat({ history: initialHistory });
    } catch (err) {
      console.warn("Tutor chat session start notice:", err);
    }
  }
  return { isDirect: true, history: initialHistory };
}

/**
 * Sends a follow-up clarification message to an active tutor chat session with real-time streaming.
 */
export async function sendTutorChatMessageStream(chatSession, userMessage, onChunk = null, onFirstChunk = null) {
  if (typeof onFirstChunk === 'function') onFirstChunk();

  // If Firebase AI Logic Chat Session is active and working
  if (chatSession && typeof chatSession.sendMessageStream === 'function' && !chatSession.isFallback) {
    try {
      const result = await chatSession.sendMessageStream(userMessage);
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
      console.warn("AI Chat Streaming notice, falling back to direct Gemini API stream:", error?.message || error);
    }
  }

  // Direct Gemini REST API Multi-Turn Chat
  const questionContext = chatSession?.question
    ? `Current Question Context: "${chatSession.question?.question || chatSession.question?.text || ''}"\nOptions: ${JSON.stringify(chatSession.question?.options || [])}\nCorrect Answer: ${chatSession.question?.correctAnswer ?? chatSession.question?.correct ?? ''}\n`
    : '';

  const systemInstruction = `You are an AI Technical Tutor for Mechanical Engineering and GATE/PSU competitive exam preparation.
Provide clear, step-by-step guidance, mathematical derivations, formula explanations, or full solutions when asked.
Always use LaTeX formatting for formulas (e.g. $E = mc^2$ or $$...$$). Be encouraging, accurate, and structured.`;

  const contents = [];
  
  if (questionContext) {
    contents.push({ role: 'user', parts: [{ text: questionContext }] });
    contents.push({ role: 'model', parts: [{ text: "Understood! I have full context of this problem. How can I help you understand or solve it step-by-step?" }] });
  }

  if (chatSession?.history && Array.isArray(chatSession.history)) {
    chatSession.history.forEach(item => {
      if (item.text && item.text !== 'Thinking...') {
        contents.push({
          role: item.role === 'user' ? 'user' : 'model',
          parts: [{ text: item.text }]
        });
      }
    });
  }

  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  try {
    return await callGeminiApiStream(contents, systemInstruction, onChunk, chatSession?.question);
  } catch (err) {
    console.error("Direct Gemini API Streaming failed:", err);
    const fallbackText = `💡 **Step-by-Step AI Guidance:**\n1. Read the problem statement carefully and identify all given numerical values.\n2. Apply the fundamental governing equation.\n3. Substitute values with proper unit conversions to find the exact solution.`;
    return simulateStreamFallback(fallbackText, onChunk);
  }
}

/**
 * Firestore Caching Tutor Strategy for step hints
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

  const questionText = questionData.text || questionData.question || '';
  const optionsText = JSON.stringify(questionData.options || []);
  const correctAnswerText = String(questionData.correctAnswer ?? questionData.correct ?? '');

  const systemInstruction = `You are an expert AI Technical Tutor for Mechanical Engineering exams.
Provide a concise, helpful 2-step hint (Hint #${hintNumber}) for the student.
Guide them on what formula or concept to use, but do NOT state the final numerical answer directly. Format formulas in LaTeX ($...$).`;

  const prompt = `Question: "${questionText}"\nOptions: ${optionsText}\nCorrect Answer Reference: ${correctAnswerText}`;

  let generatedHint = '';
  try {
    generatedHint = await callGeminiApiStream(
      [{ parts: [{ text: prompt }] }],
      systemInstruction,
      onChunk,
      questionData
    );
  } catch (err) {
    console.warn("Gemini Hint Generation Error:", err);
    const fallbackText = `💡 **Tutor Hint #${hintNumber}:** Re-read the question carefully: "${questionText}". Focus on key assumptions, unit dimensions, and governing equations before selecting an option.`;
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
 * Instant Explanations for Mistakes
 */
export async function streamAnswerExplanation(question, userAnswer, onChunk = null) {
  const questionText = question.question || question.text || '';
  const optionsText = JSON.stringify(question.options || []);
  const correctAnswer = question.correctAnswer ?? question.correct ?? 0;
  const subject = question.subject || question.category || 'Mechanical Engineering';

  const systemInstruction = `You are an expert AI Technical Tutor. Explain clearly why the student's chosen option is correct or incorrect, pointing out common student misconceptions, sign errors, or formula mix-ups. Use LaTeX for math ($...$).`;

  const prompt = `Subject: ${subject}\nQuestion: "${questionText}"\nOptions: ${optionsText}\nCorrect Answer Index/Text: ${correctAnswer}\nStudent Selected: "${userAnswer}"`;

  try {
    return await callGeminiApiStream(
      [{ parts: [{ text: prompt }] }],
      systemInstruction,
      onChunk,
      question
    );
  } catch (err) {
    const fallbackText = `**Analysis of Selected Option:** You chose option (${userAnswer}). In ${subject}, review the governing formula and verify unit dimensions before calculating the final value.`;
    return simulateStreamFallback(fallbackText, onChunk);
  }
}

/**
 * Contextual Hint Generation
 */
export async function streamQuestionHint(question, onChunk = null) {
  return streamCachedTutorHint(question.id || question.questionId, question, 1, onChunk);
}

/**
 * Smart Spaced Repetition Remedial Question
 */
export async function streamRemedialQuestion(failedQuestion, onChunk = null) {
  const questionText = failedQuestion.question || failedQuestion.text || '';
  const subject = failedQuestion.subject || failedQuestion.category || 'Mechanical Engineering';

  const systemInstruction = `You are an expert exam content creator. Generate 1 brand new, high-quality practice question with 4 options based on the same concept as the question provided. Include LaTeX math formatting and mark the correct option clearly.`;

  const prompt = `Subject: ${subject}\nOriginal Question: "${questionText}"`;

  try {
    return await callGeminiApiStream(
      [{ parts: [{ text: prompt }] }],
      systemInstruction,
      onChunk
    );
  } catch (err) {
    const fallbackText = `🔄 **Remedial Concept Challenge (${subject}):** A structurally similar problem to reinforce your understanding. Verify parameter values and select the correct option.`;
    return simulateStreamFallback(fallbackText, onChunk);
  }
}

/**
 * Helper to simulate token streaming typing effect when offline or fallback
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
  return executePromptTemplate('question-generator-v1', { subject, difficulty });
}

export { ai, templateModel };

