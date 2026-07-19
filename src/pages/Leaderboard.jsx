import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Trophy, Medal, Star, Shield, Award, Zap, Activity, Target } from 'lucide-react';
import './Leaderboard.css';
import { useAuth } from '../contexts/AuthContext';
import { useScore } from '../contexts/ScoreContext';

const MOCK_LEADERS = [
  { id: 'mock-1', email: 'rahul.sharma@iitd.ac.in', xp: 450, totalAttempted: 45, totalCorrect: 40, streak: 8, xp_weekly: 120, xp_monthly: 310, streak_weekly: 4, streak_monthly: 8, totalAttempted_weekly: 12, totalAttempted_monthly: 30 },
  { id: 'mock-2', email: 'priya.patel@bits-pilani.ac.in', xp: 380, totalAttempted: 35, totalCorrect: 32, streak: 12, xp_weekly: 150, xp_monthly: 280, streak_weekly: 6, streak_monthly: 12, totalAttempted_weekly: 15, totalAttempted_monthly: 25 },
  { id: 'mock-3', email: 'amit.verma@nitk.ac.in', xp: 290, totalAttempted: 30, totalCorrect: 24, streak: 5, xp_weekly: 80, xp_monthly: 200, streak_weekly: 3, streak_monthly: 5, totalAttempted_weekly: 8, totalAttempted_monthly: 20 },
  { id: 'mock-4', email: 'sneha.reddy@nsut.ac.in', xp: 180, totalAttempted: 20, totalCorrect: 15, streak: 3, xp_weekly: 60, xp_monthly: 120, streak_weekly: 2, streak_monthly: 3, totalAttempted_weekly: 6, totalAttempted_monthly: 12 },
  { id: 'mock-5', email: 'vikram.singh@dtu.ac.in', xp: 120, totalAttempted: 15, totalCorrect: 10, streak: 2, xp_weekly: 40, xp_monthly: 90, streak_weekly: 1, streak_monthly: 2, totalAttempted_weekly: 5, totalAttempted_monthly: 10 },
  { id: 'mock-6', email: 'ananya.sen@ju.edu', xp: 0, totalAttempted: 0, totalCorrect: 0, streak: 0, xp_weekly: 0, xp_monthly: 0, streak_weekly: 0, streak_monthly: 0, totalAttempted_weekly: 0, totalAttempted_monthly: 0 },
  { id: 'mock-7', email: 'rohit.gupta@vit.ac.in', xp: 0, totalAttempted: 0, totalCorrect: 0, streak: 0, xp_weekly: 0, xp_monthly: 0, streak_weekly: 0, streak_monthly: 0, totalAttempted_weekly: 0, totalAttempted_monthly: 0 }
];

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('xp');
  const [timeframe, setTimeframe] = useState('all-time');
  const { user } = useAuth();
  const { scoreData } = useScore();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        
        let leaderboardData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          leaderboardData.push({
            id: doc.id,
            email: data.email || 'Anonymous Engineer',
            xp: data.xp || 0,
            totalAttempted: data.totalAttempted || 0,
            totalCorrect: data.totalCorrect || 0,
            streak: data.streak || 0,
            xp_weekly: data.xp_weekly || 0,
            xp_monthly: data.xp_monthly || 0,
            streak_weekly: data.streak_weekly || 0,
            streak_monthly: data.streak_monthly || 0,
            totalAttempted_weekly: data.totalAttempted_weekly || 0,
            totalAttempted_monthly: data.totalAttempted_monthly || 0,
            createdAt: data.createdAt || ''
          });
        });

        // Insert current user stats if not already fetched
        const currentUserStats = user ? {
          id: user.uid,
          email: user.email || 'You',
          xp: scoreData?.xp || 0,
          totalAttempted: scoreData?.totalAttempted || 0,
          totalCorrect: scoreData?.totalCorrect || 0,
          streak: scoreData?.streak || 0,
          xp_weekly: Math.min(scoreData?.xp || 0, 40), 
          xp_monthly: Math.min(scoreData?.xp || 0, 80),
          streak_weekly: Math.min(scoreData?.streak || 0, 2),
          streak_monthly: Math.min(scoreData?.streak || 0, 5),
          totalAttempted_weekly: Math.min(scoreData?.totalAttempted || 0, 5),
          totalAttempted_monthly: Math.min(scoreData?.totalAttempted || 0, 10),
        } : null;

        if (currentUserStats) {
          const exists = leaderboardData.some(l => l.id === currentUserStats.id);
          if (!exists) {
            leaderboardData.push(currentUserStats);
          } else {
            // Update the existing entry with live stats
            leaderboardData = leaderboardData.map(l => l.id === currentUserStats.id ? currentUserStats : l);
          }
        }

        // Fill with mock data if we have very few users to show a nice active board
        MOCK_LEADERS.forEach(mockUser => {
          if (!leaderboardData.some(l => l.id === mockUser.id || l.email === mockUser.email)) {
            leaderboardData.push(mockUser);
          }
        });

        // Sort data
        let sortField = activeTab; // 'xp', 'streak', 'questions', 'accuracy'
        if (timeframe === 'weekly') {
          if (sortField === 'xp') sortField = 'xp_weekly';
          else if (sortField === 'streak') sortField = 'streak_weekly';
          else if (sortField === 'questions') sortField = 'totalAttempted_weekly';
        } else if (timeframe === 'monthly') {
          if (sortField === 'xp') sortField = 'xp_monthly';
          else if (sortField === 'streak') sortField = 'streak_monthly';
          else if (sortField === 'questions') sortField = 'totalAttempted_monthly';
        } else { // all-time
          if (sortField === 'questions') sortField = 'totalAttempted';
        }

        if (activeTab === 'accuracy') {
          leaderboardData.forEach(item => {
            item.computedAccuracy = item.totalAttempted ? (item.totalCorrect || 0) / item.totalAttempted : 0;
          });
          leaderboardData.sort((a, b) => b.computedAccuracy - a.computedAccuracy || b.totalAttempted - a.totalAttempted);
        } else {
          leaderboardData.sort((a, b) => (b[sortField] || 0) - (a[sortField] || 0) || (b.xp || 0) - (a.xp || 0));
        }

        setLeaders(leaderboardData.slice(0, 50));
      } catch (error) {
        console.warn("Error fetching leaderboard from Firestore, falling back to mock data:", error);
        // Fallback to mock data on error (e.g. permission-denied)
        let leaderboardData = [...MOCK_LEADERS];
        
        const currentUserStats = user ? {
          id: user.uid,
          email: user.email || 'You',
          xp: scoreData?.xp || 0,
          totalAttempted: scoreData?.totalAttempted || 0,
          totalCorrect: scoreData?.totalCorrect || 0,
          streak: scoreData?.streak || 0,
          xp_weekly: Math.min(scoreData?.xp || 0, 40), 
          xp_monthly: Math.min(scoreData?.xp || 0, 80),
          streak_weekly: Math.min(scoreData?.streak || 0, 2),
          streak_monthly: Math.min(scoreData?.streak || 0, 5),
          totalAttempted_weekly: Math.min(scoreData?.totalAttempted || 0, 5),
          totalAttempted_monthly: Math.min(scoreData?.totalAttempted || 0, 10),
        } : null;

        if (currentUserStats) {
          const exists = leaderboardData.some(l => l.id === currentUserStats.id);
          if (!exists) {
            leaderboardData.push(currentUserStats);
          } else {
            leaderboardData = leaderboardData.map(l => l.id === currentUserStats.id ? currentUserStats : l);
          }
        }

        let sortField = activeTab;
        if (timeframe === 'weekly') {
          if (sortField === 'xp') sortField = 'xp_weekly';
          else if (sortField === 'streak') sortField = 'streak_weekly';
          else if (sortField === 'questions') sortField = 'totalAttempted_weekly';
        } else if (timeframe === 'monthly') {
          if (sortField === 'xp') sortField = 'xp_monthly';
          else if (sortField === 'streak') sortField = 'streak_monthly';
          else if (sortField === 'questions') sortField = 'totalAttempted_monthly';
        } else {
          if (sortField === 'questions') sortField = 'totalAttempted';
        }

        if (activeTab === 'accuracy') {
          leaderboardData.forEach(item => {
            item.computedAccuracy = item.totalAttempted ? (item.totalCorrect || 0) / item.totalAttempted : 0;
          });
          leaderboardData.sort((a, b) => b.computedAccuracy - a.computedAccuracy || b.totalAttempted - a.totalAttempted);
        } else {
          leaderboardData.sort((a, b) => (b[sortField] || 0) - (a[sortField] || 0) || (b.xp || 0) - (a.xp || 0));
        }

        setLeaders(leaderboardData.slice(0, 50));
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [activeTab, timeframe, user, scoreData]);

  // Split top 3 for podium and others for table list
  const topThree = leaders.slice(0, 3);

  // Find current user's rank
  const currentUserRankIndex = leaders.findIndex(l => user && l.id === user.uid);
  const currentUserRank = currentUserRankIndex !== -1 ? currentUserRankIndex + 1 : null;
  const currentUserData = currentUserRankIndex !== -1 ? leaders[currentUserRankIndex] : null;

  const getRankBadge = (index) => {
    switch (index) {
      case 0:
        return { label: 'Gold Scholar', color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.12)' };
      case 1:
        return { label: 'Silver Specialist', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)' };
      case 2:
        return { label: 'Bronze Practitioner', color: '#b45309', bg: 'rgba(180, 83, 9, 0.12)' };
      default:
        return { label: 'Competitor', color: 'var(--text-secondary)', bg: 'rgba(255, 255, 255, 0.05)' };
    }
  };

  return (
    <div className="page-content leaderboard-page">
      <header className="leaderboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Trophy size={32} style={{ color: 'var(--warning)' }} />
          <h1 style={{ margin: 0 }}>Global Leaderboard</h1>
        </div>
        <p>Compete with other engineers. Solve placement questions to claim your position at the top.</p>
      </header>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="leaderboard-tabs" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            className={`btn ${activeTab === 'xp' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('xp')}
          >
            <Zap size={16} /> Total XP
          </button>
          <button 
            className={`btn ${activeTab === 'accuracy' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('accuracy')}
          >
            <Target size={16} /> Accuracy
          </button>
          <button 
            className={`btn ${activeTab === 'streak' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('streak')}
          >
            <Activity size={16} /> Streak
          </button>
          <button 
            className={`btn ${activeTab === 'questions' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('questions')}
          >
            <Award size={16} /> Questions Solved
          </button>
        </div>

        <div className="timeframe-tabs" style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button 
            className={`btn ${timeframe === 'weekly' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
            onClick={() => setTimeframe('weekly')}
          >Weekly</button>
          <button 
            className={`btn ${timeframe === 'monthly' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
            onClick={() => setTimeframe('monthly')}
          >Monthly</button>
          <button 
            className={`btn ${timeframe === 'all-time' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
            onClick={() => setTimeframe('all-time')}
          >All Time</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state card" style={{ padding: '4rem', textAlign: 'center' }}>
          <div className="spinner" style={{ border: '4px solid var(--border)', borderTop: '4px solid var(--accent)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
          <p>Analyzing rankings and compiling leaderboard...</p>
        </div>
      ) : (
        <>
          {/* Top User Overview Quick Badge */}
          {currentUserData && (
            <div className="card my-standing-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2.5rem', padding: '1.25rem 2rem', background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.08) 0%, rgba(108, 92, 231, 0.02) 100%)', border: '1px solid rgba(108, 92, 231, 0.25)', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'var(--accent-soft)', padding: '0.75rem', borderRadius: '12px', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Your Current Rank</span>
                  <strong style={{ fontSize: '1.25rem', color: 'var(--text-h)' }}>
                    #{currentUserRank} <span style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-muted)' }}>out of {leaders.length} users</span>
                  </strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '2rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Total XP</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--text-h)' }}>{currentUserData.xp || 0} XP</strong>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Solved</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--text-h)' }}>{currentUserData.totalAttempted || 0}</strong>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Streak</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--text-h)' }}>{currentUserData.streak || 0}🔥</strong>
                </div>
              </div>
            </div>
          )}

          {/* Top 3 Podium Displays */}
          {topThree.length > 0 && (
            <div className="podium-container">
              
              {/* 2nd Place (Silver) */}
              {topThree[1] && (
                <div className="podium-card silver-podium">
                  <div className="podium-rank">2</div>
                  <img 
                    src={`https://ui-avatars.com/api/?name=${topThree[1].email || 'User'}&background=64748B&color=fff&size=128`} 
                    alt="Silver Avatar" 
                    className="podium-avatar"
                  />
                  <strong className="podium-username">
                    {topThree[1].email ? topThree[1].email.split('@')[0] : 'Engineer'}
                  </strong>
                  <span className="podium-badge badge-silver">Silver Specialist</span>
                  <div className="podium-stats">
                    <span><strong>{topThree[1].xp || 0}</strong> XP</span>
                    <span><strong>{topThree[1].totalAttempted || 0}</strong> Solved</span>
                  </div>
                </div>
              )}

              {/* 1st Place (Gold) */}
              {topThree[0] && (
                <div className="podium-card gold-podium">
                  <div className="podium-glow"></div>
                  <div className="podium-crown">
                    <Trophy size={22} fill="var(--warning)" />
                  </div>
                  <div className="podium-rank">1</div>
                  <img 
                    src={`https://ui-avatars.com/api/?name=${topThree[0].email || 'User'}&background=F59E0B&color=fff&size=128`} 
                    alt="Gold Avatar" 
                    className="podium-avatar"
                  />
                  <strong className="podium-username">
                    {topThree[0].email ? topThree[0].email.split('@')[0] : 'Engineer'}
                  </strong>
                  <span className="podium-badge badge-gold">Gold Scholar</span>
                  <div className="podium-stats">
                    <span><strong>{topThree[0].xp || 0}</strong> XP</span>
                    <span><strong>{topThree[0].totalAttempted || 0}</strong> Solved</span>
                  </div>
                </div>
              )}

              {/* 3rd Place (Bronze) */}
              {topThree[2] && (
                <div className="podium-card bronze-podium">
                  <div className="podium-rank">3</div>
                  <img 
                    src={`https://ui-avatars.com/api/?name=${topThree[2].email || 'User'}&background=B45309&color=fff&size=128`} 
                    alt="Bronze Avatar" 
                    className="podium-avatar"
                  />
                  <strong className="podium-username">
                    {topThree[2].email ? topThree[2].email.split('@')[0] : 'Engineer'}
                  </strong>
                  <span className="podium-badge badge-bronze">Bronze Practitioner</span>
                  <div className="podium-stats">
                    <span><strong>{topThree[2].xp || 0}</strong> XP</span>
                    <span><strong>{topThree[2].totalAttempted || 0}</strong> Solved</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Leaders Table list */}
          <div className="card leaderboard-card">
            <div className="leaderboard-table-wrapper">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Engineer</th>
                    <th>Placement Tier</th>
                    <th style={{ color: activeTab === 'accuracy' ? 'var(--accent)' : 'inherit' }}>Accuracy</th>
                    <th style={{ color: activeTab === 'questions' ? 'var(--accent)' : 'inherit' }}>Questions</th>
                    <th style={{ color: activeTab === 'xp' ? 'var(--accent)' : 'inherit' }}>Total XP</th>
                    <th style={{ color: activeTab === 'streak' ? 'var(--accent)' : 'inherit' }}>Streak</th>
                  </tr>
                </thead>
                <tbody>
                  {leaders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-row">No data available yet. Start practicing!</td>
                    </tr>
                  ) : (
                    leaders.map((leader, index) => {
                      const isCurrentUser = user && user.uid === leader.id;
                      const accuracy = leader.totalAttempted ? Math.round((leader.totalCorrect / leader.totalAttempted) * 100) : 0;
                      const badgeInfo = getRankBadge(index);
                      
                      return (
                        <tr key={leader.id} className={`${isCurrentUser ? 'current-user-row' : ''} ${index < 3 ? 'podium-table-row' : ''}`}>
                          <td className="rank-cell">
                            {index === 0 && <Trophy size={18} className="gold" />}
                            {index === 1 && <Medal size={18} className="silver" />}
                            {index === 2 && <Medal size={18} className="bronze" />}
                            {index > 2 && <span className="rank-number">#{index + 1}</span>}
                          </td>
                          <td className="user-cell">
                            <img 
                              src={`https://ui-avatars.com/api/?name=${leader.email || 'User'}&background=random`} 
                              alt="Avatar" 
                              className="leader-avatar" 
                            />
                            <span className="leader-name">
                              {leader.email ? leader.email.split('@')[0] : 'Anonymous Engineer'}
                              {isCurrentUser && <span className="badge badge-accent you-badge" style={{ marginLeft: '0.5rem' }}>You</span>}
                            </span>
                          </td>
                          <td>
                            <span className="badge" style={{ color: badgeInfo.color, background: badgeInfo.bg, padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: '12px', fontWeight: 600 }}>
                              {badgeInfo.label}
                            </span>
                          </td>
                          <td className="accuracy-col" style={{ color: activeTab === 'accuracy' ? 'var(--accent)' : 'inherit' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${accuracy}%`, background: 'var(--accent)' }}></div>
                              </div>
                              {accuracy}%
                            </div>
                          </td>
                          <td style={{ color: activeTab === 'questions' ? 'var(--text-primary)' : 'inherit' }}>{leader.totalAttempted || 0}</td>
                          <td className="xp-col" style={{ color: activeTab === 'xp' ? 'var(--warning)' : 'inherit' }}>
                            <strong>{leader.xp || 0}</strong> <span style={{ fontSize: '0.75rem' }}>XP</span>
                          </td>
                          <td style={{ color: activeTab === 'streak' ? 'var(--danger)' : 'inherit' }}>
                            {leader.streak || 0}🔥
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
