import React, { useState, useEffect } from 'react';
import { useUserData } from '../contexts/UserDataContext';
import { buildHeatmapData, getReadinessSummary } from '../utils/masteryUtils';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronUp, 
  Award, 
  TrendingUp, 
  Brain, 
  Play, 
  Search,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  FileText
} from 'lucide-react';
import './ReadinessHeatmap.css';

export default function ReadinessHeatmap() {
  const navigate = useNavigate();
  const { masteryScores } = useUserData();

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

  // Build heatmap layout models
  const rawHeatmapData = buildHeatmapData(allQuestions, masteryScores);
  const summary = getReadinessSummary(rawHeatmapData);

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

  // Calculate placement readiness index
  const readinessIndex = Math.round(summary.overallScore * 100);

  return (
    <div className="page-content heatmap-page">
      <h1>Exam Readiness Heatmap 📊</h1>
      <p className="practice-subtitle" style={{ marginBottom: '2rem' }}>
        Visualize your learning taxonomy. Click on any topic matrix to start practicing immediately.
      </p>

      {loadingPools ? (
        <div className="loading" style={{ textAlign: 'center', padding: '5rem 0' }}>
          <div className="spinner" style={{ border: '4px solid var(--border)', borderTop: '4px solid var(--accent)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
          <p>Analyzing question database and building taxonomy graph...</p>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
