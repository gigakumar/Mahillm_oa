import React, { useState } from 'react';
import { 
  Users, 
  Zap, 
  Trophy, 
  Calendar, 
  Swords,
  Copy,
  Share2,
  ArrowRight,
  TrendingUp,
  Activity,
  Award,
  Star,
  Gift,
  Clock,
  Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './SpeedDuelLobby.css';

export default function SpeedDuelLobby({ 
  onQuickMatch, 
  onCreateRoom, 
  onJoinRoom, 
  inputRoomCode, 
  setInputRoomCode 
}) {
  const { user } = useAuth();
  const [copiedCode, setCopiedCode] = useState(false);
  const [difficulty, setDifficulty] = useState('Mixed');

  // Simulated Data for Premium Esports Feel
  const LIVE_PLAYERS = "1,284";
  const AVG_WAIT = "6 sec";
  const MATCHES_TODAY = "14,820";
  const CURRENT_SEASON = "Season 3";
  const WEEKLY_LEADERBOARD = [
    { rank: 1, name: "Karthik N.", xp: 2450, avatar: "K" },
    { rank: 2, name: "Priya Sharma", xp: 2140, avatar: "P" },
    { rank: 3, name: "Anmol Verma", xp: 1980, avatar: "A" },
    { rank: 27, name: user?.displayName || "You", xp: 820, avatar: user?.displayName?.charAt(0) || "Y", isUser: true }
  ];
  const RECENT_MATCHES = [
    { result: 'Victory', opponent: 'Aryan Sharma', topic: 'Thermodynamics', score: '12 - 8', timeAgo: '5 min ago', xp: '+48 XP', isWin: true },
    { result: 'Defeat', opponent: 'Rohit Verma', topic: 'Fluid Mechanics', score: '9 - 10', timeAgo: '25 min ago', xp: '+28 XP', isWin: false },
    { result: 'Victory', opponent: 'Aditya Singh', topic: 'Strength of Materials', score: '14 - 6', timeAgo: '1 hr ago', xp: '+52 XP', isWin: true }
  ];
  const FRIENDS_ONLINE = [
    { name: 'Amit Kumar', status: 'Online', action: 'Challenge', color: 'bg-green-500' },
    { name: 'Rahul Gupta', status: 'In Match', action: 'Spectate', color: 'bg-blue-500' },
    { name: 'Shivam Patel', status: 'Online', action: 'Challenge', color: 'bg-green-500' }
  ];
  const LIVE_FEED = [
    { text: "Amit Kumar defeated Rahul Gupta", time: "2m ago" },
    { text: "Shivam Patel reached Gold III", time: "10m ago" },
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
              <Swords size={32} className="hero-icon" />
              <h1>Speed Duel Arena</h1>
            </div>
            <p>Challenge anyone worldwide or test your speed against AI in real-time technical battles!</p>
            
            <div className="hero-stats-row">
              <div className="hero-stat">
                <Users size={20} className="stat-icon purple" />
                <div className="stat-info">
                  <strong>{LIVE_PLAYERS}</strong>
                  <span><span className="live-dot"></span> Players Online</span>
                </div>
              </div>
              <div className="hero-stat">
                <Zap size={20} className="stat-icon yellow" />
                <div className="stat-info">
                  <strong>{AVG_WAIT}</strong>
                  <span>Average Wait Time</span>
                </div>
              </div>
              <div className="hero-stat">
                <Trophy size={20} className="stat-icon orange" />
                <div className="stat-info">
                  <strong>{MATCHES_TODAY}</strong>
                  <span>Matches Today</span>
                </div>
              </div>
              <div className="hero-stat">
                <Calendar size={20} className="stat-icon pink" />
                <div className="stat-info">
                  <strong>{CURRENT_SEASON}</strong>
                  <span>Current Season</span>
                </div>
              </div>
            </div>
          </div>
          <div className="hero-graphic">
            {/* VS Graphic representation */}
            <div className="vs-avatar left"></div>
            <div className="vs-text">VS</div>
            <div className="vs-avatar right"></div>
          </div>
        </div>

        {/* BATTLE MODES */}
        <div className="mode-cards-grid">
          {/* Quick Match */}
          <div className="mode-card mode-quick">
            <div className="mode-card-header">
              <div className="mode-icon-circle"><Zap size={24} /></div>
              <span className="badge-hot">HOT</span>
            </div>
            <h3>Quick Match</h3>
            <p>Find random opponent in seconds</p>
            <div className="mode-meta">
              <div className="avatar-group">
                <div className="avatar">A</div>
                <div className="avatar">R</div>
                <div className="avatar">K</div>
                <span>+1.2K online</span>
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
              <div className="mode-icon-circle"><Users size={24} /></div>
            </div>
            <h3>Private Room</h3>
            <p>Invite friends & duel in your room</p>
            <div className="room-code-display">
               ABX-82KF <Copy size={16} />
            </div>
            <div className="private-actions">
              <button className="btn btn-outline-green" onClick={onCreateRoom}>Copy Code</button>
              <button className="btn btn-outline-green">Share Invite</button>
            </div>
            <div className="mode-footer">Play with friends</div>
          </div>

          {/* AI Duel */}
          <div className="mode-card mode-ai">
             <div className="mode-card-header">
              <div className="mode-icon-circle"><Settings size={24} /></div>
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
               <span>Medium</span>
            </div>
            <button className="btn mode-btn btn-ai" onClick={onQuickMatch}>
              Choose AI Level
            </button>
            <div className="mode-footer">Improve with AI</div>
          </div>

          {/* Ranked Duel */}
          <div className="mode-card mode-ranked">
            <div className="mode-card-header">
              <div className="mode-icon-circle"><Trophy size={24} /></div>
            </div>
            <h3>Ranked Duel</h3>
            <p>Compete & climb the leaderboard</p>
            <div className="rank-display">
              <ShieldIcon />
              <div className="rank-info">
                <strong>Silver II</strong>
                <div className="stars"><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12}/></div>
              </div>
            </div>
            <button className="btn mode-btn btn-ranked">
              View Rankings
            </button>
            <div className="mode-footer text-gold">Earn XP & Rewards</div>
          </div>
        </div>

        {/* JOIN ROOM BAR */}
        <div className="join-room-bar card">
          <div className="join-icon"><Users size={20} /> Join Existing Room</div>
          <input 
            type="text" 
            placeholder="Enter room code (e.g. DUEL-9K2F)" 
            value={inputRoomCode}
            onChange={(e) => setInputRoomCode(e.target.value)}
          />
          <button className="btn btn-primary" onClick={() => onJoinRoom(inputRoomCode)}>
            Join Match <ArrowRight size={16} />
          </button>
        </div>

        {/* CUSTOMIZE DUEL / FILTERS */}
        <div className="customize-duel card">
          <div className="customize-header">
            <Users size={16} /> Customize Your Duel
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

            <div className="dropdowns">
               <div className="dropdown">
                 <label>Question Source</label>
                 <select><option>All Topics</option></select>
               </div>
               <div className="dropdown">
                 <label>No. of Questions</label>
                 <select><option>20 Questions</option></select>
               </div>
               <div className="dropdown">
                 <label>Time per Question</label>
                 <select><option>30 Seconds</option></select>
               </div>
               <button className="btn btn-outline btn-more"><Settings size={14}/> More Filters</button>
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
              {RECENT_MATCHES.map((match, i) => (
                <div className="feed-item match-item" key={i}>
                  <div className={`match-result ${match.isWin ? 'win' : 'loss'}`}>
                    {match.result}
                  </div>
                  <div className="match-opponent">vs {match.opponent}</div>
                  <div className="match-topic">{match.topic}</div>
                  <div className="match-score"><strong>{match.score}</strong></div>
                  <div className="match-meta">
                    <span className="time">{match.timeAgo}</span>
                    <span className={`xp ${match.isWin ? 'text-green' : 'text-gray'}`}>{match.xp}</span>
                  </div>
                </div>
              ))}
              <button className="btn-view-all">View All Matches <ArrowRight size={14}/></button>
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
                   <div className="friend-avatar">{friend.name.charAt(0)}</div>
                   <div className="friend-info">
                     <strong>{friend.name}</strong>
                     <span><span className={`status-dot ${friend.color}`}></span> {friend.status}</span>
                   </div>
                   <button className="btn btn-outline btn-sm">{friend.action}</button>
                 </div>
               ))}
               <button className="btn-view-all">View All Friends <ArrowRight size={14}/></button>
            </div>
          </div>

          {/* Live Feed */}
          <div className="feed-card card">
            <div className="feed-header">
              <Activity size={16} /> Live Feed
            </div>
            <div className="feed-list">
               {LIVE_FEED.map((feed, i) => (
                 <div className="feed-item live-item" key={i}>
                   <div className="feed-avatar"></div>
                   <div className="feed-content">
                     <p>{feed.text}</p>
                     <span>{feed.time}</span>
                   </div>
                 </div>
               ))}
               <button className="btn-view-all">View Full Feed <ArrowRight size={14}/></button>
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
              <h3>Silver II</h3>
              <div className="stars"><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14}/></div>
              <div className="xp-text"><strong>120</strong> / 200 XP</div>
            </div>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{width: '60%'}}></div>
          </div>
          <div className="next-rank">
            <span>Next Rank</span>
            <span>Gold III <ShieldIcon sm /></span>
          </div>
        </div>

        {/* Weekly Leaderboard */}
        <div className="sidebar-card card">
          <div className="card-header">
            <span>Weekly Leaderboard</span>
            <button className="btn-link">View All</button>
          </div>
          <div className="leaderboard-list">
            {WEEKLY_LEADERBOARD.map(p => (
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
              <strong>74% <span className="trend up">▲+3</span></strong>
            </div>
            <div className="stat-box">
              <span className="stat-lbl">Matches Won</span>
              <strong>8</strong>
            </div>
            <div className="stat-box">
              <span className="stat-lbl">Best Streak</span>
              <strong>8</strong>
            </div>
            <div className="stat-box">
              <span className="stat-lbl">Accuracy</span>
              <strong>82%</strong>
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
            <div className="achievement-badge purple"><Award size={20} /></div>
            <div className="achievement-badge blue"><Award size={20} /></div>
            <div className="achievement-badge gold"><Award size={20} /></div>
            <div className="achievement-badge green"><Award size={20} /></div>
            <div className="achievement-more">+12</div>
          </div>
        </div>

        {/* Daily Reward */}
        <div className="sidebar-card card reward-card">
          <div className="card-header"><Gift size={16} /> Daily Reward</div>
          <p>Play 1 more match to claim your daily reward!</p>
          <div className="reward-actions">
            <button className="btn btn-primary">Claim Reward</button>
            <div className="reward-amt"><Star size={16} className="text-yellow-400"/> 100 XP</div>
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
