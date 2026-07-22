import React, { useState } from 'react';
import Sidebar from './Sidebar';
import HeaderBar from './HeaderBar';
import './Layout.css';

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="marks-app-layout">
      {/* Fixed Left Navigation Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Right Content Panel */}
      <div className="marks-main-wrapper">
        {/* Top Header Bar */}
        <HeaderBar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        {/* Main Content Workspace inside dark rounded card */}
        <main className="marks-workspace-container">
          {children}
        </main>
      </div>
    </div>
  );
}
