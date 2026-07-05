import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Trophy, Medal, Star, Shield, Award } from 'lucide-react';
import './Leaderboard.css';
import { useAuth } from '../contexts/AuthContext';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('xp', 'desc'), limit(50));
        const querySnapshot = await getDocs(q);
        
        const leaderboardData = [];
        querySnapshot.forEach((doc) => {
          leaderboardData.push({ id: doc.id, ...doc.data() });
        });
        
        setLeaders(leaderboardData);
      } catch (error) {
        console.error("Error fetching leaderboard: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

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
                    <th>Accuracy</th>
                    <th>Questions</th>
                    <th>Total XP</th>
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
                          <td>
                            <div className="stat-with-icon">
                              <Shield size={14} className={accuracy >= 80 ? 'text-success' : accuracy >= 50 ? 'text-warning' : 'text-danger'} />
                              {accuracy}%
                            </div>
                          </td>
                          <td>{leader.totalAttempted || 0}</td>
                          <td className="xp-cell">
                            <div className="stat-with-icon xp-highlight">
                              <Star size={14} className="gold" fill="var(--warning)" style={{ border: 'none' }} />
                              {leader.xp || 0}
                            </div>
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
