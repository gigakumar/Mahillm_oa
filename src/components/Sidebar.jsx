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
  Calculator
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import './Sidebar.css';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { tierDetails, openPricingModal } = useSubscription();

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/aptitude', label: 'General Aptitude', icon: Calculator },
    { path: '/tests', label: 'Tests', icon: ClipboardCheck },
    { path: '/oa-practice', label: 'Practice & PYQs', icon: Sparkles },
    { path: '/ai-solver', label: 'AI Step Solver', icon: Brain, badge: 'ELITE' },
    { path: '/pdf-generator', label: 'PDF Exporter', icon: BookMarked, badge: 'PRO' },
    { path: '/ai-coach', label: '24/7 AI Mentor', icon: Sparkles, badge: 'ELITE' },
    { path: '/mock-builder', label: 'Mock Builder', icon: Layers, badge: 'PRO' },
    { path: '/mistakes', label: 'Notebooks', icon: BookMarked },
    { path: '/duel', label: '1v1 Speed Duel', icon: Swords },
    { path: '/gate-predictor', label: 'GATE Predictor', icon: Compass },
    { path: '/planner', label: 'Study Planner', icon: Calendar },
    { path: '/pricing', label: 'Plans & Pricing', icon: Crown, highlight: true },
    { path: '/profile', label: 'Profile', icon: User },
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
          <span className="brand-name">MahiLLM <span className="brand-sub">{tierDetails.badge}</span></span>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${active ? 'active' : ''} ${item.highlight ? 'premium-link' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={19} className="sidebar-link-icon" />
                <span className="sidebar-link-label">{item.label}</span>
                {item.badge && (
                  <span className="badge" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', marginLeft: 'auto', background: item.badge === 'ELITE' ? '#f59e0b' : '#6366f1', color: '#ffffff' }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="sidebar-divider" />

          <a 
            href="https://chrome.google.com" 
            target="_blank" 
            rel="noreferrer"
            className="sidebar-link external-link"
          >
            <div className="chrome-icon-badge">
              <span className="chrome-dot red" />
              <span className="chrome-dot yellow" />
              <span className="chrome-dot green" />
            </div>
            <span className="sidebar-link-label">Install Extension</span>
            <ExternalLink size={14} className="external-arrow" />
          </a>
        </nav>

        {/* Bottom Theme Toggle */}
        <div className="sidebar-footer">
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span>Turn on {theme === 'dark' ? 'light' : 'dark'} mode</span>
          </button>
        </div>
      </aside>
    </>
  );
}
