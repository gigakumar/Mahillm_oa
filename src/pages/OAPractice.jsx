import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, ChevronRight, Filter, RotateCcw, Bookmark, BookOpen, Clock, Shuffle, List, Layers, Brain, Award, Sparkles, Flame, Zap, Target, RefreshCw, TrendingUp, AlertTriangle } from 'lucide-react';

import QuestionIntelligenceBadge from '../components/QuestionIntelligenceBadge';
import { useScore } from '../contexts/ScoreContext';
import { useUserData } from '../contexts/UserDataContext';
import { selectNextQuestions, getAdaptiveSummary } from '../utils/adaptiveEngine';
import { QuestionBankRegistry } from '../data/questionBankRegistry';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import './OAPractice.css';
import './AdaptivePractice.css';

// Cache loaded question banks to avoid re-importing on filter changes
const questionBankCache = {};


const CATEGORIES = [
  { key: 'all', label: 'All', emoji: '📚' },
  { key: 'Mechanical Engineering', label: 'Mech Engg', emoji: '🔩' },
  { key: 'Quantitative Aptitude', label: 'Quants', emoji: '🧮' },
  { key: 'Data Interpretation', label: 'Data Interpretation', emoji: '📊' },
  { key: 'DILR', label: 'DILR', emoji: '🧩' },
  { key: 'Logical Reasoning', label: 'Logical Reasoning', emoji: '🧠' },
  { key: 'bookmarked', label: 'Bookmarked', emoji: '⭐' }
];

const DIFFICULTIES = ['all', 'LOW', 'MEDIUM', 'HIGH'];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function OAPractice() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const catParam = searchParams.get('cat');
  const topicParam = searchParams.get('topic');

  const { scoreData, toggleBookmark } = useScore();
  const { masteryScores, mistakes, spacedRepetition, recordDetailedAnswer } = useUserData();
  const [progressMap, setProgressMap] = useState({});
  const [xpFeedback, setXpFeedback] = useState(null);
  
  const [isSessionActive, setIsSessionActive] = useState(!!catParam);
  const [category, setCategory] = useState(catParam || 'all');
  
  useEffect(() => {
    if (catParam) {
      setCategory(catParam);
      if (topicParam) setTopic(topicParam);
      setIsSessionActive(true);
    } else {
      setIsSessionActive(false);
      setCategory('all');
      setTopic('all');
    }
  }, [catParam, topicParam]);

  const [difficulty, setDifficulty] = useState('all');
  const [topic, setTopic] = useState('all');
  const [availableTopics, setAvailableTopics] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const prevCategoryRef = useRef(category);
  
  // View mode, selections, and Adaptive mode
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'list'
  const [selectedOptions, setSelectedOptions] = useState({}); // { [qId]: index }
  const [submittedQuestions, setSubmittedQuestions] = useState({}); // { [qId]: boolean }
  const [isAdaptive, setIsAdaptive] = useState(false);
  const [selectionReasons, setSelectionReasons] = useState({});
  const [confidences, setConfidences] = useState({});
  const [currentTimeline, setCurrentTimeline] = useState([]);
  
  // Intelligence States
  const [recentSolveTimes, setRecentSolveTimes] = useState([]);
  const [sessionSureWrong, setSessionSureWrong] = useState(0);
  const [dismissSureWrong, setDismissSureWrong] = useState(false);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  const [quizQuestions, setQuizQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [debugPoolLength, setDebugPoolLength] = useState(-1);
  const [debugFilteredLength, setDebugFilteredLength] = useState(-1);

  // Load a single question bank with caching, then shuffle fresh every time
  const loadBank = useCallback(async (bankEntry, filterTopic = null, filterDifficulty = null) => {
    const cacheKey = `${bankEntry.id}`; // cache raw bank only, not filtered
    if (!questionBankCache[cacheKey]) {
      const mod = await bankEntry.loader(null, null); // load full bank unfiltered
      questionBankCache[cacheKey] = mod.default;
    }
    // Always return a fresh shuffle of the full bank — filtering happens downstream
    return shuffleArray(questionBankCache[cacheKey]);
  }, []);

  const loadActivePool = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      console.log("loadActivePool starting. Category:", category, "Difficulty:", difficulty, "Topic:", topic);
      let pool = [];

      if (category === 'all' || category === 'bookmarked') {
        // For 'all'/'bookmarked': load ONE random bank first for instant display,
        // then load remaining banks in background
        const enabledBanks = QuestionBankRegistry.filter(b => b.enabled);
        const randomBank = enabledBanks[Math.floor(Math.random() * enabledBanks.length)];
        
        // Load first bank fast
        const firstPool = await loadBank(randomBank, topic, difficulty);
        pool = [...firstPool];
        
        // Load remaining banks in parallel
        const remainingBanks = enabledBanks.filter(b => b.id !== randomBank.id);
        const remainingPools = await Promise.all(
          remainingBanks.map(b => loadBank(b, topic, difficulty))
        );
        remainingPools.forEach(p => { pool = pool.concat(p); });
      } else {
        // Single category: use registry lookup
        const bankEntry = QuestionBankRegistry.find(
          b => b.categoryKey === category || b.label === category
        );
        if (bankEntry) {
          pool = await loadBank(bankEntry, topic, difficulty);
        }
      }

      setDebugPoolLength(pool ? pool.length : -1);
      console.log("Pool loaded. Size:", pool.length);

      // Dynamically extract unique topics for selection
      const uniqueTopics = ['all', ...new Set(pool.map(q => q.topic).filter(Boolean))].sort();
      setAvailableTopics(uniqueTopics);

      // Fetch quarantined list with a short timeout to not block UI
      const qList = new Set();
      try {
        const qSnap = await Promise.race([
          getDocs(collection(db, 'quarantined_questions')),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 1500))
        ]);
        qSnap.forEach(d => qList.add(d.id.toString()));
      } catch (e) {
        console.warn("Quarantine list unavailable, skipping:", e.message);
      }

      let filtered = qList.size > 0 
        ? pool.filter(q => !qList.has(q.id.toString()))
        : pool;
        
      // Ensure we only load questions that have options (MCQs) since OAPractice doesn't have NAT/MSQ input UI yet
      filtered = filtered.filter(q => q.type === 'MCQ' || (q.options && q.options.length > 0 && q.type !== 'NAT'));
      
      console.log("After quarantine filter:", filtered.length);

      if (category === 'bookmarked') {
        filtered = filtered.filter(q => scoreData?.bookmarked?.includes(q.id));
      }
      if (difficulty !== 'all') {
        filtered = filtered.filter(q => q.difficulty === difficulty);
      }
      if (topic !== 'all') {
        filtered = filtered.filter(q => q.topic === topic);
      }

      setDebugFilteredLength(filtered ? filtered.length : -1);
      console.log("After filter: category:", category, "diff:", difficulty, "topic:", topic, "count:", filtered.length);

      if (isAdaptive) {
        const userHistoryProxy = {};
        Object.keys(spacedRepetition).forEach(id => {
          userHistoryProxy[id] = { totalAttempts: 1, correctCount: spacedRepetition[id].lastResult === 'correct' ? 1 : 0 };
        });
        Object.keys(mistakes).forEach(id => {
          if (!userHistoryProxy[id]) {
            userHistoryProxy[id] = { totalAttempts: 1, correctCount: 0 };
          }
        });

        const adaptiveResult = selectNextQuestions(
          filtered,
          masteryScores,
          userHistoryProxy,
          mistakes,
          20
        );
        setQuizQuestions(adaptiveResult.questions);
        setSelectionReasons(adaptiveResult.reasons);
      } else {
        const shuffled = shuffleArray(filtered).slice(0, 50);
        setQuizQuestions(shuffled);
        setSelectionReasons({});
      }

      setCurrentIdx(0);
      setSelectedOptions({});
      setSubmittedQuestions({});
      setTimeLeft(60);
      setIsTimerRunning(true);
    } catch (e) {
      console.error("Error loading question datasets:", e);
      setLoadError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSessionActive) return;
    if (prevCategoryRef.current !== category) {
      prevCategoryRef.current = category;
      if (topic === 'all') {
        loadActivePool();
      } else {
        setTopic('all');
      }
      return;
    }
    loadActivePool();
  }, [category, difficulty, topic, isAdaptive, isSessionActive]);

  const regenerateQuiz = () => {
    loadActivePool();
  };

  useEffect(() => {
    if (quizQuestions.length === 0) return;
    // We can also infer correct/incorrect statuses locally from spacedRepetition/mistakes 
    // to avoid extra getQuestionsProgress calls if desired, but let's keep getQuestionsProgress fallback
    const progress = {};
    quizQuestions.forEach(q => {
      if (mistakes[q.id.toString()] && !mistakes[q.id.toString()].isResolved) {
        progress[q.id] = 'incorrect';
      } else if (spacedRepetition[q.id.toString()] && spacedRepetition[q.id.toString()].lastResult === 'correct') {
        progress[q.id] = 'correct';
      }
    });
    setProgressMap(progress);
  }, [quizQuestions, mistakes, spacedRepetition]);

  const question = quizQuestions[currentIdx];
  const isBookmarked = question && scoreData?.bookmarked?.includes(question.id);
  
  const selected = question ? (selectedOptions[question.id] ?? null) : null;
  const submitted = question ? (!!submittedQuestions[question.id]) : false;

  useEffect(() => {
    if (question) {
      setCurrentTimeline([{ action: 'open', time: 0 }]);
    }
  }, [question]);

  const handleSelectOption = (qId, optionIdx) => {
    if (submitted) return;
    setSelectedOptions(prev => ({ ...prev, [qId]: optionIdx }));
    const secondsElapsed = Math.max(0, 60 - timeLeft);
    setCurrentTimeline(prev => [
      ...prev,
      { action: 'select', optionIndex: optionIdx, time: secondsElapsed }
    ]);
  };

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

  const handleTimeUp = async () => {
    if (!question) return;
    setSubmittedQuestions(prev => ({ ...prev, [question.id]: true }));
    setIsTimerRunning(false);
    const finalTimeline = [
      ...currentTimeline,
      { action: 'submit', time: 60 }
    ];
    
    setRecentSolveTimes(prev => {
      const newArr = [...prev, 60000];
      if (newArr.length > 5) newArr.shift();
      return newArr;
    });

    const res = await recordDetailedAnswer(question, false, 60000, 'guess', finalTimeline);
    if (res) {
      setXpFeedback({
        xp: res.xpEarned,
        streak: res.newStreak,
        isCorrect: false
      });
      setTimeout(() => setXpFeedback(null), 3500);
    }
    setProgressMap(prev => ({ ...prev, [question.id]: 'incorrect' }));
  };

  const handleSubmit = async () => {
    if (!question) return;
    const sel = selectedOptions[question.id];
    if (sel === undefined || sel === null) return;
    setSubmittedQuestions(prev => ({ ...prev, [question.id]: true }));
    setIsTimerRunning(false);
    const isCorrect = sel === question.correct;
    const solveTimeMs = (60 - timeLeft) * 1000;
    const confidence = confidences[question.id] || null;
    const finalTimeline = [
      ...currentTimeline,
      { action: 'submit', time: Math.max(0, 60 - timeLeft) }
    ];
    
    setRecentSolveTimes(prev => {
      const newArr = [...prev, solveTimeMs];
      if (newArr.length > 5) newArr.shift();
      return newArr;
    });

    if (confidence === 'Sure' && !isCorrect) {
      setSessionSureWrong(prev => prev + 1);
    }

    const res = await recordDetailedAnswer(question, isCorrect, solveTimeMs, confidence, finalTimeline);
    if (res) {
      setXpFeedback({
        xp: res.xpEarned,
        streak: res.newStreak,
        isCorrect: res.isCorrect
      });
      setTimeout(() => setXpFeedback(null), 3500);
    }
    setProgressMap(prev => ({ ...prev, [question.id]: isCorrect ? 'correct' : 'incorrect' }));
  };

  const handleNext = () => {
    setCurrentIdx((i) => Math.min(i + 1, quizQuestions.length - 1));
    setTimeLeft(60);
    setIsTimerRunning(true);
  };

  const handleReset = () => {
    setIsAdaptive(false);
    setDifficulty('all');
    setSearchParams({});
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loadError) {
    return (
      <div className="page-content oa-practice">
        <div className="empty-state">
          <p style={{ color: 'var(--danger)', fontWeight: 'bold' }}>Error Loading Questions</p>
          <p>{loadError}</p>
          <button className="btn btn-ghost" onClick={handleReset}><RotateCcw size={16} /> Reset Filters</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-content oa-practice">
        <div className="loading-skeleton-container">
          <div className="loading-skeleton-header">
            <div className="skeleton-pulse skeleton-title"></div>
            <div className="skeleton-pulse skeleton-subtitle"></div>
          </div>
          <div className="loading-skeleton-progress">
            <div className="skeleton-pulse skeleton-progress-bar"></div>
          </div>
          <div className="loading-skeleton-card card">
            <div className="skeleton-badges">
              <div className="skeleton-pulse skeleton-badge"></div>
              <div className="skeleton-pulse skeleton-badge"></div>
              <div className="skeleton-pulse skeleton-badge-timer"></div>
            </div>
            <div className="skeleton-pulse skeleton-question-line long"></div>
            <div className="skeleton-pulse skeleton-question-line medium"></div>
            <div className="skeleton-options">
              <div className="skeleton-pulse skeleton-option"></div>
              <div className="skeleton-pulse skeleton-option"></div>
              <div className="skeleton-pulse skeleton-option"></div>
              <div className="skeleton-pulse skeleton-option"></div>
            </div>
            <div className="skeleton-actions">
              <div className="skeleton-pulse skeleton-btn"></div>
            </div>
          </div>
          <p className="loading-status-text">
            <span className="loading-dot-animation"></span>
            Preparing your questions
          </p>
        </div>
      </div>
    );
  }
  if (!question) {
    return (
      <div className="page-content oa-practice">
        <div className="empty-state">
          <p>No questions found for this filter. Try a different category or difficulty.</p>
          <div style={{ padding: '1rem', background: '#222', color: '#0f0', fontFamily: 'monospace', textAlign: 'left', marginTop: '1rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '12px' }}>
            DEBUG INFO:
            {`\nCategory: "${category}"`}
            {`\nDifficulty: "${difficulty}"`}
            {`\nTopic: "${topic}"`}
            {`\nPoolLength: ${debugPoolLength}`}
            {`\nFilteredLength: ${debugFilteredLength}`}
            {`\nQuizLength: ${quizQuestions.length}`}
            {`\nLoadError: ${loadError}`}
            {`\nURL Search: ${window.location.search}`}
          </div>
          <button className="btn btn-ghost" onClick={handleReset}><RotateCcw size={16} /> Reset Filters</button>
        </div>
      </div>
    );
  }

  if (!isSessionActive) {
    const handleStartIntent = (intentName, customTopic = null) => {
      localStorage.setItem('current_test_config', JSON.stringify({
        mode: 'adaptive',
        intent: intentName,
        targetConcept: customTopic,
        category: 'Mechanical Engineering', // default fallback
        duration: 18,
        count: 12
      }));
      navigate('/tests/session-briefing');
    };

    const handleCategoryClick = (catName) => {
      setSearchParams({ cat: catName });
    };

    const categoryCards = [
      { cat: 'Mechanical Engineering', emoji: '🔩', title: 'Mechanical Engg', desc: 'Thermo, Fluids, SOM, Manufacturing, Machine Design & more', count: '9,400+', gradient: 'linear-gradient(135deg, rgba(255,107,0,0.15), rgba(255,107,0,0.03))' },
      { cat: 'Quantitative Aptitude', emoji: '🧮', title: 'Quantitative Aptitude', desc: 'Percentages, Profit & Loss, Time & Work, Algebra, Geometry', count: '3,400+', gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.03))' },
      { cat: 'Data Interpretation', emoji: '📊', title: 'Data Interpretation', desc: 'Tables, Bar, Pie, Line charts — read data, spot trends', count: '1,500+', gradient: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.03))' },
      { cat: 'DILR', emoji: '🧩', title: 'DILR Puzzles', desc: 'Seating arrangements, constraint satisfaction, ordering', count: '2,000+', gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.03))' },
      { cat: 'Logical Reasoning', emoji: '🧠', title: 'Logical Reasoning', desc: 'Series, coding-decoding, direction sense, syllogisms', count: '3,000+', gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.03))' },
    ];

    const intentCards = [
      { intent: 'OPTIMAL', icon: <Zap size={20} />, title: 'Continue my path', desc: 'Adaptive traversal through optimal syllabus route', color: 'var(--accent)' },
      { intent: 'WEAKNESS_REPAIR', icon: <Target size={20} />, title: 'Repair weaknesses', desc: 'Target and patch performance loops and prerequisites', color: 'var(--danger)' },
      { intent: 'STRETCH', icon: <TrendingUp size={20} />, title: 'Challenge me', desc: 'Push beyond your estimated ability boundary', color: 'var(--secondary)' },
      { intent: 'DECAY_RECOVERY', icon: <RefreshCw size={20} />, title: 'Recover forgotten', desc: 'Reinforce items identified with high decay risk', color: 'var(--warning)' },
      { intent: 'MISTAKE_REPAIR', icon: <AlertTriangle size={20} />, title: 'Fix my mistakes', desc: 'Train specifically on active mistakes notebook', color: 'var(--tertiary)' },
    ];

    return (
      <div className="page-content practice-page practice-hub">
        <header className="hub-header">
          <div className="hub-header-content">
            <h1 className="hub-title">
              <span className="hub-title-icon">🎯</span>
              Practice Hub
            </h1>
            <p className="hub-subtitle">
              Choose your learning route: launch targeted adaptive sessions or browse the full question bank.
            </p>
          </div>
          <div className="hub-stats">
            <div className="hub-stat">
              <span className="hub-stat-value">19,300+</span>
              <span className="hub-stat-label">Questions</span>
            </div>
            <div className="hub-stat">
              <span className="hub-stat-value">5</span>
              <span className="hub-stat-label">Categories</span>
            </div>
          </div>
        </header>

        {/* ADAPTIVE PRACTICE SECTION */}
        <section className="hub-section">
          <div className="hub-section-header">
            <Brain size={20} className="hub-section-icon" />
            <h2>Adaptive Practice Intents</h2>
          </div>
          <div className="intents-grid">
            {intentCards.map(({ intent, icon, title, desc, color }) => (
              <button key={intent} className="intent-card-v2" onClick={() => handleStartIntent(intent)}>
                <div className="intent-icon-wrap" style={{ '--intent-color': color }}>
                  {icon}
                </div>
                <div className="intent-card-body">
                  <strong>{title}</strong>
                  <span>{desc}</span>
                </div>
                <ChevronRight size={16} className="intent-chevron" />
              </button>
            ))}
          </div>
        </section>

        {/* BROWSE QUESTION BANK SECTION */}
        <section className="hub-section">
          <div className="hub-section-header">
            <BookOpen size={20} className="hub-section-icon" />
            <h2>Browse Question Bank</h2>
          </div>
          <div className="category-grid">
            {categoryCards.map(({ cat, emoji, title, desc, count, gradient }) => (
              <div
                key={cat}
                className="category-card"
                onClick={() => handleCategoryClick(cat)}
                style={{ '--card-gradient': gradient }}
              >
                <div className="category-card-top">
                  <span className="category-emoji">{emoji}</span>
                  <span className="category-count">{count}</span>
                </div>
                <h3 className="category-title">{title}</h3>
                <p className="category-desc">{desc}</p>
                <div className="category-card-action">
                  <span>Start practicing</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  const progress = quizQuestions.length > 0 ? ((currentIdx + 1) / quizQuestions.length) * 100 : 0;

  return (
    <div className="page-content practice-page">
      {xpFeedback && (
        <div className={`floating-xp-toast ${xpFeedback.isCorrect ? 'correct' : 'incorrect'}`}>
          <div className="xp-toast-content">
            <Sparkles size={18} className="xp-toast-icon" />
            <div className="xp-toast-details">
              <strong>+{xpFeedback.xp} XP</strong>
              <span>{xpFeedback.isCorrect ? 'Correct Answer!' : 'Participation XP'}</span>
            </div>
            {xpFeedback.streak > 1 && (
              <div className="xp-toast-streak">
                <Flame size={16} fill="var(--warning)" />
                <span>{xpFeedback.streak}🔥</span>
              </div>
            )}
          </div>
        </div>
      )}
      <header className="practice-header">
        <div>
          <h1>Practice Mode 🎯</h1>
          <p className="practice-subtitle">
            {quizQuestions.length} questions in this quiz {isAdaptive && '(Adaptive Mode)'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className={`toggle-adaptive-btn ${isAdaptive ? 'active' : ''}`}
            onClick={() => setIsAdaptive(!isAdaptive)}
            title="Toggle Adaptive Practice Engine"
          >
            <Brain size={16} /> Adaptive Practice
          </button>
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

      {isAdaptive && (
        <div className="adaptive-mode-banner">
          <div className="adaptive-banner-header">
            <Brain size={20} className="secondary" style={{ color: 'var(--secondary)' }} />
            <span className="adaptive-banner-title">Adaptive Practice Active</span>
          </div>
          <p className="adaptive-banner-desc">
            The platform has scanned your past attempts and generated 20 questions targeted specifically at your weakness areas and mistake patterns.
          </p>
          {getAdaptiveSummary(masteryScores).length > 0 && (
            <div className="adaptive-focus-areas">
              <span className="adaptive-focus-title">Focus areas today:</span>
              {getAdaptiveSummary(masteryScores).map((area, idx) => (
                <span key={idx} className="adaptive-focus-pill">
                  {area.topic} ({Math.round(area.score * 100)}%)
                </span>
              ))}
            </div>
          )}
        </div>
      )}

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
          <div className="filter-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">📁 Topic / Section</label>
            <div className="filter-pills" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {availableTopics.map((t) => (
                <button
                  key={t}
                  className={`pill ${topic === t ? 'active' : ''}`}
                  onClick={() => setTopic(t)}
                  style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                >
                  {t === 'all' ? '🌐 All Topics' : t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-skeleton-container">
          <div className="loading-skeleton-card card">
            <div className="skeleton-badges">
              <div className="skeleton-pulse skeleton-badge"></div>
              <div className="skeleton-pulse skeleton-badge"></div>
            </div>
            <div className="skeleton-pulse skeleton-question-line long"></div>
            <div className="skeleton-pulse skeleton-question-line medium"></div>
            <div className="skeleton-options">
              <div className="skeleton-pulse skeleton-option"></div>
              <div className="skeleton-pulse skeleton-option"></div>
              <div className="skeleton-pulse skeleton-option"></div>
              <div className="skeleton-pulse skeleton-option"></div>
            </div>
          </div>
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
                    {isAdaptive && selectionReasons[q.id] && (
                      <span className="reason-badge">
                        <Brain size={12} /> {selectionReasons[q.id]}
                      </span>
                    )}
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
                        onClick={() => handleSelectOption(q.id, optIdx)}
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
                      onClick={async () => {
                        if (selected === null) return;
                        setSubmittedQuestions(prev => ({ ...prev, [q.id]: true }));
                        const res = await recordDetailedAnswer(q, selected === q.correct, 0, null);
                        if (res) {
                          setXpFeedback({
                            xp: res.xpEarned,
                            streak: res.newStreak,
                            isCorrect: res.isCorrect
                          });
                          setTimeout(() => setXpFeedback(null), 3500);
                        }
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

          {sessionSureWrong >= 3 && !dismissSureWrong && (
            <div className="overconfidence-banner" style={{
              background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.05))',
              border: '1px solid var(--warning)',
              borderLeft: '4px solid var(--warning)',
              padding: '1rem',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem' }}>🧠</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Overconfidence pattern detected — you've been confident but wrong {sessionSureWrong} times this session</span>
              </div>
              <button onClick={() => setDismissSureWrong(true)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <XCircle size={18} />
              </button>
            </div>
          )}

          {/* Question Card */}
          <div className="question-card card">
            <div className="question-header-row">
              <div className="question-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge badge-accent">{question.topic}</span>
                <span className={`badge badge-${question.difficulty === 'Easy' ? 'success' : question.difficulty === 'Medium' ? 'warning' : 'danger'}`}>
                  {question.difficulty}
                </span>
                <QuestionIntelligenceBadge attempts={question.stats?.totalAttempts || 0} />
                {isAdaptive && selectionReasons[question.id] && (
                  <span className="reason-badge">
                    <Brain size={12} /> {selectionReasons[question.id]}
                  </span>
                )}
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

            {recentSolveTimes.length > 0 && (
              <div className="sparkline-container" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Recent Pace:</span>
                <svg viewBox="0 0 100 30" style={{ width: '80px', height: '24px', overflow: 'visible' }}>
                  <polyline 
                    fill="none" 
                    stroke="var(--accent)" 
                    strokeWidth="2" 
                    points={recentSolveTimes.map((time, i) => {
                      const x = (i / 4) * 100;
                      // map 0-60s to 30-0 y coords (lower time = higher point or lower point? let's make longer time = higher y)
                      const y = Math.min(30, Math.max(0, (time / 60000) * 30));
                      return `${x},${y}`;
                    }).join(' ')} 
                  />
                  {recentSolveTimes.map((time, i) => {
                    const x = (i / 4) * 100;
                    const y = Math.min(30, Math.max(0, (time / 60000) * 30));
                    return <circle key={i} cx={x} cy={y} r="3" fill="var(--accent)" />;
                  })}
                </svg>
              </div>
            )}

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
                    onClick={() => handleSelectOption(question.id, index)}
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

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {(() => {
                    const timeMs = (60 - timeLeft) * 1000;
                    if (timeMs < 8000) return <span className="badge" style={{ background: '#e17055', color: '#fff' }}>⚡ Too Fast</span>;
                    if (timeMs <= 40000) return <span className="badge" style={{ background: '#00b894', color: '#fff' }}>✅ Optimal</span>;
                    if (timeMs <= 55000) return <span className="badge" style={{ background: '#fdcb6e', color: '#000' }}>🟡 Slightly Slow</span>;
                    return <span className="badge" style={{ background: '#d63031', color: '#fff' }}>⏰ Time Pressure</span>;
                  })()}

                  {confidences[question.id] === 'Sure' && selected !== question.correct && (
                    <span className="badge" style={{ background: 'var(--warning)', color: '#000' }}>
                      ⚠️ Misconception signal — you were confident but incorrect
                    </span>
                  )}
                  {(confidences[question.id] === 'Guess' || confidences[question.id] === 'Unsure') && selected === question.correct && (
                    <span className="badge" style={{ background: 'var(--secondary)', color: '#fff' }}>
                      💡 Lucky guess — queued for spaced repetition review
                    </span>
                  )}
                </div>

                {question.explanation && (
                  <div className="explanation" style={{ display: 'none' }}>
                    <strong>Explanation:</strong>
                    <div dangerouslySetInnerHTML={{ __html: question.explanation }} />
                  </div>
                )}
                
                {/* AI Tutor Card (Phase 2) */}
                <div className="ai-tutor-card" style={{
                  background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginTop: '1.5rem',
                  textAlign: 'left'
                }}>
                  <div className="tutor-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', color: 'var(--primary)' }}>
                    <Brain size={20} />
                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>AI Tutor Analysis</h4>
                  </div>
                  
                  <div className="insight-grid" style={{ display: 'grid', gridTemplateColumns: selected === question.correct ? '1fr' : '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    {selected !== question.correct && (
                      <div className="insight-box danger" style={{ background: 'rgba(239, 68, 68, 0.05)', borderLeft: '3px solid var(--danger)', padding: '1rem', borderRadius: '0 8px 8px 0' }}>
                        <strong style={{ display: 'block', color: 'var(--danger)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Why your choice is incorrect</strong>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          {question.ai_wrong || `Option ${String.fromCharCode(65 + selected)} is a common misconception. You likely calculated the intermediate step but missed the final conversion.`}
                        </p>
                      </div>
                    )}
                    <div className="insight-box success" style={{ background: 'rgba(16, 185, 129, 0.05)', borderLeft: '3px solid var(--success)', padding: '1rem', borderRadius: '0 8px 8px 0' }}>
                      <strong style={{ display: 'block', color: 'var(--success)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Why Option {String.fromCharCode(65 + question.correct)} is correct</strong>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {question.ai_correct || (question.explanation !== 'Coming soon' ? question.explanation : `The correct application of the principle yields this result by balancing the fundamental equations.`)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="insight-row" style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    <div className="insight-item" style={{ flex: '1', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Formula Used</strong>
                      <code style={{ background: 'var(--bg-body)', padding: '0.25rem 0.5rem', borderRadius: '4px', color: 'var(--accent)', fontSize: '0.9rem' }}>
                        {question.formula || "Q = \u0394U + W"}
                      </code>
                    </div>
                    <div className="insight-item" style={{ flex: '1', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Exam Trick</strong>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--warning)' }}>
                        {question.trick || "Watch out for units of pressure. Always convert bar to MPa before computing."}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {!submitted && selected !== null && (
              <div className="confidence-tracking-section" style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: 'var(--bg-body)',
                border: '1px dashed var(--border)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                animation: 'fadeIn 0.2s ease',
                marginBottom: '1.5rem'
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>How confident are you?</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['sure', 'unsure', 'guess'].map(c => {
                    const isConfSelected = confidences[question.id] === c;
                    return (
                      <button
                        key={c}
                        className={`btn ${isConfSelected ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', textTransform: 'capitalize' }}
                        onClick={() => setConfidences(prev => ({ ...prev, [question.id]: c }))}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
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
