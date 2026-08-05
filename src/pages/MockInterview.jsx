import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Sparkles, Volume2, VolumeX, MessageSquare, RefreshCw, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import { callGeminiApiStream } from '../services/aiLogicService';
import './MockInterview.css';

const INTERVIEW_TOPICS = [
  'Thermodynamics & Thermal Power',
  'Strength of Materials & Machine Design',
  'Fluid Mechanics & Turbo-Machinery',
  'Manufacturing & Material Science',
  'Heat & Mass Transfer',
  'PSU & General Technical HR'
];

export default function MockInterview() {
  const [topic, setTopic] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [textInput, setTextInput] = useState('');
  const hasSpeechRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const recognitionRef = useRef(null);
  const scrollRef = useRef(null);

  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript + ' ';
        }
        setTranscript(currentText);
      };

      recognition.onerror = (err) => {
        console.error("Speech recognition error:", err);
        setIsRecording(false);
      };
      
      
      recognitionRef.current = recognition;
    }
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation, transcript]);

  const speak = (text) => {
    if (!isTtsEnabled || !window.speechSynthesis) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const getSystemInstruction = (currentTopic) => `You are an expert technical interviewer conducting a mock interview on ${currentTopic}. 
Assess the candidate's answers and ask follow-up questions.
IMPORTANT: You MUST respond ONLY with a valid JSON object. No markdown formatting, no code blocks, just raw JSON.
Schema:
{
  "feedback": "Your feedback on their last answer (if any). Be constructive.",
  "score": <number 1-10 rating their answer>,
  "nextQuestion": "Your next interview question",
  "isInterviewComplete": <boolean>
}`;

  const startInterview = async (selectedTopic) => {
    setTopic(selectedTopic);
    setIsSessionActive(true);
    setConversation([]);
    setErrorMsg('');
    setIsAiThinking(true);
    
    try {
      const contents = [
        { role: 'user', parts: [{ text: `Hello, I'm ready to start the interview on ${selectedTopic}.` }] }
      ];
      const rawResponse = await callGeminiApiStream(contents, getSystemInstruction(selectedTopic));
      const jsonStr = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      
      if (jsonStr.startsWith('Fallback')) {
        throw new Error("AI is currently unavailable. Please verify your API key and network connection.");
      }
      
      const aiData = JSON.parse(jsonStr);
      handleAiResponse(aiData);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message && err.message.includes("AI is currently unavailable") ? err.message : "Failed to start AI session.");
      setIsSessionActive(false);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleAiResponse = (aiData) => {
    const aiMessage = {
      role: 'ai',
      text: aiData.nextQuestion,
      feedback: aiData.feedback,
      score: aiData.score
    };
    
    setConversation(prev => [...prev, aiMessage]);
    
    // Speak both feedback (if exists) and the next question
    let textToSpeak = "";
    if (aiData.feedback && aiData.feedback !== "N/A" && aiData.feedback.trim() !== "") {
      textToSpeak += aiData.feedback + ". ";
    }
    textToSpeak += aiData.nextQuestion;
    
    speak(textToSpeak);
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      // Start recording
      stopSpeaking();
      setTranscript('');
      setIsRecording(true);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const submitAnswer = async (overrideText) => {
    const answerText = overrideText || transcript.trim();
    if (!answerText) return;
    
    // Stop recording if active
    if (isRecording) {
      toggleRecording();
    }
    
    const userMessage = { role: 'user', text: answerText };
    setConversation(prev => [...prev, userMessage]);
    setTranscript('');
    setTextInput('');
    setIsAiThinking(true);
    
    try {
      const updatedConversation = [...conversation, userMessage];
      const contents = [
         { role: 'user', parts: [{ text: `Hello, I'm ready to start the interview on ${topic}.` }] }
      ];
      
      for (const msg of updatedConversation) {
        if (msg.role === 'user') {
          contents.push({ role: 'user', parts: [{ text: msg.text }] });
        } else if (msg.role === 'ai') {
          contents.push({ 
            role: 'model', 
            parts: [{ text: JSON.stringify({ feedback: msg.feedback, score: msg.score, nextQuestion: msg.text }) }] 
          });
        }
      }

      const rawResponse = await callGeminiApiStream(contents, getSystemInstruction(topic));
      const jsonStr = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const aiData = JSON.parse(jsonStr);
      
      handleAiResponse(aiData);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to process answer with AI.");
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (textInput.trim()) {
      submitAnswer(textInput.trim());
    }
  };

  const endInterview = () => {
    setIsSessionActive(false);
    stopSpeaking();
  };

  if (!isSessionActive) {
    return (
      <div className="page-content mock-interview setup-mode">
        <header className="mi-header">
          <h1>AI Voice Interviewer 🎙️</h1>
          <p className="practice-subtitle">Experience a real-time, adaptive technical interview powered by Gemini AI.</p>
        </header>

        {errorMsg && (
          <div className="error-banner">
            <AlertTriangle size={20} />
            {errorMsg}
          </div>
        )}

        <div className="setup-card card">
          <h2>Select Interview Topic</h2>
          <div className="topics-grid">
            {INTERVIEW_TOPICS.map(t => (
              <button 
                key={t} 
                className="topic-btn"
                onClick={() => startInterview(t)}
                disabled={isAiThinking}
              >
                {isAiThinking && topic === t ? <RefreshCw className="animate-spin inline" size={18}/> : <Sparkles size={18} className="text-indigo-400" />}
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content mock-interview active-mode">
      <header className="mi-header-active">
        <div className="header-info">
          <h2>Live Interview: <span className="text-indigo-400">{topic}</span></h2>
          <div className="status-badge pulse-active">Session Active</div>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost toggle-tts" onClick={() => setIsTtsEnabled(!isTtsEnabled)}>
            {isTtsEnabled ? <Volume2 size={20} /> : <VolumeX size={20} className="text-rose-400" />}
          </button>
          <button className="btn btn-outline-danger" onClick={endInterview}>End Interview</button>
        </div>
      </header>

      <div className="chat-arena" ref={scrollRef}>
        {conversation.map((msg, idx) => (
          <div key={idx} className={`chat-message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'ai' ? <Sparkles size={18} /> : 'U'}
            </div>
            <div className="message-content">
              {msg.role === 'ai' && msg.feedback && (
                <div className="ai-feedback-box">
                  <div className="feedback-score">Score: {msg.score}/10</div>
                  <p>{msg.feedback}</p>
                </div>
              )}
              <div className="text-bubble">
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        
        {/* Live Transcript Bubble */}
        {(isRecording || transcript) && (
          <div className="chat-message user live-typing">
            <div className="message-avatar">U</div>
            <div className="message-content">
              <div className="text-bubble live-bubble">
                {transcript}
                {isRecording && <span className="typing-cursor"></span>}
              </div>
            </div>
          </div>
        )}
        
        {/* AI Thinking Indicator */}
        {isAiThinking && (
          <div className="chat-message ai thinking">
            <div className="message-avatar"><Sparkles size={18} /></div>
            <div className="message-content">
              <div className="thinking-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="interview-controls card">
        <div className="control-bar">
          {hasSpeechRecognition && (
            <>
              <button 
                className={`btn-mic ${isRecording ? 'recording' : ''}`}
                onClick={toggleRecording}
                disabled={isAiThinking}
              >
                {isRecording ? <Square size={24} /> : <Mic size={24} />}
                {isRecording ? 'Stop Recording' : 'Hold to Speak'}
              </button>
              
              {(transcript.trim()) && (
                <button 
                  className="btn btn-primary submit-ans-btn"
                  onClick={() => submitAnswer()}
                  disabled={!transcript.trim() || isAiThinking}
                >
                  <Send size={18} /> Submit Answer
                </button>
              )}
            </>
          )}
        </div>

        {/* Text input fallback — always shown */}
        <form className="text-input-fallback" onSubmit={handleTextSubmit} style={{ display: 'flex', gap: '0.5rem', marginTop: hasSpeechRecognition ? '0.75rem' : '0', width: '100%' }}>
          <input
            type="text"
            className="input"
            placeholder={hasSpeechRecognition ? 'Or type your answer here...' : 'Type your answer here...'}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            disabled={isAiThinking}
            style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
          />
          <button 
            type="submit"
            className="btn btn-primary"
            disabled={!textInput.trim() || isAiThinking}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Send size={16} /> Send
          </button>
        </form>
        
        {isRecording && (
          <div className="recording-indicator">
            <div className="wave">
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
            </div>
            <span>Listening to your answer...</span>
          </div>
        )}
      </div>
    </div>
  );
}
