import { generativeModel } from '../firebase';

export class AIInterviewerService {
  constructor(topic) {
    this.topic = topic;
    this.chatSession = null;
  }

  async startInterview() {
    if (!generativeModel) {
      throw new Error("Generative AI model is not initialized. Check Firebase config.");
    }

    const systemInstruction = `You are a strict but encouraging Senior Mechanical Engineering Interviewer. 
Your goal is to conduct a mock interview with the user on the topic: ${this.topic}.
You will ask one technical question at a time. The user will answer using voice dictation (STT).
After the user answers, you must evaluate their response, provide a score out of 10, give short constructive feedback, and ask the next follow-up question.
Keep your spoken responses (feedback and question) concise because they will be read aloud by a Text-to-Speech engine.
ALWAYS respond in valid JSON format matching this schema:
{
  "feedback": "Your evaluation of the user's answer. Be concise and constructive.",
  "score": 8,
  "nextQuestion": "The next question you want to ask.",
  "isInterviewComplete": false
}`;

    this.chatSession = generativeModel.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemInstruction }]
        },
        {
          role: "model",
          parts: [{ text: "Understood. I will act as the interviewer and respond strictly in JSON." }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    // Start with the first question
    return this.sendAnswer("Hello, I am ready to start the interview.");
  }

  async sendAnswer(answerText) {
    if (!this.chatSession) {
      throw new Error("Chat session not started.");
    }

    try {
      const result = await this.chatSession.sendMessage(answerText);
      const responseText = result.response.text();
      return JSON.parse(responseText);
    } catch (error) {
      console.error("AI Interviewer Error:", error);
      throw error;
    }
  }
}
