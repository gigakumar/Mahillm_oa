import React, { useState, useEffect } from 'react';
import { useUserData } from '../contexts/UserDataContext';
import { useScore } from '../contexts/ScoreContext';
import { getDueQuestions, getRevisionSummary, formatInterval } from '../utils/spacedRepetition';
import { 
  CheckCircle, 
  XCircle, 
  ChevronRight, 
  Bookmark, 
  Clock, 
  Brain, 
  Award,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './RevisionSession.css';

export default function RevisionSession() {
  const navigate = useNavigate();
  const { spacedRepetition, recordDetailedAnswer } = useUserData();
  const { scoreData, toggleBookmark } = useScore();

  const [dueList, setDueList] = useState([]);
  const [loadedQuestions, setLoadedQuestions] = useState({});
  const [loadingPools, setLoadingPools] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Session stats for completion summary
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    correct: 0,
    incorrect: 0,
    advanced: 0,
    reset: 0
  });

  const [intervalChange, setIntervalChange] = useState(null); // { old: number, new: number, isReset: boolean }

  // 1. Get list of due questions
  useEffect(() => {
    const list = getDueQuestions(spacedRepetition);
    setDueList(list);
  }, [spacedRepetition]);

  // 2. Load question data files dynamically based on represented categories in dueList
  useEffect(() => {
    if (dueList.length === 0) return;

    async function loadRequiredPools() {
      setLoadingPools(true);
      const pools = { ...loadedQuestions };
      const representedCategories = new Set(
        dueList.map(item => {
          // Find the category in spacedRepetition metadata or fallback
          const rawEntry = spacedRepetition[item.questionId.toString()];
          return rawEntry?.category || null;
        }).filter(Boolean)
      );

      // Fallback: search across all if category is missing in subcollection doc
      const needsAll = representedCategories.size === 0;

      const categoryPromises = [];

      if ((representedCategories.has('Mechanical Engineering') || needsAll) && !pools['Mechanical Engineering']) {
        categoryPromises.push(import('../data/mechEngQuestions.js').then(m => { pools['Mechanical Engineering'] = m.default; }));
      }
      if ((representedCategories.has('Quantitative Aptitude') || needsAll) && !pools['Quantitative Aptitude']) {
        categoryPromises.push(import('../data/quantsQuestions.js').then(m => { pools['Quantitative Aptitude'] = m.default; }));
      }
      if ((representedCategories.has('Data Interpretation') || needsAll) && !pools['Data Interpretation']) {
        categoryPromises.push(import('../data/dataInterpretationQuestions.js').then(m => { pools['Data Interpretation'] = m.default; }));
      }
      if ((representedCategories.has('DILR') || needsAll) && !pools['DILR']) {
        categoryPromises.push(import('../data/dilrQuestions.js').then(m => { pools['DILR'] = m.default; }));
      }
      if ((representedCategories.has('Logical Reasoning') || needsAll) && !pools['Logical Reasoning']) {
        categoryPromises.push(import('../data/logicalReasoningQuestions.js').then(m => { pools['Logical Reasoning'] = m.default; }));
      }

      try {
        await Promise.all(categoryPromises);
        const qMap = {};
        Object.keys(pools).forEach(cat => {
          pools[cat].forEach(q => {
            qMap[q.id.toString()] = q;
          });
        });
        setLoadedQuestions(qMap);
      } catch (e) {
        console.error("Error dynamically loading question pools for revision session:", e);
      } finally {
        setLoadingPools(false);
      }
    }

    loadRequiredPools();
  }, [dueList]);

  // Handle case where we finish the session
  useEffect(() => {
    if (dueList.length > 0 && currentIdx >= dueList.length) {
      setSessionCompleted(true);
    }
  }, [currentIdx, dueList]);

  const activeDueEntry = dueList[currentIdx];
  const question = activeDueEntry ? loadedQuestions[activeDueEntry.questionId.toString()] : null;
  const isBookmarked = question && scoreData?.bookmarked?.includes(question.id);

  const handleSubmit = async () => {
    if (!question || selectedOption === null || submitted) return;

    const isCorrect = selectedOption === question.correct;
    setSubmitted(true);

    // Calculate changes for completion summary
    const rawEntry = spacedRepetition[question.id.toString()];
    const oldInterval = rawEntry ? rawEntry.interval : 1;

    setSessionStats(prev => ({
      ...prev,
      total: prev.total + 1,
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      incorrect: !isCorrect ? prev.incorrect + 1 : prev.incorrect,
      advanced: isCorrect ? prev.advanced + 1 : prev.advanced,
      reset: !isCorrect ? prev.reset + 1 : prev.reset
    }));

    // Record detailed answer (updates subcollections via UserDataContext)
    await recordDetailedAnswer(question, isCorrect, 0, null);

    // Set interval progression message
    let nextInterval = 1;
    if (isCorrect) {
      const intervals = [1, 3, 7, 14, 30];
      const nextRep = (rawEntry ? rawEntry.repetitionCount : 0) + 1;
      nextInterval = intervals[Math.min(nextRep - 1, intervals.length - 1)];
    }

    setIntervalChange({
      old: oldInterval,
      new: nextInterval,
      isReset: !isCorrect
    });
  };

  const handleNext = () => {
    setSubmitted(false);
    setSelectedOption(null);
    setIntervalChange(null);
    setCurrentIdx(prev => prev + 1);
  };

  if (loadingPools) {
    return (
      <div className="page-content revision-page">
        <div className="loading" style={{ textAlign: 'center', padding: '5rem 0' }}>
          <div className="spinner" style={{ border: '4px solid var(--border)', borderTop: '4px solid var(--accent)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
          <p>Assembling revision queue questions...</p>
        </div>
      </div>
    );
  }

  if (dueList.length === 0 || sessionCompleted) {
    return (
      <div className="page-content revision-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="card revision-complete-card">
          {sessionCompleted ? (
            <>
              <Sparkles size={48} className="revision-complete-icon" />
              <h2>Revision Session Complete! 🎉</h2>
              <p style={{ color: 'var(--text-secondary)' }}>You've reviewed your due questions and updated your spaced repetition intervals.</p>
              
              <div className="revision-complete-details">
                <div>
                  <span className="revision-stat-num" style={{ color: 'var(--success)' }}>{sessionStats.correct}</span>
                  <span className="revision-stat-lbl">Correct</span>
                </div>
                <div>
                  <span className="revision-stat-num" style={{ color: 'var(--danger)' }}>{sessionStats.incorrect}</span>
                  <span className="revision-stat-lbl">Incorrect</span>
                </div>
                <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                  <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-secondary)' }}>
                    🔥 <strong>{sessionStats.advanced}</strong> questions advanced in interval.<br/>
                    ❌ <strong>{sessionStats.reset}</strong> questions reset back to 1-day queue.
                  </p>
                </div>
              </div>

              <button className="btn btn-primary" onClick={() => navigate('/')}>
                Back to Dashboard
              </button>
            </>
          ) : (
            <>
              <CheckCircle size={48} className="revision-complete-icon" style={{ color: 'var(--success)', animation: 'none' }} />
              <h2>You're all caught up! 🍿</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0.5rem auto' }}>
                There are no questions due for spaced repetition revision today. Your memory is secure.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
                <button className="btn btn-primary" onClick={() => navigate('/oa-practice')}>
                  Practice Mode
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/mistakes')}>
                  View Mistakes Notebook
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const progress = dueList.length > 0 ? ((currentIdx + 1) / dueList.length) * 100 : 0;
  const summary = getRevisionSummary(spacedRepetition);

  return (
    <div className="page-content revision-page">
      {/* revision summary banner */}
      <div className="revision-summary-header">
        <div className="revision-summary-text">
          <h2>Spaced Repetition Revision 🧠</h2>
          <p>Answering correctly increases the interval. Answering incorrectly resets back to 1 day.</p>
        </div>
        <div className="revision-summary-stats">
          <div className="revision-stat-pill">
            <span className="revision-stat-num">{dueList.length - currentIdx}</span>
            <span className="revision-stat-lbl">Remaining</span>
          </div>
          <div className="revision-stat-pill">
            <span className="revision-stat-num">{summary.upcoming}</span>
            <span className="revision-stat-lbl">Upcoming</span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="progress-row" style={{ marginBottom: '1.5rem' }}>
        <span className="progress-label">Revision Q {currentIdx + 1} of {dueList.length}</span>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%`, background: 'var(--accent)' }}></div>
        </div>
      </div>

      {/* Question Card */}
      {question ? (
        <div className="question-card card">
          <div className="question-header-row">
            <div className="question-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-accent">{question.category}</span>
              <span className="badge badge-secondary">{question.topic}</span>
              <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={12} /> Interval: {activeDueEntry.interval}d
              </span>
            </div>
            
            <div className="question-tools">
              <button 
                className={`bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`} 
                onClick={() => toggleBookmark(question.id)}
                title="Bookmark Question"
              >
                <Bookmark size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>

          {question.contextHtml && (
            <div className="question-context card" style={{ marginBottom: '1.5rem', background: 'var(--bg-body)', padding: '1rem' }} dangerouslySetInnerHTML={{ __html: question.contextHtml }} />
          )}

          <h2 className="question-text" dangerouslySetInnerHTML={{ __html: question.question }} />

          <div className="options">
            {question.options.map((opt, index) => {
              let cls = '';
              if (submitted) {
                if (index === question.correct) cls = 'correct';
                else if (index === selectedOption) cls = 'incorrect';
              } else if (index === selectedOption) {
                cls = 'selected';
              }

              return (
                <button
                  key={index}
                  className={`option ${cls}`}
                  onClick={() => !submitted && setSelectedOption(index)}
                  disabled={submitted}
                >
                  <span className="option-key">{String.fromCharCode(65 + index)}</span>
                  <span className="option-value" dangerouslySetInnerHTML={{ __html: opt }} />
                  {submitted && index === question.correct && <CheckCircle size={18} className="option-icon success-icon" />}
                  {submitted && index === selectedOption && index !== question.correct && <XCircle size={18} className="option-icon danger-icon" />}
                </button>
              );
            })}
          </div>

          {submitted && (
            <div className={`result-box ${selectedOption === question.correct ? 'correct' : 'incorrect'}`}>
              <div className="result-header">
                <h3>{selectedOption === question.correct ? 'Correct! 🎉' : 'Incorrect'}</h3>
                {intervalChange && (
                  <span className={`interval-progression-badge ${intervalChange.isReset ? 'shrunk' : ''}`}>
                    {intervalChange.isReset 
                      ? `Interval Reset: ${intervalChange.old}d ➔ 1d ➔ due tomorrow`
                      : `Interval Extended: ${intervalChange.old}d ➔ ${intervalChange.new}d`
                    }
                  </span>
                )}
              </div>
              {question.explanation && (
                <div className="explanation" style={{ marginTop: '1rem' }}>
                  <strong>Explanation:</strong>
                  <div dangerouslySetInnerHTML={{ __html: question.explanation }} />
                </div>
              )}
            </div>
          )}

          <div className="question-actions">
            {!submitted ? (
              <button className="btn btn-primary" onClick={handleSubmit} disabled={selectedOption === null}>
                Submit Answer
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleNext}>
                Next Question <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={24} style={{ color: 'var(--warning)' }} />
          <h3>Question could not be resolved</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Dynamically loaded file is still parsing for question ID {activeDueEntry?.questionId}</p>
        </div>
      )}
    </div>
  );
}
