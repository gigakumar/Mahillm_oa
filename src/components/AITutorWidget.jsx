import React, { useState } from 'react';
import { 
  Sparkles, 
  Lightbulb, 
  HelpCircle, 
  RefreshCw, 
  Send, 
  CheckCircle, 
  AlertTriangle,
  MessageSquare,
  Bot
} from 'lucide-react';
import { 
  streamCachedTutorHint, 
  streamAnswerExplanation, 
  streamRemedialQuestion,
  startTutorChatSession,
  sendTutorChatMessageStream 
} from '../services/aiLogicService';
import MathRenderer from './MathRenderer';

export default function AITutorWidget({ question, userAnswer = null, questionId = null }) {
  if (!question) return null;

  const [activeTab, setActiveTab] = useState(null); // 'hint' | 'explanation' | 'chat' | 'remedial'
  const [isThinking, setIsThinking] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  
  // Chat session state
  const [chatSession, setChatSession] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');

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
    if (!chatSession) {
      try {
        const session = startTutorChatSession([
          { role: 'user', parts: [{ text: `Question: ${question?.question || question?.text}` }] },
          { role: 'model', parts: [{ text: "Hello! I am your AI Technical Tutor. Ask me any follow-up question or clarification about this problem!" }] }
        ]);
        setChatSession(session || { isFallback: true });
      } catch (err) {
        console.warn("Chat session setup:", err);
        setChatSession({ isFallback: true });
      }
    }
  };

  const handleSendChatMessage = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userText }, { role: 'model', text: 'Thinking...', isStreaming: true }]);
    setIsThinking(true);

    try {
      const fullText = await sendTutorChatMessageStream(
        chatSession,
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

      // Ensure final state is updated
      setIsThinking(false);
      setChatHistory(prev => {
        const next = [...prev];
        const lastIdx = next.length - 1;
        if (lastIdx >= 0 && next[lastIdx].text === 'Thinking...') {
          next[lastIdx] = { role: 'model', text: fullText, isStreaming: false };
        }
        return next;
      });
    } catch (err) {
      setIsThinking(false);
    }
  };

  return (
    <div className="card" style={{ background: 'rgba(30, 41, 59, 0.85)', border: '1px solid rgba(99, 102, 241, 0.35)', borderRadius: '12px', padding: '1rem 1.25rem', marginTop: '1.25rem' }}>
      {/* Widget Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', color: '#818cf8', fontSize: '0.95rem' }}>
          <Sparkles size={18} className="text-amber-400" />
          <span>AI Tutor & Real-Time Hint Assistant</span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            className={`btn btn-sm ${activeTab === 'hint' ? 'btn-primary' : 'btn-outline'}`}
            onClick={handleGetHint}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', gap: '0.35rem' }}
          >
            <Lightbulb size={14} className="text-amber-400" /> Get Step Hint
          </button>

          {userAnswer !== null && (
            <button 
              className={`btn btn-sm ${activeTab === 'explanation' ? 'btn-primary' : 'btn-outline'}`}
              onClick={handleExplainMistake}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', gap: '0.35rem' }}
            >
              <HelpCircle size={14} className="text-rose-400" /> Explain Choice
            </button>
          )}

          <button 
            className={`btn btn-sm ${activeTab === 'chat' ? 'btn-primary' : 'btn-outline'}`}
            onClick={handleStartChat}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', gap: '0.35rem' }}
          >
            <MessageSquare size={14} className="text-emerald-400" /> Clarification Chat
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
        <div style={{ marginTop: '0.85rem', background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '0.85rem 1rem', fontSize: '0.9rem', lineHeight: '1.5', color: '#f1f5f9' }}>
          <MathRenderer text={streamedText} />
        </div>
      )}

      {/* Multi-Turn Clarification Chat Session */}
      {activeTab === 'chat' && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.65)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            {chatHistory.map((msg, idx) => (
              <div key={idx} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', background: msg.role === 'user' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(30, 41, 59, 0.9)', padding: '0.5rem 0.75rem', borderRadius: '8px', maxWidth: '85%', fontSize: '0.85rem' }}>
                <strong style={{ color: msg.role === 'user' ? '#818cf8' : '#34d399', fontSize: '0.75rem', display: 'block', marginBottom: '0.2rem' }}>
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
              style={{ flex: 1, background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.75rem', color: '#fff', fontSize: '0.85rem' }}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={isThinking || !chatInput.trim()}>
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
