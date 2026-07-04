import React, { useState, useEffect } from 'react';
import { useUserData } from '../contexts/UserDataContext';
import { classifyStrategy } from '../intelligence/strategyClassifier';
import { Play, Pause, RotateCcw, Clock, ShieldAlert, Award, ArrowRight } from 'lucide-react';
import './AttemptReplay.css';

export default function AttemptReplay() {
  const { questionProgress } = useUserData();

  const [allQuestions, setAllQuestions] = useState([]);
  const [selectedQId, setSelectedQId] = useState(null);
  const [playbackIndex, setPlaybackIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load all question sets to resolve details
  useEffect(() => {
    async function loadAllPools() {
      setLoading(true);
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
        console.error("Error loading question sets for replay:", e);
      } finally {
        setLoading(false);
      }
    }
    loadAllPools();
  }, []);

  // Filter progress items that contain timeline tracking
  const progressList = Object.keys(questionProgress || {}).map(qId => {
    const prog = questionProgress[qId];
    const quest = allQuestions.find(q => q.id.toString() === qId);
    return {
      id: qId,
      status: prog.status,
      solveTimeMs: prog.solveTimeMs || 60000,
      confidence: prog.confidence || 'Sure',
      timeline: prog.timeline || [
        { action: 'open', time: 0 },
        { action: 'select', optionIndex: quest ? quest.correct : 0, time: Math.round((prog.solveTimeMs || 60000) / 2000) },
        { action: 'submit', time: Math.round((prog.solveTimeMs || 60000) / 1000) }
      ],
      question: quest
    };
  }).filter(item => item.question);

  const selectedItem = progressList.find(item => item.id === selectedQId);

  // Setup playback step timer
  useEffect(() => {
    let timer;
    if (isPlaying && selectedItem) {
      if (playbackIndex < selectedItem.timeline.length - 1) {
        timer = setTimeout(() => {
          setPlaybackIndex(prev => prev + 1);
        }, 1500); // 1.5 second interval per event
      } else {
        setIsPlaying(false);
      }
    }
    return () => clearTimeout(timer);
  }, [isPlaying, playbackIndex, selectedItem]);

  const handleStartPlay = () => {
    if (playbackIndex === selectedItem.timeline.length - 1) {
      setPlaybackIndex(0);
    }
    setIsPlaying(true);
  };

  const handleReset = () => {
    setPlaybackIndex(0);
    setIsPlaying(false);
  };

  // Determine option states at the current playback step
  const getActiveOptionIndex = () => {
    if (!selectedItem || playbackIndex === -1) return null;
    let selected = null;
    for (let i = 0; i <= playbackIndex; i++) {
      const step = selectedItem.timeline[i];
      if (step.action === 'select') {
        selected = step.optionIndex;
      }
    }
    return selected;
  };

  const currentOptionIndex = getActiveOptionIndex();
  const currentStep = selectedItem && playbackIndex >= 0 ? selectedItem.timeline[playbackIndex] : null;

  // Run strategic classification on selection
  let strategyDiagnosis = null;
  if (selectedItem) {
    const rawSwitches = selectedItem.timeline.filter(t => t.action === 'select');
    const switchesList = rawSwitches.map((s, idx) => ({
      from: idx > 0 ? rawSwitches[idx - 1].optionIndex : 'none',
      to: s.optionIndex,
      time: s.time
    }));

    strategyDiagnosis = classifyStrategy({
      solveTime: selectedItem.solveTimeMs / 1000,
      medianSolveTime: 60,
      timeStdDev: 20,
      correct: selectedItem.status === 'correct',
      answerSwitches: switchesList
    });
  }

  return (
    <div className="page-content replay-page">
      <h1>Learner Attempt Replay 🎬</h1>
      <p className="practice-subtitle" style={{ marginBottom: '2rem' }}>
        Visualize step-by-step solve timelines, answer swaps, and commitment delays to debug calculation stalls.
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>Loading attempts database...</div>
      ) : progressList.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <ShieldAlert size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
          <h3>No Attempts Found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Solve questions in practice sessions or mocks to populate replay timelines.</p>
        </div>
      ) : (
        <div className="replay-container">
          
          {/* Sidebar list */}
          <div className="replay-sidebar card">
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--text-h)' }}>Attempt History</h3>
            <div className="replay-list-scroll">
              {progressList.map(item => {
                const isActive = item.id === selectedQId;
                return (
                  <div 
                    key={item.id} 
                    className={`replay-item-card ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedQId(item.id);
                      setPlaybackIndex(0);
                      setIsPlaying(false);
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`badge ${item.status === 'correct' ? 'badge-success-soft' : 'badge-danger-soft'}`} style={{ fontSize: '0.75rem' }}>
                        {item.status === 'correct' ? 'Correct' : 'Incorrect'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {Math.round(item.solveTimeMs / 1000)}s
                      </span>
                    </div>
                    <p className="replay-card-qtext">
                      {item.question.question}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Player Content Area */}
          <div className="replay-main">
            {selectedItem ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Strategic classification diagnostic card */}
                {strategyDiagnosis && (
                  <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent)', background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.08) 0%, rgba(255,255,255,0.01) 100%)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-h)' }}>
                        Strategic Category: <span style={{ color: 'var(--accent)' }}>{strategyDiagnosis.strategyType.replace('_', ' ')}</span>
                      </h4>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Solve speed: {strategyDiagnosis.pacingCategory} (Time Ratio: {strategyDiagnosis.timeRatio}x)
                      </span>
                    </div>
                  </div>
                )}

                {/* Question rendering */}
                <div className="card" style={{ padding: '2rem' }}>
                  <span className="badge badge-ghost-soft" style={{ marginBottom: '1rem' }}>
                    {selectedItem.question.category} &bull; {selectedItem.question.topic}
                  </span>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text-h)', margin: '0 0 1.5rem 0' }}>
                    {selectedItem.question.question}
                  </h3>

                  {/* Options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selectedItem.question.options.map((opt, idx) => {
                      const isSelected = currentOptionIndex === idx;
                      const isCorrectAnswer = selectedItem.question.correct === idx;
                      const isStepSubmit = currentStep?.action === 'submit';

                      let borderClass = '';
                      let bgClass = '';
                      if (isSelected) {
                        borderClass = 'option-selected-border';
                        bgClass = 'option-selected-bg';
                      }
                      if (isStepSubmit) {
                        if (isCorrectAnswer) {
                          borderClass = 'option-correct-border';
                          bgClass = 'option-correct-bg';
                        } else if (isSelected) {
                          borderClass = 'option-incorrect-border';
                          bgClass = 'option-incorrect-bg';
                        }
                      }

                      return (
                        <div 
                          key={idx} 
                          className={`replay-option-card ${borderClass} ${bgClass}`}
                          style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', transition: 'all 0.3s ease' }}
                        >
                          <span style={{ fontWeight: 700, marginRight: '0.5rem' }}>{String.fromCharCode(65 + idx)}.</span>
                          {opt}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Timeline Controls */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      {isPlaying ? (
                        <button className="btn btn-secondary" onClick={() => setIsPlaying(false)}>
                          <Pause size={16} /> Pause
                        </button>
                      ) : (
                        <button className="btn btn-primary" onClick={handleStartPlay}>
                          <Play size={16} /> Play Replay
                        </button>
                      )}
                      <button className="btn btn-ghost" onClick={handleReset}>
                        <RotateCcw size={16} /> Reset
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      <Clock size={16} />
                      <span>Event {playbackIndex + 1} of {selectedItem.timeline.length}</span>
                    </div>

                  </div>

                  {/* Horizontal visual timeline */}
                  <div className="visual-timeline-bar">
                    {selectedItem.timeline.map((step, idx) => {
                      const isActive = idx <= playbackIndex;
                      const isCurrent = idx === playbackIndex;
                      
                      let stepColor = 'rgba(255,255,255,0.15)';
                      if (isActive) stepColor = 'var(--accent)';
                      if (isCurrent) stepColor = '#00b894';

                      return (
                        <div 
                          key={idx} 
                          className="visual-timeline-dot"
                          style={{ backgroundColor: stepColor }}
                          onClick={() => setPlaybackIndex(idx)}
                          title={`${step.action} at ${step.time}s`}
                        >
                          <span className="dot-label">{step.action.toUpperCase()}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Log description */}
                  <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.01)', borderRadius: 'var(--radius-md)' }}>
                    <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Event Log</strong>
                    {currentStep ? (
                      <span style={{ fontSize: '0.95rem', color: 'var(--text-h)' }}>
                        {currentStep.action === 'open' && "Question opened."}
                        {currentStep.action === 'select' && `Selected option ${String.fromCharCode(65 + currentStep.optionIndex)} after ${currentStep.time} seconds.`}
                        {currentStep.action === 'submit' && `Submitted answer after ${currentStep.time} seconds.`}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Click Play to start attempt replay.</span>
                    )}
                  </div>

                </div>

              </div>
            ) : (
              <div className="card" style={{ padding: '4rem', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <Clock size={36} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
                <h3>Select an Attempt</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Choose a card from the left sidebar to play back the attempt timeline.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
