import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, 
  PenTool, 
  Clipboard, 
  Mic, 
  Trophy, 
  Moon, 
  Sun, 
  LogOut, 
  Menu, 
  X,
  BookOpen,
  BarChart2,
  RefreshCw,
  Shield,
  Sparkles,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useScore } from '../contexts/ScoreContext';
import { useUserData } from '../contexts/UserDataContext';
import { getDueQuestions } from '../utils/spacedRepetition';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { scoreData } = useScore();
  const { mistakes, spacedRepetition } = useUserData();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if current user has isAdmin flag on their user document
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    async function checkAdmin() {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists() && snap.data().isAdmin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (e) {
        console.error("Error checking admin privilege in Navbar:", e);
      }
    }
    checkAdmin();
  }, [user]);

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
        <Link to="/daily-challenge" className={`nav-link ${isActive('/daily-challenge') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
          <Sparkles size={16} /> Daily Challenge
        </Link>
        <Link to="/tests" className={`nav-link ${isActive('/tests') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
          <Clipboard size={16} /> Online Tests
        </Link>
        <Link to="/mistakes" className={`nav-link ${isActive('/mistakes') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
          <BookOpen size={16} /> Mistakes
          {Object.values(mistakes).filter(m => !m.isResolved).length > 0 && (
            <span className="badge badge-danger" style={{ padding: '0.1rem 0.35rem', fontSize: '0.7rem', marginLeft: '0.25rem', borderRadius: '50%' }}>
              {Object.values(mistakes).filter(m => !m.isResolved).length}
            </span>
          )}
        </Link>
        <Link to="/revision" className={`nav-link ${isActive('/revision') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
          <RefreshCw size={16} /> Revision
          {getDueQuestions(spacedRepetition).length > 0 && (
            <span className="badge badge-warning" style={{ padding: '0.1rem 0.35rem', fontSize: '0.7rem', marginLeft: '0.25rem', borderRadius: '50%', color: '#000' }}>
              {getDueQuestions(spacedRepetition).length}
            </span>
          )}
        </Link>
        <Link to="/readiness" className={`nav-link ${isActive('/readiness') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
          <BarChart2 size={16} /> Readiness
        </Link>
        <Link to="/attempt-replay" className={`nav-link ${isActive('/attempt-replay') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
          <Play size={16} /> Replay
        </Link>
        <Link to="/formulas" className={`nav-link ${isActive('/formulas') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
          <FileText size={16} /> Formulas
        </Link>
        <Link to="/mock-interview" className={`nav-link ${isActive('/mock-interview') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
          <Mic size={16} /> Interview
        </Link>
        <Link to="/leaderboard" className={`nav-link ${isActive('/leaderboard') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
          <Trophy size={16} /> Leaderboard
        </Link>
        {isAdmin && (
          <Link to="/admin/questions" className={`nav-link ${isActive('/admin/questions') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
            <Shield size={16} style={{ color: 'var(--accent)' }} /> Admin
          </Link>
        )}
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
