import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Target, BookOpen, Award, User } from 'lucide-react';
import Sidebar from './Sidebar';
import HeaderBar from './HeaderBar';
import QuickNotesModal from './QuickNotesModal';
import './Layout.css';

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="marks-app-layout">
      {/* Fixed Left Navigation Sidebar (Hidden on mobile) */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Right Content Panel */}
      <div className="marks-main-wrapper">
        {/* Top Header Bar */}
        <HeaderBar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        {/* Main Content Workspace inside dark rounded card */}
        <main className="marks-workspace-container animate-scale-in">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Visible only on mobile) */}
      <div className="mobile-bottom-nav">
        <Link to="/" className={`bottom-nav-item ${path === '/' ? 'active' : ''}`}>
          <Home size={20} />
          <span>Home</span>
        </Link>
        <Link to="/oa-practice" className={`bottom-nav-item ${path === '/oa-practice' ? 'active' : ''}`}>
          <Target size={20} />
          <span>Practice</span>
        </Link>
        <Link to="/revision" className={`bottom-nav-item ${path === '/revision' ? 'active' : ''}`}>
          <BookOpen size={20} />
          <span>Revise</span>
        </Link>
        <Link to="/tests" className={`bottom-nav-item ${path === '/tests' ? 'active' : ''}`}>
          <Award size={20} />
          <span>Tests</span>
        </Link>
        <Link to="/profile" className={`bottom-nav-item ${path === '/profile' ? 'active' : ''}`}>
          <User size={20} />
          <span>Profile</span>
        </Link>
      </div>

      {/* Global Floating Quick Notes Scratchpad */}
      <QuickNotesModal />
    </div>
  );
}
