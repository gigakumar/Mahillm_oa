import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore';
import { Check, X, Award, Clock, Target, AlertTriangle, AlertCircle, Bookmark, Share2, CornerDownRight, Flag } from 'lucide-react';
import './TestResult.css';

export default function TestResult() {
  const { testId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  
  // Review Filters
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all' | 'correct' | 'incorrect' | 'unattempted'
  
  // Issue reporting state
  const [reportingQ, setReportingQ] = useState(null); // question object
  const [issueType, setIssueType] = useState('Incorrect Answer Key');
  const [issueDetails, setIssueDetails] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    loadTestResult();
  }, [testId, user]);

  const loadTestResult = async () => {
    setLoading(true);
    try {
      let foundData = null;
      if (user) {
        const docRef = doc(db, 'users', user.uid, 'tests', testId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          foundData = docSnap.data();
        }
      }
      
      if (!foundData) {
        // Try local storage for guest
        const localData = localStorage.getItem(`guest_test_result_${testId}`);
        if (localData) {
          foundData = JSON.parse(localData);
        }
      }

      if (foundData) {
        setResult(foundData);
      }
    } catch (e) {
      console.error("Error loading test result:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading" style={{ textAlign: 'center', padding: '3rem' }}>Loading assessment analysis...</div>;
  }

  if (!result) {
    return (
      <div className="error-container card" style={{ maxWidth: '500px', margin: '3rem auto', textAlign: 'center', padding: '2rem' }}>
        <AlertCircle size={48} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
        <h2>Result Not Found</h2>
        <p>We couldn't retrieve the scorecard for this test session.</p>
        <button className="btn btn-primary" onClick={() => navigate('/tests')}>Go to Tests</button>
      </div>
    );
  }

  // Calculate topic performance breakdown
  const topicStats = {};
  result.report.forEach((q) => {
    const topic = q.topic || 'General';
    if (!topicStats[topic]) {
      topicStats[topic] = { total: 0, attempted: 0, correct: 0, incorrect: 0 };
    }
    topicStats[topic].total += 1;
    if (q.isAttempted) {
      topicStats[topic].attempted += 1;
      if (q.isCorrect) {
        topicStats[topic].correct += 1;
      } else {
        topicStats[topic].incorrect += 1;
      }
    }
  });

  const sortedTopics = Object.keys(topicStats).map((topic) => {
    const stats = topicStats[topic];
    const accuracy = stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0;
    const weaknessScore = stats.attempted > 0 ? 100 - accuracy : 100; // 100 if not attempted but total is 0? Let's keep it simple
    return { topic, ...stats, accuracy, weaknessScore };
  });

  // Identify weak areas (accuracy < 60% and attempted > 0)
  const weakAreas = sortedTopics
    .filter(t => t.attempted > 0 && t.accuracy < 60)
    .sort((a, b) => b.weaknessScore - a.weaknessScore);

  const filteredQuestions = result.report.filter((q) => {
    if (reviewFilter === 'correct') return q.isAttempted && q.isCorrect;
    if (reviewFilter === 'incorrect') return q.isAttempted && !q.isCorrect;
    if (reviewFilter === 'unattempted') return !q.isAttempted;
    return true;
  });

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportingQ) return;

    try {
      const reportPayload = {
        questionId: reportingQ.id,
        questionText: reportingQ.question,
        category: reportingQ.category,
        issueType,
        details: issueDetails,
        reportedBy: user?.email || 'Guest',
        reportedAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'reports'), reportPayload);
      setReportSuccess(true);
      setTimeout(() => {
        setReportingQ(null);
        setReportSuccess(false);
        setIssueDetails('');
      }, 2000);
    } catch (err) {
      console.error("Error submitting report:", err);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}m ${remainder}s`;
  };

  return (
    <div className="page-content result-page">
      <header className="result-header card">
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div className="trophy-container" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-glow)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Award size={40} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1>Assessment Scorecard</h1>
            <p className="portal-sub">{result.testName}</p>
            <span className="text-secondary" style={{ fontSize: '0.9rem' }}>Submitted on {new Date(result.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </header>

      {/* Overview Cards */}
      <div className="overview-cards">
        <div className="stat-card card">
          <Target size={24} className="stat-icon" style={{ color: 'var(--accent)' }} />
          <div>
            <span className="stat-label">TOTAL SCORE</span>
            <span className="stat-value">{result.score} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/ {result.total}</span></span>
          </div>
        </div>
        <div className="stat-card card">
          <Check className="stat-icon" style={{ color: 'var(--success)' }} />
          <div>
            <span className="stat-label">ACCURACY</span>
            <span className="stat-value" style={{ color: 'var(--success)' }}>{result.accuracy}%</span>
          </div>
        </div>
        <div className="stat-card card">
          <Clock size={24} className="stat-icon" style={{ color: 'var(--warning)' }} />
          <div>
            <span className="stat-label">TIME SPENT</span>
            <span className="stat-value">{formatTime(result.timeSpentSeconds)}</span>
          </div>
        </div>
      </div>

      {/* Weak Areas Alerts */}
      {weakAreas.length > 0 && (
        <div className="weak-areas-banner card" style={{ borderLeft: '4px solid var(--danger)', background: 'rgba(239, 68, 68, 0.05)' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', color: 'var(--danger)', marginBottom: '0.5rem' }}>
            <AlertTriangle size={20} />
            <h3 style={{ margin: 0 }}>Critical Focus Areas Spotted ⚠️</h3>
          </div>
          <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem' }}>Based on accuracy, prioritize revising these topics before your next mock exam:</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {weakAreas.map((w, idx) => (
              <span key={idx} className="badge badge-danger" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--danger)' }}>
                {w.topic} ({w.accuracy}% Acc)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Breakdown Tabular Table */}
      <section className="breakdown-section card">
        <h2>Subject / Topic Performance</h2>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Topic</th>
              <th style={{ textAlign: 'center', padding: '0.75rem' }}>Attempted</th>
              <th style={{ textAlign: 'center', padding: '0.75rem' }}>Correct</th>
              <th style={{ textAlign: 'center', padding: '0.75rem' }}>Incorrect</th>
              <th style={{ textAlign: 'right', padding: '0.75rem' }}>Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {sortedTopics.map((t, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 600 }}>{t.topic}</td>
                <td style={{ textAlign: 'center', padding: '0.75rem' }}>{t.attempted} / {t.total}</td>
                <td style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--success)' }}>{t.correct}</td>
                <td style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--danger)' }}>{t.incorrect}</td>
                <td style={{ textAlign: 'right', padding: '0.75rem', fontWeight: 'bold', color: t.accuracy >= 75 ? 'var(--success)' : t.accuracy >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                  {t.accuracy}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Review Mode Area */}
      <section className="review-section">
        <div className="review-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <h2>Question Review Mode</h2>
          <div className="filter-tabs" style={{ display: 'flex', gap: '0.5rem' }}>
            {['all', 'correct', 'incorrect', 'unattempted'].map((f) => (
              <button 
                key={f} 
                className={`filter-tab-btn ${reviewFilter === f ? 'active' : ''}`}
                onClick={() => setReviewFilter(f)}
                style={{
                  background: reviewFilter === f ? 'var(--accent)' : 'var(--bg-card)',
                  color: reviewFilter === f ? 'white' : 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textTransform: 'capitalize'
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="questions-review-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredQuestions.map((q, idx) => {
            const hasContext = q.contextHtml;
            const letters = ['A', 'B', 'C', 'D'];

            return (
              <div key={idx} className="review-question-card card" style={{ borderLeft: `4px solid ${q.isAttempted ? (q.isCorrect ? 'var(--success)' : 'var(--danger)') : 'var(--border)'}` }}>
                {/* Meta details */}
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className="badge">{q.category}</span>
                    <span className="badge">{q.topic}</span>
                    <span className="badge badge-accent">{q.type}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: q.isAttempted ? (q.isCorrect ? 'var(--success)' : 'var(--danger)') : 'var(--text-secondary)' }}>
                      {q.isAttempted ? (q.isCorrect ? 'Correct ✓' : 'Incorrect ✗') : 'Unattempted'}
                    </span>
                    <button className="icon-btn" onClick={() => setReportingQ(q)} title="Report an issue with this question">
                      <Flag size={14} />
                    </button>
                  </div>
                </div>

                {/* Split layout or normal */}
                <div className={`question-content ${hasContext ? 'split-review' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {hasContext && (
                    <div className="scenario-panel-review" style={{ background: 'var(--bg-body)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }} dangerouslySetInnerHTML={{ __html: q.contextHtml }} />
                  )}

                  <div>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem' }}>Q{idx + 1}. {q.question}</h3>
                    
                    {q.type === 'NAT' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-body)', padding: '1rem', borderRadius: '8px' }}>
                        <div><strong>Correct Value:</strong> {q.correct}</div>
                        <div><strong>Your Answer:</strong> {q.userAnswer !== null ? q.userAnswer : <span className="text-secondary">None</span>}</div>
                      </div>
                    ) : (
                      <div className="options-review-grid" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {q.options.map((opt, optIdx) => {
                          const isCorrectOpt = q.type === 'MSQ' ? (q.correct || []).includes(optIdx) : q.correct === optIdx;
                          const isUserSelected = q.type === 'MSQ' ? (q.userAnswer || []).includes(optIdx) : q.userAnswer === optIdx;

                          let optionClass = 'option-review-row';
                          if (isCorrectOpt) optionClass += ' correct';
                          else if (isUserSelected && !isCorrectOpt) optionClass += ' incorrect';

                          return (
                            <div key={optIdx} className={optionClass} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.75rem',
                              borderRadius: '6px',
                              border: '1px solid var(--border)',
                              background: isCorrectOpt ? 'rgba(16, 185, 129, 0.08)' : isUserSelected ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-card)'
                            }}>
                              <span className="marker" style={{
                                width: '24px', height: '24px', borderRadius: '50%',
                                display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.8rem', fontWeight: 'bold',
                                background: isCorrectOpt ? 'var(--success)' : isUserSelected ? 'var(--danger)' : 'var(--bg-body)',
                                color: isCorrectOpt || isUserSelected ? 'white' : 'var(--text-primary)'
                              }}>{letters[optIdx]}</span>
                              <span>{opt}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div className="explanation-block" style={{ marginTop: '1.5rem', background: 'var(--bg-body)', padding: '1.25rem', borderRadius: '8px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--accent)' }}>
                      <CornerDownRight size={16} /> Step-by-Step Explanation:
                    </div>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }} dangerouslySetInnerHTML={{ __html: q.explanation }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Issue Reporting Dialog */}
      {reportingQ && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '500px' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Report Question Issue 🚩</h3>
            
            {reportSuccess ? (
              <div style={{ color: 'var(--success)', textAlign: 'center', padding: '1.5rem 0' }}>
                <CheckCircle2 size={36} style={{ marginBottom: '0.5rem' }} />
                <p>Thank you! Issue report submitted successfully.</p>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Issue Type</label>
                  <select className="form-input" value={issueType} onChange={(e) => setIssueType(e.target.value)}>
                    <option value="Incorrect Answer Key">Incorrect Answer Key</option>
                    <option value="Formatting / Math notation error">Formatting / Math notation error</option>
                    <option value="Ambiguous wording">Ambiguous wording</option>
                    <option value="Duplicate question">Duplicate question</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Describe the issue</label>
                  <textarea 
                    className="form-input" 
                    rows={4}
                    value={issueDetails} 
                    onChange={(e) => setIssueDetails(e.target.value)}
                    placeholder="Provide specific corrections (e.g. calculation mistakes, typo in options)..."
                    required
                  />
                </div>
                <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setReportingQ(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CheckCircle2(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size || 24}
      height={props.size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
