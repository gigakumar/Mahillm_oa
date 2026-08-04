import { callGeminiApiStream } from '../services/aiLogicService';

export class AIInterviewerService {
  constructor(topic) {
    this.topic = topic;
    this.history = [];
    this.systemInstruction = `You are a strict but encouraging Senior Mechanical Engineering Interviewer. 
Your goal is to conduct a mock interview with the user on the topic: ${topic}.
You will ask one technical question at a time. The user will answer.
After the user answers, you must evaluate their response, provide a score out of 10, give short constructive feedback, and ask the next follow-up question.
Keep your spoken responses (feedback and question) concise because they will be read aloud by a Text-to-Speech engine.
ALWAYS respond in valid JSON format matching this schema:
{
  "feedback": "Your evaluation of the user's answer. Be concise and constructive.",
  "score": 8,
  "nextQuestion": "The next question you want to ask.",
  "isInterviewComplete": false
}`;
  }

  async startInterview() {
    this.history = [];
    return this.sendAnswer("Hello, I am ready to start the interview.");
  }

  async sendAnswer(answerText) {
    // Build contents array for multi-turn conversation
    const contents = [];

    // Add conversation history
    for (const msg of this.history) {
      contents.push({
        role: msg.role,
        parts: [{ text: msg.text }]
      });
    }

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: answerText }]
    });

    try {
      const responseText = await callGeminiApiStream(
        contents,
        this.systemInstruction
      );

      // Store history for multi-turn
      this.history.push({ role: 'user', text: answerText });
      this.history.push({ role: 'model', text: responseText });

      // Parse JSON response — handle markdown code fences if present
      let cleaned = responseText.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      }

      try {
        return JSON.parse(cleaned);
      } catch (parseErr) {
        // Try to extract JSON from the response text
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        // If all parsing fails, construct a reasonable response
        return {
          feedback: '',
          score: null,
          nextQuestion: responseText,
          isInterviewComplete: false
        };
      }
    } catch (error) {
      console.error("AI Interviewer Error:", error);
      throw error;
    }
  }
}
