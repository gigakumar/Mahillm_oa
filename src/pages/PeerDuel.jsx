import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useScore } from '../contexts/ScoreContext';
import { 
  Zap, 
  Swords, 
  Trophy, 
  Timer, 
  User, 
  Sparkles, 
  RotateCcw,
  BarChart2,
  Copy,
  Check,
  Share2,
  Users,
  Play,
  ArrowRight,
  Globe,
  MessageCircle,
  ShieldAlert
} from 'lucide-react';
import MathRenderer from '../components/MathRenderer';
import { 
  computeRoundScore, 
  awardVictoryXP, 
  getOpponentLabel 
} from '../utils/duelEngine';
import { QuestionBankRegistry } from '../data/questionBankRegistry';
import { shuffleQuestionOptions } from '../utils/mathUtils';
import { db } from '../firebase';
import { doc, setDoc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import './PeerDuel.css';

const FALLBACK_QUESTIONS = [
  {
    id: 1,
    subject: "Thermodynamics",
    question: "In an isothermal process for an ideal gas, what is the change in internal energy ($\\Delta U$)?",
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
    subject: "Heat Transfer",
    question: "Prandtl number ($Pr$) represents the ratio of:",
    options: ["Momentum diffusivity to thermal diffusivity", "Conduction resistance to convection resistance", "Inertia force to viscous force", "Buoyancy force to viscous force"],
    correct: 0,
    explanation: "Prandtl number $Pr = \\frac{\\nu}{\\alpha} = \\frac{\\mu \\cdot c_p}{k}$, comparing momentum to thermal boundary layer growth."
  }
];

const BOT_NAMES = ['Vikram_IITD', 'Priya_NITK', 'Rahul_BITS', 'Ananya_DTU', 'Karan_GATE', 'Neha_NITW'];

async function fetchDuelQuestions(difficulty = 'LOW', count = 5) {
  try {
    const mechBank = QuestionBankRegistry.find(b => b.id === 'mechanical');
    if (!mechBank) return FALLBACK_QUESTIONS;
    const res = await mechBank.loader(null, difficulty);
    const questions = res.default || [];
    const valid = questions.filter(q => (q.question || q.text) && Array.isArray(q.options) && q.options.length >= 2);
    if (valid.length === 0) return FALLBACK_QUESTIONS;

    const shuffled = [...valid].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map((q, i) => {
      const prepared = {
        id: q.id || `q_${i}_${Date.now()}`,
        subject: q.subject || q.topic || q.category || 'Mechanical Engineering',
        question: q.question || q.text,
        options: q.options,
        correct: q.correctAnswer ?? q.correct ?? 0,
        explanation: q.explanation || 'Refer to fundamental principles of mechanical engineering.'
      };
      return shuffleQuestionOptions(prepared);
    });
  } catch (err) {
    console.warn("Failed to load speed duel questions dynamically:", err);
    return FALLBACK_QUESTIONS;
  }
}

function getOrCreateGuestUid() {
  if (typeof window === 'undefined') return 'guest_' + Date.now();
  let id = sessionStorage.getItem('mech_guest_uid');
  if (!id) {
    id = 'guest_' + Math.random().toString(36).substring(2, 10);
    sessionStorage.setItem('mech_guest_uid', id);
  }
  return id;
}

export default function PeerDuel() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const roomParam = searchParams.get('room');

  const { user } = useAuth();
  const { addXp } = useScore();

  const getMyUid = () => user?.uid || getOrCreateGuestUid();

  // Mode & Room State
  const [mode, setMode] = useState('menu'); // menu | lobby | matchmaking | countdown | playing | result
  const [difficulty, setDifficulty] = useState('LOW');
  const [roomId, setRoomId] = useState(roomParam || '');
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isMultiplayer, setIsMultiplayer] = useState(false);

  // Gameplay State
  const [questions, setQuestions] = useState([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(12);
  const [countdown, setCountdown] = useState(3);

  const [opponent, setOpponent] = useState(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);

  const [playerSelected, setPlayerSelected] = useState(null);
  const [opponentSelected, setOpponentSelected] = useState(null);
  const [roundAnswered, setRoundAnswered] = useState(false);

  const isPlayer1 = useRef(true);
  const isCreatingRoom = useRef(false);
  const unsubscribeRoom = useRef(null);

  // Auto-join room from URL link on mount (only for Opponents opening the link!)
  useEffect(() => {
    if (roomParam && !isCreatingRoom.current) {
      joinExistingRoom(roomParam);
    }
  }, [roomParam]);

  // Clean up Firestore listener on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRoom.current) unsubscribeRoom.current();
    };
  }, []);

  // 1. Create Private Invite Room
  const handleCreateRoom = async () => {
    if (isCreatingRoom.current) return;
    isCreatingRoom.current = true;
    const code = 'DUEL-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    
    // Switch to lobby IMMEDIATELY (<1ms) so the host sees the lobby & invite link instantly!
    setRoomId(code);
    setIsMultiplayer(true);
    isPlayer1.current = true;
    setOpponent(null);
    setPlayerScore(0);
    setOpponentScore(0);
    // Removed setSearchParams to prevent host auto-join bug
    setMode('lobby');

    const myUid = getMyUid();
    const playerName = user?.displayName || 'Guest Host ' + myUid.slice(-4).toUpperCase();

    const loadedQuestions = await fetchDuelQuestions(difficulty, 5);
    setQuestions(loadedQuestions);

    const roomData = {
      roomId: code,
      createdBy: myUid,
      status: 'waiting', // waiting | countdown | playing | finished
      difficulty: difficulty,
      questions: loadedQuestions,
      player1: {
        uid: myUid,
        name: playerName,
        score: 0,
        currentQIdx: 0,
        choice: null
      },
      player2: null,
      createdAt: Date.now()
    };

    if (db) {
      try {
        const docRef = doc(db, 'duels', code);
        await setDoc(docRef, roomData);
        listenToRoom(code, true);
      } catch (err) {
        console.warn("Firestore duel room creation notice:", err);
      }
    }
  };

  // 2. Join Existing Room via Code/Link (Opponent Player 2)
  const joinExistingRoom = async (targetCode) => {
    const code = (targetCode || inputRoomCode).trim().toUpperCase();
    if (!code) return;

    if (db) {
      try {
        const docRef = doc(db, 'duels', code);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          
          const myUid = getMyUid();
          const currentName = user?.displayName;

          // Check if current user is the host/creator of this room
          const isCreator = (data.createdBy === myUid) || 
                            (data.player1 && data.player1.uid === myUid) ||
                            (currentName && data.player1 && data.player1.name === currentName);

          if (isCreator) {
            // User is the host: STAY in lobby mode waiting for Player 2!
            setRoomId(code);
            setIsMultiplayer(true);
            isPlayer1.current = true;
            if (data.questions) setQuestions(data.questions);
            if (data.player2) {
              setOpponent({ name: data.player2.name, score: data.player2.score });
              setOpponentScore(data.player2.score || 0);
            } else {
              setOpponent(null);
            }
            setMode(data.player2 && data.status === 'countdown' ? 'countdown' : 'lobby');
            listenToRoom(code, true);
            return;
          }

          // User is Player 2 (Opponent joining via link)
          // Hard safety check: Do not allow player 1 to join as player 2
          if (data.player1 && (data.player1.uid === myUid || (currentName && data.player1.name === currentName))) {
            return;
          }

          setRoomId(code);
          setIsMultiplayer(true);
          isPlayer1.current = false;
          if (data.questions) setQuestions(data.questions);

          const playerName = user?.displayName || 'Guest Challenger ' + myUid.slice(-4).toUpperCase();

          if (data.status === 'waiting' || !data.player2) {
            await updateDoc(docRef, {
              player2: {
                uid: myUid,
                name: playerName,
                score: 0,
                currentQIdx: 0,
                choice: null
              },
              status: 'countdown'
            });
          }
          listenToRoom(code, false);
        } else {
          alert(`Room ${code} not found! Please check the code or create a new room.`);
          setMode('menu');
        }
      } catch (err) {
        console.warn("Error joining room:", err);
      }
    }
  };

  // Real-time Firestore sync
  const listenToRoom = (code, isHost) => {
    if (!db) return;
    if (unsubscribeRoom.current) unsubscribeRoom.current();

    const docRef = doc(db, 'duels', code);
    unsubscribeRoom.current = onSnapshot(docRef, (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();

      if (isHost) {
        // Host logic: If player 2 hasn't joined yet, strictly keep host in lobby!
        if (!data.player2) {
          setOpponent(null);
          setOpponentScore(0);
          setMode('lobby');
          return;
        }
        // Player 2 HAS joined!
        setOpponent({ name: data.player2.name, score: data.player2.score || 0 });
        setOpponentScore(data.player2.score || 0);
        if (data.player2.choice !== null) setOpponentSelected(data.player2.choice);
      } else {
        // Player 2 logic: Opponent is player 1 (host)
        if (data.player1) {
          setOpponent({ name: data.player1.name, score: data.player1.score || 0 });
          setOpponentScore(data.player1.score || 0);
          if (data.player1.choice !== null) setOpponentSelected(data.player1.choice);
        }
      }

      // Handle status transitions without kicking user out of result screen
      if (data.status === 'finished') {
        setMode('result');
      } else if (data.status === 'countdown' && (isHost ? !!data.player2 : true)) {
        setMode(prev => (prev === 'playing' || prev === 'result' ? prev : 'countdown'));
      } else if (data.status === 'playing') {
        setMode(prev => (prev === 'result' ? 'result' : 'playing'));
      }
    });
  };

  // 3. Start AI Practice Match immediately
  const handleStartAIMatch = async () => {
    setIsMultiplayer(false);
    setMode('matchmaking');

    const loadedQuestions = await fetchDuelQuestions(difficulty, 5);
    setQuestions(loadedQuestions);

    const randomBot = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    const label = getOpponentLabel(true);
    setOpponent({
      name: randomBot,
      avatar: randomBot.charAt(0),
      rating: 1200 + Math.floor(Math.random() * 250),
      labelBadge: label.badge
    });

    setTimeout(() => {
      setMode('countdown');
    }, 1500);
  };

  // Countdown timer effect
  useEffect(() => {
    if (mode === 'countdown') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setMode('playing');
        setTimeLeft(12);
        if (isMultiplayer && isPlayer1.current && roomId && db) {
          const docRef = doc(db, 'duels', roomId);
          updateDoc(docRef, { status: 'playing' }).catch(console.warn);
        }
      }
    }
  }, [mode, countdown]);

  // Round timer effect
  useEffect(() => {
    if (mode === 'playing' && !roundAnswered) {
      if (timeLeft > 0) {
        const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        handleOptionSelect(-1);
      }
    }
  }, [mode, timeLeft, roundAnswered]);

  // Handle option selection
  const handleOptionSelect = (optionIdx) => {
    if (roundAnswered) return;
    setRoundAnswered(true);
    setPlayerSelected(optionIdx);

    const currentQ = questions[currentQIdx] || FALLBACK_QUESTIONS[0];
    const isPlayerCorrect = optionIdx === currentQ.correct;

    const pPoints = computeRoundScore({ isCorrect: isPlayerCorrect, secondsRemainingWhenAnswered: timeLeft });
    const newPlayerScore = playerScore + pPoints;

    if (isPlayerCorrect) setPlayerScore(newPlayerScore);

    if (isMultiplayer && db && roomId) {
      // Sync choice to Firestore
      const docRef = doc(db, 'duels', roomId);
      const updatePayload = isPlayer1.current
        ? { 'player1.score': newPlayerScore, 'player1.choice': optionIdx }
        : { 'player2.score': newPlayerScore, 'player2.choice': optionIdx };
      updateDoc(docRef, updatePayload).catch(console.warn);
    } else {
      // Bot opponent simulation
      const botIsCorrect = Math.random() < 0.70;
      const botChoice = botIsCorrect ? currentQ.correct : (currentQ.correct + 1) % 4;
      setOpponentSelected(botChoice);
      const bPoints = computeRoundScore({ isCorrect: botIsCorrect, secondsRemainingWhenAnswered: Math.max(1, timeLeft - 2) });
      if (botIsCorrect) setOpponentScore(prev => prev + bPoints);
    }

    // Advance round
    setTimeout(() => {
      if (currentQIdx + 1 < questions.length) {
        setCurrentQIdx(idx => idx + 1);
        setPlayerSelected(null);
        setOpponentSelected(null);
        setRoundAnswered(false);
        setTimeLeft(12);
      } else {
        setMode('result');
        if (isMultiplayer && db && roomId) {
          const docRef = doc(db, 'duels', roomId);
          updateDoc(docRef, { status: 'finished' }).catch(console.warn);
        }
        if (newPlayerScore >= opponentScore) {
          const xpRes = awardVictoryXP({ isSimulatedOpponent: !isMultiplayer, victoriesTodayCount: 1 });
          if (xpRes.xpAwarded > 0) addXp(xpRes.xpAwarded);
        }
      }
    }, 2400);
  };

  const copyRoomLink = () => {
    const inviteUrl = `${window.location.origin}/duel?room=${roomId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const shareOnWhatsApp = () => {
    const inviteUrl = `${window.location.origin}/duel?room=${roomId}`;
    const text = `⚔️ Challenge me to a 1vs1 Mechanical Speed Duel on MahiLLM! Join room code: ${roomId}\nClick to play: ${inviteUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const restartDuel = () => {
    setMode('menu');
    setRoomId('');
    setQuestions([]);
    setCurrentQIdx(0);
    setTimeLeft(12);
    setCountdown(3);
    setPlayerScore(0);
    setOpponentScore(0);
    setPlayerSelected(null);
    setOpponentSelected(null);
    setRoundAnswered(false);
    setSearchParams({});
  };

  const shareableUrl = roomId ? `${window.location.origin}/duel?room=${roomId}` : '';

  return (
    <div className="peer-duel-container">
      {/* MODE MENU */}
      {mode === 'menu' && (
        <div className="duel-card mode-menu-card">
          <div className="menu-header">
            <Swords className="w-12 h-12 text-indigo-400 animate-pulse" />
            <h1>1vs1 Speed Duel Arena</h1>
            <p>Challenge peers worldwide or test your speed against AI in real-time technical battles!</p>
          </div>

          <div className="difficulty-picker">
            <span className="diff-label">Question Bank Filter:</span>
            <div className="diff-options">
              <button 
                className={`diff-btn ${difficulty === 'LOW' ? 'active' : ''}`} 
                onClick={() => setDifficulty('LOW')}
              >
                ⚡ LOW Difficulty (Fast Speed Challenge)
              </button>
              <button 
                className={`diff-btn ${difficulty === 'all' ? 'active' : ''}`} 
                onClick={() => setDifficulty('all')}
              >
                🔥 ALL Difficulties
              </button>
            </div>
          </div>

          <div className="duel-modes-grid">
            {/* Create Multiplayer Room */}
            <div className="mode-box highlight-box">
              <div className="mode-icon"><Users size={28} className="text-emerald-400" /></div>
              <h3>Create Private Duel Room</h3>
              <p>Generate a shareable invite link & play 1vs1 with any friend!</p>
              <button className="btn btn-emerald w-full" onClick={handleCreateRoom}>
                🎮 Create Room & Get Link
              </button>
            </div>

            {/* Quick Match / AI Opponent */}
            <div className="mode-box">
              <div className="mode-icon"><Zap size={28} className="text-amber-400" /></div>
              <h3>Quick Match (AI / Bot)</h3>
              <p>Instant battle with an AI engineer match in your skill band.</p>
              <button className="btn btn-primary w-full" onClick={handleStartAIMatch}>
                ⚡ Start Instant Duel
              </button>
            </div>
          </div>

          {/* Enter Room Code */}
          <div className="join-room-section">
            <h4>Have an Invite Room Code?</h4>
            <div className="join-input-group">
              <input 
                type="text" 
                placeholder="Enter Room Code (e.g. DUEL-9K2F)"
                value={inputRoomCode}
                onChange={(e) => setInputRoomCode(e.target.value)}
              />
              <button className="btn btn-secondary" onClick={() => joinExistingRoom(inputRoomCode)}>
                Join Match <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOBBY / WAITING FOR LINK OPPONENT */}
      {mode === 'lobby' && (
        <div className="duel-card lobby-card">
          <div className="room-badge">ROOM CODE: <strong>{roomId}</strong></div>
          <h2>Invite Friend to Join Speed Duel</h2>
          <p>Share this link with your opponent to play live 1vs1!</p>

          <div className="invite-link-container">
            <input type="text" readOnly value={shareableUrl} />
            <button className="btn btn-primary btn-sm" onClick={copyRoomLink}>
              {copiedLink ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Link</>}
            </button>
          </div>

          <div className="lobby-actions">
            <button className="btn btn-whatsapp" onClick={shareOnWhatsApp}>
              <MessageCircle size={18} /> Share via WhatsApp
            </button>
            <button className="btn btn-outline" onClick={handleStartAIMatch}>
              ⚡ Play with AI Opponent Instead
            </button>
            <button className="btn btn-secondary text-xs opacity-75" onClick={restartDuel}>
              ← Cancel & Return to Menu
            </button>
          </div>

          <div className="waiting-spinner mt-4">
            <div className="matchmaking-spinner" />
            <span className="text-amber-300 font-medium">Waiting for opponent to open link and join...</span>
          </div>
        </div>
      )}

      {/* MATCHMAKING SCREEN */}
      {mode === 'matchmaking' && (
        <div className="duel-card matchmaking-card">
          <Swords className="w-16 h-16 text-indigo-400 animate-bounce" />
          <h2>Finding Real-Time Technical Opponent...</h2>
          <p>Selecting 5 fresh LOW difficulty questions from 5,000+ question bank</p>
          <div className="matchmaking-spinner" />
        </div>
      )}

      {/* COUNTDOWN SCREEN */}
      {mode === 'countdown' && (
        <div className="duel-card countdown-card">
          <div className="versus-header">
            <div className="player-profile">
              <div className="avatar-circle">{user?.displayName?.charAt(0) || 'Y'}</div>
              <span>{user?.displayName || 'You'}</span>
            </div>
            <div className="vs-badge">VS</div>
            <div className="player-profile">
              <div className="avatar-circle bot-avatar">{opponent?.avatar || opponent?.name?.charAt(0) || 'O'}</div>
              <span>{opponent?.name || 'Opponent'}</span>
            </div>
          </div>
          <div className="start-countdown-val">{countdown}</div>
          <p className="font-semibold text-amber-400">GET READY! 1VS1 SPEED DUEL STARTING</p>
        </div>
      )}

      {/* ACTIVE DUEL ARENA */}
      {mode === 'playing' && (
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
              <span className="round-count">Q {currentQIdx + 1} / {questions.length || 5}</span>
            </div>

            <div className="score-box opponent-score">
              <span className="player-name">{opponent?.name || 'Opponent'}</span>
              <span className="score-val">{opponentScore} PTS</span>
            </div>
          </div>

          {/* Question Box */}
          {questions[currentQIdx] && (
            <div className="duel-question-card">
              <div className="q-subject-badge">{questions[currentQIdx].subject}</div>
              <h3 className="q-text">
                <MathRenderer text={questions[currentQIdx].question} />
              </h3>

              <div className="options-grid">
                {questions[currentQIdx].options?.map((opt, idx) => {
                  let btnStyle = '';
                  if (roundAnswered) {
                    if (idx === questions[currentQIdx].correct) btnStyle = 'correct-opt';
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
                      {roundAnswered && opponentSelected === idx && (
                        <span className="bot-pick-tag">⚔️ {opponent?.name || 'Opponent'}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {roundAnswered && questions[currentQIdx].explanation && (
                <div className="explanation-box">
                  <strong>Explanation:</strong> <MathRenderer text={questions[currentQIdx].explanation} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* RESULT SCREEN */}
      {mode === 'result' && (
        <div className="duel-card result-card">
          <Trophy className={`w-20 h-20 ${playerScore >= opponentScore ? 'text-amber-400 animate-bounce' : 'text-slate-500'}`} />
          <h2>{playerScore > opponentScore ? 'VICTORY!' : playerScore === opponentScore ? 'DRAW!' : 'DEFEAT'}</h2>
          <p className="text-slate-300">
            {playerScore >= opponentScore ? 'Great speed and accuracy! +50 XP Awarded' : 'Nice effort! Practice to increase your speed.'}
          </p>

          <div className="final-score-breakdown">
            <div className="final-box">
              <span>Your Final Score</span>
              <strong>{playerScore} PTS</strong>
            </div>
            <div className="final-box">
              <span>{opponent?.name || 'Opponent'}</span>
              <strong>{opponentScore} PTS</strong>
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

