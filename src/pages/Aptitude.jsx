import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calculator, 
  Brain, 
  PieChart, 
  Layers, 
  BookOpen, 
  Sparkles, 
  Play, 
  Zap, 
  Target, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight, 
  RotateCcw,
  Clock,
  ChevronRight,
  Compass,
  AlertCircle
} from 'lucide-react';
import { useUserData } from '../contexts/UserDataContext';
import { useScore } from '../contexts/ScoreContext';
import './Aptitude.css';

// Aptitude Domains configuration with topics & counts
const APTITUDE_DOMAINS = [
  {
    id: 'quants',
    title: 'Quantitative Aptitude',
    categoryKey: 'Quantitative Aptitude',
    emoji: '🧮',
    count: 348,
    color: '#3b82f6',
    bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.05) 100%)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    description: 'Master numerical estimation, algebra, arithmetic, ratio-proportion, and probability for GATE GA & PSUs.',
    topics: ['Percentages', 'Profit & Loss', 'Time & Work', 'Speed, Distance & Time', 'Algebra', 'Geometry & Mensuration', 'Number Systems', 'Probability', 'P&C']
  },
  {
    id: 'lr',
    title: 'Logical Reasoning',
    categoryKey: 'Logical Reasoning',
    emoji: '🧠',
    count: 59,
    color: '#a855f7',
    bgGradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(147, 51, 234, 0.05) 100%)',
    borderColor: 'rgba(168, 85, 247, 0.3)',
    description: 'Deductive reasoning, pattern recognition, series completion, blood relations, and syllogisms.',
    topics: ['Series Completion', 'Coding-Decoding', 'Syllogisms', 'Direction Sense', 'Blood Relations', 'Clocks & Calendars', 'Analogy']
  },
  {
    id: 'di',
    title: 'Data Interpretation',
    categoryKey: 'Data Interpretation',
    emoji: '📊',
    count: 15,
    color: '#06b6d4',
    bgGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(8, 145, 178, 0.05) 100%)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    description: 'Extract insights from complex tables, bar charts, pie charts, line graphs, and data sufficiency problems.',
    topics: ['Tables & Data Grids', 'Bar Charts', 'Pie Charts', 'Line Graphs', 'Data Sufficiency']
  },
  {
    id: 'dilr',
    title: 'DILR Puzzles',
    categoryKey: 'DILR',
    emoji: '🧩',
    count: 14,
    color: '#f59e0b',
    bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.05) 100%)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    description: 'High-level constraint satisfaction puzzles, linear & circular seating arrangements, and grouping.',
    topics: ['Seating Arrangements', 'Constraint Satisfaction', 'Matrix Puzzles', 'Order & Ranking']
  },
  {
    id: 'verbal',
    title: 'Verbal & Critical Reasoning',
    categoryKey: 'Logical Reasoning',
    emoji: '📝',
    count: 45,
    color: '#10b981',
    bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    description: 'Grammar, vocabulary, sentence completion, reading comprehension, and critical inferences.',
    topics: ['Grammar & Error Spotting', 'Vocabulary & Synonyms', 'Sentence Completion', 'Reading Comprehension', 'Critical Inferences']
  },
  {
    id: 'spatial',
    title: 'Spatial Aptitude (GATE Special)',
    categoryKey: 'Logical Reasoning',
    emoji: '📐',
    count: 25,
    color: '#ec4899',
    bgGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(219, 39, 119, 0.05) 100%)',
    borderColor: 'rgba(236, 72, 153, 0.3)',
    description: 'Paper folding, mirror images, 3D block rotations, pattern assembly (GATE 2026 mandatory GA section).',
    topics: ['Paper Folding & Cutting', 'Mirror & Water Images', '3D Block Rotation', 'Pattern Assembly', 'Grouping Figures']
  }
];

export default function Aptitude() {
  const navigate = useNavigate();
  const { scoreData } = useScore();
  const { questionProgress } = useUserData();

  // Active tab inside aptitude hub
  const [activeTab, setActiveTab] = useState('domains'); // 'domains' | 'calculators' | 'presets' | 'shortcuts'

  // Calculator states
  const [calcInputs, setCalcInputs] = useState({
    profitX: 10,
    speedKmh: 72,
    ciP: 10000,
    ciR: 10,
    ciN: 2,
    probFavorable: 3,
    probTotal: 10
  });

  const handleCalcChange = (field, val) => {
    setCalcInputs(prev => ({ ...prev, [field]: parseFloat(val) || 0 }));
  };

  // Compute stats
  const totalAttempted = Object.keys(questionProgress || {}).length;

  return (
    <div className="aptitude-page-container">
      {/* Hero Stream Banner */}
      <div className="aptitude-hero-banner">
        <div className="hero-left-content">
          <div className="hero-badge">
            <Calculator size={14} />
            <span>GENERAL APTITUDE HUB & PLACEMENT SUITE</span>
          </div>
          <h1 className="hero-title">
            Master General Aptitude for <span className="highlight-text">GATE & PSUs</span>
          </h1>
          <p className="hero-subtitle">
            Comprehensive quantitative aptitude, logical reasoning, DILR puzzles, and GATE spatial reasoning with 400+ solved PYQs, speed math calculators, and 15-mark GATE simulators.
          </p>

          <div className="hero-actions">
            <button 
              className="btn-primary-action" 
              onClick={() => navigate('/oa-practice?cat=Quantitative%20Aptitude')}
            >
              <Zap size={18} />
              <span>Start Quants Practice</span>
            </button>

            <button 
              className="btn-secondary-action" 
              onClick={() => navigate('/tests')}
            >
              <Award size={18} />
              <span>GATE GA 15-Mark Simulator</span>
            </button>
          </div>
        </div>

        <div className="hero-right-stats">
          <div className="stat-card-glass">
            <div className="stat-icon-wrapper amber">
              <Sparkles size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{scoreData?.totalXp || 1476} XP</span>
              <span className="stat-label">Aptitude Score</span>
            </div>
          </div>

          <div className="stat-card-glass">
            <div className="stat-icon-wrapper indigo">
              <Target size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">450+</span>
              <span className="stat-label">Question Pool</span>
            </div>
          </div>

          <div className="stat-card-glass">
            <div className="stat-icon-wrapper emerald">
              <CheckCircle2 size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{totalAttempted} Solved</span>
              <span className="stat-label">Practice Progress</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="aptitude-nav-tabs">
        <button 
          className={`tab-btn ${activeTab === 'domains' ? 'active' : ''}`}
          onClick={() => setActiveTab('domains')}
        >
          <Layers size={16} />
          <span>Aptitude Domains ({APTITUDE_DOMAINS.length})</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'calculators' ? 'active' : ''}`}
          onClick={() => setActiveTab('calculators')}
        >
          <Calculator size={16} />
          <span>Interactive Math Calculators</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'presets' ? 'active' : ''}`}
          onClick={() => setActiveTab('presets')}
        >
          <Award size={16} />
          <span>GATE & Placement Sprints</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'shortcuts' ? 'active' : ''}`}
          onClick={() => setActiveTab('shortcuts')}
        >
          <BookOpen size={16} />
          <span>Percentage & Speed Tricks</span>
        </button>
      </div>

      {/* TAB 1: APTITUDE DOMAINS GRID */}
      {activeTab === 'domains' && (
        <div className="aptitude-domains-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Aptitude Core Topics & Question Banks</h2>
              <p className="section-sub">Select a domain below to launch topic-focused practice drills or review questions.</p>
            </div>
          </div>

          <div className="domains-grid">
            {APTITUDE_DOMAINS.map((domain) => (
              <div 
                key={domain.id} 
                className="domain-card"
                style={{ 
                  background: domain.bgGradient,
                  borderColor: domain.borderColor
                }}
              >
                <div className="domain-card-header">
                  <span className="domain-emoji">{domain.emoji}</span>
                  <div className="domain-header-meta">
                    <span className="domain-count-badge">{domain.count} Questions</span>
                  </div>
                </div>

                <h3 className="domain-title">{domain.title}</h3>
                <p className="domain-desc">{domain.description}</p>

                <div className="domain-topics-list">
                  {domain.topics.slice(0, 4).map((t, i) => (
                    <span key={i} className="topic-pill">{t}</span>
                  ))}
                  {domain.topics.length > 4 && (
                    <span className="topic-pill-more">+{domain.topics.length - 4} more</span>
                  )}
                </div>

                <div className="domain-card-footer">
                  <button 
                    className="domain-action-btn"
                    style={{ background: domain.color }}
                    onClick={() => navigate(`/oa-practice?cat=${encodeURIComponent(domain.categoryKey)}`)}
                  >
                    <Play size={14} fill="currentColor" />
                    <span>Practice {domain.title.split(' ')[0]}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE CALCULATORS */}
      {activeTab === 'calculators' && (
        <div className="aptitude-calculators-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Speed Math & Formula Calculators</h2>
              <p className="section-sub">Interactive solvers to test concepts and speed up numerical problem solving.</p>
            </div>
          </div>

          <div className="calculators-grid">
            {/* Calc 1: Successive Profit & Loss */}
            <div className="calc-card">
              <div className="calc-header">
                <span className="calc-icon">📈</span>
                <div>
                  <h3 className="calc-title">Same SP Profit & Loss Trap</h3>
                  <span className="calc-tag">Profit & Loss</span>
                </div>
              </div>
              <p className="calc-formula">Net Loss % = (x / 10)² %</p>
              <div className="calc-inputs-row">
                <label>Common profit & loss % (x):</label>
                <input 
                  type="number" 
                  value={calcInputs.profitX}
                  onChange={(e) => handleCalcChange('profitX', e.target.value)}
                />
              </div>
              <div className="calc-result-box">
                <span className="result-label">Net Result:</span>
                <span className="result-val text-red-400">
                  -{(Math.pow(calcInputs.profitX / 10, 2)).toFixed(2)}% Net Loss
                </span>
              </div>
            </div>

            {/* Calc 2: Speed Unit Converter */}
            <div className="calc-card">
              <div className="calc-header">
                <span className="calc-icon">⚡</span>
                <div>
                  <h3 className="calc-title">Speed Unit Converter</h3>
                  <span className="calc-tag">Speed & Distance</span>
                </div>
              </div>
              <p className="calc-formula">m/s = km/h × (5 / 18)</p>
              <div className="calc-inputs-row">
                <label>Speed in km/h:</label>
                <input 
                  type="number" 
                  value={calcInputs.speedKmh}
                  onChange={(e) => handleCalcChange('speedKmh', e.target.value)}
                />
              </div>
              <div className="calc-result-box">
                <span className="result-label">Equivalent m/s:</span>
                <span className="result-val text-cyan-400">
                  {(calcInputs.speedKmh * 5 / 18).toFixed(2)} m/s
                </span>
              </div>
            </div>

            {/* Calc 3: Compound Interest */}
            <div className="calc-card">
              <div className="calc-header">
                <span className="calc-icon">💰</span>
                <div>
                  <h3 className="calc-title">Compound Interest Evaluator</h3>
                  <span className="calc-tag">Interest</span>
                </div>
              </div>
              <p className="calc-formula">A = P (1 + r/100)ⁿ | CI = A - P</p>
              <div className="calc-inputs-grid">
                <div>
                  <label>Principal (P):</label>
                  <input 
                    type="number" 
                    value={calcInputs.ciP}
                    onChange={(e) => handleCalcChange('ciP', e.target.value)}
                  />
                </div>
                <div>
                  <label>Rate % (r):</label>
                  <input 
                    type="number" 
                    value={calcInputs.ciR}
                    onChange={(e) => handleCalcChange('ciR', e.target.value)}
                  />
                </div>
                <div>
                  <label>Years (n):</label>
                  <input 
                    type="number" 
                    value={calcInputs.ciN}
                    onChange={(e) => handleCalcChange('ciN', e.target.value)}
                  />
                </div>
              </div>
              <div className="calc-result-box">
                <span className="result-label">Total Amount A:</span>
                <span className="result-val text-emerald-400">
                  ₹{(calcInputs.ciP * Math.pow(1 + calcInputs.ciR / 100, calcInputs.ciN)).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Calc 4: Classical Probability */}
            <div className="calc-card">
              <div className="calc-header">
                <span className="calc-icon">🎲</span>
                <div>
                  <h3 className="calc-title">Probability Evaluator</h3>
                  <span className="calc-tag">Probability</span>
                </div>
              </div>
              <p className="calc-formula">P(A) = Favorable / Total</p>
              <div className="calc-inputs-grid">
                <div>
                  <label>Favorable N(A):</label>
                  <input 
                    type="number" 
                    value={calcInputs.probFavorable}
                    onChange={(e) => handleCalcChange('probFavorable', e.target.value)}
                  />
                </div>
                <div>
                  <label>Total N(S):</label>
                  <input 
                    type="number" 
                    value={calcInputs.probTotal}
                    onChange={(e) => handleCalcChange('probTotal', e.target.value)}
                  />
                </div>
              </div>
              <div className="calc-result-box">
                <span className="result-label">Probability P(A):</span>
                <span className="result-val text-indigo-400">
                  {calcInputs.probTotal > 0 ? (calcInputs.probFavorable / calcInputs.probTotal).toFixed(4) : 0} ({calcInputs.probTotal > 0 ? ((calcInputs.probFavorable / calcInputs.probTotal) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EXAM PRESETS & SPRINTS */}
      {activeTab === 'presets' && (
        <div className="aptitude-presets-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Aptitude Sprints & Placement Tests</h2>
              <p className="section-sub">Practice simulated aptitude rounds for GATE, ISRO, BARC, TCS, and PSUs.</p>
            </div>
          </div>

          <div className="presets-cards-grid">
            <div className="preset-card gold-border">
              <div className="preset-header">
                <div className="preset-badge gold">GATE 2026 MANDATORY</div>
                <h3 className="preset-title">GATE General Aptitude 15-Mark Simulator 🏆</h3>
              </div>
              <p className="preset-desc">
                10 high-yield questions matching official GATE pattern: 5 questions × 1 Mark + 5 questions × 2 Marks (Total 15 Marks).
              </p>
              <div className="preset-stats">
                <span>⏱️ 15 Mins</span>
                <span>❓ 10 Questions</span>
                <span>🎯 1/3 & 2/3 Neg.</span>
              </div>
              <button className="preset-launch-btn" onClick={() => navigate('/tests')}>
                <span>Start GATE GA Test</span>
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="preset-card blue-border">
              <div className="preset-header">
                <div className="preset-badge blue">PLACEMENT SPECIAL</div>
                <h3 className="preset-title">IT & PSU Placement Aptitude Round 🏢</h3>
              </div>
              <p className="preset-desc">
                30 timed aptitude questions covering Quantitative Aptitude, Logical Reasoning, and Data Interpretation.
              </p>
              <div className="preset-stats">
                <span>⏱️ 30 Mins</span>
                <span>❓ 30 Questions</span>
                <span>🎯 Mixed Topics</span>
              </div>
              <button className="preset-launch-btn" onClick={() => navigate('/tests')}>
                <span>Start Placement Test</span>
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="preset-card purple-border">
              <div className="preset-header">
                <div className="preset-badge purple">SPEED DRILL</div>
                <h3 className="preset-title">5-Minute Speed Math Drill ⚡</h3>
              </div>
              <p className="preset-desc">
                5 rapid-fire mental math questions designed to boost calculation speed under extreme clock pressure.
              </p>
              <div className="preset-stats">
                <span>⏱️ 5 Mins</span>
                <span>❓ 5 Questions</span>
                <span>⚡ High Speed</span>
              </div>
              <button className="preset-launch-btn" onClick={() => navigate('/oa-practice?cat=Quantitative%20Aptitude')}>
                <span>Launch Speed Sprint</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PERCENTAGE & SPEED SHORTCUT MATRIX */}
      {activeTab === 'shortcuts' && (
        <div className="aptitude-shortcuts-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Percentage to Fraction Quick Conversion Table</h2>
              <p className="section-sub">Memorize these high-frequency fraction conversions to solve quants problems in under 30 seconds.</p>
            </div>
          </div>

          <div className="fraction-matrix-grid">
            {[
              { fraction: '1/2', percent: '50%', decimal: '0.50' },
              { fraction: '1/3', percent: '33.33%', decimal: '0.333' },
              { fraction: '1/4', percent: '25%', decimal: '0.25' },
              { fraction: '1/5', percent: '20%', decimal: '0.20' },
              { fraction: '1/6', percent: '16.67%', decimal: '0.166' },
              { fraction: '1/7', percent: '14.28%', decimal: '0.142' },
              { fraction: '1/8', percent: '12.5%', decimal: '0.125' },
              { fraction: '1/9', percent: '11.11%', decimal: '0.111' },
              { fraction: '1/10', percent: '10%', decimal: '0.10' },
              { fraction: '1/11', percent: '9.09%', decimal: '0.0909' },
              { fraction: '1/12', percent: '8.33%', decimal: '0.0833' },
              { fraction: '1/15', percent: '6.67%', decimal: '0.0666' },
            ].map((item, idx) => (
              <div key={idx} className="fraction-card">
                <span className="frac-val">{item.fraction}</span>
                <span className="frac-percent">{item.percent}</span>
                <span className="frac-decimal">({item.decimal})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
