import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, ChevronRight, Filter, RotateCcw, Bookmark, Clock, Shuffle, List, Layers } from 'lucide-react';
import { useScore } from '../contexts/ScoreContext';
import './OAPractice.css';

const CATEGORIES = [
  { key: 'all', label: 'All', emoji: '📚' },
  { key: 'Mechanical Engineering', label: 'Mech Engg', emoji: '🔩' },
  { key: 'Quantitative Aptitude', label: 'Quants', emoji: '🧮' },
  { key: 'Data Interpretation', label: 'Data Interpretation', emoji: '📊' },
  { key: 'DILR', label: 'DILR', emoji: '🧩' },
  { key: 'Logical Reasoning', label: 'Logical Reasoning', emoji: '🧠' },
  { key: 'bookmarked', label: 'Bookmarked', emoji: '⭐' }
];

const DIFFICULTIES = ['all', 'Easy', 'Medium', 'Hard'];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function OAPractice() {
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get('cat') || 'all';

  const { scoreData, recordAnswer, getQuestionsProgress, toggleBookmark } = useScore();
  const [progressMap, setProgressMap] = useState({});
  
  const [category, setCategory] = useState(initialCat);
  const [difficulty, setDifficulty] = useState('all');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  
  // View mode and selections
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'list'
  const [selectedOptions, setSelectedOptions] = useState({}); // { [qId]: index }
  const [submittedQuestions, setSubmittedQuestions] = useState({}); // { [qId]: boolean }
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  const [quizQuestions, setQuizQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadActivePool = async () => {
    setLoading(true);
    try {
      let pool = [];
      if (category === 'Mechanical Engineering') {
        const mod = await import('../data/mechEngQuestions.js');
        pool = mod.default;
      } else if (category === 'Quantitative Aptitude') {
        const mod = await import('../data/quantsQuestions.js');
        pool = mod.default;
      } else if (category === 'Data Interpretation') {
        const mod = await import('../data/dataInterpretationQuestions.js');
        pool = mod.default;
      } else if (category === 'DILR') {
        const mod = await import('../data/dilrQuestions.js');
        pool = mod.default;
      } else if (category === 'Logical Reasoning') {
        const mod = await import('../data/logicalReasoningQuestions.js');
        pool = mod.default;
      } else if (category === 'all' || category === 'bookmarked') {
        // Load all categories dynamically in parallel
        const [me, qa, di, dilr, lr] = await Promise.all([
          import('../data/mechEngQuestions.js'),
          import('../data/quantsQuestions.js'),
          import('../data/dataInterpretationQuestions.js'),
          import('../data/dilrQuestions.js'),
          import('../data/logicalReasoningQuestions.js')
        ]);
        pool = [...me.default, ...qa.default, ...di.default, ...dilr.default, ...lr.default];
      }

      let filtered = pool;
      if (category === 'bookmarked') {
        filtered = filtered.filter(q => scoreData?.bookmarked?.includes(q.id));
      }
      if (difficulty !== 'all') {
        filtered = filtered.filter(q => q.difficulty === difficulty);
      }

      const shuffled = shuffleArray(filtered).slice(0, 50);
      setQuizQuestions(shuffled);
      setCurrentIdx(0);
      setSelectedOptions({});
      setSubmittedQuestions({});
      setTimeLeft(60);
      setIsTimerRunning(true);
    } catch (e) {
      console.error("Error loading code-split question datasets dynamically:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivePool();
  }, [category, difficulty]);

  const regenerateQuiz = () => {
    loadActivePool();
  };

  useEffect(() => {
    if (quizQuestions.length === 0) return;
    async function fetchProgress() {
      const ids = quizQuestions.map(q => q.id);
      const progress = await getQuestionsProgress(ids);
      setProgressMap(progress);
    }
    fetchProgress();
  }, [quizQuestions]);

  const question = quizQuestions[currentIdx];
  const isBookmarked = question && scoreData?.bookmarked?.includes(question.id);
  
  const selected = question ? (selectedOptions[question.id] ?? null) : null;
  const submitted = question ? (!!submittedQuestions[question.id]) : false;

  // Timer Effect
  useEffect(() => {
    if (!isTimerRunning || submitted || !question || viewMode !== 'card') return;
    
    if (timeLeft <= 0) {
      handleTimeUp();
      return;
    }
    
    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timerId);
  }, [timeLeft, isTimerRunning, submitted, question, viewMode]);

  const handleTimeUp = () => {
    if (!question) return;
    setSubmittedQuestions(prev => ({ ...prev, [question.id]: true }));
    setIsTimerRunning(false);
    recordAnswer(question.id, false);
    setProgressMap(prev => ({ ...prev, [question.id]: 'incorrect' }));
  };

  const handleSubmit = () => {
    if (!question) return;
    const sel = selectedOptions[question.id];
    if (sel === undefined || sel === null) return;
    setSubmittedQuestions(prev => ({ ...prev, [question.id]: true }));
    setIsTimerRunning(false);
    const isCorrect = sel === question.correct;
    recordAnswer(question.id, isCorrect);
    setProgressMap(prev => ({ ...prev, [question.id]: isCorrect ? 'correct' : 'incorrect' }));
  };

  const handleNext = () => {
    setCurrentIdx((i) => Math.min(i + 1, quizQuestions.length - 1));
    setTimeLeft(60);
    setIsTimerRunning(true);
  };

  const handleReset = () => {
    regenerateQuiz();
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!question) {
    return (
      <div className="page-content oa-practice">
        <div className="empty-state">
          <p>No questions found for this filter. Try a different category or difficulty.</p>
          <button className="btn btn-ghost" onClick={handleReset}><RotateCcw size={16} /> Reset Filters</button>
        </div>
      </div>
    );
  }

  const progress = quizQuestions.length > 0 ? ((currentIdx + 1) / quizQuestions.length) * 100 : 0;

  return (
    <div className="page-content oa-practice">
      <header className="practice-header">
        <div>
          <h1>Practice Mode 🎯</h1>
          <p className="practice-subtitle">
            {quizQuestions.length} questions in this quiz
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-ghost" 
            onClick={() => setViewMode(viewMode === 'card' ? 'list' : 'card')}
            title={viewMode === 'card' ? 'Show all questions in a list' : 'Show one question at a time'}
          >
            {viewMode === 'card' ? <List size={16} /> : <Layers size={16} />}
            {viewMode === 'card' ? ' List View' : ' Card View'}
          </button>
          <button className="btn btn-ghost" onClick={regenerateQuiz} title="Start a new random quiz">
            <RotateCcw size={16} /> New Quiz
          </button>
          <button className="btn btn-ghost" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={16} /> Filters
          </button>
        </div>
      </header>

      {showFilters && (
        <div className="filters-panel card">
          <div className="filter-group">
            <label className="form-label">Category</label>
            <div className="filter-pills">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  className={`pill ${category === c.key ? 'active' : ''}`}
                  onClick={() => setCategory(c.key)}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label className="form-label">Difficulty</label>
            <div className="filter-pills">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  className={`pill ${difficulty === d ? 'active' : ''}`}
                  onClick={() => setDifficulty(d)}
                >
                  {d === 'all' ? '🌐 All' : d}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading" style={{ textAlign: 'center', padding: '5rem 0' }}>
          <div className="spinner" style={{ border: '4px solid var(--border)', borderTop: '4px solid var(--accent)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <p style={{ color: 'var(--text-secondary)' }}>Loading code-split practice pool...</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="questions-list" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1rem' }}>
          {quizQuestions.map((q, idx) => {
            const isBookmarked = scoreData?.bookmarked?.includes(q.id);
            const selected = selectedOptions[q.id] ?? null;
            const submitted = !!submittedQuestions[q.id];

            return (
              <div key={q.id} className="question-card card">
                <div className="question-header-row">
                  <div className="question-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="badge" style={{ background: 'var(--bg-body)', color: 'var(--text-secondary)', fontWeight: 600 }}>Q {idx + 1}</span>
                    <span className="badge badge-accent">{q.topic}</span>
                    <span className={`badge badge-${q.difficulty === 'Easy' ? 'success' : q.difficulty === 'Medium' ? 'warning' : 'danger'}`}>
                      {q.difficulty}
                    </span>
                    {progressMap[q.id] === 'correct' && (
                      <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        Solved ✓
                      </span>
                    )}
                    {progressMap[q.id] === 'incorrect' && (
                      <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        Incorrect previously ✗
                      </span>
                    )}
                  </div>
                  
                  <div className="question-tools">
                    <button 
                      className={`bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`} 
                      onClick={() => toggleBookmark(q.id)}
                      title="Bookmark Question"
                    >
                      <Bookmark size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>

                {q.contextHtml && (
                  <div className="question-context card" style={{ marginBottom: '1.5rem', background: 'var(--bg-body)', padding: '1rem' }} dangerouslySetInnerHTML={{ __html: q.contextHtml }} />
                )}

                <h2 className="question-text" dangerouslySetInnerHTML={{ __html: q.question }} />

                <div className="options">
                  {q.options.map((opt, optIdx) => {
                    let cls = '';
                    if (submitted) {
                      if (optIdx === q.correct) cls = 'correct';
                      else if (optIdx === selected) cls = 'incorrect';
                    } else if (optIdx === selected) {
                      cls = 'selected';
                    }

                    return (
                      <button
                        key={optIdx}
                        className={`option ${cls}`}
                        onClick={() => !submitted && setSelectedOptions(prev => ({ ...prev, [q.id]: optIdx }))}
                        disabled={submitted}
                      >
                        <span className="option-key">{String.fromCharCode(65 + optIdx)}</span>
                        <span className="option-value" dangerouslySetInnerHTML={{ __html: opt }} />
                        {submitted && optIdx === q.correct && <CheckCircle size={18} className="option-icon success-icon" />}
                        {submitted && optIdx === selected && optIdx !== q.correct && <XCircle size={18} className="option-icon danger-icon" />}
                      </button>
                    );
                  })}
                </div>

                {submitted && (
                  <div className={`result-box ${selected === q.correct ? 'correct' : 'incorrect'}`}>
                    <div className="result-header">
                      <h3>{selected === q.correct ? 'Correct! 🎉' : 'Incorrect'}</h3>
                      {selected === q.correct ? <span className="xp-gain">+10 XP</span> : null}
                    </div>
                    {q.explanation && (
                      <div className="explanation">
                        <strong>Explanation:</strong>
                        <div dangerouslySetInnerHTML={{ __html: q.explanation }} />
                      </div>
                    )}
                  </div>
                )}

                <div className="question-actions">
                  {!submitted ? (
                    <button 
                      className="btn btn-primary" 
                      onClick={() => {
                        if (selected === null) return;
                        setSubmittedQuestions(prev => ({ ...prev, [q.id]: true }));
                        recordAnswer(q.id, selected === q.correct);
                      }} 
                      disabled={selected === null}
                    >
                      Check Answer
                    </button>
                  ) : (
                    <span className="badge badge-success" style={{ padding: '0.5rem 1rem' }}>Completed</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          {/* Progress */}
          <div className="progress-row">
            <span className="progress-label">Q {currentIdx + 1} of {quizQuestions.length}</span>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%`, background: 'var(--accent)' }}></div>
            </div>
          </div>

          {/* Question Card */}
          <div className="question-card card">
            <div className="question-header-row">
              <div className="question-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge badge-accent">{question.topic}</span>
                <span className={`badge badge-${question.difficulty === 'Easy' ? 'success' : question.difficulty === 'Medium' ? 'warning' : 'danger'}`}>
                  {question.difficulty}
                </span>
                {progressMap[question.id] === 'correct' && (
                  <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    Solved ✓
                  </span>
                )}
                {progressMap[question.id] === 'incorrect' && (
                  <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    Incorrect previously ✗
                  </span>
                )}
              </div>
              
              <div className="question-tools">
                <div className={`timer-badge ${timeLeft <= 10 ? 'danger' : ''}`}>
                  <Clock size={16} /> {formatTime(timeLeft)}
                </div>
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
                  else if (index === selected) cls = 'incorrect';
                } else if (index === selected) {
                  cls = 'selected';
                }

                return (
                  <button
                    key={index}
                    className={`option ${cls}`}
                    onClick={() => !submitted && setSelectedOptions(prev => ({ ...prev, [question.id]: index }))}
                    disabled={submitted}
                  >
                    <span className="option-key">{String.fromCharCode(65 + index)}</span>
                    <span className="option-value" dangerouslySetInnerHTML={{ __html: opt }} />
                    {submitted && index === question.correct && <CheckCircle size={18} className="option-icon success-icon" />}
                    {submitted && index === selected && index !== question.correct && <XCircle size={18} className="option-icon danger-icon" />}
                  </button>
                );
              })}
            </div>

            {submitted && (
              <div className={`result-box ${selected === question.correct ? 'correct' : 'incorrect'}`}>
                <div className="result-header">
                  <h3>{selected === question.correct ? 'Correct! 🎉' : 'Incorrect'}</h3>
                  {selected === question.correct ? <span className="xp-gain">+10 XP</span> : null}
                </div>
                {question.explanation && (
                  <div className="explanation">
                    <strong>Explanation:</strong>
                    <div dangerouslySetInnerHTML={{ __html: question.explanation }} />
                  </div>
                )}
              </div>
            )}

            <div className="question-actions">
              {!submitted ? (
                <button className="btn btn-primary" onClick={handleSubmit} disabled={selected === null}>
                  Check Answer
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleNext} disabled={currentIdx >= quizQuestions.length - 1}>
                  Next <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
