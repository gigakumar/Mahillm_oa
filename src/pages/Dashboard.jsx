import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../contexts/UserDataContext';
import { getWeakestTopics } from '../utils/adaptiveEngine';
import { MOCK_TESTS } from '../data/mockSeriesConfig';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Play, TrendingUp, Target, Activity, Lock, Unlock, ArrowRight } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { spacedRepetition, masteryScores } = useUserData();
  const firstName = user?.displayName?.split(' ')[0] || 'there';

  const weakTopics = getWeakestTopics(masteryScores, 1);
  const priorityTopic = weakTopics.length > 0 ? weakTopics[0] : { category: 'Thermodynamics', topic: 'Entropy Generation' };

  // Placeholder readiness metrics from telemetry/adaptive engine
  const placementReadiness = 78;
  const clearanceProb = 72;
  const trend = 8.4;
  const abilityBand = "ADVANCED";

  const handleStartAdaptiveSession = () => {
    localStorage.setItem('current_test_config', JSON.stringify({
      mode: 'adaptive',
      intent: 'CONTINUE', // Uses the continuous adaptive path
      duration: 18,
      count: 12
    }));
    navigate('/tests/session-briefing'); // We'll route to the new briefing first
  };

  const handleStartMock = (mock) => {
    localStorage.setItem('current_test_config', JSON.stringify({
      name: mock.name,
      duration: mock.duration,
      difficulty: 'all',
      negativeMarking: mock.negativeMarking,
      distribution: mock.distribution,
      count: mock.count
    }));
    localStorage.removeItem('current_test_session');
    navigate('/tests/session');
  };

  return (
    <div className="page-content dashboard command-center">
      <header className="cc-header">
        <h1>Welcome back, {firstName}.</h1>
        <p>Your adaptive placement intelligence is active.</p>
      </header>

      {/* PLACEMENT READINESS COMMAND CENTER */}
      <section className="command-center-panel card">
        <div className="cc-top">
          <div className="cc-readiness-header">
            <h2>PLACEMENT READINESS</h2>
            <span className="cc-score">{placementReadiness} / 100</span>
          </div>
          
          <div className="cc-progress-bar">
            <div className="cc-progress-fill" style={{ width: `${placementReadiness}%` }}></div>
          </div>

          <div className="cc-metrics">
            <div className="cc-metric">
              <span className="label">Predicted OA Clearance Probability</span>
              <span className="value">{clearanceProb}%</span>
            </div>
            <div className="cc-metric">
              <span className="label">Readiness Trend</span>
              <span className="value positive"><TrendingUp size={14}/> {trend}% / 30d</span>
            </div>
            <div className="cc-metric">
              <span className="label">Current Ability Band</span>
              <span className="value band-badge">{abilityBand}</span>
            </div>
          </div>
        </div>

        <div className="cc-bottom">
          <div className="cc-priority-section">
            <h3>TODAY'S PRIORITY</h3>
            <div className="cc-priority-details">
              <span className="cc-cat">{priorityTopic.category}</span>
              <span className="cc-top-name">{priorityTopic.topic}</span>
              <span className="cc-meta">12 questions · ~18 min</span>
            </div>
            <button className="btn btn-primary btn-lg cc-start-btn" onClick={handleStartAdaptiveSession}>
              <Play size={18} fill="currentColor"/> Continue your adaptive path
            </button>
          </div>
          
          <div className="cc-trajectory-section">
            <h3>READINESS TRAJECTORY</h3>
            <div className="cc-chart-placeholder">
              {/* Minimal SVG line chart representation for readiness trajectory */}
              <svg viewBox="0 0 100 40" className="trajectory-sparkline">
                <path d="M0,35 Q10,35 20,30 T40,25 T60,15 T80,10 T100,5" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="100" cy="5" r="3" fill="var(--primary)" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Mock Test Series */}
      <section className="mock-tests-series" style={{ marginTop: '3rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.25rem' }}>Scheduled Mock Tests 🏆</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {MOCK_TESTS.map(mock => {
            const isLocked = new Date() < new Date(mock.unlockDate);
            const dateStr = new Date(mock.unlockDate).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            });

            return (
              <div key={mock.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: isLocked ? '4px solid var(--border)' : '4px solid var(--success)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{mock.name}</h3>
                  {isLocked ? <Lock size={16} style={{ color: 'var(--text-secondary)' }} /> : <Unlock size={16} style={{ color: 'var(--success)' }} />}
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{mock.description}</p>
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                  <span className="badge" style={{ background: 'var(--bg-body)' }}>{mock.duration} Mins</span>
                  <span className="badge" style={{ background: 'var(--bg-body)' }}>{mock.count} Qs</span>
                  {mock.negativeMarking && <span className="badge badge-danger-soft">-1/3 Mark</span>}
                </div>
                
                {isLocked ? (
                  <div style={{ marginTop: 'auto', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Unlocks: {dateStr}
                  </div>
                ) : (
                  <button 
                    className="btn btn-primary" 
                    style={{ marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }}
                    onClick={() => handleStartMock(mock)}
                  >
                    <Play size={12} fill="currentColor" /> Start Mock
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Intelligence Links */}
      <section className="intelligence-links" style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <Activity size={24} style={{ color: 'var(--accent)', marginBottom: '1rem' }}/>
          <h3 style={{ marginBottom: '0.5rem' }}>Intelligence Insights</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>View your Skill Genome, Mistake DNA, and Knowledge Decay maps.</p>
          <Link to="/insights" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            Open Insights <ArrowRight size={16}/>
          </Link>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <Target size={24} style={{ color: 'var(--primary)', marginBottom: '1rem' }}/>
          <h3 style={{ marginBottom: '0.5rem' }}>Targeted Intents</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Challenge yourself, repair weaknesses, or assess your baseline.</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
             <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>Challenge Me</button>
             <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>Repair Weaknesses</button>
             <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>Test Readiness</button>
          </div>
        </div>
      </section>

    </div>
  );
}
