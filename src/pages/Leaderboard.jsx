import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Trophy, Medal, Star, Shield } from 'lucide-react';
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

  const getRankIcon = (index) => {
    switch(index) {
      case 0: return <Trophy size={24} className="gold" />;
      case 1: return <Medal size={24} className="silver" />;
      case 2: return <Medal size={24} className="bronze" />;
      default: return <span className="rank-number">#{index + 1}</span>;
    }
  };

  return (
    <div className="page-content leaderboard-page">
      <header className="leaderboard-header">
        <h1>Global Leaderboard 🌍</h1>
        <p>Compete with other engineers. Earn XP by completing practice questions.</p>
      </header>

      <div className="card leaderboard-card">
        {loading ? (
          <div className="loading-state">Loading rankings...</div>
        ) : (
          <div className="leaderboard-table-wrapper">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Engineer</th>
                  <th>Accuracy</th>
                  <th>Questions</th>
                  <th>Total XP</th>
                </tr>
              </thead>
              <tbody>
                {leaders.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-row">No data available yet. Start practicing!</td>
                  </tr>
                ) : (
                  leaders.map((leader, index) => {
                    const isCurrentUser = user && user.uid === leader.id;
                    const accuracy = leader.totalAttempted ? Math.round((leader.totalCorrect / leader.totalAttempted) * 100) : 0;
                    
                    return (
                      <tr key={leader.id} className={isCurrentUser ? 'current-user-row' : ''}>
                        <td className="rank-cell">
                          {getRankIcon(index)}
                        </td>
                        <td className="user-cell">
                          <img 
                            src={`https://ui-avatars.com/api/?name=${leader.email || 'User'}&background=random`} 
                            alt="Avatar" 
                            className="leader-avatar" 
                          />
                          <span className="leader-name">
                            {leader.email ? leader.email.split('@')[0] : 'Anonymous Engineer'}
                            {isCurrentUser && <span className="badge badge-accent you-badge">You</span>}
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
                            <Star size={14} className="gold" />
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
        )}
      </div>
    </div>
  );
}
