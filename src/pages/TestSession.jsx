import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, setDoc, collection } from 'firebase/firestore';
import { HelpCircle, ChevronLeft, ChevronRight, CheckCircle2, Bookmark, Trash2, AlertTriangle } from 'lucide-react';
import './TestSession.css';

// Datasets
import mechEngQuestions from '../data/mechEngQuestions';
import quantsQuestions from '../data/quantsQuestions';
import dataInterpretationQuestions from '../data/dataInterpretationQuestions';
import dilrQuestions from '../data/dilrQuestions';
import logicalReasoningQuestions from '../data/logicalReasoningQuestions';

// Coherent Set-based sampler
function sampleQuestions(config) {
  const { count, distribution, difficulty } = config;
  const pool = {
    'Mechanical Engineering': mechEngQuestions,
    'Quantitative Aptitude': quantsQuestions,
    'Data Interpretation': dataInterpretationQuestions,
    'DILR': dilrQuestions,
    'Logical Reasoning': logicalReasoningQuestions
  };

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
      catPool = pool[category] || []; // fallback to all if difficulty pool empty
    }

    // Set-based coherence for Data Interpretation and DILR
    if (category === 'Data Interpretation' || category === 'DILR') {
      // Find all unique sets (grouped by contextHtml)
      const setsMap = new Map();
      catPool.forEach((q) => {
        const key = q.contextHtml || q.question;
        if (!setsMap.has(key)) {
          setsMap.set(key, []);
        }
        setsMap.get(key).push(q);
      });

      const sets = Array.from(setsMap.values());
      // Shuffle sets
      const shuffledSets = [...sets].sort(() => 0.5 - Math.random());
      
      let added = 0;
      for (const setQs of shuffledSets) {
        if (added >= catCount) break;
        // Take up to remaining needed
        const toTake = setQs.slice(0, catCount - added);
        selected.push(...toTake);
        added += toTake.length;
      }
    } else {
      // Standalone random selection
      const shuffled = [...catPool].sort(() => 0.5 - Math.random());
      selected.push(...shuffled.slice(0, catCount));
    }
  });

  // If we ended up with slightly more or fewer questions due to rounding, truncate or pad
  let finalSelection = selected.slice(0, count);
  if (finalSelection.length < count) {
    // Pad with leftover questions
    const allQs = [...mechEngQuestions, ...quantsQuestions];
    for (const q of allQs) {
      if (finalSelection.length >= count) break;
      if (!finalSelection.some(fq => fq.id === q.id)) {
        finalSelection.push(q);
      }
    }
  }

  // Shuffle the final merged test set so it's a mixed test
  return finalSelection.sort(() => 0.5 - Math.random());
}

export default function TestSession() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [config, setConfig] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  // States: key is question ID
  const [selectedOptions, setSelectedOptions] = useState({}); // user answers (index for MCQ, array for MSQ, text for NAT)
  const [visitedQuestions, setVisitedQuestions] = useState({}); // true/false
  const [markedForReview, setMarkedForReview] = useState({}); // true/false
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  const timerRef = useRef(null);

  // Load or initialize test session
  useEffect(() => {
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
      setTimerSeconds(session.timerSeconds);
    } else {
      // Start new session
      const testQs = sampleQuestions(parsedConfig);
      setQuestions(testQs);
      setTimerSeconds(parsedConfig.duration * 60);
      
      const initialVisited = { [testQs[0]?.id]: true };
      setVisitedQuestions(initialVisited);

      // Save initial state
      localStorage.setItem('current_test_session', JSON.stringify({
        questions: testQs,
        currentIdx: 0,
        selectedOptions: {},
        visitedQuestions: initialVisited,
        markedForReview: {},
        timerSeconds: parsedConfig.duration * 60
      }));
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
  }, []);

  // Timer interval setup
  useEffect(() => {
    if (timerSeconds <= 0 && questions.length > 0) {
      // Auto submit on timeout
      submitTest(true);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        const next = prev - 1;
        // Save state to localstorage with decremented timer
        saveSessionToStorage(next);
        return next;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timerSeconds, questions]);

  const saveSessionToStorage = (currTime) => {
    if (questions.length === 0) return;
    localStorage.setItem('current_test_session', JSON.stringify({
      questions,
      currentIdx,
      selectedOptions,
      visitedQuestions,
      markedForReview,
      timerSeconds: currTime
    }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setVisitedQuestions((prev) => {
        const updated = { ...prev, [questions[nextIdx].id]: true };
        localStorage.setItem('current_test_session', JSON.stringify({
          questions,
          currentIdx: nextIdx,
          selectedOptions,
          visitedQuestions: updated,
          markedForReview,
          timerSeconds
        }));
        return updated;
      });
    }
  };

  const handlePrevious = () => {
    if (currentIdx > 0) {
      const prevIdx = currentIdx - 1;
      setCurrentIdx(prevIdx);
      setVisitedQuestions((prev) => {
        const updated = { ...prev, [questions[prevIdx].id]: true };
        localStorage.setItem('current_test_session', JSON.stringify({
          questions,
          currentIdx: prevIdx,
          selectedOptions,
          visitedQuestions: updated,
          markedForReview,
          timerSeconds
        }));
        return updated;
      });
    }
  };

  const handleSaveAndNext = () => {
    // Saves answer implicitly through state binding and moves to next
    handleNext();
  };

  const handleMarkForReviewAndNext = () => {
    const qId = questions[currentIdx].id;
    setMarkedForReview(prev => {
      const updated = { ...prev, [qId]: true };
      localStorage.setItem('current_test_session', JSON.stringify({
        questions,
        currentIdx: currentIdx + 1,
        selectedOptions,
        visitedQuestions,
        markedForReview: updated,
        timerSeconds
      }));
      return updated;
    });
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
          // Both correct arrays must match elements exactly
          const correctArr = q.correct || [];
          const userArr = ans || [];
          isCorrect = correctArr.length === userArr.length && correctArr.every(v => userArr.includes(v));
        } else if (q.type === 'NAT') {
          const userVal = parseFloat(ans);
          const correctVal = parseFloat(q.correct);
          // Set standard numeric tolerance e.g. 0.05
          const tolerance = 0.05;
          isCorrect = Math.abs(userVal - correctVal) <= tolerance;
        } else {
          // MCQ / TF / Assertion-Reason
          isCorrect = ans === q.correct;
        }

        if (isCorrect) {
          correctCount++;
          totalScore += 1; // 1 mark per question
        } else {
          incorrectCount++;
          if (config.negativeMarking) {
            totalScore -= (1/3); // GATE Style negative marking
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
        type: q.type
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
      report: detailedReport
    };

    let testId = `test_${Date.now()}`;
    if (user) {
      // Save scorecard to firestore
      const docRef = doc(db, 'users', user.uid, 'tests', testId);
      await setDoc(docRef, testResult);
    } else {
      // Local storage fallback for guests
      localStorage.setItem(`guest_test_result_${testId}`, JSON.stringify(testResult));
    }

    // Clear state
    localStorage.removeItem('current_test_session');
    localStorage.removeItem('current_test_config');

    navigate(`/tests/result/${testId}`);
  };

  if (questions.length === 0 || !config) {
    return <div className="loading">Initializing test session...</div>;
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
