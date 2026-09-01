import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Trophy,
  Sparkles,
  Menu,
  X,
  User,
  Calculator,
  Flame
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useScore } from '../contexts/ScoreContext';
import CommandPalette from './CommandPalette';
import FocusTimerModal from './FocusTimerModal';
import FocusAudioPlayer from './FocusAudioPlayer';
import GateCalculatorModal from './GateCalculatorModal';
import './HeaderBar.css';

export default function HeaderBar({ mobileOpen, setMobileOpen }) {
  const { user } = useAuth();
  const { scoreData } = useScore();
  const navigate = useNavigate();
  const [calcOpen, setCalcOpen] = React.useState(false);

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

        {/* Global Command Palette Trigger */}
        <CommandPalette />
      </div>

      {/* Right Action Counters, Focus Timer & Audio Beats */}
      <div className="header-right">
        {/* GATE Scientific Calculator Modal Trigger */}
        <button className="header-stat-pill calc-pill" onClick={() => setCalcOpen(true)} title="Open Official GATE Scientific Calculator">
          <Calculator size={15} className="text-amber-400" />
          <span className="pill-val">GATE Calc</span>
        </button>

        <GateCalculatorModal isOpen={calcOpen} onClose={() => setCalcOpen(false)} />

        {/* Ambient Study Beats Player */}
        <FocusAudioPlayer />

        {/* Focus Stopwatch & Pomodoro Timer */}
        <FocusTimerModal />

        {scoreData?.streak > 0 && (
          <div className="header-stat-pill streak-pill" title={`${scoreData.streak} day streak!`}>
            <Flame size={15} className="pill-icon" style={{ color: '#f97316' }} />
            <span className="pill-val" style={{ color: '#f97316', fontWeight: 700 }}>{scoreData.streak}🔥</span>
          </div>
        )}

        {/* XP / Sparkle Pill */}
        <div className="header-stat-pill xp-pill" onClick={() => navigate('/stats')} title="Experience Points (XP) earned from practice">
          <Sparkles size={16} className="pill-icon text-amber-400" />
          <span className="pill-val">{scoreData?.xp || 0} XP</span>
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
