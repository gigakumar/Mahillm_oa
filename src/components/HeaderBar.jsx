import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronDown, 
  Trophy, 
  Sparkles, 
  Menu, 
  X,
  User,
  Check,
  Calculator,
  Cog,
  Crown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useScore } from '../contexts/ScoreContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import './HeaderBar.css';

export default function HeaderBar({ mobileOpen, setMobileOpen }) {
  const { user } = useAuth();
  const { scoreData } = useScore();
  const { tierDetails, openPricingModal } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const firstName = user?.displayName?.split(' ')[0] || 'harshit';
  const photoUrl = user?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';

  // Determine current active stream based on URL
  const isAptitudePage = location.pathname.startsWith('/aptitude');
  const currentBranchLabel = isAptitudePage ? 'General Aptitude' : 'GATE Mechanical';

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectBranch = (branchPath) => {
    setDropdownOpen(false);
    navigate(branchPath);
  };

  return (
    <header className="header-bar">
      {/* Left Greeting & Branch Selector */}
      <div className="header-left">
        <button className="mobile-toggle-btn" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* User Profile Pill (Avatar + Greeting) */}
        <div className="user-profile-clickable" onClick={() => navigate('/profile')} title="View Profile">
          <img src={photoUrl} alt="User Avatar" className="user-avatar-img" />
          <span className="greeting-name">Hey, {firstName}!</span>
        </div>

        {/* Branch Selector Dropdown (Completely Independent Element) */}
        <div className="branch-selector-wrapper" ref={dropdownRef}>
          <button 
            type="button"
            className="branch-dropdown-tag"
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen((prev) => !prev);
            }}
            title="Click to switch target exam stream"
          >
            <span>{currentBranchLabel}</span>
            <ChevronDown size={14} className={`dropdown-arrow ${dropdownOpen ? 'rotated' : ''}`} />
          </button>

          {/* Branch Switcher Dropdown Popover */}
          {dropdownOpen && (
            <div className="branch-menu-dropdown">
              <div className="branch-menu-header">SELECT STREAM</div>
              
              <div 
                className={`branch-menu-item ${!isAptitudePage ? 'active' : ''}`}
                onClick={() => handleSelectBranch('/')}
              >
                <div className="branch-item-left">
                  <span className="branch-item-icon">⚙️</span>
                  <div>
                    <div className="branch-item-title">GATE Mechanical</div>
                    <div className="branch-item-sub">Thermodynamics, SOM, FM & Mfg</div>
                  </div>
                </div>
                {!isAptitudePage && <Check size={16} className="branch-check" />}
              </div>

              <div 
                className={`branch-menu-item ${isAptitudePage ? 'active' : ''}`}
                onClick={() => handleSelectBranch('/aptitude')}
              >
                <div className="branch-item-left">
                  <span className="branch-item-icon">🧮</span>
                  <div>
                    <div className="branch-item-title">General Aptitude</div>
                    <div className="branch-item-sub">Quants, LR, DI & Spatial Aptitude</div>
                  </div>
                </div>
                {isAptitudePage && <Check size={16} className="branch-check" />}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Action Counters */}
      <div className="header-right">
        {/* Subscription Tier Pill */}
        <div 
          className="header-stat-pill tier-pill" 
          onClick={() => navigate('/pricing')} 
          title="Click to view subscription plan details & upgrade"
          style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: tierDetails.color }}
        >
          <Crown size={15} className="pill-icon" />
          <span className="pill-val" style={{ fontSize: '0.82rem', fontWeight: 800 }}>{tierDetails.badge}</span>
        </div>

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

