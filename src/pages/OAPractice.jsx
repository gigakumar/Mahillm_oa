import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, ChevronRight, Filter, RotateCcw, Bookmark, BookOpen, Clock, Shuffle, List, Layers, Brain, Award, Sparkles, Flame, Zap, Target, RefreshCw, TrendingUp, AlertTriangle, ChevronDown, ChevronUp, Search, X } from 'lucide-react';

import QuestionIntelligenceBadge from '../components/QuestionIntelligenceBadge';
import { useScore } from '../contexts/ScoreContext';
import { useUserData } from '../contexts/UserDataContext';
import { selectNextQuestions, getAdaptiveSummary } from '../utils/adaptiveEngine';
import { QuestionBankRegistry, MECH_TOPIC_GROUPS } from '../data/questionBankRegistry';
import { formatMathHtml, shuffleQuestionOptions } from '../utils/mathUtils';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import AITutorWidget from '../components/AITutorWidget';
import './OAPractice.css';
import './AdaptivePractice.css';

// Cache is ONLY used for non-Mech categories or when topic='all'
// For Mech with a specific topic, we always fetch scoped from Firestore/JSON
const questionBankCache = {};


const CATEGORIES = [
  { key: 'all', label: 'All', emoji: '📚' },
  { key: 'Mechanical Engineering', label: 'Mech Engg', emoji: '🔩' },
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
  const { masteryScores, mistakes, spacedRepetition, recordDetailedAnswer, questionProgress } = useUserData();
  const [progressMap, setProgressMap] = useState({});
  
  // Mech subtopic picker state
  const [mechSubtopicMode, setMechSubtopicMode] = useState(false);
  const [xpFeedback, setXpFeedback] = useState(null);
  
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [category, setCategory] = useState(catParam || 'all');
  
  useEffect(() => {
    if (catParam) {
      setCategory(catParam);
      if (topicParam) setTopic(topicParam);
    } else {
      setCategory('all');
      setTopic('all');
    }
    setIsSessionActive(true);
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

  // Per-question shuffled options: { [qId]: { shuffledOpts: string[], shuffledCorrect: number, indexMap: number[] } }
  // indexMap[shuffledIndex] = originalIndex  so we can still compare with question.correct
  const [shuffledOptionsMap, setShuffledOptionsMap] = useState({});

  const [qType, setQType] = useState('all'); // 'all' | 'MCQ' | 'NAT'
  const [natAnswers, setNatAnswers] = useState({}); // { [qId]: string }
  const [topicSearchQuery, setTopicSearchQuery] = useState('');
  const [showAllTopicsExpanded, setShowAllTopicsExpanded] = useState(false);

  // Gemini AI state
  const selectedModel = 'gemini-3.1-flash-lite';
  const [aiAnalysis, setAiAnalysis] = useState({});

  const filteredAvailableTopics = useMemo(() => {
    if (!availableTopics) return ['all'];
    if (topicSearchQuery.trim()) {
      return availableTopics.filter(t => 
        t === 'all' || t.toLowerCase().includes(topicSearchQuery.toLowerCase())
      );
    }
    return showAllTopicsExpanded ? availableTopics : availableTopics.slice(0, 12);
  }, [availableTopics, topicSearchQuery, showAllTopicsExpanded]);

  // ─── Gemini Live Fetcher ──────────────────────────────────────────────────
  const fetchGeminiAnalysis = useCallback(async (q, selectedOriginalIdx, modelToUse = null, userNatVal = null) => {
    const qId = q.id;
    const model = modelToUse || selectedModel;
    setAiAnalysis(prev => ({ ...prev, [qId]: { loading: true, error: null } }));

    const isNat = q.type === 'NAT' || !q.options || q.options.length === 0;

    let prompt = '';
    if (isNat) {
      prompt = `You are an expert exam tutor for competitive engineering exams (GATE, PSU, UPSC-ESE).

Question (NAT - Numerical Answer Type): ${q.question.replace(/<[^>]*>/g, '')}
${userNatVal ? `Student Typed Numerical Answer: "${userNatVal}"` : ''}

Provide a detailed JSON object with EXACTLY these 4 fields:
{
  "whyCorrect": "Comprehensive step-by-step derivation & calculation of the correct numerical answer with units.",
  "whySelected": "${userNatVal ? `Detailed feedback evaluating the student's entered value "${userNatVal}". Explain whether it is correct or point out the exact calculation or unit error.` : 'null'}",
  "formula": "Primary formula(s) or equation(s) used to solve this NAT question.",
  "trick": "Detailed exam shortcut, rounding tip, or unit check specific to this question."
}

Respond ONLY with the JSON object, no markdown fences.`;
    } else {
      const correctOpt = q.options[q.correct];
      const selectedOpt = selectedOriginalIdx !== null && selectedOriginalIdx !== undefined
        ? q.options[selectedOriginalIdx]
        : null;
      const correctLetter = String.fromCharCode(65 + q.correct);
      const selectedLetter = selectedOriginalIdx !== null && selectedOriginalIdx !== undefined
        ? String.fromCharCode(65 + selectedOriginalIdx)
        : null;
      const isCorrect = selectedOriginalIdx === q.correct;

      prompt = `You are an expert exam tutor for competitive engineering exams (GATE, PSU, UPSC-ESE).

Question: ${q.question.replace(/<[^>]*>/g, '')}

Options:
${q.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o.replace(/<[^>]*>/g, '')}`).join('\n')}

Correct Answer: Option ${correctLetter}) ${correctOpt.replace(/<[^>]*>/g, '')}
${selectedOpt && !isCorrect ? `Student Selected (INCORRECT): Option ${selectedLetter}) ${selectedOpt.replace(/<[^>]*>/g, '')}` : ''}

Provide a detailed JSON object with EXACTLY these 4 fields:
{
  "whyCorrect": "Comprehensive, step-by-step explanation of WHY option ${correctLetter} is the correct answer, showing all relevant derivations, formulas, or fundamental principles clearly.",
  "whySelected": "${!isCorrect && selectedOpt ? `Detailed explanation of the specific misconception or mathematical error that leads students to pick option ${selectedLetter}. Point out exactly where the student went wrong.` : 'null'}",
  "formula": "Primary formula(s) or equation(s) used to solve this question (e.g. 'Δx = y − x, W = ∫ P dV'). Include step-by-step substitution if applicable.",
  "trick": "Detailed exam shortcut, rule of thumb, or memory tip specific to this question type."
}

Respond ONLY with the JSON object, no markdown fences.`;
    }

    const tryFetch = async (m) => {
      const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': GEMINI_KEY,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
          }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      let raw = parts.map(p => p.text || '').join('');
      raw = raw.replace(/```json\n?|```/g, '').trim();
      return JSON.parse(raw);
    };

    try {
      let parsed;
      try {
        parsed = await tryFetch(model);
      } catch (err) {
        // Fallback to gemini-3.1-flash-lite if requested model is busy/unsupported
        console.warn(`Model ${model} failed, falling back to gemini-3.1-flash-lite...`);
        parsed = await tryFetch('gemini-3.1-flash-lite');
      }

      setAiAnalysis(prev => ({
        ...prev,
        [qId]: {
          loading: false,
          whyCorrect: parsed.whyCorrect || '',
          whySelected: parsed.whySelected && parsed.whySelected !== 'null' ? parsed.whySelected : null,
          formula: parsed.formula || '',
          trick: parsed.trick || '',
          modelUsed: model,
        },
      }));
    } catch (err) {
      console.error('Gemini fetch error:', err);
      setAiAnalysis(prev => ({
        ...prev,
        [qId]: { loading: false, error: 'Could not fetch AI explanation. Check network/API key.' },
      }));
    }
  }, [selectedModel]);


  // Load a question bank - for Mech with a specific topic, load ONLY that topic (scoped)
  const loadBank = useCallback(async (bankEntry, filterTopic = null, filterDifficulty = null) => {
    const isMech = bankEntry.id === 'mechanical';
    // For Mech with a specific topic: always fetch scoped, never cache full 23K bank
    if (isMech && filterTopic && filterTopic !== 'all') {
      const mod = await bankEntry.loader(filterTopic, filterDifficulty);
      return shuffleArray(mod.default);
    }
    // For all other cases: use cache to avoid re-fetching full bank
    const cacheKey = `${bankEntry.id}`;
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

      // Use only core Mechanical subject groups instead of dynamic subtopics
      const uniqueTopics = ['all', ...MECH_TOPIC_GROUPS.map(g => g.group)].sort();
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
        
      // Filter by Question Type (MCQ vs NAT)
      if (qType === 'NAT') {
        filtered = filtered.filter(q => q.type === 'NAT' || !q.options || q.options.length === 0);
      } else if (qType === 'MCQ') {
        filtered = filtered.filter(q => q.type !== 'NAT' && q.options && q.options.length > 0);
      } else {
        // 'all': ensure valid question content (either has options or is NAT)
        filtered = filtered.filter(q => (q.options && q.options.length > 0) || q.type === 'NAT');
      }

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
        setQuizQuestions(adaptiveResult.questions.map(shuffleQuestionOptions));
        setSelectionReasons(adaptiveResult.reasons);
      } else {
        const shuffled = shuffleArray(filtered).slice(0, 50).map(shuffleQuestionOptions);
        setQuizQuestions(shuffled);
        setSelectionReasons({});
      }

      setCurrentIdx(0);
      setSelectedOptions({});
      setSubmittedQuestions({});
      setShuffledOptionsMap({});
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
  
  // selected / submitted track the SHUFFLED option index in this question's display
  const selected = question ? (selectedOptions[question.id] ?? null) : null;
  const submitted = question ? (!!submittedQuestions[question.id]) : false;

  // Compute stable shuffled options for current question on first access
  useEffect(() => {
    if (!question) return;
    if (shuffledOptionsMap[question.id]) return; // already computed
    // Build shuffled mapping: indexMap[newIdx] = originalIdx
    const n = question.options.length;
    const indexMap = shuffleArray([...Array(n).keys()]);
    const shuffledOpts = indexMap.map(i => question.options[i]);
    const shuffledCorrect = indexMap.indexOf(question.correct);
    setShuffledOptionsMap(prev => ({
      ...prev,
      [question.id]: { shuffledOpts, shuffledCorrect, indexMap },
    }));
  }, [question, shuffledOptionsMap]);

  // Current question's shuffled view (fallback to original while computing)
  // Pre-shuffled display options and correct index are 100% aligned on question object
  const displayOptions = question ? question.options : [];
  const displayCorrect = question ? question.correct : 0;
  const selectedOriginalIdx = selected;

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
    const isNat = question.type === 'NAT' || !question.options || question.options.length === 0;
    const sel = isNat ? natAnswers[question.id] : selectedOptions[question.id]; // shuffled index or typed string
    if (sel === undefined || sel === null || sel === '') return;

    setSubmittedQuestions(prev => ({ ...prev, [question.id]: true }));
    setIsTimerRunning(false);

    const selOriginal = sel;
    const isCorrect = isNat ? true : sel === question.correct;
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

    // Trigger live Gemini fetch for this question (pass NAT input if NAT)
    fetchGeminiAnalysis(question, isNat ? null : selOriginal, selectedModel, isNat ? sel : null);
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
      if (catName === 'Mechanical Engineering') {
        // For Mech, toggle the subtopic picker instead of immediately loading all 23K questions
        setMechSubtopicMode(prev => !prev);
      } else {
        setSearchParams({ cat: catName });
      }
    };

    const handleMechTopicSelect = (topicName) => {
      setSearchParams({ cat: 'Mechanical Engineering', topic: topicName });
    };

    const handleMechAllTopics = () => {
      // Load all Mech — user explicitly wants this
      setSearchParams({ cat: 'Mechanical Engineering' });
    };

    // Dynamic progress derived from questionProgress context
    const totalAttempted = Object.keys(questionProgress || {}).length;
    const totalCorrect = Object.values(questionProgress || {}).filter(p => p.status === 'correct').length;
    const totalQuestionsInBank = QuestionBankRegistry.reduce((sum, b) => sum + (b.estimatedCount || 0), 0);

    // Per-category solved counts
    const categoryProgress = {};
    QuestionBankRegistry.forEach(bank => {
      // We track solved questions — match by checking spacedRepetition or questionProgress for this category
      // Since questionProgress doesn't store category, we approximate via mastery keys
      categoryProgress[bank.categoryKey] = 0;
    });
    // Count from masteryScores which are keyed by topic within a category
    // A more accurate pass: count from questionProgress where we cross-ref with bank topics
    // For simplicity, show total solved across all categories
    const sessionSolved = Object.values(progressMap).filter(v => v === 'correct').length;

    const categoryCards = [
      { cat: 'Mechanical Engineering', emoji: '🔩', title: 'Mechanical Engg', desc: 'Thermo, Fluids, SOM, Manufacturing, Machine Design & more', count: '23,400+', gradient: 'linear-gradient(135deg, rgba(255,107,0,0.15), rgba(255,107,0,0.03))', hasPicker: true },
      { cat: 'Quantitative Aptitude', emoji: '🧮', title: 'Quantitative Aptitude', desc: 'Percentages, Profit & Loss, Time & Work, Algebra, Geometry', count: '1,900+', gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.03))' },
      { cat: 'Data Interpretation', emoji: '📊', title: 'Data Interpretation', desc: 'Tables, Bar, Pie, Line charts — read data, spot trends', count: '730+', gradient: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.03))' },
      { cat: 'DILR', emoji: '🧩', title: 'DILR Puzzles', desc: 'Seating arrangements, constraint satisfaction, ordering', count: '14+', gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.03))' },
      { cat: 'Logical Reasoning', emoji: '🧠', title: 'Logical Reasoning', desc: 'Series, coding-decoding, direction sense, syllogisms', count: '59+', gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.03))' },
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
              <span className="hub-stat-value">{totalQuestionsInBank.toLocaleString()}+</span>
              <span className="hub-stat-label">Questions</span>
            </div>
            <div className="hub-stat">
              <span className="hub-stat-value hub-stat-value--solved">{totalCorrect.toLocaleString()}</span>
              <span className="hub-stat-label">Solved ✓</span>
            </div>
            <div className="hub-stat">
              <span className="hub-stat-value">{totalAttempted.toLocaleString()}</span>
              <span className="hub-stat-label">Attempted</span>
            </div>
            <div className="hub-stat">
              <span className="hub-stat-value">5</span>
              <span className="hub-stat-label">Categories</span>
            </div>
          </div>
        </header>

        {/* Progress bar showing overall completion */}
        {totalAttempted > 0 && (
          <div className="hub-overall-progress">
            <div className="hub-progress-label">
              <span>Overall Progress</span>
              <span className="hub-progress-pct">{totalAttempted.toLocaleString()} attempted · {totalCorrect.toLocaleString()} correct ({totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0}% accuracy)</span>
            </div>
            <div className="hub-progress-track">
              <div
                className="hub-progress-fill"
                style={{ width: `${Math.min(100, (totalAttempted / totalQuestionsInBank) * 100)}%` }}
              />
              <div
                className="hub-progress-fill hub-progress-fill--correct"
                style={{ width: `${Math.min(100, (totalCorrect / totalQuestionsInBank) * 100)}%` }}
              />
            </div>
          </div>
        )}

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
            {categoryCards.map(({ cat, emoji, title, desc, count, gradient, hasPicker }) => {
              const catAttempted = Object.values(questionProgress || {}).filter(p => p.category === cat).length;
              const catCorrect = Object.values(questionProgress || {}).filter(p => p.category === cat && p.status === 'correct').length;
              const isExpanded = hasPicker && mechSubtopicMode;
              return (
                <div key={cat} className={`category-card-wrapper${isExpanded ? ' expanded' : ''}`}>
                  <div
                    className={`category-card${isExpanded ? ' category-card--active' : ''}`}
                    onClick={() => handleCategoryClick(cat)}
                    style={{ '--card-gradient': gradient }}
                  >
                    <div className="category-card-top">
                      <span className="category-emoji">{emoji}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                        <span className="category-count">{count}</span>
                        {catAttempted > 0 && (
                          <span className="category-solved-badge">{catCorrect}/{catAttempted} solved</span>
                        )}
                      </div>
                    </div>
                    <h3 className="category-title">{title}</h3>
                    <p className="category-desc">{desc}</p>
                    {catAttempted > 0 && (
                      <div className="category-progress-mini">
                        <div
                          className="category-progress-mini-fill"
                          style={{ width: `${Math.min(100, (catCorrect / Math.max(catAttempted, 1)) * 100)}%` }}
                        />
                      </div>
                    )}
                    <div className="category-card-action">
                      <span>{hasPicker ? (isExpanded ? 'Choose a subtopic ↓' : 'Pick subtopic') : 'Start practicing'}</span>
                      {hasPicker ? <ChevronDown size={14} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} /> : <ChevronRight size={14} />}
                    </div>
                  </div>

                  {/* Inline Mech Subtopic Picker */}
                  {isExpanded && (
                    <div className="mech-subtopic-picker">
                      <div className="mech-subtopic-header">
                        <span>🔩 Select a Mechanical Engineering subtopic to practice</span>
                        <button className="mech-all-btn" onClick={handleMechAllTopics}>
                          <Shuffle size={14} /> All Topics (random 50)
                        </button>
                      </div>
                      <div className="mech-topic-groups">
                        {MECH_TOPIC_GROUPS.map(group => (
                          <div key={group.group} className="mech-topic-group">
                            <div
                              className="mech-group-header"
                              style={{ borderColor: group.color }}
                            >
                              <span className="mech-group-emoji">{group.emoji}</span>
                              <span className="mech-group-name">{group.group}</span>
                              <span className="mech-group-total">
                                {group.topics.reduce((s, t) => s + t.count, 0).toLocaleString()} Qs
                              </span>
                            </div>
                            <div className="mech-topic-pills">
                              {group.topics.map(t => {
                                const tAttempted = Object.values(questionProgress || {}).filter(p => p.topic === t.name).length;
                                const tCorrect = Object.values(questionProgress || {}).filter(p => p.topic === t.name && p.status === 'correct').length;
                                const accuracy = tAttempted > 0 ? Math.round((tCorrect / tAttempted) * 100) : null;
                                return (
                                  <button
                                    key={t.name}
                                    className="mech-topic-pill"
                                    onClick={() => handleMechTopicSelect(t.name)}
                                    style={{
                                      '--topic-color': group.color,
                                      '--accuracy-pct': accuracy !== null ? `${accuracy}%` : '0%'
                                    }}
                                  >
                                    <span className="mech-pill-name">{t.name}</span>
                                    <span className="mech-pill-count">{t.count.toLocaleString()}</span>
                                    {tAttempted > 0 && (
                                      <span className="mech-pill-progress" title={`${tCorrect}/${tAttempted} correct`}>
                                        {accuracy}%
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
        <div className="filters-panel">
          <div className="filter-panel-header">
            <div className="filter-title">
              <Filter size={18} />
              <span>Filter Questions</span>
            </div>
            <button className="btn-reset-filters" onClick={handleReset}>
              <RotateCcw size={14} /> Reset All
            </button>
          </div>

          <div className="filter-options-grid">
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
              <label className="form-label">Question Type</label>
              <div className="filter-pills">
                {[
                  { id: 'all', label: '🌐 All Types' },
                  { id: 'MCQ', label: '🔘 MCQ' },
                  { id: 'NAT', label: '🔢 NAT' },
                ].map((t) => (
                  <button
                    key={t.id}
                    className={`pill ${qType === t.id ? 'active' : ''}`}
                    onClick={() => setQType(t.id)}
                  >
                    {t.label}
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

          {/* TOPIC / SECTION SELECTION WITH SEARCH */}
          <div className="filter-group topic-filter-group">
            <div className="topic-group-header">
              <label className="form-label">📁 Topic / Section ({availableTopics.length})</label>
              
              <div className="topic-search-box">
                <Search size={15} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search topics (e.g. Thermodynamics, SOM...)"
                  value={topicSearchQuery}
                  onChange={(e) => setTopicSearchQuery(e.target.value)}
                  className="topic-search-input"
                />
                {topicSearchQuery && (
                  <button className="btn-clear-search" onClick={() => setTopicSearchQuery('')}>
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="topic-pills-wrapper">
              <button
                className={`pill topic-pill ${topic === 'all' ? 'active' : ''}`}
                onClick={() => setTopic('all')}
              >
                🌐 All Topics
              </button>

              {filteredAvailableTopics.filter(t => t !== 'all').map((t) => (
                <button
                  key={t}
                  className={`pill topic-pill ${topic === t ? 'active' : ''}`}
                  onClick={() => setTopic(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            {!topicSearchQuery && availableTopics.length > 12 && (
              <button
                className="btn-toggle-topics"
                onClick={() => setShowAllTopicsExpanded(!showAllTopicsExpanded)}
              >
                {showAllTopicsExpanded ? (
                  <>Show Fewer Topics <ChevronUp size={15} /></>
                ) : (
                  <>Show All {availableTopics.length} Topics <ChevronDown size={15} /></>
                )}
              </button>
            )}
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
                  <div className="question-context card" style={{ marginBottom: '1.5rem', background: 'var(--bg-body)', padding: '1rem' }} dangerouslySetInnerHTML={{ __html: formatMathHtml(q.contextHtml) }} />
                )}

                <h2 className="question-text" dangerouslySetInnerHTML={{ __html: formatMathHtml(q.question) }} />

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
                        <span className="option-value" dangerouslySetInnerHTML={{ __html: formatMathHtml(opt) }} />
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
                        <div dangerouslySetInnerHTML={{ __html: formatMathHtml(q.explanation) }} />
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
              <div className="question-context card" style={{ marginBottom: '1.5rem', background: 'var(--bg-body)', padding: '1rem' }} dangerouslySetInnerHTML={{ __html: formatMathHtml(question.contextHtml) }} />
            )}

            <h2 className="question-text" dangerouslySetInnerHTML={{ __html: formatMathHtml(question.question) }} />

            {/* Question Options OR NAT Input Component */}
            {(() => {
              const isNat = question.type === 'NAT' || !displayOptions || displayOptions.length === 0;

              if (isNat) {
                const userVal = natAnswers[question.id] || '';

                return (
                  <div className="nat-question-container" style={{
                    background: 'var(--bg-body)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginBottom: '1.5rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>
                      <span style={{ fontSize: '1.1rem' }}>🔢</span>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Numerical Answer Type (NAT)</h4>
                    </div>

                    <div style={{ maxWidth: '340px', margin: '0 auto' }}>
                      <input
                        type="text"
                        value={userVal}
                        onChange={(e) => {
                          if (!submitted) {
                            const val = e.target.value;
                            setNatAnswers(prev => ({ ...prev, [question.id]: val }));
                          }
                        }}
                        disabled={submitted}
                        placeholder="Type numerical answer..."
                        style={{
                          width: '100%',
                          padding: '0.8rem 1rem',
                          fontSize: '1.3rem',
                          fontFamily: 'monospace',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          background: 'var(--bg-card)',
                          color: 'var(--text-primary)',
                          border: '2px solid var(--primary)',
                          borderRadius: '8px',
                          outline: 'none',
                          marginBottom: '1rem'
                        }}
                      />

                      {!submitted && (
                        <div className="virtual-numpad" style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '0.5rem'
                        }}>
                          {['1','2','3','4','5','6','7','8','9','.','0','-','Clear','⌫'].map((k) => (
                            <button
                              key={k}
                              className="btn btn-ghost"
                              style={{
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                padding: '0.6rem',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid var(--border)',
                                gridColumn: k === 'Clear' ? 'span 2' : 'span 1'
                              }}
                              onClick={() => {
                                const cur = natAnswers[question.id] || '';
                                if (k === 'Clear') {
                                  setNatAnswers(prev => ({ ...prev, [question.id]: '' }));
                                } else if (k === '⌫') {
                                  setNatAnswers(prev => ({ ...prev, [question.id]: cur.slice(0, -1) }));
                                } else {
                                  setNatAnswers(prev => ({ ...prev, [question.id]: cur + k }));
                                }
                              }}
                            >
                              {k}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div className="options">
                  {displayOptions.map((opt, index) => {
                    let cls = '';
                    if (submitted) {
                      if (index === displayCorrect) cls = 'correct';
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
                        <span className="option-value" dangerouslySetInnerHTML={{ __html: formatMathHtml(opt) }} />
                        {submitted && index === displayCorrect && <CheckCircle size={18} className="option-icon success-icon" />}
                        {submitted && index === selected && index !== displayCorrect && <XCircle size={18} className="option-icon danger-icon" />}
                      </button>
                    );
                  })}
                </div>
              );
            })()}

            {/* Interactive AI Tutor & Hint Assistant */}
            <AITutorWidget 
              question={question} 
              userAnswer={selectedOriginalIdx !== undefined && displayOptions ? displayOptions[selectedOriginalIdx] : null} 
              questionId={question.id} 
            />

            {submitted && (
              <div className={`result-box ${selectedOriginalIdx === question.correct ? 'correct' : 'incorrect'}`}>
                <div className="result-header">
                  <h3>{selectedOriginalIdx === question.correct ? 'Correct! 🎉' : 'Incorrect'}</h3>
                  {selectedOriginalIdx === question.correct ? <span className="xp-gain">+10 XP</span> : null}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {(() => {
                    const timeMs = (60 - timeLeft) * 1000;
                    if (timeMs < 8000) return <span className="badge" style={{ background: '#e17055', color: '#fff' }}>⚡ Too Fast</span>;
                    if (timeMs <= 40000) return <span className="badge" style={{ background: '#00b894', color: '#fff' }}>✅ Optimal</span>;
                    if (timeMs <= 55000) return <span className="badge" style={{ background: '#fdcb6e', color: '#000' }}>🟡 Slightly Slow</span>;
                    return <span className="badge" style={{ background: '#d63031', color: '#fff' }}>⏰ Time Pressure</span>;
                  })()}

                  {confidences[question.id] === 'Sure' && selectedOriginalIdx !== question.correct && (
                    <span className="badge" style={{ background: 'var(--warning)', color: '#000' }}>
                      ⚠️ Misconception signal — you were confident but incorrect
                    </span>
                  )}
                  {(confidences[question.id] === 'Guess' || confidences[question.id] === 'Unsure') && selectedOriginalIdx === question.correct && (
                    <span className="badge" style={{ background: 'var(--secondary)', color: '#fff' }}>
                      💡 Lucky guess — queued for spaced repetition review
                    </span>
                  )}
                </div>

                {question.explanation && (
                  <div className="explanation" style={{ display: 'none' }}>
                    <strong>Explanation:</strong>
                    <div dangerouslySetInnerHTML={{ __html: formatMathHtml(question.explanation) }} />
                  </div>
                )}
                
                {/* AI Tutor Card — Live Gemini AI with Model Selector */}
                {(() => {
                  const ai = aiAnalysis[question.id];
                  const isWrong = selectedOriginalIdx !== question.correct;
                  const correctDisplayLetter = String.fromCharCode(65 + displayCorrect);
                  const selectedDisplayLetter = selected !== null ? String.fromCharCode(65 + selected) : null;

                  return (
                    <div className="ai-tutor-card" style={{
                      background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      marginTop: '1.5rem',
                      textAlign: 'left'
                    }}>
                      <div className="tutor-header" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', color: 'var(--primary)' }}>
                        <Brain size={20} />
                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>AI Tutor Analysis</h4>
                        {ai?.loading && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: '0.5rem' }}>
                            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', border: '2px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                            Generating…
                          </span>
                        )}
                      </div>

                      <div className="insight-grid" style={{ display: 'grid', gridTemplateColumns: isWrong ? '1fr 1fr' : '1fr', gap: '1rem', marginBottom: '1rem' }}>
                        {isWrong && (
                          <div className="insight-box danger" style={{ background: 'rgba(239, 68, 68, 0.05)', borderLeft: '3px solid var(--danger)', padding: '1rem', borderRadius: '0 8px 8px 0' }}>
                            <strong style={{ display: 'block', color: 'var(--danger)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                              Why Option {selectedDisplayLetter} is Incorrect
                            </strong>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                              {ai?.loading
                                ? <span style={{ opacity: 0.5 }}>Analyzing your specific mistake…</span>
                                : (ai?.whySelected || question.ai_wrong || `Option ${selectedDisplayLetter} is a common trap — double check your calculation steps.`)}
                            </p>
                          </div>
                        )}
                        <div className="insight-box success" style={{ background: 'rgba(16, 185, 129, 0.05)', borderLeft: '3px solid var(--success)', padding: '1rem', borderRadius: '0 8px 8px 0' }}>
                          <strong style={{ display: 'block', color: 'var(--success)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                            Why Option {correctDisplayLetter} is Correct
                          </strong>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            {ai?.loading
                              ? <span style={{ opacity: 0.5 }}>Generating detailed explanation…</span>
                              : (ai?.whyCorrect || question.ai_correct || (question.explanation && question.explanation !== 'Coming soon'
                                ? question.explanation
                                : `Option ${correctDisplayLetter} follows directly from the correct application of the relevant formula.`))}
                          </p>
                        </div>
                      </div>

                      <div className="insight-row" style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                        <div className="insight-item" style={{ flex: '1', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Formula Used</strong>
                          <code style={{ display: 'block', background: 'var(--bg-body)', padding: '0.25rem 0.5rem', borderRadius: '4px', color: 'var(--accent)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                            {ai?.loading ? '…' : (ai?.formula || question.formula || 'See explanation above')}
                          </code>
                          {question.equation && (
                            <>
                              <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Equation</strong>
                              <code style={{ display: 'block', background: 'var(--bg-body)', padding: '0.25rem 0.5rem', borderRadius: '4px', color: 'var(--success)', fontSize: '0.9rem' }}>
                                {question.equation}
                              </code>
                            </>
                          )}
                        </div>
                        <div className="insight-item" style={{ flex: '1', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Exam Trick</strong>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--warning)' }}>
                            {ai?.loading ? '…' : (ai?.trick || question.trick || 'Read all options carefully before selecting — common traps use similar numbers.')}
                          </p>
                        </div>
                      </div>

                      {ai?.error && (
                        <p style={{ margin: '0.75rem 0 0', fontSize: '0.8rem', color: 'var(--danger)', opacity: 0.8 }}>
                          ⚠️ {ai.error}
                        </p>
                      )}
                    </div>
                  );
                })()}

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
                <button
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={(() => {
                    const isNat = question.type === 'NAT' || !displayOptions || displayOptions.length === 0;
                    return isNat ? (!natAnswers[question.id] || natAnswers[question.id].trim() === '') : (selected === null);
                  })()}
                >
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
