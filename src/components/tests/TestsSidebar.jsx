import React from 'react';
import { Clock, CheckCircle, Hash, AlertCircle } from 'lucide-react';
import './TestsSidebar.css';

export default function TestsSidebar() {
  return (
    <div className="tests-sidebar">
      
      {/* Study Overview */}
      <div className="sidebar-card card">
        <div className="sidebar-header">
          <h3>Study Overview</h3>
          <span className="sidebar-filter">This Week ▾</span>
        </div>
        
        <div className="overview-stats">
          <div className="overview-row">
            <div className="overview-icon"><Clock size={16} color="#3b82f6" /></div>
            <div className="overview-info">
              <span className="overview-label">Total Study Time</span>
              <span className="overview-value">12h 45m</span>
            </div>
            <div className="overview-trend trend-up">↑ 2h 15m</div>
          </div>
          
          <div className="overview-row">
            <div className="overview-icon"><CheckCircle size={16} color="#10b981" /></div>
            <div className="overview-info">
              <span className="overview-label">Accuracy</span>
              <span className="overview-value">78%</span>
            </div>
            <div className="overview-trend trend-up">↑ 6%</div>
          </div>
          
          <div className="overview-row">
            <div className="overview-icon" style={{ background: 'rgba(234, 179, 8, 0.2)', padding: '4px', borderRadius: '4px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#eab308' }}>?</span>
            </div>
            <div className="overview-info">
              <span className="overview-label">Questions Solved</span>
              <span className="overview-value">342</span>
            </div>
            <div className="overview-trend trend-up">↑ 48</div>
          </div>
          
          <div className="overview-row">
            <div className="overview-icon"><Clock size={16} color="#8b5cf6" /></div>
            <div className="overview-info">
              <span className="overview-label">Avg. Time / Qs</span>
              <span className="overview-value">1m 24s</span>
            </div>
            <div className="overview-trend trend-down">↓ 10s</div>
          </div>
        </div>
        
        <div className="consistency-score">
          <div className="consistency-info">
            <div className="consistency-title">Consistency Score</div>
            <div className="consistency-stars">⭐ Great!</div>
          </div>
          <div className="consistency-ring">
            <svg viewBox="0 0 36 36">
              <path className="circle-bg" stroke="rgba(255,255,255,0.1)" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="circle" stroke="#10b981" strokeWidth="3" strokeDasharray="82, 100" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="consistency-val">82</div>
          </div>
        </div>
      </div>

      {/* Weakest Topic */}
      <div className="sidebar-card card">
        <div className="sidebar-header">
          <h3>Weakest Topic</h3>
          <span className="sidebar-filter">By Accuracy ▾</span>
        </div>
        
        <div className="weak-topic-content">
          <div className="weak-topic-title">
            <AlertCircle size={16} color="#ef4444" /> Heat Transfer
          </div>
          <div className="weak-topic-accuracy">Accuracy <span>54%</span></div>
          <div className="progress-bar-container mt-2 mb-3">
            <div className="progress-bar" style={{ width: '54%', background: 'linear-gradient(90deg, #ef4444, #f97316)' }}></div>
          </div>
          <button className="btn btn-primary w-100" style={{ padding: '0.6rem' }}>Practice Now</button>
        </div>
      </div>

      {/* Next Milestone */}
      <div className="sidebar-card card">
        <div className="sidebar-header">
          <h3>Next Milestone</h3>
          <span className="sidebar-filter">Rank ▾</span>
        </div>
        
        <div className="milestone-content">
          <div className="milestone-row">
            <div>
              <div className="milestone-label">Current Rank</div>
              <div className="milestone-val">#431</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="milestone-label">Next Milestone</div>
              <div className="milestone-val">Top 300</div>
            </div>
          </div>
          
          <div className="progress-bar-container my-3" style={{ height: '8px' }}>
            <div className="progress-bar" style={{ width: '70%', background: 'linear-gradient(90deg, #f97316, #eab308)' }}></div>
          </div>
          
          <div className="milestone-hint">
            You're 69 mocks away!
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="sidebar-card card">
        <div className="sidebar-header">
          <h3>Achievements</h3>
          <span className="sidebar-link">View all ›</span>
        </div>
        
        <div className="achievements-row">
          <div className="achievement-badge" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.05))', borderColor: 'rgba(139,92,246,0.5)' }}>🛡️</div>
          <div className="achievement-badge" style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(234,179,8,0.05))', borderColor: 'rgba(234,179,8,0.5)' }}>⭐</div>
          <div className="achievement-badge" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.05))', borderColor: 'rgba(59,130,246,0.5)' }}>💎</div>
          <div className="achievement-badge" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))', borderColor: 'rgba(16,185,129,0.5)' }}>🌿</div>
          <div className="achievement-more">+8</div>
        </div>
      </div>

    </div>
  );
}
