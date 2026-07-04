import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, PenTool, Mic, Trophy, Moon, Sun, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useScore } from '../contexts/ScoreContext';
import { useState } from 'react';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { scoreData } = useScore();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar card">
      <div className="nav-brand">
        <img src="/logo.png" alt="Mahi LLM Logo" className="nav-logo-img" />
        <span className="nav-title">Mahillm OA</span>
      </div>

      <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
          <LayoutGrid size={16} /> Home
        </Link>
        <Link to="/oa-practice" className={`nav-link ${isActive('/oa-practice') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
          <PenTool size={16} /> Practice
        </Link>
        <Link to="/mock-interview" className={`nav-link ${isActive('/mock-interview') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
          <Mic size={16} /> Interview
        </Link>
        <Link to="/leaderboard" className={`nav-link ${isActive('/leaderboard') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
          <Trophy size={16} /> Leaderboard
        </Link>
      </div>

      <div className="nav-actions">
        <div className="nav-score badge badge-accent" title={`Accuracy: ${scoreData?.accuracy || 0}%`}>
          XP: {scoreData?.xp || 0}
        </div>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        {user && (
          <div className="user-profile">
            <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=random`} alt="Profile" className="avatar" />
            <div className="user-dropdown card">
              <span className="user-email">{user.email}</span>
              <button onClick={logout} className="logout-btn">
                <LogOut size={14} /> Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
