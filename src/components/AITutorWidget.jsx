import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Lightbulb, 
  HelpCircle, 
  RefreshCw, 
  Send, 
  MessageSquare
} from 'lucide-react';
import { 
  streamCachedTutorHint, 
  streamAnswerExplanation, 
  startTutorChatSession,
  sendTutorChatMessageStream 
} from '../services/aiLogicService';
import MathRenderer from './MathRenderer';

export default function AITutorWidget({ question, userAnswer = null, questionId = null }) {
  if (!question) return null;

  const [activeTab, setActiveTab] = useState(null); // 'hint' | 'explanation' | 'chat'
  const [isThinking, setIsThinking] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  
  // Chat session state
  const [chatSession, setChatSession] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory, isThinking, streamedText]);

  const handleGetHint = async () => {
    setActiveTab('hint');
    setIsThinking(true);
    setStreamedText('');

    try {
      const fullText = await streamCachedTutorHint(
        questionId || question?.id || question?.questionId,
        {
          text: question?.question || question?.text,
          correctAnswer: question?.correctAnswer ?? question?.correct ?? '',
          options: question?.options
        },
        1,
        (chunkText, fullText) => {
          setIsThinking(false);
          setStreamedText(fullText);
        }
      );
      setStreamedText(fullText);
    } catch (err) {
      setIsThinking(false);
    }
  };

  const handleExplainMistake = async () => {
    setActiveTab('explanation');
    setIsThinking(true);
    setStreamedText('');

    try {
      const fullText = await streamAnswerExplanation(
        question,
        userAnswer || 'Selected Option',
        (chunkText, fullText) => {
          setIsThinking(false);
          setStreamedText(fullText);
        }
      );
      setStreamedText(fullText);
    } catch (err) {
      setIsThinking(false);
    }
  };

  const handleStartChat = () => {
    setActiveTab('chat');
    if (!chatHistory || chatHistory.length === 0) {
      setChatHistory([
        { role: 'model', text: "Hello! I am your AI Technical Tutor. Ask me any follow-up question or clarification about this problem!" }
      ]);
    }
    const session = startTutorChatSession([
      { role: 'user', parts: [{ text: `Question: ${question?.question || question?.text}` }] },
      { role: 'model', parts: [{ text: "Hello! I am your AI Technical Tutor. Ask me any follow-up question or clarification about this problem!" }] }
    ]);
    setChatSession({ ...session, question });
  };

  const handleSendChatMessage = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatInput('');

    const currentHistory = [...chatHistory, { role: 'user', text: userText }];
    setChatHistory([...currentHistory, { role: 'model', text: 'Thinking...', isStreaming: true }]);
    setIsThinking(true);

    const activeSession = {
      ...(chatSession || {}),
      question,
      history: currentHistory
    };

    try {
      const fullText = await sendTutorChatMessageStream(
        activeSession,
        userText,
        (chunkText, fullResponse) => {
          setIsThinking(false);
          setChatHistory(prev => {
            const next = [...prev];
            const lastIdx = next.length - 1;
            if (lastIdx >= 0) {
              next[lastIdx] = { role: 'model', text: fullResponse, isStreaming: false };
            }
            return next;
          });
        },
        () => setIsThinking(false)
      );

      setIsThinking(false);
      setChatHistory(prev => {
        const next = [...prev];
        const lastIdx = next.length - 1;
        if (lastIdx >= 0) {
          next[lastIdx] = { role: 'model', text: fullText, isStreaming: false };
        }
        return next;
      });
    } catch (err) {
      setIsThinking(false);
    }
  };

  return (
    <div className="card" style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(99, 102, 241, 0.35)', borderRadius: '12px', padding: '1.25rem', marginTop: '1.25rem', color: '#fff' }}>
      {/* Widget Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', color: '#818cf8', fontSize: '1rem' }}>
          <Sparkles size={18} className="text-amber-400" />
          <span>AI Tutor & Real-Time Hint Assistant</span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            className={`btn btn-sm ${activeTab === 'hint' ? 'btn-primary' : ''}`}
            onClick={handleGetHint}
            style={{ 
              fontSize: '0.85rem', 
              padding: '0.4rem 0.85rem', 
              gap: '0.35rem',
              borderRadius: '8px',
              background: activeTab === 'hint' ? '#2563eb' : 'rgba(255, 255, 255, 0.08)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontWeight: '600'
            }}
          >
            <Lightbulb size={15} className="text-amber-400" /> Get Step Hint
          </button>

          {userAnswer !== null && (
            <button 
              className={`btn btn-sm ${activeTab === 'explanation' ? 'btn-primary' : ''}`}
              onClick={handleExplainMistake}
              style={{ 
                fontSize: '0.85rem', 
                padding: '0.4rem 0.85rem', 
                gap: '0.35rem',
                borderRadius: '8px',
                background: activeTab === 'explanation' ? '#2563eb' : 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontWeight: '600'
              }}
            >
              <HelpCircle size={15} className="text-rose-400" /> Explain Choice
            </button>
          )}

          <button 
            className={`btn btn-sm ${activeTab === 'chat' ? 'btn-warning' : ''}`}
            onClick={handleStartChat}
            style={{ 
              fontSize: '0.85rem', 
              padding: '0.4rem 0.85rem', 
              gap: '0.35rem',
              borderRadius: '8px',
              background: activeTab === 'chat' ? '#ea580c' : 'rgba(255, 255, 255, 0.08)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontWeight: '600'
            }}
          >
            <MessageSquare size={15} /> Clarification Chat
          </button>
        </div>
      </div>

      {/* Thinking Skeleton State */}
      {isThinking && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 0', color: '#fbbf24', fontSize: '0.875rem' }}>
          <RefreshCw size={16} className="animate-spin text-amber-400" />
          <span>AI Tutor is thinking and generating response...</span>
        </div>
      )}

      {/* Single Hint or Explanation Stream Output */}
      {activeTab && activeTab !== 'chat' && streamedText && (
        <div style={{ marginTop: '0.85rem', background: 'rgba(30, 41, 59, 0.75)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '0.9rem 1.1rem', fontSize: '0.92rem', lineHeight: '1.6', color: '#f1f5f9' }}>
          <MathRenderer text={streamedText} />
        </div>
      )}

      {/* Multi-Turn Clarification Chat Session */}
      {activeTab === 'chat' && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div 
            ref={chatScrollRef}
            style={{ 
              maxHeight: '260px', 
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.65rem', 
              background: 'rgba(10, 15, 30, 0.85)', 
              padding: '0.85rem', 
              borderRadius: '8px', 
              border: '1px solid rgba(255, 255, 255, 0.1)' 
            }}
          >
            {chatHistory.map((msg, idx) => (
              <div 
                key={idx} 
                style={{ 
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', 
                  background: msg.role === 'user' ? '#2e2b5f' : 'rgba(30, 41, 59, 0.95)', 
                  border: msg.role === 'user' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '0.65rem 0.85rem', 
                  borderRadius: '10px', 
                  maxWidth: '85%', 
                  fontSize: '0.88rem',
                  color: '#fff'
                }}
              >
                <strong style={{ color: msg.role === 'user' ? '#a5b4fc' : '#34d399', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>
                  {msg.role === 'user' ? 'You' : 'AI Tutor'}
                </strong>
                <MathRenderer text={msg.text} />
              </div>
            ))}
          </div>

          <form onSubmit={handleSendChatMessage} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="Ask AI Tutor for clarification..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              style={{ 
                flex: 1, 
                background: 'rgba(10, 15, 30, 0.95)', 
                border: '1.5px solid #2563eb', 
                borderRadius: '8px', 
                padding: '0.65rem 0.9rem', 
                color: '#fff', 
                fontSize: '0.88rem',
                outline: 'none'
              }}
            />
            <button 
              type="submit" 
              className="btn btn-sm" 
              disabled={isThinking || !chatInput.trim()}
              style={{
                background: '#ea580c',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.65rem 1rem',
                cursor: isThinking || !chatInput.trim() ? 'not-allowed' : 'pointer',
                opacity: isThinking || !chatInput.trim() ? 0.6 : 1
              }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

