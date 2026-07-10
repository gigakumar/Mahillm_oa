import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Target, Clock, Activity, AlertTriangle, Zap } from 'lucide-react';
import { useUserData } from '../../contexts/UserDataContext';
import './SessionBriefing.css';

export default function SessionBriefing() {
  const navigate = useNavigate();
  const { questionProgress } = useUserData();
  const [config, setConfig] = useState(null);
  const [calibrating, setCalibrating] = useState(true);

  const totalAttempts = Object.keys(questionProgress || {}).length;
  const isColdStart = totalAttempts < 10;

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

  const intent = config.intent || 'OPTIMAL';

  const intentDetails = {
    OPTIMAL: {
      title: "OPTIMAL SYLLABUS PATH",
      difficulty: "DYNAMIC (Targeting 75% Success)",
      objective: "Calibrating your optimal mastery progression route across all categories.",
      composition: "Target difficulty: 50% | Above: 25% | Below: 25%"
    },
    WEAKNESS_REPAIR: {
      title: "WEAKNESS REPAIR SESSION",
      difficulty: "STABILIZING",
      objective: "Target and repair active performance weakness loops and prerequisite concept gaps.",
      composition: "Target difficulty: 40% | Prerequisite: 40% | Below: 20%"
    },
    STRETCH: {
      title: "CHALLENGE SESSION",
      difficulty: "STRETCH",
      objective: "Test performance above your current estimated ability boundary.",
      composition: "Target difficulty: 35% | Above target: 60% | Below target: 5%"
    },
    DECAY_RECOVERY: {
      title: "DECAY RECOVERY SESSION",
      difficulty: "RETENTION REINFORCEMENT",
      objective: "Reinforce concepts identified as having high memory decay risk.",
      composition: "Decaying concepts: 70% | Baseline: 30%"
    },
    MISTAKE_REPAIR: {
      title: "MISTAKE REPAIR SESSION",
      difficulty: "FOCUSED",
      objective: "Train specifically on patterns retrieved from your active Mistakes Notebook.",
      composition: "Mistake fingerprinted: 80% | Unseen: 20%"
    },
    ASSESSMENT: {
      title: "READINESS ASSESSMENT",
      difficulty: "BENCHMARK CALIBRATION",
      objective: "Run diagnostics to establish baseline syllabus readiness scores.",
      composition: "Balanced coverage: 100%"
    },
    CONCEPT_REPAIR: {
      title: "CONCEPT REPAIR: " + (config.targetConcept || "General"),
      difficulty: "FOCUSED CALIBRATION",
      objective: `Directly targets stability restoration for concept: ${config.targetConcept || "General"}.`,
      composition: `${config.targetConcept || "General"}: 75% | Mixed: 25%`
    }
  };

  const details = intentDetails[intent] || intentDetails.OPTIMAL;

  return (
    <div className="page-content briefing-page">
      <button className="btn-back" onClick={() => navigate('/')}>
        <ChevronLeft size={20} /> Back to Command Center
      </button>

      <div className="briefing-container card">
        <div className="briefing-header">
          <div className="pulse-indicator">
            <div className={`pulse-ring ${calibrating ? 'active' : ''}`}></div>
            <div className="pulse-dot"></div>
          </div>
          <h1>{calibrating ? 'CALIBRATING SESSION...' : details.title}</h1>
        </div>

        <div className="briefing-grid">
          <div className="briefing-details">
            <div className="detail-item">
              <Target size={18} className="detail-icon" />
              <div className="detail-text">
                <span className="label">Session Objective</span>
                <span className="value" style={{ fontSize: '1rem', fontWeight: 'normal', fontFamily: 'inherit', color: 'var(--text-secondary)' }}>
                  {details.objective}
                </span>
              </div>
            </div>
            <div className="detail-item">
              <Activity size={18} className="detail-icon" />
              <div className="detail-text">
                <span className="label">Composition Strategy</span>
                <span className="value">{details.composition}</span>
              </div>
            </div>
            <div className="detail-item">
              <Clock size={18} className="detail-icon" />
              <div className="detail-text">
                <span className="label">Length & Time</span>
                <span className="value">{config.count || 12} questions · ~{config.duration || 18} mins</span>
              </div>
            </div>
          </div>

          <div className="briefing-targets">
            <h3>TARGET TOPICS</h3>
            <ul className="target-list">
              <li>
                <span className="topic-cat">{config.targetConcept ? config.category : "Thermodynamics"}</span>
                <span className="topic-focus">{config.targetConcept ? `Focus: ${config.targetConcept}` : "Priority: Entropy"}</span>
              </li>
              <li>
                <span className="topic-cat">{config.targetConcept ? "Quantitative Aptitude" : "Strength of Materials"}</span>
                <span className="topic-focus">{config.targetConcept ? "Maintaining baseline" : "Priority: Bending Stresses"}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="briefing-warning">
          <Activity size={24} className="warning-icon" style={{ color: 'var(--accent)' }} />
          <div className="warning-text">
            <strong>ADAPTIVE SESSION</strong>
            <p>
              {isColdStart 
                ? "Mahi will use your answers to establish an initial ability and concept baseline. Question selection may adjust as evidence is collected."
                : "Question selection adapts to your recent performance, concept stability, and session objective."}
            </p>
          </div>
        </div>

        <div className="briefing-actions">
          <button 
            className="btn btn-primary btn-lg btn-initiate" 
            onClick={handleStart}
            disabled={calibrating}
          >
            <Zap size={20} fill={calibrating ? "none" : "currentColor"} />
            {calibrating ? 'INITIALIZING ENGINE...' : (
              intent === 'OPTIMAL' ? 'CONTINUE ADAPTIVE PATH' :
              intent === 'WEAKNESS_REPAIR' ? 'START REPAIR SESSION' :
              intent === 'STRETCH' ? 'START CHALLENGE' :
              intent === 'DECAY_RECOVERY' ? 'START RECOVERY SESSION' :
              intent === 'MISTAKE_REPAIR' ? 'START MISTAKE TRAINING' :
              intent === 'CONCEPT_REPAIR' ? 'START CONCEPT REPAIR' :
              'START ASSESSMENT'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
