import { useState, useEffect, useRef } from 'react';
import { Mic, Square, ChevronLeft, ChevronRight, Lightbulb, MessageSquare, Sparkles, Volume2, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { getSpeechSupportTier, evaluateVivaAnswer } from '../utils/voiceCoachEngine';
import './MockInterview.css';

const QUESTIONS = {
  Technical: [
    { q: "Explain the difference between a two-stroke and a four-stroke engine.", tips: ["stroke", "revolution", "efficiency", "emissions", "power"] },
    { q: "What is the significance of Mohr's Circle in stress analysis?", tips: ["principal", "shear", "stress", "graphical", "plane"] },
    { q: "Describe the working principle of a centrifugal pump.", tips: ["impeller", "head", "kinetic", "pressure", "priming"] },
    { q: "What are the differences between a Carnot cycle and a Rankine cycle?", tips: ["carnot", "rankine", "steam", "ideal", "efficiency"] },
    { q: "Explain the concept of factor of safety in machine design.", tips: ["yield", "ultimate", "safety", "stress", "load"] }
  ],
  Behavioral: [
    { q: "Tell me about a time you worked under a tight deadline to complete a project.", tips: ["deadline", "project", "time", "result", "priority"] },
    { q: "Describe a situation where you had to resolve a conflict within your team.", tips: ["team", "communication", "resolution", "conflict", "listen"] }
  ],
  HR: [
    { q: "Tell me about yourself and your career goals in mechanical engineering.", tips: ["background", "projects", "engineering", "goals", "skills"] }
  ]
};

import PremiumGate from '../components/PremiumGate';

export default function MockInterview() {
  const [tab, setTab] = useState('Technical');
  const [idx, setIdx] = useState(0);
  const [showTips, setShowTips] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const recognitionRef = useRef(null);
  const list = QUESTIONS[tab];
  const item = list[idx];
  const tabs = Object.keys(QUESTIONS);

  const supportTier = getSpeechSupportTier();

  // Initialize SpeechRecognition API
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
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startRecording = () => {
    setTranscript('');
    setFeedback(null);
    setIsRecording(true);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Error starting speech recognition:", e);
      }
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Error stopping speech recognition:", e);
      }
    }

    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      const evalRes = evaluateVivaAnswer({
        transcript,
        targetKeywords: item.tips,
        expectedMinWords: 20
      });
      setFeedback(evalRes);
    }, 1200);
  };

  const goTo = (i) => {
    setIdx(i);
    setShowTips(false);
    setIsRecording(false);
    setTranscript('');
    setFeedback(null);
  };

  return (
    <div className="page-content mock-interview">
      <header className="mi-header">
        <div>
          <h1>AI Voice Viva & Technical Interview Coach 🎙️</h1>
          <p className="practice-subtitle">Practice answering out loud. Speech recognition analyzes your clarity, depth, and technical keyword coverage.</p>
        </div>
      </header>

      <PremiumGate 
        featureId="mock_interview" 
        requiredTier="pro"
        title="Unlock AI Voice Viva & Technical Interviewer"
        subtitle="Real-time speech evaluation, keyword coverage diagnostics, and PSU viva simulation."
      >

      {/* Tabs */}
      <div className="mi-tabs">
        {tabs.map((t) => (
          <button
            key={t}
            className={`mi-tab ${tab === t ? 'active' : ''}`}
            onClick={() => { setTab(t); goTo(0); }}
          >
            {t === 'Technical' ? '⚙️' : t === 'Behavioral' ? '🧠' : '🤝'} {t}
          </button>
        ))}
      </div>

      {/* Question Card */}
      <div className="mi-card card">
        <div className="mi-counter">
          Question {idx + 1} of {list.length}
        </div>
        <h2 className="mi-question">{item.q}</h2>

        {/* Tips toggle */}
        <button className="btn btn-ghost tips-toggle" onClick={() => setShowTips(!showTips)}>
          <Lightbulb size={16} />
          {showTips ? 'Hide Target Keywords' : 'Show Target Keywords'}
        </button>

        {showTips && (
          <div className="tips-box">
            <h4>💡 Target Key Concepts to Cover:</h4>
            <ul>
              {item.tips.map((tip, i) => <li key={i}>{tip}</li>)}
            </ul>
          </div>
        )}

        {/* Recorder */}
        <div className="recorder">
          <div className={`recorder-status ${isRecording ? 'active' : ''}`}>
            <div className="rec-dot"></div>
            {isRecording ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span>Live Audio Viva active… Speak out loud</span>
                <div className="wave">
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                </div>
              </div>
            ) : 'Tap start to answer via voice microphone'}
          </div>

          {!isRecording ? (
            <button className="rec-btn start" onClick={startRecording}>
              <Mic size={22} /> Start Voice Practice
            </button>
          ) : (
            <button className="rec-btn stop" onClick={stopRecording}>
              <Square size={22} /> Stop & Evaluate
            </button>
          )}
        </div>

        {/* Live Speech Transcript Box */}
        {transcript && (
          <div className="transcript-live-box">
            <h4><Volume2 size={16} className="text-indigo-400 inline mr-1" /> Speech Transcript:</h4>
            <p className="transcript-text">"{transcript}"</p>
          </div>
        )}

        {/* Analyzing Spinner */}
        {analyzing && (
          <div className="ai-evaluating-box">
            <RefreshCw size={20} className="animate-spin text-amber-400" />
            <span>AI analyzing technical vocabulary & concept coverage...</span>
          </div>
        )}

        {/* Feedback Display */}
        {feedback && !analyzing && (
          <div className="viva-feedback-card">
            <div className="feedback-header">
              <Sparkles size={18} className="text-amber-400" />
              <h3>AI Voice Viva Analysis</h3>
            </div>
            
            <div className="feedback-stats">
              <div className="fb-stat">
                <span className="label">Evaluation Band</span>
                <strong className={`val ${feedback.band === 'strong' ? 'text-emerald-400' : feedback.band === 'developing' ? 'text-amber-400' : 'text-rose-400'}`}>
                  {feedback.band === 'strong' ? 'STRONG ANSWER ✅' : feedback.band === 'developing' ? 'DEVELOPING ⚠️' : 'NEEDS WORK 🔴'}
                </strong>
              </div>
              <div className="fb-stat">
                <span className="label">Word Count</span>
                <strong className="val">{feedback.wordCount} words</strong>
              </div>
              <div className="fb-stat">
                <span className="label">Matched Keywords</span>
                <strong className="val text-indigo-400">{feedback.keywordsFound.length} / {item.tips.length}</strong>
              </div>
            </div>

            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Keywords Detected in Transcript:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {feedback.keywordsFound.map((kw, i) => (
                  <span key={i} className="badge badge-success" style={{ fontSize: '0.75rem' }}>✓ {kw}</span>
                ))}
                {feedback.keywordsMissing.map((kw, i) => (
                  <span key={i} className="badge badge-secondary" style={{ fontSize: '0.75rem', opacity: 0.6 }}>missing: {kw}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mi-nav">
          <button className="btn btn-ghost" onClick={() => goTo(Math.max(0, idx - 1))} disabled={idx === 0}>
            <ChevronLeft size={16} /> Previous
          </button>
          <button className="btn btn-primary" onClick={() => goTo(Math.min(list.length - 1, idx + 1))} disabled={idx === list.length - 1}>
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>
      </PremiumGate>
    </div>
  );
}

