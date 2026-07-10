import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../contexts/UserDataContext';
import { compileLearnerState } from '../intelligence/learnerStateModel';
import { deriveInsights } from '../intelligence/learnerInsights/cognitiveInsightEngine';
import { MOCK_TESTS } from '../data/mockSeriesConfig';
import { getWeakestTopics } from '../utils/adaptiveEngine';
import { 
  Play, 
  TrendingUp, 
  Target, 
  Activity, 
  Lock, 
  Unlock, 
  ArrowRight,
  Brain,
  Clock,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { spacedRepetition, masteryScores, mistakes, questionProgress } = useUserData();
  const firstName = user?.displayName?.split(' ')[0] || 'Harshit';

  const [loadingPools, setLoadingPools] = useState(true);
  const [allQuestions, setAllQuestions] = useState([]);

  // Load all question pools on mount to compile dynamic ELOs
  useEffect(() => {
    async function loadAllPools() {
      setLoadingPools(true);
      try {
        const [me, qa, di, dilr, lr] = await Promise.all([
          import('../data/mechEngQuestions.js'),
          import('../data/quantsQuestions.js'),
          import('../data/dataInterpretationQuestions.js'),
          import('../data/dilrQuestions.js'),
          import('../data/logicalReasoningQuestions.js')
        ]);
        const combined = [...me.default, ...qa.default, ...di.default, ...dilr.default, ...lr.default];
        setAllQuestions(combined);
      } catch (e) {
        console.error("Error loading question sets for dashboard command center:", e);
      } finally {
        setLoadingPools(false);
      }
    }
    loadAllPools();
  }, []);

  // Compile learner telemetry
  const compiledAttempts = [];
  Object.keys(questionProgress || {}).forEach(qId => {
    const prog = questionProgress[qId];
    const quest = allQuestions.find(q => q.id.toString() === qId);
    compiledAttempts.push({
      id: parseInt(qId),
      topic: quest ? quest.topic : 'General',
      category: quest ? quest.category : 'General',
      correct: prog.status === 'correct',
      solveTime: (prog.solveTimeMs || 60000) / 1000,
      timeRatio: (prog.solveTimeMs || 60000) / 60000,
      confidence: prog.confidence || 'Sure',
      changedAnswer: prog.changedAnswer || false,
      date: prog.updatedAt || new Date().toISOString()
    });
  });

  const topicElo = {};
  Object.keys(masteryScores || {}).forEach(key => {
    const doc = masteryScores[key];
    topicElo[doc.topic] = Math.round(600 + doc.score * 900);
  });

  const srItems = Object.values(spacedRepetition || {}).map(item => ({
    questionId: item.questionId,
    topic: item.topic || 'General',
    lastReviewed: item.lastReviewDate,
    intervalDays: item.interval || 1
  }));

  const simulatedPeerPool = [
    { accuracy: 0.65, speedSeconds: 70, coreMechanicalElo: 1100, aptitudeElo: 1050 },
    { accuracy: 0.85, speedSeconds: 45, coreMechanicalElo: 1400, aptitudeElo: 1350 },
    { accuracy: 0.72, speedSeconds: 58, coreMechanicalElo: 1210, aptitudeElo: 1180 }
  ];

  const learnerState = compileLearnerState({
    userId: user?.uid || 'guest',
    attempts: compiledAttempts,
    topicMasteryElo: topicElo,
    srItems,
    recentMockScores: [75, 82, 88],
    peerPool: simulatedPeerPool,
    mistakes,
    questionDb: allQuestions
  });

  const isZeroData = compiledAttempts.length < 10;
  const activeInsights = deriveInsights(learnerState, compiledAttempts, mistakes);

  // Today's priority details
  const weakTopics = getWeakestTopics(masteryScores, 1);
  const priorityTopic = weakTopics.length > 0 ? weakTopics[0] : { category: 'Thermodynamics', topic: 'Entropy Generation' };

  // Nearest mock test details
  const nearestMock = MOCK_TESTS.find(m => new Date() < new Date(m.unlockDate)) || MOCK_TESTS[0];

  const handleStartAdaptiveSession = (intentName, customTopic = null) => {
    localStorage.setItem('current_test_config', JSON.stringify({
      mode: 'adaptive',
      intent: intentName,
      targetConcept: customTopic || (intentName === 'CONCEPT_REPAIR' ? priorityTopic.topic : null),
      category: priorityTopic.category,
      duration: 18,
      count: 12
    }));
    navigate('/tests/session-briefing');
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
        <h1>Welcome, {firstName}</h1>
        <p>MahiLLM Placement Intelligence is online.</p>
      </header>

      {loadingPools ? (
        <div className="loading" style={{ textAlign: 'center', padding: '5rem 0' }}>
          <div className="spinner" style={{ border: '4px solid var(--border)', borderTop: '4px solid var(--accent)', borderRadius: '50%', width: '45px', height: '45px', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem auto' }}></div>
          <p>Analyzing question database and building telemetry model...</p>
        </div>
      ) : (
        <>
          {/* PLACEMENT READINESS PANEL */}
          <section className="command-center-panel card">
            <div className="cc-top">
              <div className="cc-readiness-header">
                <h2>PLACEMENT READINESS</h2>
                <span className="cc-score">
                  {isZeroData ? '[ 40 / 100 ]' : `[ ${Math.round(learnerState.global.readiness * 100)} / 100 ]`}
                </span>
              </div>
              
              <div className="cc-progress-bar">
                <div className="cc-progress-fill" style={{ width: isZeroData ? '40%' : `${learnerState.global.readiness * 100}%` }}></div>
              </div>

              {isZeroData ? (
                <div className="cc-calibration-warning">
                  <AlertTriangle size={16} /> Below calibration threshold
                </div>
              ) : null}

              <div className="cc-metrics">
                <div className="cc-metric">
                  <span className="label">Readiness Trend</span>
                  <span className="value">
                    {isZeroData ? 'Insufficient evidence' : <><TrendingUp size={14}/> +8.4% / 30d</>}
                  </span>
                </div>
                <div className="cc-metric">
                  <span className="label">Ability Estimate</span>
                  <span className="value">
                    {isZeroData ? 'Calibrating' : 'ADVANCED'}
                  </span>
                </div>
                <div className="cc-metric">
                  <span className="label">Learning Stability</span>
                  <span className="value font-mono">
                    87%
                  </span>
                </div>
              </div>
            </div>

            <div className="cc-bottom">
              {/* PRIMARY ADAPTIVE ACTION */}
              <div className="cc-priority-section">
                <h3>TODAY'S ADAPTIVE PRIORITY</h3>
                {isZeroData ? (
                  <div className="cc-priority-details">
                    <p className="cc-zero-text">
                      We need a short calibration session before Mahi can identify your strongest and weakest learning patterns.
                    </p>
                    <span className="cc-meta">INITIAL ABILITY CALIBRATION</span>
                    <span className="cc-meta">12 questions · ~18 minutes</span>
                    <button 
                      className="btn btn-primary btn-lg cc-start-btn" 
                      onClick={() => handleStartAdaptiveSession('ASSESSMENT')}
                    >
                      <Play size={18} fill="currentColor"/> START CALIBRATION
                    </button>
                  </div>
                ) : (
                  <div className="cc-priority-details">
                    <span className="cc-cat">{priorityTopic.category}</span>
                    <span className="cc-top-name">Stabilise {priorityTopic.topic}</span>
                    <p className="cc-zero-text">
                      Your recent attempts show inconsistent performance in multi-step irreversible process questions.
                    </p>
                    <span className="cc-meta">12 questions · ~18 min</span>
                    <button 
                      className="btn btn-primary btn-lg cc-start-btn" 
                      onClick={() => handleStartAdaptiveSession('CONCEPT_REPAIR')}
                    >
                      <Play size={18} fill="currentColor"/> CONTINUE ADAPTIVE PATH
                    </button>
                  </div>
                )}
              </div>
              
              {/* TRAJECTORY CARD */}
              <div className="cc-trajectory-section">
                <h3>READINESS TRAJECTORY</h3>
                {isZeroData ? (
                  <div className="cc-zero-trajectory-box">
                    <p>Complete your first adaptive session to establish a readiness trajectory.</p>
                  </div>
                ) : (
                  <div className="cc-chart-placeholder">
                    <svg viewBox="0 0 100 40" className="trajectory-sparkline">
                      <path d="M0,35 Q10,35 20,30 T40,25 T60,15 T80,10 T100,5" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round"/>
                      <circle cx="100" cy="5" r="3" fill="var(--primary)" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ACTIVE INTELLIGENCE INSIGHTS */}
          <section className="dashboard-section" style={{ marginTop: '2.5rem' }}>
            <h2 className="section-title"><Brain size={18} /> Active Intelligence Insights</h2>
            <div className="cc-insights-grid">
              {isZeroData ? (
                <div className="card cc-zero-insights-card">
                  <h4>Mahi is still learning how you learn</h4>
                  <p>Complete 10–20 adaptive questions to begin detecting mistake patterns, confidence gaps, and concept instability.</p>
                </div>
              ) : (
                activeInsights.slice(0, 3).map(insight => (
                  <div key={insight.insightId} className="card cc-insight-card">
                    <span className={`badge ${insight.severity === 'HIGH' ? 'badge-danger-soft' : 'badge-warning-soft'}`} style={{ width: 'fit-content', marginBottom: '0.5rem' }}>
                      {insight.severity} PRIORITY
                    </span>
                    <h4>{insight.title}</h4>
                    <p>{insight.summary}</p>
                    <Link to="/intelligence" className="cc-view-evidence-btn">
                      VIEW EVIDENCE →
                    </Link>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* QUICK ADAPTIVE INTENTS */}
          <section className="dashboard-section" style={{ marginTop: '2.5rem' }}>
            <h2 className="section-title"><Target size={18} /> Quick Adaptive Intents</h2>
            <div className="intents-grid">
              <button className="intent-card card" onClick={() => handleStartAdaptiveSession('OPTIMAL')}>
                <strong>Continue my path</strong>
                <span>Let Mahi guide your optimal syllabus route</span>
              </button>
              <button className="intent-card card" onClick={() => handleStartAdaptiveSession('WEAKNESS_REPAIR')}>
                <strong>Repair weaknesses</strong>
                <span>Target and patch concept performance failure loops</span>
              </button>
              <button className="intent-card card" onClick={() => handleStartAdaptiveSession('STRETCH')}>
                <strong>Challenge me</strong>
                <span>Push Elos above your estimated ability boundary</span>
              </button>
              <button className="intent-card card" onClick={() => handleStartAdaptiveSession('DECAY_RECOVERY')}>
                <strong>Recover forgotten concepts</strong>
                <span>Reinforce items identified with high memory decay</span>
              </button>
              <button className="intent-card card" onClick={() => handleStartAdaptiveSession('MISTAKE_REPAIR')}>
                <strong>Fix my mistakes</strong>
                <span>Train specifically on active mistakes notebook</span>
              </button>
              <button className="intent-card card" onClick={() => handleStartAdaptiveSession('ASSESSMENT')}>
                <strong>Test my readiness</strong>
                <span>Run diagnostic benchmarks across all categories</span>
              </button>
            </div>
          </section>

          {/* UPCOMING TEST WIDGET */}
          {nearestMock && (
            <section className="upcoming-test-alert card" style={{ marginTop: '2.5rem' }}>
              <div className="alert-content">
                <div className="alert-title-row">
                  <Calendar size={18} className="alert-icon" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Upcoming Mock: {nearestMock.name}</h3>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {nearestMock.description}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  <span className="badge" style={{ background: 'var(--bg-body)' }}>{nearestMock.duration} Mins</span>
                  <span className="badge" style={{ background: 'var(--bg-body)' }}>{nearestMock.count} Qs</span>
                </div>
              </div>
              <button className="btn btn-primary" onClick={() => handleStartMock(nearestMock)}>
                Start Mock
              </button>
            </section>
          )}
        </>
      )}
    </div>
  );
}
