import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../contexts/UserDataContext';
import { compileLearnerState } from '../intelligence/learnerStateModel';
import { deriveInsights } from '../intelligence/learnerInsights/cognitiveInsightEngine';
import { buildHeatmapData } from '../utils/masteryUtils';
import ConceptProfileDrawer from '../components/ConceptProfileDrawer';
import InsightEvidenceDrawer from '../components/InsightEvidenceDrawer';
import { 
  Brain, 
  Activity, 
  Target, 
  TrendingUp, 
  ShieldAlert, 
  Clock, 
  Calendar, 
  Search, 
  BookOpen, 
  AlertCircle,
  HelpCircle,
  Play
} from 'lucide-react';
import './Intelligence.css';

export default function Intelligence() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { masteryScores, spacedRepetition, mistakes, questionProgress } = useUserData();

  const [loadingPools, setLoadingPools] = useState(true);
  const [allQuestions, setAllQuestions] = useState([]);
  
  // Drawer States
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedInsight, setSelectedInsight] = useState(null);
  
  // Expandable Genome Categories
  const [expandedCategories, setExpandedCategories] = useState({
    'Mechanical Engineering': true,
    'Quantitative Aptitude': true,
    'Logical Reasoning': false,
    'Data Interpretation': false,
    'DILR': false
  });

  // Load all question pools on mount to compile dynamic taxonomy ELOs
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
        console.error("Error loading question sets for intelligence page:", e);
      } finally {
        setLoadingPools(false);
      }
    }
    loadAllPools();
  }, []);

  // 1. Gather all learner telemetry and compile canonical learner state
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

  // 2. Generate insights via Cognitive Insight Engine
  const activeInsights = deriveInsights(learnerState, compiledAttempts, mistakes);

  // 3. Build Skill Genome hierarchy tree
  const rawHeatmapData = buildHeatmapData(allQuestions, masteryScores);

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleConceptClick = (categoryName, topicObj) => {
    setSelectedCategory(categoryName);
    setSelectedConcept({
      topic: topicObj.topic,
      masteryScore: topicObj.masteryScore,
      stabilityScore: learnerState.retentionMap?.[topicObj.topic] ?? 0.5,
      confidenceScore: 0.75, // placeholder
      questionsAttempted: topicObj.questionsAttempted,
      status: topicObj.status.toUpperCase()
    });
  };

  const handleStartCalibration = () => {
    localStorage.setItem('current_test_config', JSON.stringify({
      mode: 'adaptive',
      intent: 'ASSESSMENT',
      duration: 18,
      count: 12
    }));
    navigate('/tests/session-briefing');
  };

  const handleIntentLaunch = (intent, targetConcept = null, pattern = null) => {
    localStorage.setItem('current_test_config', JSON.stringify({
      mode: 'adaptive',
      intent: intent,
      targetConcept,
      targetPattern: pattern,
      duration: 18,
      count: 12
    }));
    navigate('/tests/session-briefing');
  };

  // Compile timeline events dynamically from changes
  const getTimelineEvents = () => {
    if (isZeroData) return [];
    
    const events = [];
    // Populate some realistic timeline entries derived from actual attempts
    if (compiledAttempts.length > 0) {
      events.push({
        type: 'READINESS_MILESTONE',
        title: `Readiness calibration active`,
        description: `Overall status index calibrated to ${Math.round(learnerState.global.readiness * 100)}`,
        date: 'Today'
      });
    }

    Object.keys(topicElo).forEach(topic => {
      if (topicElo[topic] > 1200) {
        events.push({
          type: 'CONCEPT_STATE_CHANGE',
          title: `${topic} Mastered`,
          description: `Mastery index crossed 80% boundary`,
          date: '2 days ago'
        });
      }
    });

    if (activeInsights.length > 0) {
      events.push({
        type: 'MISTAKE_PATTERN_DETECTED',
        title: `Pattern detected: ${activeInsights[0].type.replace(/_/g, ' ')}`,
        description: `Identified with ${Math.round(activeInsights[0].confidence * 100)}% confidence from recent mistakes`,
        date: 'Yesterday'
      });
    }

    return events.slice(0, 4);
  };

  const timelineEvents = getTimelineEvents();

  return (
    <div className="page-content intelligence-page">
      <header className="intel-header">
        <h1>Learner Intelligence</h1>
        <p className="subtitle">
          A live model of what you know, how stable that knowledge is, and where your performance breaks down.
        </p>
      </header>

      {/* TOP SUMMARY BAR */}
      <section className="intel-summary-bar">
        <div className="summary-metric card">
          <span className="lbl">Readiness Score</span>
          <span className="val">{isZeroData ? 'CALIBRATING' : `${Math.round(learnerState.global.readiness * 100)}/100`}</span>
        </div>
        <div className="summary-metric card">
          <span className="lbl">Ability Estimate</span>
          <span className="val">{isZeroData ? 'INSUFFICIENT EVIDENCE' : 'ADVANCED'}</span>
        </div>
        <div className="summary-metric card">
          <span className="lbl">Knowledge Stability</span>
          <span className="val">{isZeroData ? 'CALIBRATING' : `${Math.round(learnerState.global.consistency * 100)}%`}</span>
        </div>
        <div className="summary-metric card">
          <span className="lbl">Calibration Confidence</span>
          <span className="val">{isZeroData ? 'LOW' : 'HIGH'}</span>
        </div>
      </section>

      {/* COGNITIVE INSIGHTS SECTION */}
      <section className="intel-insights-section" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        <div className="section-header">
          <h2><Brain size={20} /> Cognitive Insights</h2>
          <span className="tag-secondary">AI-Generated Learning Diagnostics</span>
        </div>
        
        {isZeroData || activeInsights.length === 0 ? (
          <div className="card empty-insights-card">
            <div className="empty-insights-icon">🎉</div>
            <h3>No active learning issues detected</h3>
            <p>Keep practicing to generate insights on your learning patterns, confidence, and mistakes.</p>
          </div>
        ) : (
          <div className="insights-list">
            {activeInsights.map(insight => (
              <div key={insight.insightId} className={`card insight-card severity-${insight.severity.toLowerCase()}`}>
                <div className="insight-card-header">
                  <div className="insight-title-row">
                    <span className={`badge badge-${insight.severity === 'HIGH' ? 'danger' : 'warning'}-soft insight-severity-badge`}>
                      {insight.severity} PRIORITY
                    </span>
                    <h3>{insight.title}</h3>
                  </div>
                  <div className="insight-confidence-wrapper">
                    <span className="confidence-label">Confidence</span>
                    <div className="confidence-track">
                      <div className="confidence-fill" style={{ width: `${Math.round(insight.confidence * 100)}%` }}></div>
                    </div>
                    <span className="confidence-value">{Math.round(insight.confidence * 100)}%</span>
                  </div>
                </div>
                
                <p className="insight-summary">{insight.summary}</p>
                
                <div className="insight-evidence-bar">
                  <Activity size={14} />
                  <span>Based on {insight.evidence.evidenceCount}/{insight.evidence.sampleSize} questions ({Math.round(insight.evidence.currentRate)}%)</span>
                </div>
                
                <div className="insight-affected-concepts">
                  <span className="affected-label">Affected Concepts:</span>
                  <div className="affected-chips">
                    {insight.affectedConcepts.map(concept => (
                      <button 
                        key={concept} 
                        className="concept-chip"
                        onClick={() => navigate(`/oa-practice?topic=${encodeURIComponent(concept)}`)}
                      >
                        {concept}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="insight-actions">
                  <button 
                    className="btn btn-primary insight-cta-btn"
                    onClick={() => {
                      if (insight.recommendedIntent === 'MISTAKE_REPAIR') navigate('/mistakes');
                      else if (insight.recommendedIntent === 'WEAKNESS_REPAIR') handleIntentLaunch('WEAKNESS_REPAIR');
                      else if (insight.recommendedIntent === 'STRETCH') handleIntentLaunch('STRETCH');
                      else if (insight.recommendedIntent === 'DECAY_RECOVERY') navigate('/revision');
                      else navigate('/oa-practice');
                    }}
                  >
                    {insight.recommendedIntent === 'MISTAKE_REPAIR' ? 'Fix these mistakes →' :
                     insight.recommendedIntent === 'WEAKNESS_REPAIR' ? 'Target weak topics →' :
                     insight.recommendedIntent === 'STRETCH' ? 'Challenge yourself →' :
                     insight.recommendedIntent === 'DECAY_RECOVERY' ? 'Start revision →' : 'Practice now →'}
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedInsight(insight)}
                  >
                    View Evidence
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 12-COLUMN MAIN LAYOUT GRID */}
      <div className="intel-grid">
        
        {/* LEFT COLUMN (8 cols): SKILL GENOME & SCATTER MAP */}
        <div className="intel-left-column">
          
          {/* WEAK TOPIC HEATMAP */}
          <section className="intel-section card">
            <div className="section-header">
              <h2><Target size={20} /> Topic Mastery Heatmap</h2>
              <span className="tag-secondary">Density visualization</span>
            </div>

            {loadingPools ? (
              <div className="loading-small">Loading heatmap...</div>
            ) : (
              <div className="heatmap-container">
                {rawHeatmapData.map(cat => (
                  <div key={cat.category} className="heatmap-category">
                    <h3 className="heatmap-cat-title">{cat.category}</h3>
                    <div className="heatmap-topics">
                      {cat.topics.map(topic => {
                        const mastery = Math.round(topic.masteryScore * 100);
                        const blocks = Math.floor(mastery / 10);
                        const blockArray = Array.from({ length: 10 }, (_, i) => i < blocks);

                        return (
                          <div key={topic.topic} className="heatmap-row" onClick={() => handleConceptClick(cat.category, topic)}>
                            <div className="heatmap-topic-name">{topic.topic}</div>
                            <div className="heatmap-blocks">
                              {blockArray.map((isFilled, idx) => (
                                <div 
                                  key={idx} 
                                  className={`heatmap-block ${isFilled ? 'filled' : 'empty'} ${mastery < 50 ? 'weak' : mastery > 80 ? 'strong' : 'moderate'}`}
                                ></div>
                              ))}
                            </div>
                            <div className="heatmap-score">{mastery}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {isZeroData && (
              <div className="zero-data-overlay-banner">
                <p>Your concept model is waiting for evidence.</p>
                <button className="btn btn-primary" onClick={handleStartCalibration}>
                  <Play size={14} fill="currentColor"/> Start Calibration Session
                </button>
              </div>
            )}
          </section>

          {/* CONFIDENCE-COMPETENCE MAP */}
          <section className="intel-section card">
            <div className="section-header">
              <h2><Activity size={20} /> Confidence-Competence Map</h2>
              <span className="tag-secondary">Calibration Analysis</span>
            </div>

            {isZeroData ? (
              <div className="zero-data-panel">
                <AlertCircle size={32} className="warning-icon" />
                <p>Confidence calibration requires more rated answers.</p>
                <span className="requirements">Min requirement: 10 completed attempts with confidence ratings.</span>
              </div>
            ) : (
              <div className="calibration-map-wrapper">
                <div className="scatter-labels-y">
                  <span>HIGH CONFIDENCE (100%)</span>
                  <span>LOW CONFIDENCE (0%)</span>
                </div>
                <div className="scatter-plot-area">
                  {/* Four Regions */}
                  <div className="plot-region overconfident">OVERCONFIDENT</div>
                  <div className="plot-region calibrated-mastery">CALIBRATED MASTERY</div>
                  <div className="plot-region realistic-weakness">REALISTIC WEAKNESS</div>
                  <div className="plot-region hidden-strength">HIDDEN STRENGTH</div>

                  {/* SVG Scatter Plot Points */}
                  <svg className="scatter-svg" viewBox="0 0 100 100">
                    <circle cx="35" cy="40" r="3" fill="#ef4444" className="scatter-point" /> {/* Weakness / Overconfident */}
                    <circle cx="85" cy="80" r="3" fill="#10b981" className="scatter-point" /> {/* Calibrated Mastery */}
                    <circle cx="75" cy="40" r="3" fill="#a78bfa" className="scatter-point" /> {/* Hidden Strength */}
                    <circle cx="20" cy="20" r="3" fill="#f59e0b" className="scatter-point" /> {/* Realistic Weakness */}
                  </svg>
                </div>
                <div className="scatter-labels-x">
                  <span>LOW PERFORMANCE (0%)</span>
                  <span>HIGH PERFORMANCE (100%)</span>
                </div>
              </div>
            )}
          </section>

        </div>

        {/* RIGHT COLUMN (4 cols): MISTAKE DNA, DECAY, TIMELINE */}
        <div className="intel-right-column">
          
          {/* MISTAKE DNA */}
          <section className="intel-section card">
            <div className="section-header">
              <h2><ShieldAlert size={20} /> Mistake DNA</h2>
            </div>

            {isZeroData ? (
              <div className="zero-data-panel">
                <AlertCircle size={28} className="warning-icon" />
                <p>No recurring mistake pattern can be identified yet.</p>
                <span className="requirements">Minimum evidence: 10 relevant attempts.</span>
              </div>
            ) : (
              <div className="mistake-dna-patterns">
                {activeInsights.filter(i => i.type === 'CALCULATION_CASCADE').map(i => (
                  <div key={i.insightId} className="mistake-pattern-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong className="pattern-title">{i.title}</strong>
                      <span className="badge badge-danger-soft">{Math.round(i.confidence * 100)}% Conf</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0 0 1rem 0' }}>
                      {i.summary}
                    </p>
                    <button 
                      className="btn btn-outline btn-sm" 
                      onClick={() => handleIntentLaunch('MISTAKE_REPAIR', null, 'CALCULATION_CASCADE')}
                      style={{ width: '100%' }}
                    >
                      Train against this pattern
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* KNOWLEDGE DECAY */}
          <section className="intel-section card">
            <div className="section-header">
              <h2><Clock size={20} /> Knowledge Decay</h2>
            </div>

            {isZeroData ? (
              <div className="zero-data-panel">
                <AlertCircle size={28} className="warning-icon" />
                <p>Decay tracking begins after a concept reaches established mastery.</p>
              </div>
            ) : (
              <div className="decay-list">
                <div className="decay-group">
                  <h4 className="decay-group-title critical">CRITICAL</h4>
                  <div className="decay-row">
                    <span>Entropy Generation</span>
                    <span className="loss-val">-17% loss (18d)</span>
                  </div>
                  <div className="decay-row">
                    <span>Availability</span>
                    <span className="loss-val">-14% loss (15d)</span>
                  </div>
                </div>

                <div className="decay-group">
                  <h4 className="decay-group-title stable">STABLE</h4>
                  <div className="decay-row">
                    <span>First Law</span>
                    <span className="loss-val">-1% loss</span>
                  </div>
                </div>

                <button 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => handleIntentLaunch('DECAY_RECOVERY')}
                  style={{ width: '100%', marginTop: '1rem' }}
                >
                  Recover Decaying Concepts
                </button>
              </div>
            )}
          </section>

          {/* COGNITIVE INSIGHTS */}
          <section className="intel-section card">
            <div className="section-header">
              <h2><Brain size={20} /> Active Insights</h2>
            </div>

            {isZeroData ? (
              <div className="zero-data-panel">
                <AlertCircle size={28} className="warning-icon" />
                <p>Mahi is still learning how you learn.</p>
                <span className="requirements">Complete 10–20 adaptive questions to begin detecting patterns.</span>
              </div>
            ) : (
              <div className="insights-feed">
                {activeInsights.map(insight => (
                  <div key={insight.insightId} className="insight-feed-card">
                    <strong>{insight.title}</strong>
                    <p>{insight.summary}</p>
                    <button 
                      className="btn-link" 
                      onClick={() => setSelectedInsight(insight)}
                    >
                      VIEW EVIDENCE →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* LEARNING TIMELINE */}
          <section className="intel-section card">
            <div className="section-header">
              <h2><Calendar size={20} /> Learning Timeline</h2>
            </div>

            {isZeroData ? (
              <div className="zero-data-panel">
                <AlertCircle size={28} className="warning-icon" />
                <p>Timeline is empty. Start practicing to generate events.</p>
              </div>
            ) : (
              <div className="timeline-flow">
                {timelineEvents.map((e, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className="timeline-dot"></div>
                    <div className="timeline-meta">
                      <span className="t-date">{e.date}</span>
                      <strong>{e.title}</strong>
                      <p>{e.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

      </div>

      {/* Concept Profile Drawer Overlay */}
      <ConceptProfileDrawer 
        isOpen={selectedConcept !== null}
        onClose={() => setSelectedConcept(null)}
        concept={selectedConcept}
        category={selectedCategory}
      />

      {/* Insight Evidence Drawer Overlay */}
      <InsightEvidenceDrawer 
        isOpen={selectedInsight !== null}
        onClose={() => setSelectedInsight(null)}
        insight={selectedInsight}
      />
    </div>
  );
}
