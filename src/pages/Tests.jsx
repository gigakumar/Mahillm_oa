import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { Clipboard, Play, RotateCcw, BarChart2, Plus, RefreshCw, Trash2, Calendar, Award } from 'lucide-react';
import './Tests.css';

import metadata from '../data/metadata';

const PRESETS = [
  { id: 'quick', name: 'Quick Test ⚡', desc: '10 random questions, 15 minutes. Great for a quick daily sprint.', count: 10, time: 15, dist: { ME: 40, QA: 30, LR: 20, DI: 10 } },
  { id: 'standard', name: 'Standard OA 📋', desc: '30 questions, 45 minutes. Mimics typical first-round placement assessments.', count: 30, time: 45, dist: { ME: 50, QA: 20, LR: 15, DI: 15 } },
  { id: 'full', name: 'Full OA Simulation 🏆', desc: '50 questions, 60 minutes. High-pressure mixed placement simulation.', count: 50, time: 60, dist: { ME: 60, QA: 20, LR: 10, DI: 10 } },
  { id: 'mechanical', name: 'Mechanical Technical 🔩', desc: '50 core mechanical engineering questions, 60 minutes. Gate/PSU format.', count: 50, time: 60, dist: { ME: 100, QA: 0, LR: 0, DI: 0 } },
  { id: 'aptitude', name: 'General Aptitude Round 🧮', desc: '30 general aptitude & reasoning questions, 30 minutes.', count: 30, time: 30, dist: { ME: 0, QA: 50, LR: 30, DI: 20 } }
];

export default function Tests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'custom' | 'history'
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Custom Test Builder state
  const [testName, setTestName] = useState('Custom Placement Test');
  const [qCount, setQCount] = useState(30);
  const [duration, setDuration] = useState(45);
  const [difficulty, setDifficulty] = useState('all');
  const [negMarking, setNegMarking] = useState(true);
  const [unseenOnly, setUnseenOnly] = useState(false);
  
  // Weights (must sum to 100)
  const [weights, setWeights] = useState({
    ME: 40,
    QA: 20,
    DI: 15,
    DILR: 15,
    LR: 10
  });

  const [weightError, setWeightError] = useState('');

  // Load history from Firestore
  useEffect(() => {
    if (activeTab === 'history' && user) {
      loadTestHistory();
    }
  }, [activeTab, user]);

  const loadTestHistory = async () => {
    setHistoryLoading(true);
    try {
      const qRef = collection(db, 'users', user.uid, 'tests');
      const q = query(qRef, orderBy('submittedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const list = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setHistory(list);
    } catch (e) {
      console.error("Error loading test history:", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleWeightChange = (key, val) => {
    const numeric = Math.max(0, Math.min(100, parseInt(val) || 0));
    setWeights(prev => {
      const updated = { ...prev, [key]: numeric };
      const sum = Object.values(updated).reduce((a, b) => a + b, 0);
      if (sum !== 100) {
        setWeightError(`Weights sum to ${sum}%. They must sum to exactly 100%.`);
      } else {
        setWeightError('');
      }
      return updated;
    });
  };

  const handleAutoBalance = () => {
    const keys = Object.keys(weights);
    const count = keys.length;
    const share = Math.floor(100 / count);
    const remainder = 100 - share * count;
    
    const balanced = {};
    keys.forEach((k, idx) => {
      balanced[k] = share + (idx === 0 ? remainder : 0);
    });
    setWeights(balanced);
    setWeightError('');
  };

  const generateTest = (presetId = null, presetConfig = null) => {
    let finalConfig = {};
    if (presetId) {
      const p = PRESETS.find(pr => pr.id === presetId);
      finalConfig = {
        name: p.name,
        count: p.count,
        duration: p.time,
        difficulty: 'all',
        negativeMarking: true,
        unseenOnly: false,
        distribution: {
          'Mechanical Engineering': p.dist.ME,
          'Quantitative Aptitude': p.dist.QA,
          'DILR': p.dist.LR / 2, // split LR into DILR and Standalone LR
          'Logical Reasoning': p.dist.LR / 2,
          'Data Interpretation': p.dist.DI
        }
      };
    } else {
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      if (sum !== 100) {
        setWeightError('Total weight must equal exactly 100% before starting.');
        return;
      }
      finalConfig = {
        name: testName,
        count: qCount,
        duration: duration,
        difficulty: difficulty,
        negativeMarking: negMarking,
        unseenOnly: unseenOnly,
        distribution: {
          'Mechanical Engineering': weights.ME,
          'Quantitative Aptitude': weights.QA,
          'Data Interpretation': weights.DI,
          'DILR': weights.DILR,
          'Logical Reasoning': weights.LR
        }
      };
    }

    // Generate random seed
    const seed = Math.random().toString(36).substring(2, 9);
    localStorage.setItem('current_test_config', JSON.stringify({ ...finalConfig, seed }));
    localStorage.removeItem('current_test_session'); // Clear any old test
    
    navigate('/tests/session');
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="page-content tests-portal">
      <header className="portal-header card">
        <div>
          <h1>Online Assessments & Practice Tests 🏆</h1>
          <p className="portal-sub">Simulate placement tests, challenge your weakness areas, and review mock scorecard history.</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="portal-tabs">
        <button className={`tab-btn ${activeTab === 'presets' ? 'active' : ''}`} onClick={() => setActiveTab('presets')}>
          <Clipboard size={16} /> Exam Presets
        </button>
        <button className={`tab-btn ${activeTab === 'custom' ? 'active' : ''}`} onClick={() => setActiveTab('custom')}>
          <Plus size={16} /> Custom Test Builder
        </button>
        <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <BarChart2 size={16} /> My Scorecards
        </button>
      </div>

      {/* Active Tab View */}
      <div className="portal-view card">
        {activeTab === 'presets' && (
          <div className="presets-list">
            <h2>Select a Test Preset ⚡</h2>
            <p className="section-desc">Jump straight into predefined assessments modeled on placement screening formats.</p>
            <div className="presets-grid">
              {PRESETS.map((p) => (
                <div key={p.id} className="preset-card card card-interactive">
                  <div className="preset-info">
                    <h3>{p.name}</h3>
                    <p>{p.desc}</p>
                    <div className="preset-meta">
                      <span className="badge badge-accent">{p.count} Questions</span>
                      <span className="badge badge-secondary">{p.time} Minutes</span>
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={() => generateTest(p.id)}>
                    <Play size={14} /> Start
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'custom' && (
          <div className="custom-builder">
            <h2>Build a Custom Test ⚙️</h2>
            <p className="section-desc">Fine-tune the categories, weight ratios, constraints, and negative marking structure.</p>
            
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Test Name</label>
                <input type="text" className="form-input" value={testName} onChange={(e) => setTestName(e.target.value)} />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Questions Count</label>
                  <select className="form-input" value={qCount} onChange={(e) => setQCount(parseInt(e.target.value))}>
                    {[10, 15, 20, 25, 30, 50, 75, 100].map(c => <option key={c} value={c}>{c} Qs</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (Minutes)</label>
                  <select className="form-input" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))}>
                    {[10, 15, 20, 30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m} Mins</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Difficulty</label>
                  <select className="form-input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    <option value="all">🌐 All Difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label className="checkbox-container" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
                    <input type="checkbox" checked={negMarking} onChange={(e) => setNegMarking(e.target.checked)} />
                    Enable Negative Marking (GATE-style -1/3rd)
                  </label>
                </div>
              </div>
            </div>

            <div className="weights-section">
              <div className="weights-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Category Distribution Weighting</h3>
                <button className="btn btn-secondary btn-sm" onClick={handleAutoBalance}>
                  <RefreshCw size={14} /> Distribute Equally
                </button>
              </div>

              <div className="weights-grid">
                <div className="weight-row">
                  <span>🔩 Mechanical Engineering (~{metadata.categories['Mechanical Engineering'].count.toLocaleString()} Qs)</span>
                  <input type="number" className="weight-input" value={weights.ME} onChange={(e) => handleWeightChange('ME', e.target.value)} />
                  <span className="unit">%</span>
                </div>
                <div className="weight-row">
                  <span>🧮 Quantitative Aptitude (~{metadata.categories['Quantitative Aptitude'].count.toLocaleString()} Qs)</span>
                  <input type="number" className="weight-input" value={weights.QA} onChange={(e) => handleWeightChange('QA', e.target.value)} />
                  <span className="unit">%</span>
                </div>
                <div className="weight-row">
                  <span>📊 Data Interpretation (~{metadata.categories['Data Interpretation'].count.toLocaleString()} Qs)</span>
                  <input type="number" className="weight-input" value={weights.DI} onChange={(e) => handleWeightChange('DI', e.target.value)} />
                  <span className="unit">%</span>
                </div>
                <div className="weight-row">
                  <span>🧩 DILR Puzzles (~{metadata.categories['DILR'].count.toLocaleString()} Qs)</span>
                  <input type="number" className="weight-input" value={weights.DILR} onChange={(e) => handleWeightChange('DILR', e.target.value)} />
                  <span className="unit">%</span>
                </div>
                <div className="weight-row">
                  <span>🧠 Logical Reasoning (~{metadata.categories['Logical Reasoning'].count.toLocaleString()} Qs)</span>
                  <input type="number" className="weight-input" value={weights.LR} onChange={(e) => handleWeightChange('LR', e.target.value)} />
                  <span className="unit">%</span>
                </div>
              </div>

              {weightError && <p className="error-text" style={{ color: 'var(--danger)', marginTop: '0.5rem', fontSize: '0.9rem' }}>⚠️ {weightError}</p>}
            </div>

            <div className="action-row" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-lg" onClick={() => generateTest()} disabled={!!weightError}>
                <Play size={16} /> Start Custom Assessment
              </button>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-view">
            <h2>My Placement Scorecards 📊</h2>
            <p className="section-desc">Review your past performance, analyze timing ratios, and access solutions review.</p>

            {historyLoading ? (
              <div className="loading" style={{ textAlign: 'center', padding: '2rem' }}>Loading test records...</div>
            ) : history.length === 0 ? (
              <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <Calendar size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
                <p>No test scorecards found. Start practicing to see your assessments recorded here!</p>
              </div>
            ) : (
              <div className="history-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {history.map((record) => (
                  <div key={record.id} className="history-card card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div className="score-badge" style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent-glow)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--accent)' }}>
                        {record.score}
                      </div>
                      <div>
                        <h4 style={{ margin: 0 }}>{record.testName || 'Online Assessment'}</h4>
                        <span className="text-secondary" style={{ fontSize: '0.85rem' }}>{formatDate(record.submittedAt)}</span>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <span className="badge" style={{ background: 'var(--bg-body)' }}>{record.correct}/{record.total} Correct</span>
                          <span className="badge" style={{ background: 'var(--bg-body)' }}>{record.accuracy}% Acc</span>
                        </div>
                      </div>
                    </div>
                    <button className="btn btn-secondary" onClick={() => navigate(`/tests/result/${record.id}`)}>
                      <Award size={14} /> View Scorecard
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
