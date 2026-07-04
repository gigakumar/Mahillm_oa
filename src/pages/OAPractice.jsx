import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, ChevronRight, Filter, RotateCcw, Bookmark, Clock, Shuffle } from 'lucide-react';
import { useScore } from '../contexts/ScoreContext';
import './OAPractice.css';

// These will be populated by the scraper subagents
import mechEngQuestions from '../data/mechEngQuestions';
import quantsQuestions from '../data/quantsQuestions';
import dilrQuestions from '../data/dilrQuestions';
import graphQuestions from '../data/graphQuestions';

const ALL_QUESTIONS = [...mechEngQuestions, ...quantsQuestions, ...dilrQuestions, ...graphQuestions];

const CATEGORIES = [
  { key: 'all', label: 'All', emoji: '📚' },
  { key: 'Mechanical Engineering', label: 'Mech Engg', emoji: '🔩' },
  { key: 'Quantitative Aptitude', label: 'Quants', emoji: '🧮' },
  { key: 'DILR', label: 'DILR', emoji: '🧩' },
  { key: 'Graph Interpretation', label: 'Graphs', emoji: '📊' },
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

  const { scoreData, recordAnswer, toggleBookmark } = useScore();
  
  const [category, setCategory] = useState(initialCat);
  const [difficulty, setDifficulty] = useState('all');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  const filtered = useMemo(() => {
    let qs = ALL_QUESTIONS;
    if (category === 'bookmarked') {
      qs = qs.filter(q => scoreData?.bookmarked?.includes(q.id));
    } else if (category !== 'all') {
      qs = qs.filter((q) => q.category === category);
    }
    if (difficulty !== 'all') qs = qs.filter((q) => q.difficulty === difficulty);
    return qs;
  }, [category, difficulty, scoreData?.bookmarked]);

  const question = filtered[currentIdx];
  const isBookmarked = question && scoreData?.bookmarked?.includes(question.id);

  // Timer Effect
  useEffect(() => {
    if (!isTimerRunning || submitted || !question) return;
    
    if (timeLeft <= 0) {
      handleTimeUp();
      return;
    }
    
    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timerId);
  }, [timeLeft, isTimerRunning, submitted, question]);

  useEffect(() => {
    setCurrentIdx(0);
    setSelected(null);
    setSubmitted(false);
    setTimeLeft(60);
    setIsTimerRunning(true);
  }, [category, difficulty]);

  const handleTimeUp = () => {
    setSubmitted(true);
    setIsTimerRunning(false);
    recordAnswer(false);
  };

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    setIsTimerRunning(false);
    const isCorrect = selected === question.correct;
    recordAnswer(isCorrect);
  };

  const handleNext = () => {
    setCurrentIdx((i) => Math.min(i + 1, filtered.length - 1));
    setSelected(null);
    setSubmitted(false);
    setTimeLeft(60);
    setIsTimerRunning(true);
  };

  const handleReset = () => {
    setCurrentIdx(0);
    setSelected(null);
    setSubmitted(false);
    setTimeLeft(60);
    setIsTimerRunning(true);
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

  const progress = filtered.length > 0 ? ((currentIdx + 1) / filtered.length) * 100 : 0;

  return (
    <div className="page-content oa-practice">
      <header className="practice-header">
        <div>
          <h1>Practice Mode 🎯</h1>
          <p className="practice-subtitle">
            {filtered.length} questions available in this view
          </p>
        </div>
        <button className="btn btn-ghost" onClick={() => setShowFilters(!showFilters)}>
          <Filter size={16} /> Filters
        </button>
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

      {/* Progress */}
      <div className="progress-row">
        <span className="progress-label">Q {currentIdx + 1} of {filtered.length}</span>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%`, background: 'var(--accent)' }}></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="question-card card">
        <div className="question-header-row">
          <div className="question-meta">
            <span className="badge badge-accent">{question.topic}</span>
            <span className={`badge badge-${question.difficulty === 'Easy' ? 'success' : question.difficulty === 'Medium' ? 'warning' : 'danger'}`}>
              {question.difficulty}
            </span>
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
                onClick={() => !submitted && setSelected(index)}
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
            <button className="btn btn-primary" onClick={handleNext} disabled={currentIdx >= filtered.length - 1}>
              Next <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
