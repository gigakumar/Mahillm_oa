import React, { useState, useEffect } from 'react';
import { useUserData } from '../contexts/UserDataContext';
import { useScore } from '../contexts/ScoreContext';
import { getBankByCategory } from '../data/questionBankRegistry';
import { 
  AlertTriangle, 
  CheckCircle, 
  RotateCcw, 
  Trash2, 
  BookOpen, 
  Check, 
  Edit, 
  Save, 
  ArrowRight,
  TrendingDown,
  Activity,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './Mistakes.css';

const MISTAKE_REASONS = [
  { value: 'conceptual', label: 'Conceptual Error', emoji: '🔴' },
  { value: 'calculation', label: 'Calculation Mistake', emoji: '🟠' },
  { value: 'formula', label: 'Formula Misapplication', emoji: '🟡' },
  { value: 'unit_conversion', label: 'Unit Conversion Error', emoji: '🔵' },
  { value: 'misread', label: 'Question Misread', emoji: '🟣' },
  { value: 'time_pressure', label: 'Time Pressure Rush', emoji: '⚫' },
  { value: 'guess', label: 'Unsuccessful Guess', emoji: '⚪' }
];

export default function Mistakes() {
  const navigate = useNavigate();
  const { mistakes, updateMistakeType, resolveMistake, updateMistakeNote } = useUserData();
  const { scoreData } = useScore();

  const [loadedQuestions, setLoadedQuestions] = useState({});
  const [loadingPools, setLoadingPools] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [repeatedOnly, setRepeatedOnly] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteText, setNoteText] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load question data files based on represented categories in mistakes
  useEffect(() => {
    const representedCategories = new Set(
      Object.values(mistakes)
        .filter(m => showResolved || !m.isResolved)
        .map(m => m.category)
    );

    if (representedCategories.size === 0) return;

    async function loadRequiredPools() {
      setLoadingPools(true);
      const pools = { ...loadedQuestions };
      const categoryPromises = [];

      for (const category of representedCategories) {
        if (!pools[category]) {
          const bank = getBankByCategory(category);
          if (bank) {
            categoryPromises.push(
              bank.loader().then(m => {
                pools[category] = m.default;
              })
            );
          }
        }
      }

      try {
        await Promise.all(categoryPromises);
        // Build question ID map
        const qMap = {};
        Object.keys(pools).forEach(cat => {
          pools[cat].forEach(q => {
            qMap[q.id.toString()] = q;
          });
        });
        setLoadedQuestions(qMap);
      } catch (e) {
        console.error("Error dynamically loading question pools for mistakes page:", e);
      } finally {
        setLoadingPools(false);
      }
    }

    loadRequiredPools();
  }, [mistakes, showResolved]);

  // Compute list of filtered mistakes
  const filteredMistakes = Object.values(mistakes)
    .filter(m => {
      // Resolved filter
      if (!showResolved && m.isResolved) return false;
      if (showResolved && !m.isResolved) return false;

      // Category filter
      if (categoryFilter !== 'all' && m.category !== categoryFilter) return false;

      // Topic filter
      if (topicFilter !== 'all' && m.topic !== topicFilter) return false;

      // Mistake type filter
      if (typeFilter !== 'all') {
        const actualType = m.userOverrideType || m.mistakeType;
        if (actualType !== typeFilter) return false;
      }

      // Repeated mistakes only (timesIncorrect >= 2)
      if (repeatedOnly && m.timesIncorrect < 2) return false;

      return true;
    })
    .sort((a, b) => new Date(b.lastIncorrectAt) - new Date(a.lastIncorrectAt));

  // Extract filters
  const uniqueCategories = [...new Set(Object.values(mistakes).map(m => m.category))];
  const uniqueTopics = [...new Set(
    Object.values(mistakes)
      .filter(m => categoryFilter === 'all' || m.category === categoryFilter)
      .map(m => m.topic)
  )];

  // Statistics calculations
  const totalActiveMistakes = Object.values(mistakes).filter(m => !m.isResolved).length;
  const repeatCount = Object.values(mistakes).filter(m => !m.isResolved && m.timesIncorrect >= 2).length;

  const reasonStats = {};
  MISTAKE_REASONS.forEach(r => { reasonStats[r.value] = 0; });
  Object.values(mistakes).filter(m => !m.isResolved).forEach(m => {
    const rType = m.userOverrideType || m.mistakeType;
    if (reasonStats[rType] !== undefined) {
      reasonStats[rType]++;
    }
  });

  const topWeakTopic = Object.values(mistakes)
    .filter(m => !m.isResolved)
    .reduce((acc, current) => {
      acc[current.topic] = (acc[current.topic] || 0) + current.timesIncorrect;
      return acc;
    }, {});

  const sortedWeakTopics = Object.entries(topWeakTopic).sort((a, b) => b[1] - a[1]);
  const primaryWeakness = sortedWeakTopics[0] ? `${sortedWeakTopics[0][0]} (${sortedWeakTopics[0][1]} failures)` : 'None';

  // Prepare data for Mistake Fingerprint Chart
  const fingerprintData = MISTAKE_REASONS.map(r => ({
    name: r.label,
    shortName: r.label.split(' ')[0], // e.g. "Conceptual"
    count: reasonStats[r.value] || 0,
    fill: r.value === 'conceptual' ? '#ef4444' : 
          r.value === 'calculation' ? '#f97316' : 
          r.value === 'formula' ? '#eab308' : 
          r.value === 'unit_conversion' ? '#3b82f6' : 
          r.value === 'misread' ? '#a855f7' : 
          r.value === 'time_pressure' ? '#64748b' : '#94a3b8'
  })).filter(d => d.count > 0);

  // Pagination slice
  const totalPages = Math.ceil(filteredMistakes.length / itemsPerPage);
  const paginatedMistakes = filteredMistakes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const startEditNote = (id, currentNote) => {
    setEditingNoteId(id);
    setNoteText(currentNote || '');
  };

  const saveNote = async (id) => {
    await updateMistakeNote(id, noteText);
    setEditingNoteId(null);
  };

  const handlePracticeSingle = (qId) => {
    // Save state configuration in local storage and route to OA practice with custom seed
    const qObj = loadedQuestions[qId.toString()];
    if (!qObj) return;

    localStorage.setItem('current_test_config', JSON.stringify({
      name: `Mistake Re-attempt: ${qObj.topic}`,
      duration: 5,
      difficulty: 'all',
      negativeMarking: false,
      distribution: { [qObj.category]: 100 },
      count: 1
    }));
    
    // Setup practice session and bypass regular OAPractice router
    localStorage.removeItem('current_test_session');
    // Start session in TestSession page for focus mode, or go to oa-practice
    navigate(`/tests/session`);
  };

  return (
    <div className="page-content mistakes-page">
      <h1>Mistake Notebook 📓</h1>
      <p className="practice-subtitle" style={{ marginBottom: '2rem' }}>
        Review, classify, and resolve your mistakes. Repetition cures error.
      </p>

      {/* Stats Cards Row */}
      <div className="mistakes-stats-row">
        <div className="card mistake-stat-card">
          <span className="mistake-stat-label">Active Errors</span>
          <span className="mistake-stat-val" style={{ color: 'var(--danger)' }}>{totalActiveMistakes}</span>
          <span className="badge badge-danger-soft" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', width: 'fit-content' }}>
            <TrendingDown size={12} style={{ marginRight: '0.25rem' }} /> Action required
          </span>
        </div>
        <div className="card mistake-stat-card">
          <span className="mistake-stat-label">Repeated Mistakes</span>
          <span className="mistake-stat-val" style={{ color: 'var(--accent)' }}>{repeatCount}</span>
          <span className="badge badge-accent-soft" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', width: 'fit-content' }}>
            Incorrect ≥ 2 times
          </span>
        </div>
        <div className="card mistake-stat-card">
          <span className="mistake-stat-label">Primary Weakness</span>
          <span className="mistake-stat-val" style={{ fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.25rem' }}>
            {primaryWeakness}
          </span>
          <span className="badge badge-secondary-soft" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', width: 'fit-content', marginTop: '0.25rem' }}>
            Target for revision
          </span>
        </div>
      </div>

      {/* Breakdown Block & Fingerprint Chart */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 1.5rem 0', fontFamily: 'var(--font-display)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={20} /> Your Mistake Fingerprint
        </h3>
        
        {fingerprintData.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'center' }}>
            <div className="mistakes-breakdown" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {MISTAKE_REASONS.map(r => {
                const count = reasonStats[r.value] || 0;
                if (count === 0) return null;
                return (
                  <span key={r.value} className={`badge badge-reason ${r.value}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.9rem' }}>
                    <span>{r.emoji}</span>
                    <span style={{ flex: 1 }}>{r.label}</span>
                    <strong style={{ opacity: 0.8 }}>{count}</strong>
                  </span>
                );
              })}
            </div>
            
            <div style={{ height: 220, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fingerprintData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="shortName" type="category" axisLine={false} tickLine={false} fontSize={12} stroke="var(--text-secondary)" width={100} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {fingerprintData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>No active mistakes to fingerprint.</p>
        )}
      </div>

      {/* Filter panel */}
      <div className="card mistakes-filter-bar">
        <div className="filter-row-top">
          <select 
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setTopicFilter('all'); setCurrentPage(1); }}
          >
            <option value="all">📚 All Categories</option>
            {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            className="filter-select"
            value={topicFilter}
            onChange={(e) => { setTopicFilter(e.target.value); setCurrentPage(1); }}
            disabled={uniqueTopics.length === 0}
          >
            <option value="all">📁 All Topics</option>
            {uniqueTopics.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">🏷️ All Mistake Types</option>
            {MISTAKE_REASONS.map(r => <option key={r.value} value={r.value}>{r.emoji} {r.label}</option>)}
          </select>

          <label className="checkbox-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <input 
              type="checkbox" 
              checked={repeatedOnly} 
              onChange={(e) => { setRepeatedOnly(e.target.checked); setCurrentPage(1); }}
              style={{ accentColor: 'var(--primary)' }}
            />
            🔥 Repeated Mistakes
          </label>

          <button 
            className={`btn ${!showResolved ? 'btn-ghost' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', marginLeft: 'auto' }}
            onClick={() => { setShowResolved(!showResolved); setCurrentPage(1); }}
          >
            {showResolved ? 'View Active Mistakes' : 'View Resolved Mistakes'}
          </button>
        </div>
      </div>

      {/* Loading state for full pool resolution */}
      {loadingPools ? (
        <div className="loading" style={{ textAlign: 'center', padding: '5rem 0' }}>
          <div className="spinner" style={{ border: '4px solid var(--border)', borderTop: '4px solid var(--accent)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
          <p>Resolving matching questions from bundle...</p>
        </div>
      ) : filteredMistakes.length === 0 ? (
        <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <BookOpen size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No mistakes found!</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0.5rem auto' }}>
            {showResolved 
              ? "You haven't resolved any mistakes yet. Keep practicing!"
              : "Splendid! Either you haven't answered any questions incorrectly, or your filters are too restrictive."}
          </p>
          {!showResolved && (
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/oa-practice')}>
              Go to Practice Mode
            </button>
          )}
        </div>
      ) : (
        <div className="mistakes-list">
          {paginatedMistakes.map((m) => {
            const qIdStr = m.questionId.toString();
            const qObj = loadedQuestions[qIdStr];
            const displayType = m.userOverrideType || m.mistakeType;
            const activeReason = MISTAKE_REASONS.find(r => r.value === displayType) || MISTAKE_REASONS[0];

            return (
              <div key={m.questionId} className={`card mistake-item-card ${m.isResolved ? 'resolved' : ''}`}>
                <div className="mistake-header-row">
                  <div className="mistake-meta-left">
                    <span className="badge badge-accent">{m.category}</span>
                    <span className="badge badge-secondary">{m.topic}</span>
                    {m.timesIncorrect >= 2 && (
                      <span className="mistake-count-badge">🔥 {m.timesIncorrect}x Failed</span>
                    )}
                    <span className={`badge badge-reason ${activeReason.value}`}>
                      {activeReason.emoji} {activeReason.label}
                    </span>
                  </div>

                  <div className="mistake-actions-right">
                    {/* Inline selector to adjust mistake type */}
                    <div className="inline-selector-dropdown">
                      <select
                        className="filter-select"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', minWidth: '130px' }}
                        value={displayType}
                        onChange={(e) => updateMistakeType(m.questionId, e.target.value)}
                      >
                        {MISTAKE_REASONS.map(r => (
                          <option key={r.value} value={r.value}>{r.emoji} {r.label}</option>
                        ))}
                      </select>
                    </div>

                    {!m.isResolved ? (
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderColor: 'var(--success)', color: 'var(--success)' }}
                        onClick={() => resolveMistake(m.questionId, true)}
                      >
                        <Check size={14} style={{ marginRight: '0.25rem' }} /> Resolve
                      </button>
                    ) : (
                      <button 
                        className="btn btn-ghost" 
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => resolveMistake(m.questionId, false)}
                      >
                        <RotateCcw size={14} style={{ marginRight: '0.25rem' }} /> Re-open
                      </button>
                    )}

                    {qObj && (
                      <button 
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => handlePracticeSingle(m.questionId)}
                      >
                        Re-attempt <ArrowRight size={14} style={{ marginLeft: '0.25rem' }} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Render the question preview */}
                {qObj ? (
                  <>
                    <div className="mistake-question-preview" dangerouslySetInnerHTML={{ __html: qObj.question }} />
                    
                    <div className="mistake-options-preview">
                      {qObj.options.map((opt, optIdx) => {
                        const isCorrectOpt = optIdx === qObj.correct;
                        return (
                          <div key={optIdx} className={`opt-preview-item ${isCorrectOpt ? 'correct' : ''}`}>
                            <strong>{String.fromCharCode(65 + optIdx)}.</strong>
                            <span dangerouslySetInnerHTML={{ __html: opt }} />
                          </div>
                        );
                      })}
                    </div>

                    {qObj.explanation && qObj.explanation !== 'Coming soon' && (
                      <div className="explanation" style={{ background: 'var(--bg-body)', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)', borderLeft: '2px solid var(--border)' }}>
                        <strong>Solution explanation:</strong>
                        <div style={{ marginTop: '0.5rem' }} dangerouslySetInnerHTML={{ __html: qObj.explanation }} />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="empty-state" style={{ padding: '1rem', background: 'var(--bg-body)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                    <AlertCircle size={16} />
                    <span>Question context not resolved. Category pool may still be loading.</span>
                  </div>
                )}

                {/* Personal note editing */}
                <div className="mistake-notes-section">
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>📝 Personal Review Notes</span>
                  {editingNoteId === m.questionId ? (
                    <>
                      <textarea
                        className="mistake-note-textarea"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Explain to yourself why you failed this question. Write down formula, conditions, common traps..."
                      />
                      <div className="mistake-note-actions">
                        <button className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => setEditingNoteId(null)}>Cancel</button>
                        <button className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={() => saveNote(m.questionId)}>
                          <Save size={12} style={{ marginRight: '0.25rem' }} /> Save Note
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                      <p style={{ margin: 0, fontSize: '0.9rem', fontStyle: m.userNote ? 'normal' : 'italic', color: m.userNote ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {m.userNote || 'No notes added yet. Adding notes helps solidify understanding.'}
                      </p>
                      <button 
                        className="btn btn-ghost"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                        onClick={() => startEditNote(m.questionId, m.userNote)}
                      >
                        <Edit size={12} /> Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination component */}
      {totalPages > 1 && (
        <div className="pagination-controls">
          <button 
            className="btn btn-ghost" 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          >
            Prev
          </button>
          {[...Array(totalPages).keys()].map(page => (
            <button
              key={page + 1}
              className={`btn ${currentPage === page + 1 ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setCurrentPage(page + 1)}
            >
              {page + 1}
            </button>
          ))}
          <button 
            className="btn btn-ghost" 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
