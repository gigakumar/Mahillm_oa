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
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './GatePredictor.css';

export default function GatePredictor() {
  const navigate = useNavigate();
  const { testHistory, masteryScores } = useUserData();
  const { scoreData } = useScore();

  const [isSimulating, setIsSimulating] = useState(false);
  const [targetMarks, setTargetMarks] = useState(70);

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
            <h2><Building className="w-5 h-5 text-amber-400" /> PSU Shortlist Call Bands</h2>
            <p>Qualitative shortlist bands based on official PSU recruitment notifications ({REFERENCE_YEAR}).</p>
          </div>
          <button className="practice-boost-btn" onClick={() => navigate('/tests')}>
            <BarChart2 className="w-4 h-4" /> Take Mock Test to Refine
          </button>
        </div>

        <div className="psu-table-wrapper">
          <table className="psu-table">
            <thead>
              <tr>
                <th>PSU Organization</th>
                <th>Category</th>
                <th>Est. Cutoff (GATE Score)</th>
                <th>Historical Target AIR</th>
                <th>Official Source Citation</th>
                <th>Shortlist Band</th>
              </tr>
            </thead>
            <tbody>
              {prediction.psuStatusList.map((psu, idx) => {
                const probColor = psu.bandColor === 'emerald' ? 'badge-success' : psu.bandColor === 'amber' ? 'badge-warning' : 'badge-danger';
                return (
                  <tr key={idx}>
                    <td className="psu-name-td">
                      <Building className="w-4 h-4 text-slate-400" />
                      <strong>{psu.name}</strong>
                    </td>
                    <td><span className="psu-cat-tag">{psu.category}</span></td>
                    <td><span className="font-mono">{psu.minGateScore}+</span></td>
                    <td><span className="font-mono">&lt; #{psu.minAir}</span></td>
                    <td className="source-citation-td">
                      <Info className="w-3.5 h-3.5 text-indigo-400 inline mr-1" />
                      <span className="text-xs text-slate-400">{psu.source}</span>
                    </td>
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
    </div>
  );
}
