import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useScore } from '../contexts/ScoreContext';
import { 
  Zap, 
  Swords, 
  Trophy, 
  Timer, 
  CheckCircle2, 
  XCircle, 
  User, 
  Sparkles, 
  ShieldAlert,
  Play,
  RotateCcw,
  BarChart2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MathRenderer from '../components/MathRenderer';
import { 
  computeRoundScore, 
  canRevealOpponentChoice, 
  awardVictoryXP, 
  getOpponentLabel 
} from '../utils/duelEngine';
import './PeerDuel.css';

const DUEL_QUESTIONS = [
  {
    id: 1,
    subject: "Thermodynamics",
    question: "In an isothermal process for an ideal gas, what is the change in internal energy (\\Delta U)?",
    options: ["Zero", "Maximum", "Equal to heat added", "Depends on pressure"],
    correct: 0,
    explanation: "For an ideal gas, internal energy is purely a function of temperature ($U = f(T)$). Since temperature remains constant in an isothermal process, $\\Delta U = 0$."
  },
  {
    id: 2,
    subject: "Fluid Mechanics",
    question: "What is the unit of dynamic viscosity in the CGS system?",
    options: ["Stoke", "Poise", "Pascal-second", "Kinem"],
    correct: 1,
    explanation: "Dynamic viscosity in CGS is measured in Poise ($1 \\text{ Poise} = 0.1 \\text{ Pa}\\cdot\\text{s}$). Stoke is the CGS unit for kinematic viscosity."
  },
  {
    id: 3,
    subject: "Strength of Materials",
    question: "At the neutral axis of a beam subjected to pure bending, the bending stress is:",
    options: ["Maximum tensile", "Maximum compressive", "Zero", "Infinity"],
    correct: 2,
    explanation: "The neutral axis experiences zero elongation or compression, meaning bending stress $\\sigma = \\frac{M \\cdot y}{I} = 0$ at $y = 0$."
  },
  {
    id: 4,
    subject: "Theory of Machines",
    question: "For a planar mechanism with $n$ links, the number of degrees of freedom according to Kutzbach criterion is given by:",
    options: ["F = 3(n-1) - 2j - d", "F = 2(n-1) - 3j", "F = 3n - 2j", "F = 4(n-1) - j"],
    correct: 0,
    explanation: "Kutzbach equation for planar mechanisms is $F = 3(n - 1) - 2j - d$, where $j$ is lower pairs and $d$ is higher pairs."
  },
  {
    id: 5,
    subject: "Manufacturing Science",
    question: "Continuous chips with built-up edge (BUE) are formed during machining when:",
    options: ["Ductile material is cut at low speed", "Brittle material is cut at high speed", "Ductile material is cut at high speed with lubricant", "Brittle material is cut at low speed"],
    correct: 0,
    explanation: "Low cutting speeds with high friction in ductile metals cause material adherence to the tool tip, forming a Built-Up Edge."
  },
  {
    id: 6,
    subject: "Heat Transfer",
    question: "Prandtl number ($Pr$) represents the ratio of:",
    options: ["Momentum diffusivity to thermal diffusivity", "Conduction resistance to convection resistance", "Inertia force to viscous force", "Buoyancy force to viscous force"],
    correct: 0,
    explanation: "Prandtl number $Pr = \\frac{\\nu}{\\alpha} = \\frac{\\mu \\cdot c_p}{k}$, comparing momentum to thermal boundary layer growth."
  },
  {
    id: 7,
    subject: "Industrial Engineering",
    question: "In EOQ model with uniform demand, if order quantity doubles, annual ordering cost will:",
    options: ["Halve", "Double", "Remain same", "Quadruple"],
    correct: 0,
    explanation: "Annual ordering cost is $\\frac{D}{Q} \\cdot S$. Doubling $Q$ halves the annual ordering cost."
  }
];

const BOT_NAMES = ['Vikram_IITD', 'Priya_NITK', 'Rahul_BITS', 'Ananya_DTU'];

export default function PeerDuel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { scoreData, addXp } = useScore();

  const [gameState, setGameState] = useState('matchmaking'); // matchmaking | countdown | playing | result
  const [opponent, setOpponent] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(12);

  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);

  const [playerSelected, setPlayerSelected] = useState(null);
  const [botSelected, setBotSelected] = useState(null);
  const [roundAnswered, setRoundAnswered] = useState(false);

  // 1. Matchmaking simulation
  useEffect(() => {
    if (gameState === 'matchmaking') {
      const timer = setTimeout(() => {
        const randomBot = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
        const label = getOpponentLabel(true);
        setOpponent({
          name: randomBot,
          avatar: randomBot.charAt(0),
          rating: 1200 + Math.floor(Math.random() * 250),
          labelBadge: label.badge
        });
        setGameState('countdown');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  // 2. Countdown timer before game start
  useEffect(() => {
    if (gameState === 'countdown') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setGameState('playing');
      }
    }
  }, [gameState, countdown]);

  // 3. Question round timer
  useEffect(() => {
    if (gameState === 'playing' && !roundAnswered) {
      if (timeLeft > 0) {
        const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        handleOptionSelect(-1);
      }
    }
  }, [gameState, timeLeft, roundAnswered]);

  const handleOptionSelect = (optionIdx) => {
    if (roundAnswered) return;
    setRoundAnswered(true);
    setPlayerSelected(optionIdx);

    const currentQ = DUEL_QUESTIONS[currentQIdx];
    const isPlayerCorrect = optionIdx === currentQ.correct;

    // Simulate bot choice with 75% accuracy
    const botIsCorrect = Math.random() < 0.75;
    const botChoice = botIsCorrect ? currentQ.correct : (currentQ.correct + 1) % 4;
    setBotSelected(botChoice);

    // Compute hardened scores using duelEngine
    const pPoints = computeRoundScore({ isCorrect: isPlayerCorrect, secondsRemainingWhenAnswered: timeLeft });
    const bPoints = computeRoundScore({ isCorrect: botIsCorrect, secondsRemainingWhenAnswered: Math.max(1, timeLeft - 2) });

    if (isPlayerCorrect) setPlayerScore(prev => prev + pPoints);
    if (botIsCorrect) setBotScore(prev => prev + bPoints);

    // Advance round after delay
    setTimeout(() => {
      if (currentQIdx + 1 < DUEL_QUESTIONS.length) {
        setCurrentQIdx(idx => idx + 1);
        setPlayerSelected(null);
        setBotSelected(null);
        setRoundAnswered(false);
        setTimeLeft(12);
      } else {
        setGameState('result');
        if (playerScore >= botScore) {
          const xpRes = awardVictoryXP({ isSimulatedOpponent: true, victoriesTodayCount: 1 });
          if (xpRes.xpAwarded > 0) {
            addXp(xpRes.xpAwarded);
          }
        }
      }
    }, 2400);
  };

  const restartDuel = () => {
    setGameState('matchmaking');
    setOpponent(null);
    setCountdown(3);
    setCurrentQIdx(0);
    setTimeLeft(12);
    setPlayerScore(0);
    setBotScore(0);
    setPlayerSelected(null);
    setBotSelected(null);
    setRoundAnswered(false);
  };

  return (
    <div className="peer-duel-container">
      {/* MATCHMAKING SCREEN */}
      {gameState === 'matchmaking' && (
        <div className="duel-card matchmaking-card">
          <Swords className="w-16 h-16 text-indigo-400 animate-bounce" />
          <h2>Finding Real-Time Technical Opponent...</h2>
          <p>Matching with mechanical engineers in your skill band</p>
          <div className="matchmaking-spinner" />
        </div>
      )}

      {/* COUNTDOWN SCREEN */}
      {gameState === 'countdown' && opponent && (
        <div className="duel-card countdown-card">
          <div className="versus-header">
            <div className="player-profile">
              <div className="avatar-circle">{user?.displayName?.charAt(0) || 'Y'}</div>
              <span>{user?.displayName || 'You'}</span>
            </div>
            <div className="vs-badge">VS</div>
            <div className="player-profile">
              <div className="avatar-circle bot-avatar">{opponent.avatar}</div>
              <span>{opponent.name}</span>
            </div>
          </div>
          <div className="start-countdown-val">{countdown}</div>
          <p className="font-semibold text-amber-400">GET READY! SPEED DUEL STARTING</p>
        </div>
      )}

      {/* ACTIVE DUEL ARENA */}
      {gameState === 'playing' && opponent && (
        <div className="duel-arena-wrapper">
          {/* Scoreboard Bar */}
          <div className="duel-scoreboard">
            <div className="score-box player-score">
              <span className="player-name">You</span>
              <span className="score-val">{playerScore} PTS</span>
            </div>

            <div className="round-timer-box">
              <Timer className="w-5 h-5 text-amber-400" />
              <span className={`timer-val ${timeLeft <= 3 ? 'text-rose-500 animate-ping' : ''}`}>{timeLeft}s</span>
              <span className="round-count">Q {currentQIdx + 1} / {DUEL_QUESTIONS.length}</span>
            </div>

            <div className="score-box opponent-score">
              <span className="player-name">{opponent.name}</span>
              <span className="score-val">{botScore} PTS</span>
            </div>
          </div>

          {/* Question Box */}
          <div className="duel-question-card">
            <div className="q-subject-badge">{DUEL_QUESTIONS[currentQIdx].subject}</div>
            <h3 className="q-text">
              <MathRenderer text={DUEL_QUESTIONS[currentQIdx].question} />
            </h3>

            <div className="options-grid">
              {DUEL_QUESTIONS[currentQIdx].options.map((opt, idx) => {
                let btnStyle = '';
                if (roundAnswered) {
                  if (idx === DUEL_QUESTIONS[currentQIdx].correct) btnStyle = 'correct-opt';
                  else if (idx === playerSelected) btnStyle = 'wrong-opt';
                }

                return (
                  <button
                    key={idx}
                    className={`duel-opt-btn ${btnStyle}`}
                    onClick={() => handleOptionSelect(idx)}
                    disabled={roundAnswered}
                  >
                    <span className="opt-letter">{String.fromCharCode(65 + idx)}</span>
                    <MathRenderer text={opt} />
                    {roundAnswered && botSelected === idx && (
                      <span className="bot-pick-tag">🤖 {opponent.name}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {roundAnswered && (
              <div className="explanation-box">
                <strong>Explanation:</strong> <MathRenderer text={DUEL_QUESTIONS[currentQIdx].explanation} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* RESULT SCREEN */}
      {gameState === 'result' && opponent && (
        <div className="duel-card result-card">
          <Trophy className={`w-20 h-20 ${playerScore >= botScore ? 'text-amber-400 animate-bounce' : 'text-slate-500'}`} />
          <h2>{playerScore > botScore ? 'VICTORY!' : playerScore === botScore ? 'DRAW!' : 'DEFEAT'}</h2>
          <p className="text-slate-300">
            {playerScore >= botScore ? 'Great speed and accuracy! +50 XP Awarded' : 'Nice effort! Practice to increase your speed.'}
          </p>

          <div className="final-score-breakdown">
            <div className="final-box">
              <span>Your Final Score</span>
              <strong>{playerScore} PTS</strong>
            </div>
            <div className="final-box">
              <span>{opponent.name}</span>
              <strong>{botScore} PTS</strong>
            </div>
          </div>

          <div className="result-actions">
            <button className="btn btn-primary btn-lg" onClick={restartDuel}>
              <RotateCcw className="w-5 h-5" /> Play Another Duel
            </button>
            <button className="btn btn-outline btn-lg" onClick={() => navigate('/leaderboard')}>
              <BarChart2 className="w-5 h-5" /> View Leaderboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
