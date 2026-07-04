import React, { useState, useEffect } from 'react';
import { useUserData } from '../contexts/UserDataContext';
import { buildHeatmapData, getReadinessSummary } from '../utils/masteryUtils';
import { useNavigate } from 'react-router-dom';
import { compileLearnerState } from '../intelligence/learnerStateModel';
import { companyProfiles } from '../config/companyProfiles';
import { 
  ChevronDown, 
  ChevronUp, 
  Award, 
  TrendingUp, 
  Brain, 
  Search,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  FileText,
  Activity,
  Zap,
  TrendingDown,
  Gauge,
  UserCheck
} from 'lucide-react';
import './ReadinessHeatmap.css';

export default function ReadinessHeatmap() {
  const navigate = useNavigate();
  const { masteryScores, questionProgress, spacedRepetition } = useUserData();

  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'heatmap'
  const [allQuestions, setAllQuestions] = useState([]);
  const [loadingPools, setLoadingPools] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({
    'Mechanical Engineering': true,
    'Quantitative Aptitude': true,
    'Logical Reasoning': false,
    'Data Interpretation': false,
    'DILR': false
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Load all question categories in parallel on mount to construct full taxonomy tree
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
        console.error("Error loading full question sets for heatmap generation:", e);
      } finally {
        setLoadingPools(false);
      }
    }
    loadAllPools();
  }, []);

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleTopicClick = (cat, topic) => {
    navigate(`/oa-practice?cat=${encodeURIComponent(cat)}&topic=${encodeURIComponent(topic)}`);
  };

  const handleStartAdaptivePractice = () => {
    navigate(`/oa-practice`);
  };

  // Compile overall attempts array from progress mapping for learnerState
  const getCompiledAttempts = () => {
    const attemptsList = [];
    Object.keys(questionProgress || {}).forEach(qId => {
      const prog = questionProgress[qId];
      // Lookup topic in allQuestions
      const quest = allQuestions.find(q => q.id.toString() === qId);
      attemptsList.push({
        id: parseInt(qId),
        topic: quest ? quest.topic : 'General',
        category: quest ? quest.category : 'General',
        correct: prog.status === 'correct',
        solveTime: (prog.solveTimeMs || 60000) / 1000,
        timeRatio: (prog.solveTimeMs || 60000) / 60000, // normalized
        confidence: prog.confidence || 'Sure',
        changedAnswer: prog.changedAnswer || false,
        date: prog.updatedAt || new Date().toISOString()
      });
    });
    return attemptsList;
  };

  const getTopicEloMap = () => {
    const eloMap = {};
    Object.keys(masteryScores || {}).forEach(key => {
      const doc = masteryScores[key];
      // ELO maps derived score range (0-1) to (600-1500)
      eloMap[doc.topic] = Math.round(600 + doc.score * 900);
    });
    return eloMap;
  };

  const getSrItems = () => {
    return Object.values(spacedRepetition || {}).map(item => ({
      questionId: item.questionId,
      topic: item.topic || 'General',
      lastReviewed: item.lastReviewDate,
      intervalDays: item.interval || 1
    }));
  };

  // Build heatmap layout models
  const rawHeatmapData = buildHeatmapData(allQuestions, masteryScores);
  const summary = getReadinessSummary(rawHeatmapData);

  // Compile derived analytics state
  const compiledAttempts = getCompiledAttempts();
  const topicElo = getTopicEloMap();
  const srItems = getSrItems();

  // Peer benchmark pool
  const simulatedPeerPool = [
    { accuracy: 0.65, speedSeconds: 70, coreMechanicalElo: 1100, aptitudeElo: 1050 },
    { accuracy: 0.85, speedSeconds: 45, coreMechanicalElo: 1400, aptitudeElo: 1350 },
    { accuracy: 0.72, speedSeconds: 58, coreMechanicalElo: 1210, aptitudeElo: 1180 },
    { accuracy: 0.58, speedSeconds: 88, coreMechanicalElo: 950, aptitudeElo: 900 }
  ];

  const learnerState = compileLearnerState({
    userId: 'user-id',
    attempts: compiledAttempts,
    topicMasteryElo: topicElo,
    srItems,
    recentMockScores: [75, 82, 88], // simulated recent mocks
    peerPool: simulatedPeerPool
  });

  // Apply search query filter if present
  const heatmapData = rawHeatmapData.map(cat => {
    const filteredTopics = cat.topics.filter(t => 
      t.topic.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return {
      ...cat,
      topics: filteredTopics
    };
  }).filter(cat => cat.topics.length > 0);

  const readinessPct = Math.round(learnerState.global.readiness * 100);

  return (
    <div className="page-content heatmap-page">
      <h1>Predictive Placement Intelligence 🧠</h1>
      <p className="practice-subtitle" style={{ marginBottom: '2rem' }}>
        Assess your readiness indices, diagnose prerequisite gaps, and run targeted company GET benchmarks.
      </p>

      {/* Tabs */}
      <div className="formulas-tabs" style={{ marginBottom: '2rem' }}>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <Gauge size={16} /> Placement Analytics
        </button>
        <button 
          className={`tab-btn ${activeTab === 'heatmap' ? 'active' : ''}`}
          onClick={() => setActiveTab('heatmap')}
        >
          <Activity size={16} /> Syllabus Mastery Map
        </button>
      </div>

      {loadingPools ? (
        <div className="loading" style={{ textAlign: 'center', padding: '5rem 0' }}>
          <div className="spinner" style={{ border: '4px solid var(--border)', borderTop: '4px solid var(--accent)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
          <p>Analyzing question database and building telemetry model...</p>
        </div>
      ) : activeTab === 'analytics' ? (
        <div className="analytics-tab-content" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          
          {/* Main index card */}
          <div className="card" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.1) 0%, rgba(0, 184, 148, 0.05) 100%)', border: '1px solid var(--border)', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-h)', margin: '0 0 0.5rem 0' }}>Overall OA Readiness</h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '550px', margin: 0 }}>
                  {learnerState.readinessFeedback}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '3.5rem', fontWeight: 900, color: '#00b894', lineHeight: 1 }}>{readinessPct}%</span>
                <span className="badge badge-success-soft" style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>Derived Competency</span>
              </div>
            </div>

            {/* Micro component progress bar indices */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
              {Object.entries(learnerState.readinessComponents).map(([key, val]) => (
                <div key={key} className="card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{key}</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-h)' }}>{val}%</span>
                    <div style={{ width: '30px', height: '4px', background: val >= 70 ? '#00b894' : val >= 45 ? '#fdcb6e' : '#d63031', borderRadius: '2px' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start', flexWrap: 'wrap' }} className="analytics-grid">
            
            {/* Prerequisite weak spot diagnoses */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
                <AlertTriangle size={18} style={{ color: '#fdcb6e' }} /> Upstream Weakness Diagnosis
              </h3>
              {Object.keys(learnerState.weaknessDiagnoses).length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No prerequisite deficits detected. All active ELO ratings are stable.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {Object.entries(learnerState.weaknessDiagnoses).map(([topic, diagnosis]) => (
                    <div key={topic} className="card" style={{ padding: '1rem', borderLeft: '3px solid #fdcb6e', background: 'rgba(255,255,255,0.01)' }}>
                      <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-h)' }}>Topic: {topic}</strong>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {diagnosis.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Company GET benchmarks */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
                <UserCheck size={18} style={{ color: '#6c5ce7' }} /> Company OA Benchmarks
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {companyProfiles.map(profile => {
                  // Weighted score computation for company readiness
                  const compScore = Math.min(Math.max(readinessPct + Math.round((4.0 - profile.difficulty) * 5), 0), 100);
                  const isEligible = compScore >= profile.minPassReadiness;

                  return (
                    <div key={profile.companyId} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <div>
                          <strong style={{ color: 'var(--text-h)' }}>{profile.name}</strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>({profile.role})</span>
                        </div>
                        <span style={{ fontWeight: 700, color: isEligible ? '#00b894' : '#d63031' }}>{compScore}% Match</span>
                      </div>
                      <div className="topic-cell-accuracy-bar">
                        <div 
                          className="topic-cell-accuracy-fill" 
                          style={{ 
                            width: `${compScore}%`, 
                            backgroundColor: isEligible ? '#00b894' : '#d63031' 
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strategic telemetry & pacing */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
                <Activity size={18} style={{ color: '#0984e3' }} /> Strategic Telemetry
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Rushed Errors</span>
                  <h4 style={{ margin: '0.25rem 0', fontSize: '1.5rem', fontWeight: 800 }}>{Math.round(learnerState.behaviour.rushRate * 100)}%</h4>
                </div>
                <div className="card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Time Sinks</span>
                  <h4 style={{ margin: '0.25rem 0', fontSize: '1.5rem', fontWeight: 800 }}>{Math.round(learnerState.behaviour.timeSinkRate * 100)}%</h4>
                </div>
                <div className="card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Second Guessing</span>
                  <h4 style={{ margin: '0.25rem 0', fontSize: '1.5rem', fontWeight: 800 }}>{Math.round(learnerState.behaviour.secondGuessRate * 100)}%</h4>
                </div>
                <div className="card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Guess Dependency</span>
                  <h4 style={{ margin: '0.25rem 0', fontSize: '1.5rem', fontWeight: 800 }}>{Math.round(learnerState.behaviour.guessDependency * 100)}%</h4>
                </div>
              </div>

              {/* Confidence calibration analysis */}
              <div className="card" style={{ padding: '1rem', border: '1px solid rgba(9, 132, 227, 0.2)', background: 'rgba(9, 132, 227, 0.03)' }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-h)', display: 'block', marginBottom: '0.25rem' }}>Confidence Calibration</strong>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {learnerState.calibration.message} (Calibration Score: {Math.round(learnerState.global.calibration * 100)}%)
                </p>
              </div>
            </div>

            {/* Spaced repetition memory decay warning */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
                <Zap size={18} style={{ color: '#d63031' }} /> Forgetting Risk Alerts
              </h3>
              {learnerState.forgettingRisks.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No concepts are currently at risk of memory decay. Spaced repetition queue is fully protected.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {learnerState.forgettingRisks.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-h)' }}>{item.topic}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Estimated stability factor: {Math.round(item.pRecall * 100)}% recall</span>
                      </div>
                      <span className="badge badge-danger-soft" style={{ fontSize: '0.8rem' }}>{Math.round(item.risk * 100)}% Risk</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        <div className="heatmap-tab-content" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          
          {/* Header overall readiness scores */}
          <div className="heatmap-header-summary">
            <div className="card heatmap-stat-card" style={{ background: 'linear-gradient(135deg, rgba(0, 184, 148, 0.15) 0%, rgba(108, 92, 231, 0.05) 100%)', border: '1px solid rgba(0, 184, 148, 0.3)' }}>
              <span className="mistake-stat-label">Placement Readiness</span>
              <span className="heatmap-score-text" style={{ color: '#00b894' }}>{readinessIndex}%</span>
              <span className="badge badge-success-soft" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', width: 'fit-content' }}>
                Overall mastery index
              </span>
            </div>
            <div className="card heatmap-stat-card">
              <span className="mistake-stat-label">Strong Topics</span>
              <span className="heatmap-score-text" style={{ color: '#00b894' }}>{summary.strong}</span>
              <span className="badge badge-success-soft" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', width: 'fit-content' }}>
                Mastery ≥ 70%
              </span>
            </div>
            <div className="card heatmap-stat-card">
              <span className="mistake-stat-label">Unstable / Weak</span>
              <span className="heatmap-score-text" style={{ color: '#fdcb6e' }}>{summary.unstable + summary.weak}</span>
              <span className="badge badge-warning-soft" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', width: 'fit-content' }}>
                Needs revision
              </span>
            </div>
            <div className="card heatmap-stat-card">
              <span className="mistake-stat-label">Unattempted Topics</span>
              <span className="heatmap-score-text" style={{ color: 'var(--text-secondary)' }}>{summary.unattempted}</span>
              <span className="badge badge-ghost-soft" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', width: 'fit-content' }}>
                0 attempts
              </span>
            </div>
          </div>

          {/* Legend and search controls */}
          <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div className="heatmap-legend" style={{ margin: 0 }}>
              <div className="legend-item">
                <span className="legend-color-dot strong"></span>
                <span>Strong (≥70%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color-dot unstable"></span>
                <span>Unstable (40-70%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color-dot weak"></span>
                <span>Weak (&lt;40%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color-dot unattempted"></span>
                <span>Unattempted (0 attempts)</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexGrow: 1, justifySelf: 'flex-end', maxWidth: '400px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.2rem', margin: 0, height: '38px' }}
                  placeholder="Search topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <button 
                className="btn btn-primary"
                style={{ height: '38px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={handleStartAdaptivePractice}
              >
                <Brain size={16} /> Adaptive Practice
              </button>
            </div>
          </div>

          {/* Accordion List */}
          <div className="heatmap-accordion">
            {heatmapData.map((cat) => {
              const isExpanded = expandedCategories[cat.category];
              const scorePct = Math.round(cat.masteryScore * 100);

              return (
                <div key={cat.category} className="card heatmap-cat-section">
                  <div className="heatmap-cat-header" onClick={() => toggleCategory(cat.category)}>
                    <div className="heatmap-cat-title">
                      <span>{cat.category === 'Mechanical Engineering' ? '🔩' : cat.category === 'Quantitative Aptitude' ? '🧮' : cat.category === 'Logical Reasoning' ? '🧠' : cat.category === 'Data Interpretation' ? '📊' : '🧩'}</span>
                      <span>{cat.category}</span>
                    </div>

                    <div className="heatmap-cat-summary-meta">
                      <span className="heatmap-cat-meta-item">
                        Readiness: 
                        <span className="heatmap-cat-meta-val" style={{ color: scorePct >= 70 ? '#00b894' : scorePct >= 40 ? '#fdcb6e' : '#d63031' }}>
                          {scorePct}%
                        </span>
                      </span>
                      <span className="heatmap-cat-meta-item">
                        Solved: 
                        <span className="heatmap-cat-meta-val">
                          {cat.questionsAttempted} / {cat.totalQuestions}
                        </span>
                      </span>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="heatmap-cat-content">
                      {cat.topics.map((t) => {
                        return (
                          <div 
                            key={t.topic} 
                            className={`heatmap-topic-cell ${t.status}`}
                            onClick={() => handleTopicClick(cat.category, t.topic)}
                          >
                            <span className="topic-cell-title">{t.topic}</span>
                            
                            <div className="topic-cell-meta-row">
                              {t.questionsAttempted > 0 ? (
                                <>
                                  <span>{Math.round(t.masteryScore * 100)}% Mastery</span>
                                  <span>{t.questionsAttempted} solved</span>
                                </>
                              ) : (
                                <>
                                  <span>Unattempted</span>
                                  <span>0 / {t.totalQuestions} Qs</span>
                                </>
                              )}
                            </div>

                            {t.questionsAttempted > 0 && (
                              <div className="topic-cell-accuracy-bar">
                                <div 
                                  className={`topic-cell-accuracy-fill ${t.status}`} 
                                  style={{ width: `${t.accuracy}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
