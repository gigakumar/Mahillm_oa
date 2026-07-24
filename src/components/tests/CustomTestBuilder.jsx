import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, BookOpen, AlertCircle, Calendar, Edit3, Settings, Calculator, Puzzle, BrainCircuit, Rocket, ChevronRight } from 'lucide-react';
import metadata from '../../data/metadata';
import './CustomTestBuilder.css';

export default function CustomTestBuilder() {
  const navigate = useNavigate();
  const [testName, setTestName] = useState('Custom Placement Test');
  const [qCount, setQCount] = useState(30);
  const [duration, setDuration] = useState(45);
  const [difficulty, setDifficulty] = useState('all');
  const [negMarking, setNegMarking] = useState(true);

  // Weights (must sum to 100)
  const [weights, setWeights] = useState({
    ME: 40,
    QA: 20,
    DI: 15,
    DILR: 15,
    LR: 10
  });

  const [weightError, setWeightError] = useState('');

  // Ensures weights stay valid and sum to 100
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

  const adjustStepper = (setter, current, step, min, max) => {
    setter(Math.max(min, Math.min(max, current + step)));
  };

  const applyPreset = (preset) => {
    if (preset === 'core') {
      setTestName('Core OA Mock');
      setQCount(50);
      setDuration(60);
      setWeights({ ME: 100, QA: 0, DI: 0, DILR: 0, LR: 0 });
    } else if (preset === 'subject') {
      setTestName('Subject Wise Practice');
      setQCount(20);
      setDuration(30);
    } else if (preset === 'weak') {
      setTestName('Weak Topics Focus');
      setQCount(15);
      setDuration(25);
    } else if (preset === 'pyq') {
      setTestName('Previous Year Challenge');
      setQCount(30);
      setDuration(45);
      setWeights({ ME: 50, QA: 25, DI: 10, DILR: 5, LR: 10 });
    }
    setWeightError('');
  };

  const generateTest = () => {
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    if (sum !== 100) {
      setWeightError('Total weight must equal exactly 100% before starting.');
      return;
    }
    
    const config = {
      name: testName,
      count: qCount,
      duration: duration,
      difficulty: difficulty,
      negativeMarking: negMarking,
      unseenOnly: false,
      distribution: {
        'Mechanical Engineering': weights.ME,
        'Quantitative Aptitude': weights.QA,
        'Data Interpretation': weights.DI,
        'DILR': weights.DILR,
        'Logical Reasoning': weights.LR
      },
      seed: Math.random().toString(36).substring(2, 9)
    };

    localStorage.setItem('current_test_config', JSON.stringify(config));
    localStorage.removeItem('current_test_session');
    sessionStorage.removeItem('active_session_config');
    
    navigate('/tests/session', { state: config });
  };

  return (
    <div className="custom-builder-container">
      {/* Hero Section */}
      <div className="builder-hero card">
        <div className="builder-hero-content">
          <h1>Create Your Custom Test <Settings size={28} className="spin-icon" color="#8b5cf6" /></h1>
          <p>Design a test that matches your preparation goals.</p>
        </div>
        <div className="builder-hero-graphic">
          <div className="notebook-graphic">
            <span className="notebook-star star-1">✨</span>
            <span className="notebook-star star-2">✨</span>
            <div className="notebook-body">
              <div className="notebook-line"></div>
              <div className="notebook-line"></div>
              <div className="notebook-line half"></div>
              <div className="notebook-pencil">✏️</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="builder-section">
        <h3 className="builder-section-title">Quick Presets</h3>
        <div className="builder-presets-grid">
          <button className="builder-preset-card" onClick={() => applyPreset('core')}>
            <div className="preset-icon-circle" style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}><Target size={18} /></div>
            <div className="preset-info">
              <h4>Core OA Mock</h4>
              <p>All Sections • 45 Min</p>
            </div>
          </button>
          <button className="builder-preset-card" onClick={() => applyPreset('subject')}>
            <div className="preset-icon-circle" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}><BookOpen size={18} /></div>
            <div className="preset-info">
              <h4>Subject Wise</h4>
              <p>Pick your subjects</p>
            </div>
          </button>
          <button className="builder-preset-card" onClick={() => applyPreset('weak')}>
            <div className="preset-icon-circle" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}><AlertCircle size={18} /></div>
            <div className="preset-info">
              <h4>Weak Topics</h4>
              <p>Focus on weak areas</p>
            </div>
          </button>
          <button className="builder-preset-card" onClick={() => applyPreset('pyq')}>
            <div className="preset-icon-circle" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}><Calendar size={18} /></div>
            <div className="preset-info">
              <h4>Previous Year</h4>
              <p>PYQs only</p>
            </div>
          </button>
          <button className="builder-preset-more">
            View All Presets <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Main Config */}
      <div className="builder-config-grid">
        <div className="config-main card">
          <div className="config-row">
            <div className="config-group" style={{ flex: 2 }}>
              <label>Test Name</label>
              <div className="input-with-icon">
                <input type="text" value={testName} onChange={e => setTestName(e.target.value)} />
                <Edit3 size={16} className="input-icon" />
              </div>
            </div>
            <div className="config-group">
              <label>Questions Count</label>
              <div className="stepper-input">
                <button onClick={() => adjustStepper(setQCount, qCount, -5, 5, 100)}>-</button>
                <div className="stepper-value">{qCount}</div>
                <button onClick={() => adjustStepper(setQCount, qCount, 5, 5, 100)}>+</button>
              </div>
              <span className="config-hint">Max 100 Questions</span>
            </div>
            <div className="config-group">
              <label>Duration</label>
              <div className="stepper-input">
                <button onClick={() => adjustStepper(setDuration, duration, -15, 15, 180)}>-</button>
                <div className="stepper-value">{duration} mins</div>
                <button onClick={() => adjustStepper(setDuration, duration, 15, 15, 180)}>+</button>
              </div>
              <span className="config-hint">Recommended: {Math.max(15, qCount * 1.5)} mins</span>
            </div>
          </div>

          <div className="config-group mt-4">
            <label>Difficulty Level</label>
            <div className="difficulty-pills">
              <button className={`diff-pill ${difficulty === 'all' ? 'active' : ''}`} onClick={() => setDifficulty('all')}>
                <span className="diff-dot bg-blue"></span> All Difficulties
              </button>
              <button className={`diff-pill ${difficulty === 'Easy' ? 'active' : ''}`} onClick={() => setDifficulty('Easy')}>
                <span className="diff-dot bg-green"></span> Easy
              </button>
              <button className={`diff-pill ${difficulty === 'Medium' ? 'active' : ''}`} onClick={() => setDifficulty('Medium')}>
                <span className="diff-dot bg-yellow"></span> Medium
              </button>
              <button className={`diff-pill ${difficulty === 'Hard' ? 'active' : ''}`} onClick={() => setDifficulty('Hard')}>
                <span className="diff-dot bg-red"></span> Hard
              </button>
            </div>
          </div>
        </div>

        <div className="config-side card">
          <div className="neg-mark-header">
            <div>
              <label style={{ display: 'block', marginBottom: '0.2rem' }}>Negative Marking</label>
              <span className="config-hint" style={{ marginTop: 0 }}>GATE Style: -1/3rd</span>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={negMarking} onChange={e => setNegMarking(e.target.checked)} />
              <span className="slider round"></span>
            </label>
          </div>
          
          <div className={`neg-mark-status ${negMarking ? 'enabled' : 'disabled'}`}>
            <span className="status-indicator">✓</span> {negMarking ? 'Enabled' : 'Disabled'}
          </div>
          <p className="neg-mark-desc">
            {negMarking ? 'Each wrong answer carries -1/3rd marks' : 'No marks deducted for wrong answers'}
          </p>
        </div>
      </div>

      {/* Distribution */}
      <div className="builder-section mt-2">
        <div className="distribution-header">
          <h3 className="builder-section-title" style={{ margin: 0 }}>Choose How Questions Are Distributed</h3>
          <button className="btn-text" onClick={handleAutoBalance}>
            <span style={{ fontSize: '1.2rem', marginRight: '0.4rem' }}>⚖️</span> Distribute Equally <ChevronRight size={14} />
          </button>
        </div>
        
        <div className="distribution-grid">
          {[
            { key: 'ME', name: 'Mechanical Engineering', icon: <Settings size={18} color="#8b5cf6" />, countStr: metadata.categories['Mechanical Engineering'].count.toLocaleString(), color: '#8b5cf6' },
            { key: 'QA', name: 'Quantitative Aptitude', icon: <Calculator size={18} color="#f97316" />, countStr: metadata.categories['Quantitative Aptitude'].count.toLocaleString(), color: '#f97316' },
            { key: 'DI', name: 'Data Interpretation', icon: <Target size={18} color="#10b981" />, countStr: metadata.categories['Data Interpretation'].count.toLocaleString(), color: '#10b981' },
            { key: 'DILR', name: 'DILR Puzzles', icon: <Puzzle size={18} color="#3b82f6" />, countStr: metadata.categories['DILR'].count.toLocaleString(), color: '#3b82f6' },
            { key: 'LR', name: 'Logical Reasoning', icon: <BrainCircuit size={18} color="#eab308" />, countStr: metadata.categories['Logical Reasoning'].count.toLocaleString(), color: '#eab308' }
          ].map(subject => {
            const val = weights[subject.key];
            const estQs = Math.round((val / 100) * qCount);
            
            return (
              <div key={subject.key} className="dist-card card">
                <div className="dist-header">
                  <div className="dist-title">
                    <div className="dist-icon" style={{ background: `${subject.color}20` }}>{subject.icon}</div>
                    <span>{subject.name} <span className="dist-total">(~{subject.countStr} Qs)</span></span>
                  </div>
                  <div className="dist-input-wrapper">
                    <input 
                      type="number" 
                      className="dist-number-input" 
                      value={val} 
                      onChange={e => handleWeightChange(subject.key, e.target.value)} 
                    />
                    <div className="dist-stepper">
                      <button onClick={() => handleWeightChange(subject.key, val + 1)}>▲</button>
                      <button onClick={() => handleWeightChange(subject.key, val - 1)}>▼</button>
                    </div>
                  </div>
                </div>
                
                <div className="dist-slider-container">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={val} 
                    onChange={e => handleWeightChange(subject.key, e.target.value)}
                    className="dist-slider"
                    style={{ '--slider-color': subject.color, '--slider-pct': `${val}%` }}
                  />
                  <div className="dist-est">~{estQs} Qs</div>
                </div>
              </div>
            );
          })}
        </div>
        {weightError && <div className="error-badge mt-3">⚠️ {weightError}</div>}
      </div>

      <div className="builder-footer">
        <button 
          className="btn btn-primary btn-launch" 
          onClick={generateTest}
          disabled={!!weightError}
        >
          <Rocket size={18} fill="currentColor" /> Create Test
        </button>
      </div>

    </div>
  );
}
