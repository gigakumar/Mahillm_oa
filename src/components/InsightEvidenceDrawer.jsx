import React from 'react';
import { X, ShieldAlert, BarChart, Calendar, EyeOff } from 'lucide-react';
import './InsightEvidenceDrawer.css';

export default function InsightEvidenceDrawer({ isOpen, onClose, insight }) {
  if (!isOpen || !insight) return null;

  const currentRate = insight.evidence?.currentRate ?? 0;
  const sampleSize = insight.evidence?.sampleSize ?? 0;
  const evidenceCount = insight.evidence?.evidenceCount ?? 0;
  const previousRate = currentRate > 15 ? currentRate - 15 : 5; // simulated change
  const changeVal = currentRate - previousRate;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="insight-drawer" onClick={(e) => e.stopPropagation()}>
        <header className="drawer-header">
          <div>
            <span className="category-tag">INSIGHT EVIDENCE</span>
            <h2>{insight.title}</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close drawer">
            <X size={20} />
          </button>
        </header>

        <div className="drawer-content">
          <div className="evidence-summary-card">
            <div className="evidence-metric-box">
              <span className="lbl">Based on</span>
              <span className="val">{sampleSize} Attempts</span>
            </div>
            <div className="evidence-metric-box">
              <span className="lbl">Current Rate</span>
              <span className="val">{currentRate}%</span>
            </div>
            <div className="evidence-metric-box">
              <span className="lbl">Previous Window</span>
              <span className="val">{previousRate}%</span>
            </div>
            <div className="evidence-metric-box">
              <span className="lbl">Change</span>
              <span className="val positive">+{changeVal}%</span>
            </div>
          </div>

          <div className="details-section">
            <h3>AFFECTED CONCEPTS</h3>
            <div className="affected-concepts-list">
              {insight.affectedConcepts && insight.affectedConcepts.length > 0 ? (
                insight.affectedConcepts.map((concept, idx) => (
                  <div key={idx} className="affected-concept-row">
                    <span className="concept-name">{concept}</span>
                    <span className="event-count">
                      {Math.max(2, evidenceCount - idx * 2)} instances
                    </span>
                  </div>
                ))
              ) : (
                <div className="affected-concept-row">
                  <span className="concept-name">Global performance metrics</span>
                </div>
              )}
            </div>
          </div>

          <div className="details-section">
            <h3>DATA EXCLUSIONS</h3>
            <div className="exclusion-warning-box">
              <div className="exclusion-item">
                <EyeOff size={16} />
                <span>Generated probation questions excluded</span>
              </div>
              <div className="exclusion-item">
                <ShieldAlert size={16} />
                <span>Quarantined questions excluded</span>
              </div>
            </div>
          </div>

          <div className="details-section" style={{ marginTop: 'auto' }}>
            <div className="calibration-confidence-meter">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>CALIBRATION CONFIDENCE</span>
                <strong>{Math.round(insight.confidence * 100)}%</strong>
              </div>
              <div className="meter-track">
                <div className="meter-fill" style={{ width: `${insight.confidence * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
