import React from 'react';
import { X, TrendingUp, AlertTriangle, ShieldCheck, Activity, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ConceptProfileDrawer.css';

export default function ConceptProfileDrawer({ isOpen, onClose, concept, category }) {
  const navigate = useNavigate();
  if (!isOpen || !concept) return null;

  // Derive variables with safe fallbacks
  const mastery = concept.masteryScore !== undefined ? Math.round(concept.masteryScore * 100) : 0;
  const stability = concept.stabilityScore !== undefined ? Math.round(concept.stabilityScore * 100) : 50;
  const confidence = concept.confidenceScore !== undefined ? Math.round(concept.confidenceScore * 100) : 70;
  const exposure = concept.questionsAttempted || 0;
  const status = concept.status || 'UNKNOWN';

  const isZeroData = exposure === 0;

  const handleRepair = () => {
    localStorage.setItem('current_test_config', JSON.stringify({
      mode: 'adaptive',
      intent: 'CONCEPT_REPAIR',
      targetConcept: concept.topic,
      category: category,
      duration: 14,
      count: 10
    }));
    onClose();
    navigate('/tests/session-briefing');
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="concept-drawer" onClick={(e) => e.stopPropagation()}>
        <header className="drawer-header">
          <div>
            <span className="category-tag">{category}</span>
            <h2>{concept.topic}</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close drawer">
            <X size={20} />
          </button>
        </header>

        <div className="drawer-content">
          {isZeroData ? (
            <div className="zero-telemetry-state">
              <AlertTriangle size={32} className="warning-icon" />
              <h3>Not enough evidence</h3>
              <p>Mahi needs exposure data to diagnose performance stability and failure patterns for this concept.</p>
              <div className="exposure-requirements">
                <strong>Exposure Requirements:</strong>
                <span>• Current attempts: 0 / 5</span>
              </div>
              <button className="btn btn-primary" onClick={handleRepair} style={{ marginTop: '1.5rem', width: '100%' }}>
                Calibrate Concept
              </button>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="stats-row-grid">
                <div className="stat-box">
                  <span className="lbl">Mastery</span>
                  <span className="val">{mastery}%</span>
                </div>
                <div className="stat-box">
                  <span className="lbl">Stability</span>
                  <span className="val">{stability}%</span>
                </div>
                <div className="stat-box">
                  <span className="lbl">Confidence</span>
                  <span className="val">{confidence}%</span>
                </div>
                <div className="stat-box">
                  <span className="lbl">Exposure</span>
                  <span className="val">{exposure} Qs</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="status-badge-row">
                <span className="lbl">Status Diagnosis</span>
                <span className={`status-badge-val status-${status.toLowerCase()}`}>
                  {status}
                </span>
              </div>

              {/* Diagnosis and Failure Pattern */}
              <div className="details-section">
                <h3>SYSTEM DIAGNOSIS</h3>
                <p className="diagnosis-text">
                  {status === 'UNSTABLE' 
                    ? "You understand the core principles, but performance drops in multi-step or complex calculations."
                    : status === 'MASTERED'
                    ? "High retention stability. Excellent speed and accuracy consistency."
                    : "Calibrating conceptual framework. Core weaknesses observed in numerical formulation."}
                </p>
              </div>

              <div className="details-section">
                <h3>PRIMARY FAILURE PATTERN</h3>
                <div className="failure-pattern-box">
                  <strong>Calculation Cascade</strong>
                  <p>Incorrect calculation leads to intermediate error propagation, resulting in an incorrect final option choice.</p>
                </div>
              </div>

              <div className="details-section">
                <h3>RECOMMENDED ACTION</h3>
                <div className="action-recommend-box">
                  <strong>Stability Repair Session</strong>
                  <p>10 questions targeting focus gaps · ~14 minutes</p>
                  <button className="btn btn-primary" onClick={handleRepair} style={{ width: '100%', marginTop: '1rem' }}>
                    REPAIR THIS CONCEPT
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
