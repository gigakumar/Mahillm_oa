import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../contexts/UserDataContext';
import { Award, Clipboard, Plus, BarChart2 } from 'lucide-react';
import { MOCK_TESTS } from '../data/mockSeriesConfig';
import metadata from '../data/metadata';

// New Sub-components
import TestsHero from '../components/tests/TestsHero';
import PerformanceCards from '../components/tests/PerformanceCards';
import TestsQuickActions from '../components/tests/TestsQuickActions';
import MockGrid from '../components/tests/MockGrid';
import TestsSidebar from '../components/tests/TestsSidebar';
import CustomTestBuilder from '../components/tests/CustomTestBuilder';

import './Tests.css';

const PRESETS = [
  { id: 'quick', name: 'Quick Test ⚡', desc: '10 random questions, 15 minutes. Great for a quick daily sprint.', count: 10, time: 15, dist: { ME: 40, QA: 30, LR: 20, DI: 10 } },
  { id: 'standard', name: 'Standard OA 📋', desc: '30 questions, 45 minutes. Mimics typical first-round placement assessments.', count: 30, time: 45, dist: { ME: 50, QA: 20, LR: 15, DI: 15 } },
  { id: 'full', name: 'Full OA Simulation 🏆', desc: '50 questions, 60 minutes. High-pressure mixed placement simulation.', count: 50, time: 60, dist: { ME: 60, QA: 20, LR: 10, DI: 10 } },
  { id: 'mechanical', name: 'Mechanical Technical 🔩', desc: '50 core mechanical engineering questions, 60 minutes. Gate/PSU format.', count: 50, time: 60, dist: { ME: 100, QA: 0, LR: 0, DI: 0 } },
  { id: 'aptitude', name: 'General Aptitude Round 🧮', desc: '30 general aptitude & reasoning questions, 30 minutes.', count: 30, time: 30, dist: { ME: 0, QA: 50, LR: 30, DI: 20 } }
];

export default function Tests() {
  const { user } = useAuth();
  const { testHistory = [], loading: historyLoading } = useUserData();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('mocks'); // 'mocks' | 'presets' | 'custom' | 'history'

  const handleStartMock = (mock) => {
    const config = {
      name: mock.name,
      duration: mock.duration,
      difficulty: 'all',
      negativeMarking: mock.negativeMarking,
      distribution: mock.distribution,
      count: mock.count,
      seed: Math.random().toString(36).substring(2, 9)
    };
    localStorage.setItem('current_test_config', JSON.stringify(config));
    localStorage.removeItem('current_test_session');
    sessionStorage.removeItem('active_session_config');
    navigate('/tests/session', { state: config });
  };

  const handleCustomTest = () => {
    setActiveTab('custom');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="page-content tests-portal">
      {/* We only show the gamified dashboard on the main 'mocks' tab */}
      {activeTab === 'mocks' ? (
        <div className="dashboard-layout">
          <div className="dashboard-main">
            <TestsHero />
            <PerformanceCards />
            <TestsQuickActions onCustomTest={handleCustomTest} />
            <MockGrid mocks={MOCK_TESTS} onStartMock={handleStartMock} />
          </div>
          
          <aside className="dashboard-sidebar">
            <TestsSidebar />
          </aside>
        </div>
      ) : (
        /* Original Portal View for Presets, Custom, History */
        <>
          <header className="portal-header card" style={{ marginBottom: '1.5rem' }}>
            <div>
              <h1>Online Assessments & Practice Tests 🏆</h1>
              <p className="portal-sub">Simulate placement tests, challenge your weakness areas, and review mock scorecard history.</p>
            </div>
          </header>

          <div className="portal-tabs" style={{ marginBottom: '1.5rem' }}>
            <button className={`tab-btn ${activeTab === 'mocks' ? 'active' : ''}`} onClick={() => setActiveTab('mocks')}>
              <Award size={16} /> Dashboard
            </button>
            <button className={`tab-btn ${activeTab === 'presets' ? 'active' : ''}`} onClick={() => setActiveTab('presets')}>
              <Clipboard size={16} /> Exam Presets
            </button>
            <button className={`tab-btn ${activeTab === 'custom' ? 'active' : ''}`} onClick={() => setActiveTab('custom')}>
              <Plus size={16} /> Custom Builder
            </button>
            <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
              <BarChart2 size={16} /> Scorecards
            </button>
          </div>
          
          <div className="portal-view card">
             {activeTab === 'presets' && (
              <div className="presets-list">
                <h2>Select a Test Preset ⚡</h2>
                <div className="presets-grid" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginTop: '1rem' }}>
                  {PRESETS.map((p) => (
                    <div key={p.id} className="preset-card card card-interactive" style={{ padding: '1.5rem' }}>
                      <h3>{p.name}</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.5rem 0' }}>{p.desc}</p>
                      <button className="btn btn-primary mt-3" onClick={() => navigate('/tests/session')}>Start Preset</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'custom' && (
              <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <CustomTestBuilder />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="history-view" style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Scorecards</h2>
                <p>History will be displayed here.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
