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
  FileText,
  Play,
  ChevronDown,
  User,
  Brain
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useScore } from '../contexts/ScoreContext';
import { useUserData } from '../contexts/UserDataContext';
import { getDueQuestions } from '../utils/spacedRepetition';
import { useState, useEffect, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './Navbar.css';
import FloatingMenu from './FloatingMenu';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { scoreData } = useScore();
  const { mistakes, spacedRepetition } = useUserData();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const moreTriggerRef = useRef(null);
  const profileTriggerRef = useRef(null);

  const toggleMenu = (menu) => {
    setActiveMenu(current => current === menu ? null : menu);
  };

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
        <Link to="/tests" className={`nav-link ${isActive('/tests') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
          <Clipboard size={16} /> Tests
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
        <Link to="/intelligence" className={`nav-link ${isActive('/intelligence') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
          <Brain size={16} /> Intelligence
        </Link>

        {/* More dropdown */}
        <div className="nav-dropdown-wrapper">
          <button 
            ref={moreTriggerRef}
            className="nav-dropdown-trigger" 
            onClick={() => toggleMenu('more')}
            style={{ background: 'none', border: 'none', fontFamily: 'inherit' }}
          >
            <span>More</span>
            <ChevronDown size={14} />
          </button>
          <FloatingMenu 
            isOpen={activeMenu === 'more'} 
            onClose={() => setActiveMenu(null)} 
            triggerRef={moreTriggerRef}
            minWidth={170}
            align="left"
          >
            <Link to="/daily-challenge" role="menuitem" className={`dropdown-item ${isActive('/daily-challenge') ? 'active' : ''}`} onClick={() => { setActiveMenu(null); setMenuOpen(false); }}>
              <Sparkles size={14} /> Challenge
            </Link>
            <Link to="/attempt-replay" role="menuitem" className={`dropdown-item ${isActive('/attempt-replay') ? 'active' : ''}`} onClick={() => { setActiveMenu(null); setMenuOpen(false); }}>
              <Play size={14} /> Replay
            </Link>
            <Link to="/formulas" role="menuitem" className={`dropdown-item ${isActive('/formulas') ? 'active' : ''}`} onClick={() => { setActiveMenu(null); setMenuOpen(false); }}>
              <FileText size={14} /> Formulas
            </Link>
            <Link to="/mock-interview" role="menuitem" className={`dropdown-item ${isActive('/mock-interview') ? 'active' : ''}`} onClick={() => { setActiveMenu(null); setMenuOpen(false); }}>
              <Mic size={14} /> Interview
            </Link>
            <Link to="/leaderboard" role="menuitem" className={`dropdown-item ${isActive('/leaderboard') ? 'active' : ''}`} onClick={() => { setActiveMenu(null); setMenuOpen(false); }}>
              <Trophy size={14} /> Leaderboard
            </Link>
            {isAdmin && (
              <Link to="/admin/questions" role="menuitem" className={`dropdown-item ${isActive('/admin/questions') ? 'active' : ''}`} onClick={() => { setActiveMenu(null); setMenuOpen(false); }}>
                <Shield size={14} style={{ color: 'var(--accent)' }} /> Admin
              </Link>
            )}
          </FloatingMenu>
        </div>
        
        {user && (
          <>
            <Link 
              to="/profile" 
              className="nav-link logout-mobile-only" 
              onClick={() => setMenuOpen(false)}
              style={{ color: 'var(--text-primary)' }}
            >
              <User size={16} /> Profile
            </Link>
            <button 
              onClick={() => { logout(); setMenuOpen(false); }} 
              className="nav-link logout-mobile-only"
            >
              <LogOut size={16} /> Logout
            </button>
          </>
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
            <button 
              ref={profileTriggerRef}
              onClick={() => toggleMenu('profile')}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=random`} alt="Profile" className="avatar" />
            </button>
            <FloatingMenu
              isOpen={activeMenu === 'profile'}
              onClose={() => setActiveMenu(null)}
              triggerRef={profileTriggerRef}
              minWidth={150}
              align="right"
            >
              <span className="user-email" style={{ display: 'block', padding: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user.email}</span>
              <Link to="/profile" role="menuitem" className="dropdown-item" onClick={() => setActiveMenu(null)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', textDecoration: 'none' }}>
                <User size={14} /> Profile
              </Link>
              <button role="menuitem" onClick={() => { setActiveMenu(null); logout(); }} className="logout-btn">
                <LogOut size={14} /> Logout
              </button>
            </FloatingMenu>
          </div>
        )}
      </div>
    </nav>
  );
}
