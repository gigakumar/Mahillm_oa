import React, { useState } from 'react';
import { 
  Users, 
  Zap, 
  Trophy, 
  Calendar, 
  Swords,
  Copy,
  Check,
  Share2,
  ArrowRight,
  TrendingUp,
  Activity,
  Award,
  Star,
  Gift,
  Clock,
  Settings,
  Sparkles
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
  const [difficulty, setDifficulty] = useState('Mixed');

  const userXp = scoreData?.xp || 1476;
  const userAccuracy = scoreData?.accuracy || 82;
  const userStreak = scoreData?.streak || scoreData?.longestStreak || 8;
  const totalAttempted = scoreData?.totalAttempted || 12;
  const totalCorrect = scoreData?.totalCorrect || 10;
  
  // Calculate dynamic rank
  const rankInfo = calculateRank(userXp);
  const rankProgressPercent = Math.min(100, Math.round((rankInfo.current / rankInfo.next) * 100));

  // Dynamic Room Code generated or standard
  const roomCode = inputRoomCode || "DUEL-" + (user?.uid?.substring(0, 4)?.toUpperCase() || "9K2F");

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Dynamic Recent Matches derived from user's testHistory if present
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

  // Dynamic Leaderboard combining top users + active user
  const userName = user?.displayName || "Harshit Kumar";
  const leaderboardData = [
    { rank: 1, name: "Karthik N.", xp: 2450, avatar: "K" },
    { rank: 2, name: "Priya Sharma", xp: 2140, avatar: "P" },
    { rank: 3, name: "Anmol Verma", xp: 1980, avatar: "A" },
    { rank: 4, name: userName, xp: userXp, avatar: userName.charAt(0).toUpperCase(), isUser: true }
  ].sort((a, b) => b.xp - a.xp).map((item, index) => ({ ...item, rank: index + 1 }));

  const FRIENDS_ONLINE = [
    { name: 'Amit Kumar', status: 'Online', action: 'Challenge', color: 'status-green' },
    { name: 'Rahul Gupta', status: 'In Match', action: 'Spectate', color: 'status-blue' },
    { name: 'Shivam Patel', status: 'Online', action: 'Challenge', color: 'status-green' }
  ];

  const LIVE_FEED = [
    { text: "Amit Kumar defeated Rahul Gupta", time: "2m ago" },
    { text: `${userName.split(' ')[0]} reached ${rankInfo.name}`, time: "Just now" },
    { text: "Riya Singh won 8 matches streak 🔥", time: "15m ago" }
  ];

  return (
    <div className="speed-duel-lobby">
      
      <div className="lobby-main-content">
        
        {/* HERO SECTION */}
        <div className="lobby-hero card">
          <div className="hero-background"></div>
          <div className="hero-content">
            <div className="hero-title-area">
              <Swords size={28} className="hero-icon" />
              <h1>Speed Duel Arena</h1>
            </div>
            <p className="hero-subtitle">Challenge peers worldwide or test your speed against AI in real-time technical battles!</p>
            
            <div className="hero-stats-row">
              <div className="hero-stat">
                <Users size={18} className="stat-icon purple" />
                <div className="stat-info">
                  <strong>1,284</strong>
                  <span><span className="live-dot"></span> Online</span>
                </div>
              </div>
              <div className="hero-stat">
                <Zap size={18} className="stat-icon yellow" />
                <div className="stat-info">
                  <strong>6 sec</strong>
                  <span>Avg Wait</span>
                </div>
              </div>
              <div className="hero-stat">
                <Trophy size={18} className="stat-icon orange" />
                <div className="stat-info">
                  <strong>14,820</strong>
                  <span>Matches Today</span>
                </div>
              </div>
              <div className="hero-stat">
                <Calendar size={18} className="stat-icon pink" />
                <div className="stat-info">
                  <strong>Season 3</strong>
                  <span>Current Season</span>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-graphic">
            <div className="vs-badge">
              <div className="vs-circle left-circle">
                <span>YOU</span>
              </div>
              <div className="vs-center-text">VS</div>
              <div className="vs-circle right-circle">
                <span>OPP</span>
              </div>
            </div>
          </div>
        </div>

        {/* BATTLE MODES */}
        <div className="mode-cards-grid">
          {/* Quick Match */}
          <div className="mode-card mode-quick">
            <div className="mode-card-header">
              <div className="mode-icon-circle"><Zap size={22} /></div>
              <span className="badge-hot">HOT</span>
            </div>
            <h3>Quick Match</h3>
            <p>Find random opponent in seconds</p>
            <div className="mode-meta">
              <div className="avatar-group">
                <div className="avatar">A</div>
                <div className="avatar">R</div>
                <div className="avatar">K</div>
                <span className="online-count">+1.2K online</span>
              </div>
            </div>
            <button className="btn mode-btn btn-quick" onClick={onQuickMatch}>
              Start Quick Match
            </button>
            <div className="mode-footer"><Zap size={12}/> Est. Wait: 4 sec</div>
          </div>

          {/* Private Room */}
          <div className="mode-card mode-private">
            <div className="mode-card-header">
              <div className="mode-icon-circle"><Users size={22} /></div>
            </div>
            <h3>Private Room</h3>
            <p>Invite friends & duel in your room</p>
            
            <div className="room-code-display" onClick={handleCopyCode} title="Click to copy">
              <span>{roomCode}</span>
              {copiedCode ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            </div>
            
            <div className="private-actions">
              <button className="btn btn-outline-green" onClick={handleCopyCode}>
                {copiedCode ? "Copied!" : "Copy Code"}
              </button>
              <button className="btn btn-outline-green" onClick={onCreateRoom}>
                Create Room
              </button>
            </div>
            <div className="mode-footer">Play with friends</div>
          </div>

          {/* AI Duel */}
          <div className="mode-card mode-ai">
             <div className="mode-card-header">
              <div className="mode-icon-circle"><Settings size={22} /></div>
              <span className="badge-new">NEW</span>
            </div>
            <h3>AI Duel</h3>
            <p>Challenge AI based on your skill level</p>
            <div className="ai-difficulty-selector">
               <div className="ai-diff-bars">
                 <div className="bar filled"></div>
                 <div className="bar filled"></div>
                 <div className="bar filled"></div>
                 <div className="bar"></div>
                 <div className="bar"></div>
               </div>
               <span className="diff-name">Medium Level</span>
            </div>
            <button className="btn mode-btn btn-ai" onClick={onQuickMatch}>
              Start AI Duel
            </button>
            <div className="mode-footer">Improve with AI</div>
          </div>

          {/* Ranked Duel */}
          <div className="mode-card mode-ranked">
            <div className="mode-card-header">
              <div className="mode-icon-circle"><Trophy size={22} /></div>
            </div>
            <h3>Ranked Duel</h3>
            <p>Compete & climb the leaderboard</p>
            <div className="rank-display">
              <ShieldIcon />
              <div className="rank-info">
                <strong>{rankInfo.name}</strong>
                <div className="stars">
                  {Array.from({ length: rankInfo.stars }).map((_, i) => (
                    <Star key={i} size={12} fill="currentColor" />
                  ))}
                </div>
              </div>
            </div>
            <button className="btn mode-btn btn-ranked" onClick={onQuickMatch}>
              Enter Ranked
            </button>
            <div className="mode-footer text-gold">Earn XP & Rewards</div>
          </div>
        </div>

        {/* JOIN ROOM BAR */}
        <div className="join-room-bar card">
          <div className="join-icon"><Users size={18} /> Join Existing Room</div>
          <input 
            type="text" 
            placeholder="Enter room code (e.g. DUEL-9K2F)" 
            value={inputRoomCode}
            onChange={(e) => setInputRoomCode(e.target.value)}
          />
          <button className="btn btn-primary join-btn" onClick={() => onJoinRoom(inputRoomCode)}>
            Join Match <ArrowRight size={16} />
          </button>
        </div>

        {/* CUSTOMIZE DUEL / FILTERS */}
        <div className="customize-duel card">
          <div className="customize-header">
            <Settings size={16} /> Customize Your Duel Parameters
          </div>
          
          <div className="customize-filters">
            <div className="difficulty-chips">
              {['Easy', 'Medium', 'Hard', 'Mixed', 'Adaptive'].map(diff => (
                <button 
                  key={diff} 
                  className={`diff-chip ${difficulty === diff ? 'active' : ''} ${diff.toLowerCase()}`}
                  onClick={() => setDifficulty(diff)}
                >
                  {diff === 'Adaptive' && <Activity size={12} />}
                  {diff}
                </button>
              ))}
            </div>

            <div className="dropdowns-row">
               <div className="filter-dropdown">
                 <label>Question Source</label>
                 <select><option>All Core Topics</option><option>Thermodynamics</option><option>Fluid Mechanics</option></select>
               </div>
               <div className="filter-dropdown">
                 <label>No. of Questions</label>
                 <select><option>10 Questions</option><option>20 Questions</option></select>
               </div>
               <div className="filter-dropdown">
                 <label>Time per Question</label>
                 <select><option>30 Seconds</option><option>45 Seconds</option></select>
               </div>
               <button className="btn btn-more-filters"><Settings size={14}/> Filters</button>
            </div>
          </div>
        </div>

        {/* BOTTOM FEEDS ROW */}
        <div className="feeds-row">
          {/* Recent Matches */}
          <div className="feed-card card">
            <div className="feed-header">
              <Swords size={16} /> Recent Matches
            </div>
            <div className="feed-list">
              {recentMatches.map((match) => (
                <div className="feed-item match-item" key={match.id}>
                  <div className="match-left">
                    <span className={`match-result-tag ${match.isWin ? 'win' : 'loss'}`}>
                      {match.result}
                    </span>
                    <div className="match-details">
                      <strong>vs {match.opponent}</strong>
                      <span className="match-topic-lbl">{match.topic}</span>
                    </div>
                  </div>

                  <div className="match-right">
                    <span className="match-score-text">{match.score}</span>
                    <span className={`match-xp-lbl ${match.isWin ? 'win-xp' : ''}`}>{match.xp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Friends Online */}
          <div className="feed-card card">
            <div className="feed-header">
              <Users size={16} /> Friends Online
            </div>
            <div className="feed-list">
               {FRIENDS_ONLINE.map((friend, i) => (
                 <div className="feed-item friend-item" key={i}>
                   <div className="friend-left">
                     <div className="friend-avatar">{friend.name.charAt(0)}</div>
                     <div className="friend-info">
                       <strong>{friend.name}</strong>
                       <span className="status-label">
                         <span className={`status-dot ${friend.color}`}></span> {friend.status}
                       </span>
                     </div>
                   </div>
                   <button className="btn-friend-action" onClick={onQuickMatch}>{friend.action}</button>
                 </div>
               ))}
            </div>
          </div>

          {/* Live Feed */}
          <div className="feed-card card">
            <div className="feed-header">
              <Activity size={16} /> Server Activity Feed
            </div>
            <div className="feed-list">
               {LIVE_FEED.map((feed, i) => (
                 <div className="feed-item live-item" key={i}>
                   <div className="live-icon-box"><Sparkles size={14} className="text-indigo-400"/></div>
                   <div className="feed-content">
                     <p>{feed.text}</p>
                     <span>{feed.time}</span>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT SIDEBAR */}
      <div className="lobby-sidebar">
        
        {/* Rank Progress */}
        <div className="sidebar-card card rank-card">
          <div className="card-header"><Trophy size={16} /> Your Rank Progress</div>
          <div className="rank-main">
            <ShieldIcon lg />
            <div className="rank-details">
              <h3>{rankInfo.name}</h3>
              <div className="stars">
                {Array.from({ length: rankInfo.stars }).map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" />
                ))}
              </div>
              <div className="xp-text"><strong>{rankInfo.current}</strong> / {rankInfo.next} XP</div>
            </div>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${rankProgressPercent}%` }}></div>
          </div>
          <div className="next-rank">
            <span>Next Rank</span>
            <span className="next-rank-badge">{rankInfo.nextRank} <ShieldIcon sm /></span>
          </div>
        </div>

        {/* Weekly Leaderboard */}
        <div className="sidebar-card card">
          <div className="card-header">
            <span>Weekly Leaderboard</span>
            <button className="btn-link">View All</button>
          </div>
          <div className="leaderboard-list">
            {leaderboardData.map(p => (
              <div className={`lb-item ${p.isUser ? 'user-row' : ''}`} key={p.rank}>
                <div className="lb-rank">
                  {p.rank === 1 ? '👑' : p.rank}
                </div>
                <div className="lb-avatar">{p.avatar}</div>
                <div className="lb-name">{p.name}</div>
                <div className="lb-xp">{p.xp} XP</div>
              </div>
            ))}
          </div>
        </div>

        {/* Your Stats */}
        <div className="sidebar-card card stats-card">
          <div className="card-header"><TrendingUp size={16} /> Your Stats</div>
          <div className="stats-grid">
            <div className="stat-box">
              <span className="stat-lbl">Win Rate</span>
              <strong>{userAccuracy > 0 ? `${userAccuracy}%` : '74%'} <span className="trend up">▲+3</span></strong>
            </div>
            <div className="stat-box">
              <span className="stat-lbl">Matches Won</span>
              <strong>{totalCorrect || 8}</strong>
            </div>
            <div className="stat-box">
              <span className="stat-lbl">Best Streak</span>
              <strong>{userStreak || 8}</strong>
            </div>
            <div className="stat-box">
              <span className="stat-lbl">Accuracy</span>
              <strong>{userAccuracy || 82}%</strong>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="sidebar-card card">
          <div className="card-header">
            <span>Achievements</span>
            <button className="btn-link">View All</button>
          </div>
          <div className="achievements-row">
            <div className="achievement-badge purple" title="Speed Demon"><Award size={20} /></div>
            <div className="achievement-badge blue" title="Win Streak 5"><Award size={20} /></div>
            <div className="achievement-badge gold" title="Ranked Master"><Award size={20} /></div>
            <div className="achievement-badge green" title="Accuracy 80%+"><Award size={20} /></div>
            <div className="achievement-more">+12</div>
          </div>
        </div>

        {/* Daily Reward */}
        <div className="sidebar-card card reward-card">
          <div className="card-header"><Gift size={16} /> Daily Reward</div>
          <p>Play 1 more match to claim your daily reward!</p>
          <div className="reward-actions">
            <button className="btn btn-primary" onClick={onQuickMatch}>Claim Reward</button>
            <div className="reward-amt"><Star size={16} className="text-yellow-400"/> +100 XP</div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Helper SVG Icon
const ShieldIcon = ({ lg, sm }) => (
  <svg 
    width={lg ? 48 : sm ? 16 : 24} 
    height={lg ? 48 : sm ? 16 : 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="shield-icon"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
