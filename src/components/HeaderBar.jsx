import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronDown, 
  Trophy, 
  Sparkles, 
  Menu, 
  X,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useScore } from '../contexts/ScoreContext';
import './HeaderBar.css';

export default function HeaderBar({ mobileOpen, setMobileOpen }) {
  const { user } = useAuth();
  const { scoreData } = useScore();
  const navigate = useNavigate();

  const firstName = user?.displayName?.split(' ')[0] || 'harshit';
  const photoUrl = user?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';

  return (
    <header className="header-bar">
      {/* Left Greeting & Branch Selector */}
      <div className="header-left">
        <button className="mobile-toggle-btn" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="user-greeting-pill" onClick={() => navigate('/profile')}>
          <img src={photoUrl} alt="User Avatar" className="user-avatar-img" />
          <div className="greeting-text">
            <span className="greeting-name">Hey, {firstName}!</span>
            <div className="branch-dropdown-tag">
              <span>GATE Mechanical</span>
              <ChevronDown size={14} className="dropdown-arrow" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Action Counters */}
      <div className="header-right">
        {/* XP / Sparkle Pill */}
        <div className="header-stat-pill xp-pill" onClick={() => navigate('/stats')} title="Experience Points (XP) earned from practice">
          <Sparkles size={16} className="pill-icon text-amber-400" />
          <span className="pill-val">{scoreData?.totalXp || 1476} XP</span>
          <span className="pill-arrow">›</span>
        </div>

        {/* Trophy / Leaderboard Pill */}
        <div className="header-stat-pill trophy-pill" onClick={() => navigate('/leaderboard')} title="Leaderboard & Rank Standings">
          <Trophy size={16} className="pill-icon text-indigo-400" />
          <span className="pill-val" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Rank</span>
          <span className="pill-arrow">›</span>
        </div>
      </div>
    </header>
  );
}
