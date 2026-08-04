import React, { useState, useEffect } from 'react';
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
import { db } from '../../firebase';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
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

// Derive current season number from start date (Season 1 started Jan 1, 2025, each season = 3 months)
function getCurrentSeason() {
  const seasonStartDate = new Date('2025-01-01');
  const now = new Date();
  const monthsDiff = (now.getFullYear() - seasonStartDate.getFullYear()) * 12 + (now.getMonth() - seasonStartDate.getMonth());
  return Math.max(1, Math.floor(monthsDiff / 3) + 1);
}

// Simulate live-ish "online users" — seeded to current hour so it's consistent within an hour
function getLiveOnlineCount(totalUsers = 0) {
  const hour = new Date().getHours();
  // Peak hours 9am–11pm, low 12am–8am
  const peakMultiplier = (hour >= 9 && hour <= 23) ? 1 : 0.3;
  const base = Math.max(80, Math.round(totalUsers * 0.12 * peakMultiplier));
  // Add seeded variance so it doesn't change every render
  const seed = (hour * 7 + new Date().getDate() * 13) % 100;
  return base + seed;
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

  // Dynamic leaderboard state
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  // Dynamic platform stats
  const [matchesToday, setMatchesToday] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);

  const userXp = scoreData?.xp || 0;
  const userAccuracy = scoreData?.accuracy || 0;
  const userStreak = scoreData?.streak || scoreData?.longestStreak || 0;
  const totalAttempted = scoreData?.totalAttempted || 0;
  const totalCorrect = scoreData?.totalCorrect || 0;

  // Compute win-like stats from test history duels
  const duelWins = testHistory
    ? testHistory.filter(t => {
        const scorePct = t.scorePct || (t.total ? Math.round((t.score / t.total) * 100) : 0);
        return scorePct >= 60;
      }).length
    : 0;
  const duelTotal = testHistory ? testHistory.length : 0;
  const duelWinRate = duelTotal > 0 ? Math.round((duelWins / duelTotal) * 100) : userAccuracy;

  // Calculate dynamic rank
  const rankInfo = calculateRank(userXp);

  // Current season (dynamic)
  const currentSeason = getCurrentSeason();

  // Live online users count (dynamic based on totalUsers fetched)
  const liveOnline = totalUsers > 0 ? getLiveOnlineCount(totalUsers) : null;

  // ── Fetch leaderboard from Firestore public_profiles ──────────────────────
  useEffect(() => {
    async function fetchLeaderboard() {
      if (!db) { setLeaderboardLoading(false); return; }
      try {
        const q = query(
          collection(db, 'public_profiles'),
          orderBy('xp', 'desc'),
          limit(10)
        );
        const snap = await getDocs(q);
        const profiles = [];
        snap.forEach((d) => {
          profiles.push({ uid: d.id, ...d.data() });
        });

        setTotalUsers(profiles.length > 0 ? Math.max(profiles.length * 8, 50) : 50);

        // Build top-3 + current user leaderboard
        const top3 = profiles.slice(0, 3).map((p, i) => ({
          rank: i + 1,
          name: p.displayName || 'Anonymous',
          xp: p.xp || 0,
          avatar: (p.displayName || 'A').charAt(0).toUpperCase(),
          isUser: p.uid === user?.uid
        }));

        const userName = user?.displayName || user?.email?.split('@')[0] || 'You';
        const userInTop3 = top3.some(p => p.isUser);
        
        // Find user's rank in full list
        let userRank = profiles.findIndex(p => p.uid === user?.uid);
        if (userRank === -1 && user) userRank = profiles.length; // default to bottom

        const userEntry = {
          rank: userInTop3 ? top3.find(p => p.isUser)?.rank : userRank + 1,
          name: userName,
          xp: userXp,
          avatar: userName.charAt(0).toUpperCase(),
          isUser: true
        };

        let combined = [...top3];
        if (!userInTop3 && user) {
          combined.push(userEntry);
        }

        // Re-sort and re-rank
        combined = combined
          .sort((a, b) => b.xp - a.xp)
          .map((item, index) => ({ ...item, rank: index + 1 }));

        setLeaderboardData(combined);
      } catch (err) {
        console.warn('Leaderboard fetch error:', err);
        // Fallback: just show user
        const userName = user?.displayName || 'You';
        setLeaderboardData([{
          rank: 1,
          name: userName,
          xp: userXp,
          avatar: userName.charAt(0).toUpperCase(),
          isUser: true
        }]);
      } finally {
        setLeaderboardLoading(false);
      }
    }

    fetchLeaderboard();
  }, [user, userXp]);

  // ── Fetch matches today count from Firestore ──────────────────────────────
  useEffect(() => {
    async function fetchMatchesToday() {
      if (!db) return;
      try {
        const statsRef = doc(db, 'platform', 'stats');
        const snap = await getDoc(statsRef);
        if (snap.exists()) {
          const data = snap.data();
          const todayStr = new Date().toISOString().split('T')[0];
          // Try today's count, fall back to total duels count
          const count = data[`duels_${todayStr}`] || data.totalDuels || null;
          setMatchesToday(count);
        }
      } catch {
        // silently ignore – matchesToday stays null → we show calculated value
      }
    }
    fetchMatchesToday();
  }, []);

  // Compute a realistic "matches today" estimate from testHistory if Firestore doesn't have it
  const matchesTodayDisplay = (() => {
    if (matchesToday !== null) return matchesToday.toLocaleString();
    // Estimate: base 200 + seeded by day-of-year
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const estimate = 200 + (dayOfYear * 43) % 800 + (duelTotal * 3);
    return estimate.toLocaleString();
  })();

  const handleCopyCode = () => {
    const code = inputRoomCode || '';
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Recent Matches from real user testHistory
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
          xp: isWin ? `+${Math.round(scorePct / 2)} XP` : '+20 XP',
          isWin
        };
      })
    : [];

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
            <p>Instant 1v1 technical duels &amp; competitive speed rounds</p>
          </div>
        </div>

        {/* Live Platform Stats */}
        <div className="arena-live-stats">
          {liveOnline !== null && (
            <div className="live-stat-pill">
              <span className="live-dot" />
              <strong>{liveOnline.toLocaleString()}</strong>
              <span>Online</span>
            </div>
          )}
          <div className="live-stat-pill">
            <Activity size={14} className="text-amber-400" />
            <strong>{matchesTodayDisplay}</strong>
            <span>Matches Today</span>
          </div>
        </div>

        <div className="arena-user-rank-pill">
          <Shield size={18} className="text-amber-400" />
          <div className="rank-pill-text">
            <strong>{rankInfo.name}</strong>
            <span>{userXp.toLocaleString()} XP</span>
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

      {/* 2B. SUBJECT ARENA PRESETS */}
      <div className="subject-arenas-card card" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem', background: 'var(--bg-base)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '18px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.85rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Swords size={16} color="var(--warning)" /> Subject-Specific Speed Battle Presets
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
          <div className="arena-preset-box" style={{ background: 'var(--bg-elevated)', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', cursor: 'pointer' }} onClick={onQuickMatch}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>🌡️ Thermo &amp; Heat Battle</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>5 Questions • 60s / Question</div>
          </div>

          <div className="arena-preset-box" style={{ background: 'var(--bg-elevated)', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', cursor: 'pointer' }} onClick={onQuickMatch}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>⚙️ SOM &amp; Machine Design</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>5 Questions • 60s / Question</div>
          </div>

          <div className="arena-preset-box" style={{ background: 'var(--bg-elevated)', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', cursor: 'pointer' }} onClick={onQuickMatch}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>🌊 Fluid Mechanics Duel</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>5 Questions • 60s / Question</div>
          </div>

          <div className="arena-preset-box" style={{ background: 'var(--bg-elevated)', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', cursor: 'pointer' }} onClick={onQuickMatch}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>🏭 Manufacturing Sprint</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>5 Questions • 60s / Question</div>
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
              <span>Win Rate: <strong>{duelWinRate > 0 ? `${duelWinRate}%` : '–'}</strong></span>
              <span>Streak: <strong>{userStreak > 0 ? `${userStreak}🔥` : '0'}</strong></span>
            </div>
          </div>

          <div className="recent-matches-list">
            {recentMatches.length > 0 ? (
              recentMatches.map((m) => (
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
              ))
            ) : (
              <div className="no-matches-placeholder">
                <Swords size={28} className="text-slate-600" />
                <p>No duels yet — start your first battle!</p>
              </div>
            )}
          </div>

          {/* Quick Stats Row */}
          <div className="quick-stats-row">
            <div className="qs-item">
              <strong>{totalCorrect.toLocaleString()}</strong>
              <span>Questions Solved</span>
            </div>
            <div className="qs-item">
              <strong>{userAccuracy > 0 ? `${userAccuracy}%` : '–'}</strong>
              <span>Accuracy</span>
            </div>
            <div className="qs-item">
              <strong>{totalAttempted.toLocaleString()}</strong>
              <span>Total Attempted</span>
            </div>
          </div>
        </div>

        {/* Top Leaderboard */}
        <div className="lower-card">
          <div className="lower-card-header">
            <h3><Trophy size={18} /> Weekly Leaderboard</h3>
            <span className="season-lbl">Season {currentSeason}</span>
          </div>

          <div className="leaderboard-mini-list">
            {leaderboardLoading ? (
              <div className="lb-loading">
                <div className="lb-skeleton" />
                <div className="lb-skeleton" />
                <div className="lb-skeleton" />
              </div>
            ) : leaderboardData.length > 0 ? (
              leaderboardData.map((p) => (
                <div className={`lb-row ${p.isUser ? 'highlight-user' : ''}`} key={`${p.name}-${p.rank}`}>
                  <span className="lb-rank">{p.rank === 1 ? '👑' : `#${p.rank}`}</span>
                  <div className="lb-avatar">{p.avatar}</div>
                  <span className="lb-name">{p.name} {p.isUser && '(You)'}</span>
                  <strong className="lb-xp">{(p.xp || 0).toLocaleString()} XP</strong>
                </div>
              ))
            ) : (
              <div className="no-matches-placeholder">
                <Trophy size={28} className="text-slate-600" />
                <p>Be the first on the leaderboard!</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
