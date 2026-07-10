import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../contexts/UserDataContext';
import { db } from '../firebase';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { HelpCircle, ChevronLeft, ChevronRight, CheckCircle2, Bookmark, Trash2, AlertTriangle } from 'lucide-react';
import QuestionIntelligenceBadge from '../components/QuestionIntelligenceBadge';
import './TestSession.css';

// Dynamic imports metadata
import metadata from '../data/metadata';

// Coherent Set-based sampler
function sampleQuestions(config, pool) {
  if (config.overrideQuestionIds && config.overrideQuestionIds.length > 0) {
    const ids = new Set(config.overrideQuestionIds.map(String));
    const list = [];
    Object.values(pool).forEach(catList => {
      catList.forEach(q => {
        if (ids.has(q.id.toString())) {
          list.push(q);
        }
      });
    });
    // Maintain the order specified in overrideQuestionIds
    return config.overrideQuestionIds
      .map(id => list.find(q => q.id.toString() === id.toString()))
      .filter(Boolean);
  }

  const { count, distribution, difficulty } = config;
  const selected = [];

  // Determine number of questions per category
  Object.keys(distribution).forEach((category) => {
    const weight = distribution[category];
    let catCount = Math.round((count * weight) / 100);
    if (catCount === 0) return;

    let catPool = pool[category] || [];
    if (difficulty !== 'all') {
      catPool = catPool.filter(q => q.difficulty === difficulty);
    }
    if (catPool.length === 0) {
      catPool = pool[category] || []; // fallback
    }

    // Set-based coherence for Data Interpretation and DILR
    if (category === 'Data Interpretation' || category === 'DILR') {
      const setsMap = new Map();
      catPool.forEach((q) => {
        const key = q.contextHtml || q.question;
        if (!setsMap.has(key)) {
          setsMap.set(key, []);
        }
        setsMap.get(key).push(q);
      });

      const sets = Array.from(setsMap.values());
      const shuffledSets = [...sets].sort(() => 0.5 - Math.random());
      
      let added = 0;
      for (const setQs of shuffledSets) {
        if (added >= catCount) break;
        const toTake = setQs.slice(0, catCount - added);
        selected.push(...toTake);
        added += toTake.length;
      }
    } else {
      const shuffled = [...catPool].sort(() => 0.5 - Math.random());
      selected.push(...shuffled.slice(0, catCount));
    }
  });

  let finalSelection = selected.slice(0, count);
  if (finalSelection.length < count) {
    // Pad with leftover questions if needed from first available category pool
    const firstCat = Object.keys(pool)[0];
    const fallbackPool = pool[firstCat] || [];
    for (const q of fallbackPool) {
      if (finalSelection.length >= count) break;
      if (!finalSelection.some(fq => fq.id === q.id)) {
        finalSelection.push(q);
      }
    }
  }

  return finalSelection.sort(() => 0.5 - Math.random());
}

export default function TestSession() {
  const { user } = useAuth();
  const { recordDetailedAnswer } = useUserData();
  const navigate = useNavigate();

  const [config, setConfig] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // States: key is question ID
  const [selectedOptions, setSelectedOptions] = useState({}); // user answers (index for MCQ, array for MSQ, text for NAT)
  const [visitedQuestions, setVisitedQuestions] = useState({}); // true/false
  const [markedForReview, setMarkedForReview] = useState({}); // true/false
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [attemptId, setAttemptId] = useState('');
  
  // Telemetry & strategy states
  const [confidences, setConfidences] = useState({});
  const [timeSpentMap, setTimeSpentMap] = useState({});
  const [answerHistory, setAnswerHistory] = useState({});

  const timerRef = useRef(null);

  // Load or initialize test session
  useEffect(() => {
    async function initSession() {
      const configStr = localStorage.getItem('current_test_config');
      if (!configStr) {
        navigate('/tests');
        return;
      }
      const parsedConfig = JSON.parse(configStr);
      setConfig(parsedConfig);

      // Enter Fullscreen on test start
      try {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch (e) {}

      const sessionStr = localStorage.getItem('current_test_session');
      if (sessionStr) {
        // Resume session
        const session = JSON.parse(sessionStr);
        setQuestions(session.questions);
        setCurrentIdx(session.currentIdx);
        setSelectedOptions(session.selectedOptions || {});
        setVisitedQuestions(session.visitedQuestions || {});
        setMarkedForReview(session.markedForReview || {});
        setAttemptId(session.attemptId || `attempt_${Date.now()}`);
        setConfidences(session.confidences || {});
        setTimeSpentMap(session.timeSpentMap || {});
        setAnswerHistory(session.answerHistory || {});
        
        // Recover time from timestamp
        const endTime = parseInt(localStorage.getItem('current_test_end_time') || '0');
        const remaining = Math.max(0, endTime - Math.floor(Date.now() / 1000));
        setTimerSeconds(remaining);
      } else {
        // Load required pools dynamically based on config distribution
        setLoading(true);
        try {
          const loadedPools = {};
          const categoryPromises = [];
          const dist = parsedConfig.distribution;

          if (dist['Mechanical Engineering'] > 0) {
            categoryPromises.push(import('../data/mechEngQuestions.js').then(m => { loadedPools['Mechanical Engineering'] = m.default; }));
          }
          if (dist['Quantitative Aptitude'] > 0) {
            categoryPromises.push(import('../data/quantsQuestions.js').then(m => { loadedPools['Quantitative Aptitude'] = m.default; }));
          }
          if (dist['Data Interpretation'] > 0) {
            categoryPromises.push(import('../data/dataInterpretationQuestions.js').then(m => { loadedPools['Data Interpretation'] = m.default; }));
          }
          if (dist['DILR'] > 0) {
            categoryPromises.push(import('../data/dilrQuestions.js').then(m => { loadedPools['DILR'] = m.default; }));
          }
          if (dist['Logical Reasoning'] > 0) {
            categoryPromises.push(import('../data/logicalReasoningQuestions.js').then(m => { loadedPools['Logical Reasoning'] = m.default; }));
          }

          await Promise.all(categoryPromises);

          // Fetch quarantined list
          const qList = new Set();
          try {
            const qSnap = await Promise.race([
              getDocs(collection(db, 'quarantined_questions')),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 1500))
            ]);
            qSnap.forEach(d => qList.add(d.id.toString()));
          } catch (e) {
            console.error("Error fetching quarantine list in test session:", e);
          }

          // Filter pools
          Object.keys(loadedPools).forEach(category => {
            loadedPools[category] = loadedPools[category].filter(q => !qList.has(q.id.toString()));
          });

          const testQs = sampleQuestions(parsedConfig, loadedPools);
          setQuestions(testQs);
          
          const newAttemptId = `attempt_${Date.now()}`;
          setAttemptId(newAttemptId);

          const durationSecs = parsedConfig.duration * 60;
          setTimerSeconds(durationSecs);

          const now = Math.floor(Date.now() / 1000);
          localStorage.setItem('current_test_end_time', (now + durationSecs).toString());

          const initialVisited = { [testQs[0]?.id]: true };
          setVisitedQuestions(initialVisited);

          // Save initial state
          localStorage.setItem('current_test_session', JSON.stringify({
            questions: testQs,
            currentIdx: 0,
            selectedOptions: {},
            visitedQuestions: initialVisited,
            markedForReview: {},
            attemptId: newAttemptId
          }));
        } catch (e) {
          console.error("Error loading dynamic test session pools:", e);
        } finally {
          setLoading(false);
        }
      }

      // Refresh protection warning
      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = 'Warning: Leaving this page will submit your exam.';
        return e.returnValue;
      };
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }

    initSession();
  }, []);

  // Timer interval setup
  useEffect(() => {
    if (questions.length === 0) return;

    if (timerSeconds <= 0) {
      submitTest(true);
      return;
    }

    timerRef.current = setInterval(() => {
      const endTime = parseInt(localStorage.getItem('current_test_end_time') || '0');
      const remaining = Math.max(0, endTime - Math.floor(Date.now() / 1000));
      
      setTimerSeconds(remaining);
      
      // Increment time spent on the active question
      const activeQ = questions[currentIdx];
      if (activeQ) {
        setTimeSpentMap(prev => ({
          ...prev,
          [activeQ.id]: (prev[activeQ.id] || 0) + 1
        }));
      }

      if (remaining <= 0) {
        submitTest(true);
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timerSeconds, questions, currentIdx]);

  // Reactive localStorage sync effect
  useEffect(() => {
    if (questions.length === 0) return;
    localStorage.setItem('current_test_session', JSON.stringify({
      questions,
      currentIdx,
      selectedOptions,
      visitedQuestions,
      markedForReview,
      attemptId,
      confidences,
      timeSpentMap,
      answerHistory
    }));
  }, [questions, currentIdx, selectedOptions, visitedQuestions, markedForReview, attemptId, confidences, timeSpentMap, answerHistory]);

  const [isAdapting, setIsAdapting] = useState(false);
  const [adaptingMessage, setAdaptingMessage] = useState('');

  const handleNext = () => {
    if (config?.mode === 'adaptive') {
      setIsAdapting(true);
      
      const q = questions[currentIdx];
      const ans = selectedOptions[q.id];
      const hasAns = ans !== undefined && ans !== null && ans !== '';
      
      let isCorrect = false;
      if (hasAns) {
        if (q.type === 'NAT') {
          isCorrect = Math.abs(Number(ans) - Number(q.correct)) <= 0.05;
        } else if (q.type === 'MSQ') {
          isCorrect = JSON.stringify([...ans].sort()) === JSON.stringify([...q.correct].sort());
        } else {
          isCorrect = ans === q.correct;
        }
      }

      if (!hasAns) {
        setAdaptingMessage('Response skipped.\n↘ Adapting trajectory...\n[Next Question: Recalibrating capability]');
      } else if (!isCorrect) {
        setAdaptingMessage('[x] Incorrect. Knowledge gap detected.\n↘ Adapting trajectory...\n[Next Question: Lower difficulty, same concept]');
      } else {
        setAdaptingMessage('[✓] Correct. Concept mastery confirmed.\n↗ Adapting trajectory...\n[Next Question: Higher difficulty, lateral concept]');
      }

      setTimeout(() => {
        setIsAdapting(false);
        proceedNext();
      }, 1200);
    } else {
      proceedNext();
    }
  };

  const proceedNext = () => {
    if (currentIdx < questions.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setVisitedQuestions((prev) => ({ ...prev, [questions[nextIdx].id]: true }));
    }
  };

  const handlePrevious = () => {
    if (currentIdx > 0) {
      const prevIdx = currentIdx - 1;
      setCurrentIdx(prevIdx);
      setVisitedQuestions((prev) => ({ ...prev, [questions[prevIdx].id]: true }));
    }
  };

  const handleSaveAndNext = () => {
    handleNext();
  };

  const handleMarkForReviewAndNext = () => {
    const qId = questions[currentIdx].id;
    setMarkedForReview(prev => ({ ...prev, [qId]: true }));
    handleNext();
  };

  const handleClearResponse = () => {
    const qId = questions[currentIdx].id;
    setSelectedOptions(prev => {
      const updated = { ...prev };
      delete updated[qId];
      // Clean marked for review as well
      setMarkedForReview(r => {
        const updatedReview = { ...r };
        delete updatedReview[qId];
        return updatedReview;
      });
      return updated;
    });
  };

  const handleOptionSelect = (optIdx) => {
    const q = questions[currentIdx];
    const qId = q.id;

    // Track selection history
    setAnswerHistory(prev => {
      const hist = prev[qId] || [];
      if (hist[hist.length - 1] !== optIdx) {
        return { ...prev, [qId]: [...hist, optIdx] };
      }
      return prev;
    });

    if (q.type === 'MSQ') {
      setSelectedOptions(prev => {
        const currentSelection = prev[qId] || [];
        let nextSelection;
        if (currentSelection.includes(optIdx)) {
          nextSelection = currentSelection.filter(i => i !== optIdx);
        } else {
          nextSelection = [...currentSelection, optIdx];
        }
        return { ...prev, [qId]: nextSelection };
      });
    } else {
      setSelectedOptions(prev => ({ ...prev, [qId]: optIdx }));
    }
  };

  const handleNatInputChange = (val) => {
    const qId = questions[currentIdx].id;
    
    setAnswerHistory(prev => {
      const hist = prev[qId] || [];
      if (hist[hist.length - 1] !== val) {
        return { ...prev, [qId]: [...hist, val] };
      }
      return prev;
    });

    setSelectedOptions(prev => ({ ...prev, [qId]: val }));
  };

  const getQuestionStatusClass = (idx) => {
    const q = questions[idx];
    if (!q) return 'palette-btn not-visited';
    
    const qId = q.id;
    const isAns = selectedOptions[qId] !== undefined && selectedOptions[qId] !== '';
    const isMarked = markedForReview[qId];
    const isVisited = visitedQuestions[qId];

    if (isAns && isMarked) return 'palette-btn answered-marked';
    if (isMarked) return 'palette-btn marked';
    if (isAns) return 'palette-btn answered';
    if (isVisited) return 'palette-btn visited-not-answered';
    return 'palette-btn not-visited';
  };

  const submitTest = async (auto = false) => {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    
    // Exit Fullscreen
    try {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (e) {}

    // Calculation logic
    let correctCount = 0;
    let incorrectCount = 0;
    let totalScore = 0;
    const detailedReport = [];

    questions.forEach((q) => {
      const qId = q.id;
      const ans = selectedOptions[qId];
      let isCorrect = false;
      let isAttempted = ans !== undefined && ans !== '';

      if (isAttempted) {
        if (q.type === 'MSQ') {
          const correctArr = q.correct || [];
          const userArr = ans || [];
          isCorrect = correctArr.length === userArr.length && correctArr.every(v => userArr.includes(v));
        } else if (q.type === 'NAT') {
          const userVal = parseFloat(ans);
          const correctVal = parseFloat(q.correct);
          const tolerance = 0.05;
          isCorrect = Math.abs(userVal - correctVal) <= tolerance;
        } else {
          isCorrect = ans === q.correct;
        }

        if (isCorrect) {
          correctCount++;
          totalScore += 1;
        } else {
          incorrectCount++;
          if (config.negativeMarking) {
            totalScore -= (1/3);
          }
        }
      }

      detailedReport.push({
        id: q.id,
        question: q.question,
        options: q.options,
        correct: q.correct,
        userAnswer: ans || null,
        isCorrect,
        isAttempted,
        explanation: q.explanation || '',
        category: q.category,
        topic: q.topic,
        type: q.type,
        confidence: confidences[q.id] || null,
        timeSpentSeconds: timeSpentMap[q.id] || 0,
        answerHistory: answerHistory[q.id] || []
      });
    });

    const accuracy = correctCount + incorrectCount > 0 
      ? Math.round((correctCount / (correctCount + incorrectCount)) * 100) 
      : 0;

    const timeSpent = config.duration * 60 - timerSeconds;
    
    const testResult = {
      testName: config.name,
      total: questions.length,
      attempted: correctCount + incorrectCount,
      correct: correctCount,
      incorrect: incorrectCount,
      score: parseFloat(totalScore.toFixed(2)),
      accuracy,
      timeSpentSeconds: timeSpent,
      submittedAt: new Date().toISOString(),
      report: detailedReport,
      confidences,
      timeSpentMap,
      answerHistory
    };

    // Use attemptId as the document name for idempotency
    let testId = attemptId || `test_${Date.now()}`;
    try {
      if (user) {
        const docRef = doc(db, 'users', user.uid, 'tests', testId);
        await setDoc(docRef, testResult);

        // Track each question result in the adaptive mastery context
        const promises = questions.map((q) => {
          const repItem = detailedReport.find(item => item.id === q.id);
          const isCorrect = repItem ? repItem.isCorrect : false;
          const qTimeMs = (timeSpentMap[q.id] || 0) * 1000;
          const confidence = confidences[q.id] || null;
          return recordDetailedAnswer(q, isCorrect, qTimeMs, confidence);
        });
        await Promise.all(promises);
      } else {
        localStorage.setItem(`guest_test_result_${testId}`, JSON.stringify(testResult));
      }
    } catch (err) {
      console.error("Error saving scorecard:", err);
    }

    // Clear state
    localStorage.removeItem('current_test_session');
    localStorage.removeItem('current_test_config');
    localStorage.removeItem('current_test_end_time');

    navigate(`/tests/result/${testId}`);
  };

  if (loading || questions.length === 0 || !config) {
    return (
      <div className="loading-fullscreen" style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'var(--bg-body)', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', zIndex: 100000
      }}>
        <div className="spinner" style={{
          border: '4px solid var(--border)', borderTop: '4px solid var(--accent)',
          borderRadius: '50%', width: '50px', height: '50px',
          animation: 'spin 1s linear infinite', marginBottom: '1.5rem'
        }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <h3>Preparing Exam Environment...</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Dynamically configuring test templates and sampling questions.</p>
      </div>
    );
  }

  // Adaptation Interstitial Overlay
  if (isAdapting) {
    return (
      <div className="test-session-fullscreen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card)' }}>
        <div style={{ padding: '2rem', background: 'rgba(0,0,0,0.5)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.4)', maxWidth: '500px', width: '100%' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>Evaluating response...</h3>
          <pre style={{ whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.8)', fontSize: '1rem', lineHeight: '1.6', margin: 0, fontFamily: 'var(--font-mono)' }}>
            {adaptingMessage}
          </pre>
        </div>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentIdx];
  const hasContext = currentQuestion?.contextHtml;

  return (
    <div className="test-session-fullscreen">
      {/* Header */}
      <header className="test-header">
        <div className="test-title-section">
          <h2>{config.name}</h2>
          <span className="badge badge-accent">{questions.length} Qs</span>
        </div>
        
        <div className="test-timer-section">
          <div className="timer-box">
            <span className="timer-label">TIME REMAINING:</span>
            <span className={`timer-clock ${timerSeconds < 120 ? 'timer-danger' : ''}`}>
              {formatTime(timerSeconds)}
            </span>
          </div>
          <button className="btn btn-danger" onClick={() => setShowConfirmSubmit(true)}>
            Submit Test
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="test-main-container">
        
        {/* Left Side: Question Pane */}
        <div className="test-question-pane">
          
          {/* Top Panel: Question Category Info */}
          <div className="question-info-bar">
            <span>Question {currentIdx + 1} of {questions.length}</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span className="badge">{currentQuestion.category}</span>
              <span className="badge">{currentQuestion.topic}</span>
              <span className="badge badge-accent">{currentQuestion.type}</span>
              <QuestionIntelligenceBadge attempts={currentQuestion.stats?.totalAttempts || 0} />
              <span className="badge">+1.0 / {config.negativeMarking ? '-0.33' : '0.0'} Marks</span>
            </div>
          </div>

          {/* Core Layout Split or Single */}
          <div className={`question-render-area ${hasContext ? 'split-pane' : ''}`}>
            
            {hasContext && (
              <div className="scenario-panel" dangerouslySetInnerHTML={{ __html: currentQuestion.contextHtml }} />
            )}

            <div className="question-body-panel">
              <div className="question-text-block">
                <h3>{currentQuestion.question}</h3>
              </div>

              <div className="options-selector-block">
                {currentQuestion.type === 'NAT' ? (
                  <div className="nat-input-wrapper">
                    <p className="nat-helper">Enter decimal numeric value (accuracy tolerance within ±0.05):</p>
                    <input 
                      type="number" 
                      step="any"
                      className="form-input nat-text-input" 
                      value={selectedOptions[currentQuestion.id] || ''} 
                      onChange={(e) => handleNatInputChange(e.target.value)}
                      placeholder="Type your numeric answer..." 
                    />
                  </div>
                ) : (
                  <div className="options-grid">
                    {currentQuestion.options.map((opt, optIdx) => {
                      const isSelected = currentQuestion.type === 'MSQ'
                        ? (selectedOptions[currentQuestion.id] || []).includes(optIdx)
                        : selectedOptions[currentQuestion.id] === optIdx;

                      return (
                        <div 
                          key={optIdx} 
                          className={`option-row card card-interactive ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleOptionSelect(optIdx)}
                        >
                          <div className="option-marker">{chr(65 + optIdx)}</div>
                          <div className="option-text">{opt}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Option Confidence Selector */}
              {selectedOptions[currentQuestion.id] !== undefined && selectedOptions[currentQuestion.id] !== '' && (
                <div className="confidence-tracking-section" style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: 'var(--bg-body)',
                  border: '1px dashed var(--border)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  animation: 'fadeIn 0.2s ease'
                }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>How confident are you?</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['sure', 'unsure', 'guess'].map(c => {
                      const isConfSelected = confidences[currentQuestion.id] === c;
                      return (
                        <button
                          key={c}
                          className={`btn ${isConfSelected ? 'btn-primary' : 'btn-ghost'}`}
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', textTransform: 'capitalize' }}
                          onClick={() => setConfidences(prev => ({ ...prev, [currentQuestion.id]: c }))}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Footer Controls */}
          <footer className="test-control-footer">
            <div className="control-left">
              <button className="btn btn-secondary" onClick={handleClearResponse}>
                Clear Response
              </button>
              <button className="btn btn-secondary" onClick={handleMarkForReviewAndNext}>
                <Bookmark size={14} /> Mark for Review & Next
              </button>
            </div>
            
            <div className="control-right">
              <button className="btn btn-secondary" onClick={handlePrevious} disabled={currentIdx === 0}>
                <ChevronLeft size={16} /> Previous
              </button>
              <button className="btn btn-primary" onClick={handleSaveAndNext}>
                Save & Next <ChevronRight size={16} />
              </button>
            </div>
          </footer>

        </div>

        {/* Right Side: Sidebar Palette */}
        <aside className="test-sidebar-palette">
          <h3>Question Palette</h3>
          
          <div className="palette-grid">
            {questions.map((_, idx) => (
              <button 
                key={idx} 
                className={getQuestionStatusClass(idx)}
                onClick={() => {
                  setCurrentIdx(idx);
                  setVisitedQuestions(prev => {
                    const updated = { ...prev, [questions[idx].id]: true };
                    saveSessionToStorage(timerSeconds);
                    return updated;
                  });
                }}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <div className="palette-legend">
            <h4>Legend</h4>
            <div className="legend-row">
              <span className="legend-dot not-visited"></span>
              <span>Not Visited</span>
            </div>
            <div className="legend-row">
              <span className="legend-dot visited-not-answered"></span>
              <span>Not Answered</span>
            </div>
            <div className="legend-row">
              <span className="legend-dot answered"></span>
              <span>Answered</span>
            </div>
            <div className="legend-row">
              <span className="legend-dot marked"></span>
              <span>Marked for Review</span>
            </div>
            <div className="legend-row">
              <span className="legend-dot answered-marked"></span>
              <span>Answered & Marked</span>
            </div>
          </div>
        </aside>

      </div>

      {/* Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', color: 'var(--warning)' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0 }}>Confirm Submission</h3>
            </div>
            <p>Are you sure you want to submit your online assessment? You cannot undo this action.</p>
            <div className="modal-stats" style={{ display: 'flex', gap: '1rem', margin: '1.5rem 0', background: 'var(--bg-body)', padding: '1rem', borderRadius: '8px' }}>
              <div>
                <span className="stat-label" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>TOTAL Qs</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{questions.length}</span>
              </div>
              <div>
                <span className="stat-label" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ANSWERED</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--success)' }}>
                  {Object.keys(selectedOptions).length}
                </span>
              </div>
              <div>
                <span className="stat-label" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>UNANSWERED</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--danger)' }}>
                  {questions.length - Object.keys(selectedOptions).length}
                </span>
              </div>
            </div>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowConfirmSubmit(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={() => submitTest()}>
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helpers
function chr(code) {
  return String.fromCharCode(code);
}
