import React, { useState, useMemo } from 'react';
import { useUserData } from '../contexts/UserDataContext';
import { useScore } from '../contexts/ScoreContext';
import { predictGatePerformance, REFERENCE_YEAR } from '../utils/gatePredictorEngine';
import {
  Trophy,
  Target,
  TrendingUp,
  Award,
  Building,
  Sparkles,
  ShieldCheck,
  Zap,
  BarChart2,
  AlertTriangle,
  Info,
  ExternalLink,
  Search,
  History,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './GatePredictor.css';

const PSU_CATEGORIES = ['All', 'Maharatna', 'Govt Research', 'Space Research', 'PSU Defence', 'State PSU'];

const HISTORICAL_GATE_BENCHMARKS = [
  { rankBand: 'AIR 1 - 10', rawMarks: '88 - 94.5', gateScore: '980 - 1000', psuCallStatus: 'Guaranteed IOCL / ONGC / NTPC Rank 1', trend: 'Very Hard Top 10 Competition' },
  { rankBand: 'AIR 11 - 100', rawMarks: '80 - 87.5', gateScore: '900 - 979', psuCallStatus: 'Direct Call for All Top Maharatnas', trend: 'Consistent Top 1% Tier' },
  { rankBand: 'AIR 101 - 500', rawMarks: '70 - 79.5', gateScore: '800 - 899', psuCallStatus: 'All Maharatna & BARC Interview Shortlists', trend: 'High Selection Probability' },
  { rankBand: 'AIR 501 - 1500', rawMarks: '60 - 69.5', gateScore: '700 - 799', psuCallStatus: 'HAL / BEL / State PSU & Top IIT M.Tech', trend: 'Moderate PSU Shortlists' },
  { rankBand: 'AIR 1501 - 4000', rawMarks: '48 - 59.5', gateScore: '580 - 699', psuCallStatus: 'New IITs / NITs M.Tech & State AEs', trend: 'Qualifying Plus Tier' },
  { rankBand: 'AIR 4001 - 10000', rawMarks: '35 - 47.5', gateScore: '450 - 579', psuCallStatus: 'NIT M.Tech & Self-Financed Programs', trend: 'Base GATE Qualifier' }
];

export default function GatePredictor() {
  const navigate = useNavigate();
  const { testHistory, masteryScores } = useUserData();
  const { scoreData } = useScore();

  const [isSimulating, setIsSimulating] = useState(false);
  const [targetMarks, setTargetMarks] = useState(70);
  const [psuSearch, setPsuSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const totalAttempted = scoreData?.totalAttempted || 0;
  const totalCorrect = scoreData?.totalCorrect || 0;
  const overallAccuracy = totalAttempted > 0 ? totalCorrect / totalAttempted : 0.72;

  // Compute prediction metrics
  const prediction = useMemo(() => {
    if (isSimulating) {
      const simulatedAccuracy = targetMarks / 100;
      return predictGatePerformance([{ score: targetMarks }], {}, simulatedAccuracy);
    }
    return predictGatePerformance(testHistory || [], masteryScores || {}, overallAccuracy);
  }, [testHistory, masteryScores, overallAccuracy, isSimulating, targetMarks]);

  // Filter PSUs
  const filteredPsus = prediction.psuStatusList.filter(psu => {
    const matchesCat = categoryFilter === 'All' || psu.category === categoryFilter;
    const matchesSearch = psuSearch.trim() === '' ||
      psu.name.toLowerCase().includes(psuSearch.toLowerCase()) ||
      psu.category.toLowerCase().includes(psuSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="gate-predictor-container">
      {/* Disclaimer Notice Banner */}
      <div className="disclaimer-banner">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
        <div>
          <strong>Important Guidance Notice:</strong> Cutoffs based on {REFERENCE_YEAR} cycle, subject to change. Sourced from official PSU recruitment notifications. Intended as guidance only.
        </div>
      </div>

      {/* Header Card */}
      <div className="predictor-header-card">
        <div className="header-info">
          <div className="header-badge">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>AI GATE & PSU Estimator</span>
          </div>
          <h1>GATE Mechanical Rank & PSU Call Estimator</h1>
          <p>Projected All India Rank (AIR) band and PSU shortlist call bands calibrated against published GATE ME historical statistics.</p>
        </div>

        <div className="confidence-pill">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{isSimulating ? 'What-If Simulation Mode' : prediction.confidenceLevel}</span>
        </div>
      </div>

      {/* What-If Target Marks Simulator Box */}
      <div className="card" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '1.25rem 1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f8fafc', fontWeight: '600', fontSize: '1rem' }}>
            <Zap size={18} className="text-amber-400" />
            <span>Target Marks Simulator ("What-If" Analysis)</span>
          </div>
          <button
            className={`btn ${isSimulating ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setIsSimulating(!isSimulating)}
          >
            {isSimulating ? 'Reset to Real Practice Stats' : 'Enable What-If Slider'}
          </button>
        </div>

        {isSimulating && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: '#94a3b8' }}>Simulated GATE Marks out of 100:</span>
              <strong style={{ color: '#38bdf8', fontSize: '1.1rem' }}>{targetMarks} / 100 Marks</strong>
            </div>
            <input
              type="range"
              min="20"
              max="95"
              value={targetMarks}
              onChange={(e) => setTargetMarks(parseInt(e.target.value))}
              style={{ accentColor: '#6366f1', cursor: 'pointer', height: '6px' }}
            />
          </div>
        )}
      </div>

      {/* Main Score Prediction Cards */}
      <div className="prediction-cards-grid">
        {/* Estimated AIR Range Card */}
        <div className="pred-card primary-pred">
          <div className="pred-card-header">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span>Estimated AIR Band</span>
          </div>
          <div className="pred-card-body">
            <div className="pred-big-value">{prediction.airBandStr}</div>
            <div className="pred-subtitle">Based on published GATE ME Score-to-Rank tables</div>
          </div>
          <div className="pred-card-footer text-emerald-400">
            <TrendingUp className="w-4 h-4" /> Calibrated for ~75,000 ME candidates
          </div>
        </div>

        {/* Estimated GATE Score Card */}
        <div className="pred-card">
          <div className="pred-card-header">
            <Award className="w-6 h-6 text-indigo-400" />
            <span>Estimated GATE Score</span>
          </div>
          <div className="pred-card-body">
            <div className="pred-big-value">{prediction.estimatedGateScore} <span className="max-val">/ 1000</span></div>
            <div className="pred-subtitle">Normalized Score Scale</div>
          </div>
          <div className="pred-card-footer text-indigo-300">
            <Zap className="w-4 h-4" /> Est. Raw Marks: ~{prediction.estimatedRawMarks} / 100
          </div>
        </div>

        {/* Qualifying Status Card */}
        <div className="pred-card">
          <div className="pred-card-header">
            <Target className="w-6 h-6 text-emerald-400" />
            <span>Qualifying Cutoff</span>
          </div>
          <div className="pred-card-body">
            <div className="pred-big-value text-emerald-400">
              {prediction.isQualifying ? 'QUALIFIED ✅' : 'IN PROGRESS ⚠️'}
            </div>
            <div className="pred-subtitle">Est. Gen Cutoff: ~{prediction.qualifyingCutoff} Marks</div>
          </div>
          <div className="pred-card-footer text-slate-400">
            Margin: +{(prediction.estimatedRawMarks - prediction.qualifyingCutoff).toFixed(1)} Marks
          </div>
        </div>
      </div>

      {/* PSU Cutoff & Call Eligibility Section */}
      <div className="psu-section-card">
        <div className="psu-header">
          <div>
            <h2><Building className="w-5 h-5 text-amber-400" /> PSU Shortlist Call Bands & Salary Packages</h2>
            <p>Qualitative shortlist bands based on official PSU recruitment notifications ({REFERENCE_YEAR}).</p>
          </div>
          <button className="practice-boost-btn" onClick={() => navigate('/tests')}>
            <BarChart2 className="w-4 h-4" /> Take Mock Test to Refine
          </button>
        </div>

        {/* PSU Filter Controls */}
        <div className="psu-filter-bar" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', margin: '1rem 0', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(30, 41, 59, 0.7)', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', flex: 1, minWidth: '200px' }}>
            <Search size={15} color="#64748b" />
            <input
              type="text"
              placeholder="Search PSU (e.g. IOCL, ONGC, ISRO...)"
              value={psuSearch}
              onChange={e => setPsuSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#f1f5f9', fontSize: '0.85rem', outline: 'none', width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {PSU_CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`btn btn-sm ${categoryFilter === cat ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="psu-table-wrapper">
          <table className="psu-table">
            <thead>
              <tr>
                <th>PSU Organization</th>
                <th>Category</th>
                <th>Est. Package</th>
                <th>Est. Cutoff (GATE Score)</th>
                <th>Target AIR</th>
                <th>Shortlist Band</th>
              </tr>
            </thead>
            <tbody>
              {filteredPsus.map((psu, idx) => {
                const probColor = psu.bandColor === 'emerald' ? 'badge-success' : psu.bandColor === 'amber' ? 'badge-warning' : 'badge-danger';
                return (
                  <tr key={idx}>
                    <td className="psu-name-td">
                      <Building className="w-4 h-4 text-slate-400" />
                      <strong>{psu.name}</strong>
                    </td>
                    <td><span className="psu-cat-tag">{psu.category}</span></td>
                    <td>
                      <span className="psu-pkg-tag" style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.82rem', background: 'rgba(245, 158, 11, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                        💼 {psu.avgPackage || '12.0 LPA'}
                      </span>
                    </td>
                    <td><span className="font-mono">{psu.minGateScore}+</span></td>
                    <td><span className="font-mono">&lt; #{psu.minAir}</span></td>
                    <td>
                      <span className={`badge ${probColor} font-semibold`}>
                        {psu.band}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Score vs Rank Reference Matrix */}
      <div className="psu-section-card" style={{ marginTop: '2rem' }}>
        <div className="psu-header">
          <div>
            <h2><History className="w-5 h-5 text-indigo-400" /> 5-Year Historical GATE ME Score-to-Rank Benchmarks</h2>
            <p>Calibrated benchmarks combining GATE Mechanical official result trends (2020 – 2025).</p>
          </div>
        </div>

        <div className="psu-table-wrapper">
          <table className="psu-table">
            <thead>
              <tr>
                <th>Target AIR Band</th>
                <th>Est. Raw Marks (/100)</th>
                <th>Est. GATE Score (/1000)</th>
                <th>PSU & IIT Call Prospects</th>
                <th>Competition Density</th>
              </tr>
            </thead>
            <tbody>
              {HISTORICAL_GATE_BENCHMARKS.map((row, idx) => (
                <tr key={idx}>
                  <td><strong style={{ color: '#818cf8' }}>{row.rankBand}</strong></td>
                  <td><span className="font-mono" style={{ color: '#38bdf8', fontWeight: 700 }}>{row.rawMarks}</span></td>
                  <td><span className="font-mono" style={{ color: '#34d399', fontWeight: 700 }}>{row.gateScore}</span></td>
                  <td style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>{row.psuCallStatus}</td>
                  <td><span className="badge badge-secondary" style={{ fontSize: '0.78rem' }}>{row.trend}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
