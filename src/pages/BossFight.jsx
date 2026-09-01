import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Sword, Heart, X, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { MECH_TOPIC_GROUPS } from '../data/questionBankRegistry';
import './BossFight.css';

// A mock local fetcher for boss fight questions. In production this would hit QuestionBankRegistry.
const MOCK_BOSS_QUESTIONS = [
  {
    id: 'boss-1',
    question: '<p>A Carnot engine operates between 1000 K and 300 K. What is its maximum theoretical efficiency?</p>',
    options: ['70%', '30%', '45%', '60%'],
    correct: 0,
    topic: 'Thermodynamics'
  },
  {
    id: 'boss-2',
    question: '<p>If the Reynolds number is 1500 in pipe flow, the flow is considered:</p>',
    options: ['Turbulent', 'Laminar', 'Transitional', 'Compressible'],
    correct: 1,
    topic: 'Fluid Mechanics'
  },
  {
    id: 'boss-3',
    question: '<p>In a simple gear train, if the driver gear has 20 teeth and the driven gear has 40 teeth, the gear ratio is:</p>',
    options: ['0.5', '2.0', '1.5', '1.0'],
    correct: 1,
    topic: 'Theory of Machines'
  }
];

export default function BossFight() {
  const navigate = useNavigate();
  
  const [inBattle, setInBattle] = useState(false);
  const [bossHp, setBossHp] = useState(100);
  const [playerHp, setPlayerHp] = useState(100);
  
  const [questions, setQuestions] = useState([...MOCK_BOSS_QUESTIONS]);
  const [currQIdx, setCurrQIdx] = useState(0);
  
  const [shake, setShake] = useState(''); // 'player' or 'boss'
  const [damageText, setDamageText] = useState(null); // {target: 'boss'|'player', amount: number}

  const handleStart = () => {
    setInBattle(true);
    setBossHp(100);
    setPlayerHp(100);
    setCurrQIdx(0);
  };

  const triggerDamage = (target, amount) => {
    if (target === 'boss') {
      setBossHp(prev => Math.max(0, prev - amount));
      setShake('boss');
    } else {
      setPlayerHp(prev => Math.max(0, prev - amount));
      setShake('player');
    }
    setDamageText({ target, amount });
    
    setTimeout(() => setShake(''), 500);
    setTimeout(() => setDamageText(null), 1000);
  };

  const handleAnswer = (idx) => {
    const q = questions[currQIdx];
    if (idx === q.correct) {
      // Critical hit if answered fast? For now, fixed 35 damage
      triggerDamage('boss', 35);
    } else {
      triggerDamage('player', 40);
    }

    setTimeout(() => {
      if (currQIdx + 1 < questions.length && bossHp > 0) {
        setCurrQIdx(prev => prev + 1);
      } else if (bossHp <= 0 || (idx === q.correct && bossHp - 35 <= 0)) {
        // Boss fight ends in win! Trigger confetti.
        const duration = 3 * 1000;
        const end = Date.now() + duration;

        (function frame() {
          confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#10b981', '#38bdf8']
          });
          confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#10b981', '#38bdf8']
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        }());
      }
    }, 1500);
  };

  if (!inBattle) {
    return (
      <div className="boss-lobby">
        <button className="btn-back" onClick={() => navigate('/')}><X size={24} /></button>
        <h1>The Thermodynamics Titan</h1>
        <div className="boss-preview">
          <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Titan&backgroundColor=ef4444" alt="Titan" />
        </div>
        <p>A fearsome beast forged in the fires of Carnot.</p>
        <button className="btn-fight" onClick={handleStart}><Sword /> ENTER BATTLE</button>
      </div>
    );
  }

  const q = questions[currQIdx];

  return (
    <div className="boss-arena">
      <div className="arena-header">
        <div className={`health-bar-container player-health ${shake === 'player' ? 'shake' : ''}`}>
          <div className="health-label">You <Heart size={14} /></div>
          <div className="health-track">
            <div className="health-fill" style={{ width: `${playerHp}%`, background: '#10b981' }}></div>
          </div>
          {damageText?.target === 'player' && <div className="floating-damage">- {damageText.amount}</div>}
        </div>
        
        <div className="vs-badge"><Zap size={24} /></div>
        
        <div className={`health-bar-container boss-health ${shake === 'boss' ? 'shake' : ''}`}>
          <div className="health-label">Titan <Shield size={14} /></div>
          <div className="health-track">
            <div className="health-fill" style={{ width: `${bossHp}%`, background: '#ef4444' }}></div>
          </div>
          {damageText?.target === 'boss' && <div className="floating-damage">- {damageText.amount}</div>}
        </div>
      </div>

      <div className="arena-stage">
        <div className={`boss-sprite ${shake === 'boss' ? 'shake' : ''}`}>
          <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Titan&backgroundColor=transparent" alt="Boss" />
        </div>
      </div>

      {bossHp === 0 ? (
        <div className="battle-over win">
          <h2>VICTORY!</h2>
          <p>The Titan has been defeated.</p>
          <button onClick={() => navigate('/')}>Return to Base</button>
        </div>
      ) : playerHp === 0 ? (
        <div className="battle-over lose">
          <h2>DEFEAT!</h2>
          <p>You were crushed by the Titan.</p>
          <button onClick={() => navigate('/')}>Flee</button>
        </div>
      ) : (
        <div className="battle-panel">
          <div className="battle-question" dangerouslySetInnerHTML={{ __html: q?.question }} />
          <div className="battle-options">
            {q?.options.map((opt, i) => (
              <button 
                key={i} 
                className="battle-opt-btn"
                onClick={() => handleAnswer(i)}
                disabled={shake !== ''} // Disable while animating damage
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
