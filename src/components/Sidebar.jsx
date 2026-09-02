import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  ClipboardCheck, 
  Crown, 
  BookMarked, 
  User, 
  Calendar, 
  ExternalLink, 
  Sun, 
  Moon,
  Sparkles,
  Swords,
  Brain,
  Layers,
  Compass,
  Award,
  Bookmark,
  Activity,
  Mic,
  Target,
  GraduationCap,
  BookOpen,
  Boxes
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useUserData } from '../contexts/UserDataContext';
import './Sidebar.css';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { mistakes } = useUserData();

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navGroups = [
    {
      title: "Core",
      items: [
        { path: '/', label: 'Home', icon: Home },
        { path: '/planner', label: 'Study Planner', icon: Calendar },
        { path: '/focus', label: 'Engine Room (Focus)', icon: Moon },
        { path: '/profile', label: 'Profile', icon: User },
      ]
    },
    {
      title: "Practice & Learn",
      items: [
        { path: '/tests', label: 'Tests', icon: ClipboardCheck },
        { path: '/oa-practice', label: 'Practice & PYQs', icon: Sparkles },
        { path: '/boss-fight', label: 'Boss Fight Arena', icon: Swords },
        { path: '/bookmarks', label: 'Starred PYQs', icon: Bookmark },
        { path: '/mistakes', label: 'Notebooks', icon: BookMarked, badge: Object.values(mistakes || {}).filter(m => !m.isResolved).length || 0 },
        { path: '/revision', label: 'Spaced Revision', icon: Brain },
      ]
    },
    {
      title: "Tools & Analytics",
      items: [
        { path: '/readiness', label: 'Readiness Radar', icon: Activity },
        { path: '/mock-interview', label: 'AI Mock Interview', icon: Mic },
        { path: '/duel', label: '1v1 Speed Duel', icon: Swords },
        { path: '/formulas', label: 'Formula Revision', icon: Layers },
        { path: '/syllabus', label: 'GATE Syllabus', icon: Target },
      ]
    },
    {
      title: "Predictors & Strategy",
      items: [
        { path: '/gate-predictor', label: 'GATE Predictor', icon: Compass },
        { path: '/college-predictor', label: 'M.Tech Predictor', icon: GraduationCap },
        { path: '/exam-strategy', label: 'Exam Strategy', icon: Clock },
      ]
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sidebar-container ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Logo */}
        <div className="sidebar-brand" onClick={() => navigate('/')}>
          <div className="brand-icon-box">
            <img src="/logo.png" alt="MahiLLM Logo" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
          </div>
          <span className="brand-name">MahiLLM <span className="brand-sub">OA</span></span>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="nav-group">
              <div className="nav-group-title">{group.title}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`sidebar-link ${active ? 'active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon size={18} className="sidebar-link-icon" />
                    <span className="sidebar-link-label">{item.label}</span>
                    {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Theme & UI Style Toggles */}
        <div className="sidebar-footer">
          {/* UI Mode Segmented Switcher */}
          <div className="ui-style-switcher" title="Toggle between Modern Linear UI and Previous 3D Bubble UI">
            <button
              type="button"
              className={`ui-style-btn ${uiMode === 'modern' ? 'active' : ''}`}
              onClick={() => setUiMode('modern')}
            >
              <Sparkles size={13} />
              <span>Modern UI</span>
            </button>
            <button
              type="button"
              className={`ui-style-btn ${uiMode === 'classic' ? 'active' : ''}`}
              onClick={() => setUiMode('classic')}
            >
              <Boxes size={13} />
              <span>3D Bubble</span>
            </button>
          </div>

          <button type="button" className="theme-toggle-btn" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
