import React, { useState } from 'react';
import { 
  Users, 
  Zap, 
  Trophy, 
  Swords,
  Copy,
  Check,
  ArrowRight,
  Bot,
  Shield,
  Star,
  Activity,
  History
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useScore } from '../../contexts/ScoreContext';
import { useUserData } from '../../contexts/UserDataContext';
import './SpeedDuelLobby.css';

// Helper to determine rank based on XP
function calculateRank(xp = 0) {
  if (xp < 200) return { name: 'Bronze I', current: xp, next: 200, stars: 1, nextRank: 'Bronze II' };
  if (xp < 500) return { name: 'Bronze II', current: xp - 200, next: 300, stars: 2, nextRank: 'Silver I' };
  if (xp < 1000) return { name: 'Silver I', current: xp - 500, next: 500, stars: 2, nextRank: 'Silver II' };
  if (xp < 1500) return { name: 'Silver II', current: xp - 1000, next: 500, stars: 3, nextRank: 'Gold III' };
  if (xp < 2500) return { name: 'Gold III', current: xp - 1500, next: 1000, stars: 3, nextRank: 'Gold I' };
  if (xp < 4000) return { name: 'Gold I', current: xp - 2500, next: 1500, stars: 3, nextRank: 'Platinum I' };
  return { name: 'Platinum I', current: xp - 4000, next: 3000, stars: 3, nextRank: 'Diamond I' };
}

export default function SpeedDuelLobby({ 
  onQuickMatch, 
  onCreateRoom, 
  onJoinRoom, 
  inputRoomCode, 
  setInputRoomCode 
}) {
  const { user } = useAuth();
  const { scoreData } = useScore();
  const { testHistory } = useUserData();

  const [copiedCode, setCopiedCode] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState('Medium');

  const userXp = scoreData?.xp || 0;
  const userAccuracy = scoreData?.accuracy || 0;
  const userStreak = scoreData?.streak || scoreData?.longestStreak || 0;
  const totalCorrect = scoreData?.totalCorrect || 0;
  
  // Calculate dynamic rank
  const rankInfo = calculateRank(userXp);
  const rankProgressPercent = Math.min(100, Math.round((rankInfo.current / rankInfo.next) * 100));

  // Dynamic Room Code
  const roomCode = inputRoomCode || "DUEL-" + (user?.uid?.substring(0, 4)?.toUpperCase() || "9K2F");

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Recent Matches derived from user's testHistory if present
  const recentMatches = (testHistory && testHistory.length > 0)
    ? testHistory.slice(0, 3).map((t, idx) => {
        const scorePct = t.scorePct || (t.total ? Math.round((t.score / t.total) * 100) : 75);
        const isWin = scorePct >= 60;
        return {
          id: t.id || idx,
          result: isWin ? 'Victory' : 'Defeat',
          opponent: t.title || `GATE ME Mock 0${idx + 1}`,
          topic: t.category || 'Mechanical Core',
          score: `${t.score || Math.round(scorePct / 10)} - ${t.total ? Math.round((100 - scorePct) / 10) : 4}`,
          timeAgo: t.timestamp ? new Date(t.timestamp).toLocaleDateString() : `${(idx + 1) * 2} hrs ago`,
          xp: isWin ? `+${scorePct} XP` : `+20 XP`,
          isWin
        };
      })
    : [
        { id: 1, result: 'Victory', opponent: 'Aryan Sharma', topic: 'Thermodynamics', score: '12 - 8', timeAgo: '5 min ago', xp: '+48 XP', isWin: true },
        { id: 2, result: 'Defeat', opponent: 'Rohit Verma', topic: 'Fluid Mechanics', score: '9 - 10', timeAgo: '25 min ago', xp: '+28 XP', isWin: false },
        { id: 3, result: 'Victory', opponent: 'Aditya Singh', topic: 'Strength of Materials', score: '14 - 6', timeAgo: '1 hr ago', xp: '+52 XP', isWin: true }
      ];

  const userName = user?.displayName || "Harshit Kumar";
  const leaderboardData = [
    { rank: 1, name: "Karthik N.", xp: 2450, avatar: "K" },
    { rank: 2, name: "Priya Sharma", xp: 2140, avatar: "P" },
    { rank: 3, name: "Anmol Verma", xp: 1980, avatar: "A" },
    { rank: 4, name: userName, xp: userXp, avatar: userName.charAt(0).toUpperCase(), isUser: true }
  ].sort((a, b) => b.xp - a.xp).map((item, index) => ({ ...item, rank: index + 1 }));

  return (
    <div className="speed-duel-lobby-clean">
      
      {/* 1. ARENA HEADER */}
      <header className="arena-header">
        <div className="arena-title-wrapper">
          <div className="arena-icon-box">
            <Swords size={28} />
          </div>
          <div>
            <h1>Speed Duel Arena</h1>
            <p>Instant 1v1 technical duels & competitive speed rounds</p>
          </div>
        </div>

        <div className="arena-user-rank-pill">
          <Shield size={18} className="text-amber-400" />
          <div className="rank-pill-text">
            <strong>{rankInfo.name}</strong>
            <span>{userXp} XP</span>
          </div>
        </div>
      </header>

      {/* 2. PRIMARY BATTLE MODES (3 Main Cards) */}
      <div className="battle-modes-grid">
        
        {/* Quick 1v1 Match */}
        <div className="battle-card quick-card">
          <div className="card-top">
            <div className="icon-badge purple"><Zap size={24} /></div>
            <span className="live-tag"><span className="dot"></span> Live</span>
          </div>
          <h2>Quick 1v1 Duel</h2>
          <p>Instantly match with an online peer for a fast 5-question technical speed battle.</p>
          
          <button className="arena-btn primary-purple" onClick={onQuickMatch}>
            <Zap size={18} /> Find Opponent
          </button>
        </div>

        {/* AI Challenge */}
        <div className="battle-card ai-card">
          <div className="card-top">
            <div className="icon-badge blue"><Bot size={24} /></div>
            <span className="mode-badge">AI Powered</span>
          </div>
          <h2>AI Speed Challenge</h2>
          <p>Test your speed against adaptive AI tuned to your mechanical subject mastery.</p>

          <div className="diff-toggle">
            {['Easy', 'Medium', 'Hard'].map(d => (
              <button 
                key={d} 
                className={`diff-opt ${aiDifficulty === d ? 'active' : ''}`}
                onClick={() => setAiDifficulty(d)}
              >
                {d}
              </button>
            ))}
          </div>

          <button className="arena-btn primary-blue" onClick={onQuickMatch}>
            <Bot size={18} /> Duel AI ({aiDifficulty})
          </button>
        </div>

        {/* Private Room / Invite */}
        <div className="battle-card room-card">
          <div className="card-top">
            <div className="icon-badge green"><Users size={24} /></div>
            <span className="mode-badge green">Multiplayer</span>
          </div>
          <h2>Private Room</h2>
          <p>Create a custom room or join a friend's lobby using a room code.</p>

          <div className="room-actions">
            <button className="arena-btn primary-green" onClick={onCreateRoom}>
              Create Room
            </button>
            
            <div className="join-input-box">
              <input 
                type="text" 
                placeholder="Enter Code (e.g. DUEL-9K2F)" 
                value={inputRoomCode}
                onChange={(e) => setInputRoomCode(e.target.value)}
              />
              <button className="join-sub-btn" onClick={() => onJoinRoom(inputRoomCode)}>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 3. LOWER SECTION (Recent Activity & Leaderboard) */}
      <div className="arena-lower-section">
        
        {/* Recent Matches & Quick Stats */}
        <div className="lower-card">
          <div className="lower-card-header">
            <h3><History size={18} /> Recent Duels</h3>
            <div className="user-quick-stats">
              <span>Win Rate: <strong>{userAccuracy > 0 ? `${userAccuracy}%` : '0%'}</strong></span>
              <span>Streak: <strong>{userStreak}🔥</strong></span>
            </div>
          </div>

          <div className="recent-matches-list">
            {recentMatches.map((m) => (
              <div className="match-row" key={m.id}>
                <span className={`result-tag ${m.isWin ? 'win' : 'loss'}`}>{m.result}</span>
                <div className="match-info">
                  <strong>vs {m.opponent}</strong>
                  <span>{m.topic}</span>
                </div>
                <div className="match-score">
                  <strong>{m.score}</strong>
                  <span className={m.isWin ? 'text-green-400' : ''}>{m.xp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Leaderboard */}
        <div className="lower-card">
          <div className="lower-card-header">
            <h3><Trophy size={18} /> Weekly Leaderboard</h3>
            <span className="season-lbl">Season 3</span>
          </div>

          <div className="leaderboard-mini-list">
            {leaderboardData.map((p) => (
              <div className={`lb-row ${p.isUser ? 'highlight-user' : ''}`} key={p.rank}>
                <span className="lb-rank">{p.rank === 1 ? '👑' : `#${p.rank}`}</span>
                <div className="lb-avatar">{p.avatar}</div>
                <span className="lb-name">{p.name} {p.isUser && '(You)'}</span>
                <strong className="lb-xp">{p.xp} XP</strong>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
