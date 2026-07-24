import React, { useState } from 'react';
import { Play, Lock, Search, Filter } from 'lucide-react';
import './MockGrid.css';

const MOCK_ICONS = {
  'Mechanical': '⚙️',
  'Aptitude': '📐',
  'Full OA': '🔥',
  'Reasoning': '🧠',
  'Data Interpretation': '📊',
  'Manufacturing': '🏭'
};

export default function MockGrid({ mocks, onStartMock }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  return (
    <div className="mock-grid-container">
      
      {/* Recommended Mock */}
      <div className="recommended-mock card">
        <div className="recommended-header">
          <div className="recommended-title">
            <span className="recommended-badge">✓ Recommended Today</span>
            <h3>Improve Thermodynamics</h3>
          </div>
          <div className="recommended-gain">
            Est. Gain <span className="gain-value">+4 marks</span>
          </div>
        </div>
        <div className="recommended-reason">
          <strong>Reason:</strong> Accuracy dropped from 82% → 69% in recent practice sessions.
        </div>
        <div className="recommended-actions">
          <button className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', borderRadius: '8px' }}>Start Directed Practice</button>
        </div>
      </div>

      <div className="mock-section-header">
        <h3 className="section-title">All Mock Tests</h3>
      </div>

      <div className="mock-filters-bar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search mock tests..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-dropdowns">
          <button className="filter-btn">Difficulty ▾</button>
          <button className="filter-btn">Subjects ▾</button>
          <button className="filter-btn">Duration ▾</button>
          <button className="filter-btn">Status ▾</button>
          <button className="filter-clear">Clear Filters</button>
        </div>
      </div>

      <div className="mock-cards-grid">
        {mocks.map(mock => {
          const isLocked = new Date() < new Date(mock.unlockDate);
          const icon = mock.icon || (mock.name.includes('Aptitude') ? '📐' : mock.name.includes('Thermodynamics') ? '🔥' : '⚙️');
          
          if (isLocked) {
            // Simplified locked logic for visual display
            return (
              <div key={mock.id} className="mock-card card locked">
                <div className="mock-card-header">
                  <div className="mock-icon locked-icon"><Lock size={20} /></div>
                  <div className="mock-difficulty badge badge-warning">Medium</div>
                </div>
                <h4 className="mock-title">{mock.name}</h4>
                
                <div className="locked-countdown">
                  <div className="countdown-label">Unlocks in</div>
                  <div className="countdown-time">04d : 12h : 36m</div>
                  <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: '45%', background: '#3b82f6' }}></div>
                  </div>
                  <div className="available-date">Available on 29 Jul, 2026</div>
                </div>
                
                <button className="btn btn-secondary w-100" style={{ marginTop: 'auto' }}>Notify Me</button>
              </div>
            );
          }

          return (
            <div key={mock.id} className="mock-card card">
              <div className="mock-card-header">
                <div className="mock-icon" style={{ background: mock.color || 'rgba(59, 130, 246, 0.15)', borderColor: mock.color || 'rgba(59, 130, 246, 0.3)' }}>
                  {icon}
                </div>
                <div className="mock-difficulty badge badge-warning">Medium</div>
              </div>
              
              <h4 className="mock-title">{mock.name}</h4>
              
              <div className="mock-tags">
                <span className="mock-tag">Thermo</span>
                <span className="mock-tag">SOM</span>
                <span className="mock-tag">HT</span>
              </div>
              
              <div className="mock-meta-grid">
                <div className="meta-item">
                  <span className="meta-val">{mock.duration} min</span>
                </div>
                <div className="meta-item">
                  <span className="meta-val">{mock.count} Qs</span>
                </div>
                <div className="meta-item">
                  <span className="meta-val text-danger">-1/3</span>
                </div>
              </div>
              
              <div className="mock-stats-row">
                <div className="stat-col">
                  <span className="stat-label">Best Score</span>
                  <span className="stat-val">72%</span>
                </div>
                <div className="stat-col">
                  <span className="stat-label">Attempts</span>
                  <span className="stat-val">1</span>
                </div>
                <div className="stat-col">
                  <span className="stat-label">XP Reward</span>
                  <span className="stat-val text-warning">+120 XP</span>
                </div>
              </div>
              
              <button 
                className="btn btn-primary w-100 mt-3" 
                onClick={() => onStartMock(mock)}
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
              >
                <Play size={14} fill="currentColor" /> Start Mock
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
