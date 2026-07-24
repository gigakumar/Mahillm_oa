import React from 'react';
import { Target, BookOpen, AlertTriangle, XCircle, Sigma, Settings } from 'lucide-react';
import './TestsQuickActions.css';

export default function TestsQuickActions({ onCustomTest }) {
  const actions = [
    { id: 'daily', icon: <Target size={18} />, title: 'Daily Challenge', desc: '10 Qs', color: 'rgba(139, 92, 246, 0.2)', iconColor: '#8b5cf6' },
    { id: 'pyq', icon: <BookOpen size={18} />, title: 'Previous Year Papers', desc: 'PYQs', color: 'rgba(59, 130, 246, 0.2)', iconColor: '#3b82f6' },
    { id: 'weak', icon: <AlertTriangle size={18} />, title: 'Weak Topics', desc: 'Improve', color: 'rgba(234, 179, 8, 0.2)', iconColor: '#eab308' },
    { id: 'wrong', icon: <XCircle size={18} />, title: 'Wrong Questions', desc: 'Review', color: 'rgba(239, 68, 68, 0.2)', iconColor: '#ef4444' },
    { id: 'formula', icon: <Sigma size={18} />, title: 'Formula Revision', desc: 'Flashcards', color: 'rgba(16, 185, 129, 0.2)', iconColor: '#10b981' },
    { id: 'custom', icon: <Settings size={18} />, title: 'Custom Test', desc: 'Create', color: 'rgba(14, 165, 233, 0.2)', iconColor: '#0ea5e9', onClick: onCustomTest }
  ];

  return (
    <div className="tests-quick-actions">
      <h3 className="section-title">Quick Actions</h3>
      <div className="qa-grid">
        {actions.map(action => (
          <button 
            key={action.id} 
            className="qa-btn card"
            onClick={action.onClick}
          >
            <div className="qa-icon-wrapper" style={{ background: action.color, color: action.iconColor }}>
              {action.icon}
            </div>
            <div className="qa-info">
              <span className="qa-title">{action.title}</span>
              <span className="qa-desc">{action.desc}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
