import React, { useState } from 'react';
import { Bot, Send, Mic, Sparkles, Volume2, ShieldCheck, RefreshCw } from 'lucide-react';
import PremiumGate from '../components/PremiumGate';
import './AICoach.css';

export default function AICoach() {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Namaste! I am Mahi AI Master, your 24/7 GATE Mechanical & PSU strategy mentor. Ask me about concept doubts, mock test analysis, weak area remediation, or exam day time management."
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    const currentQuery = input;
    setInput('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      let replyText = "Based on GATE Mechanical exam trends, focusing on Thermodynamics, SOM, and Engineering Math gives you a 45+ mark cushion. Practice 15 numerical problems daily!";
      
      if (currentQuery.toLowerCase().includes("thermo") || currentQuery.toLowerCase().includes("entropy")) {
        replyText = "For Entropy & 2nd Law of Thermodynamics, remember: dS = dQ/T_boundary + S_generation. For reversible processes, S_gen = 0. In GATE, 80% of entropy questions focus on ideal gas mixing or Carnot efficiency!";
      } else if (currentQuery.toLowerCase().includes("psu") || currentQuery.toLowerCase().includes("iocl")) {
        replyText = "For IOCL and ONGC PSU technical viva interviews, brush up on pump cavitation (NPSH), boiler mountings vs accessories, and stress-strain curves for ductile vs brittle materials!";
      }

      setMessages((prev) => [...prev, { sender: 'ai', text: replyText }]);
    }, 800);
  };

  return (
    <div className="page-content ai-coach-page">
      <header className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
            <Bot size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc' }}>
              24/7 AI Voice & Strategy Mentor ("Mahi AI Master") 🤖
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.92rem' }}>
              Personalized AI coaching for AIR-1 GATE preparation, revision planning, and concept resolution.
            </p>
          </div>
        </div>
      </header>

      <PremiumGate 
        featureId="ai_coach" 
        requiredTier="elite"
        title="Unlock 24/7 AI Voice & Strategy Coach"
        subtitle="Exclusive 1-on-1 AI mentor trained on AIR-1 GATE topper notes, PSU interview transcripts, and exam psychology."
      >
        <div className="coach-chat-card">
          <div className="coach-messages-box">
            {messages.map((m, idx) => (
              <div key={idx} className={`coach-msg-bubble ${m.sender}`}>
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="coach-msg-bubble ai" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RefreshCw className="animate-spin" size={16} /> Mahi AI Master is thinking...
              </div>
            )}
          </div>

          <div className="coach-input-bar">
            <input
              type="text"
              className="coach-text-input"
              placeholder="Ask Mahi AI Master (e.g. 'How to solve entropy questions fast?')"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="btn-send-coach" onClick={handleSend} disabled={loading}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </PremiumGate>
    </div>
  );
}
