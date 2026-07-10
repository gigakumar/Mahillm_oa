import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Target, Clock, Activity, AlertTriangle, Zap } from 'lucide-react';
import './SessionBriefing.css';

export default function SessionBriefing() {
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [calibrating, setCalibrating] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('current_test_config');
    if (saved) {
      setConfig(JSON.parse(saved));
    }
    
    // Simulate calibration delay
    const timer = setTimeout(() => {
      setCalibrating(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleStart = () => {
    navigate('/tests/session');
  };

  if (!config) return null;

  return (
    <div className="page-content briefing-page">
      <button className="btn-back" onClick={() => navigate('/dashboard')}>
        <ChevronLeft size={20} /> Back to Command Center
      </button>

      <div className="briefing-container card">
        <div className="briefing-header">
          <div className="pulse-indicator">
            <div className={`pulse-ring ${calibrating ? 'active' : ''}`}></div>
            <div className="pulse-dot"></div>
          </div>
          <h1>{calibrating ? 'CALIBRATING SESSION...' : 'ADAPTIVE SESSION READY'}</h1>
        </div>

        <div className="briefing-grid">
          <div className="briefing-details">
            <div className="detail-item">
              <Target size={18} className="detail-icon" />
              <div className="detail-text">
                <span className="label">Session Intent</span>
                <span className="value">CONTINUE ADAPTIVE PATH</span>
              </div>
            </div>
            <div className="detail-item">
              <Activity size={18} className="detail-icon" />
              <div className="detail-text">
                <span className="label">Difficulty Strategy</span>
                <span className="value">DYNAMIC (Targeting 75% Success)</span>
              </div>
            </div>
            <div className="detail-item">
              <Clock size={18} className="detail-icon" />
              <div className="detail-text">
                <span className="label">Length & Time</span>
                <span className="value">{config.count} questions · ~{config.duration} mins</span>
              </div>
            </div>
          </div>

          <div className="briefing-targets">
            <h3>TARGET TOPICS</h3>
            <ul className="target-list">
              <li>
                <span className="topic-cat">Thermodynamics</span>
                <span className="topic-focus">Priority: Entropy</span>
              </li>
              <li>
                <span className="topic-cat">Strength of Materials</span>
                <span className="topic-focus">Priority: Bending Stresses</span>
              </li>
              <li>
                <span className="topic-cat">Quantitative Aptitude</span>
                <span className="topic-focus">Maintaining Baseline</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="briefing-warning">
          <AlertTriangle size={24} className="warning-icon" />
          <div className="warning-text">
            <strong>Active Calibration Warning</strong>
            <p>This session will dynamically adapt in real-time. The next question is strictly selected based on your previous answer's latent traits.</p>
          </div>
        </div>

        <div className="briefing-actions">
          <button 
            className="btn btn-primary btn-lg btn-initiate" 
            onClick={handleStart}
            disabled={calibrating}
          >
            <Zap size={20} fill={calibrating ? "none" : "currentColor"} />
            {calibrating ? 'INITIALIZING ENGINE...' : 'INITIATE SESSION'}
          </button>
        </div>
      </div>
    </div>
  );
}
