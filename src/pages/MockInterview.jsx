import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Sparkles, Volume2, VolumeX, MessageSquare, RefreshCw, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import { AIInterviewerService } from '../utils/aiInterviewerService';
import './MockInterview.css';

const INTERVIEW_TOPICS = ['Thermodynamics', 'Fluid Mechanics', 'Strength of Materials', 'Behavioral & HR'];

export default function MockInterview() {
  const [topic, setTopic] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const recognitionRef = useRef(null);
  const aiServiceRef = useRef(null);
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

  const startInterview = async (selectedTopic) => {
    setTopic(selectedTopic);
    setIsSessionActive(true);
    setConversation([]);
    setErrorMsg('');
    setIsAiThinking(true);
    
    try {
      aiServiceRef.current = new AIInterviewerService(selectedTopic);
      const initialResponse = await aiServiceRef.current.startInterview();
      
      handleAiResponse(initialResponse);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to start AI session. Ensure Firebase Vertex AI is configured.");
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

  const submitAnswer = async () => {
    if (!transcript.trim()) return;
    
    // Stop recording if active
    if (isRecording) {
      toggleRecording();
    }
    
    const userMessage = { role: 'user', text: transcript };
    setConversation(prev => [...prev, userMessage]);
    const answerText = transcript;
    setTranscript('');
    setIsAiThinking(true);
    
    try {
      const aiResponse = await aiServiceRef.current.sendAnswer(answerText);
      handleAiResponse(aiResponse);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to process answer with AI.");
    } finally {
      setIsAiThinking(false);
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
          <button 
            className={`btn-mic ${isRecording ? 'recording' : ''}`}
            onClick={toggleRecording}
            disabled={isAiThinking}
          >
            {isRecording ? <Square size={24} /> : <Mic size={24} />}
            {isRecording ? 'Stop Recording' : 'Hold to Speak'}
          </button>
          
          <button 
            className="btn btn-primary submit-ans-btn"
            onClick={submitAnswer}
            disabled={!transcript.trim() || isAiThinking}
          >
            <Send size={18} /> Submit Answer
          </button>
        </div>
        
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
