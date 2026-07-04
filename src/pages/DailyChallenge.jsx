import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../contexts/UserDataContext';
import { useScore } from '../contexts/ScoreContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { 
  Award, 
  Clock, 
  Sparkles, 
  Play, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './DailyChallenge.css';

// ──────────────────────────────────────────────
// Seeded PRNG Helpers
// ──────────────────────────────────────────────

function getSeedForDate(dateStr) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function seedRandom(seed) {
  let m = 0x80000000; // 2**31
  let a = 1103515245;
  let c = 12345;
  let state = seed ? seed : Math.floor(Math.random() * (m - 1));

  return function() {
    state = (a * state + c) % m;
    return state / (m - 1);
  };
}

function seededShuffle(array, nextRandom) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

export default function DailyChallenge() {
  const { user } = useAuth();
  const { recordDetailedAnswer } = useUserData();
  const { recordAnswer } = useScore(); // compat
  const navigate = useNavigate();

  const [dateStr, setDateStr] = useState('');
  const [completedData, setCompletedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPools, setLoadingPools] = useState(false);
  const [activeSession, setActiveSession] = useState(false); // active test running

  // Test states
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [testTimeRemaining, setTestTimeRemaining] = useState(600); // 10 minutes (600s)
  const [testTimeSpent, setTestTimeSpent] = useState(0);

  // Time remaining until next challenge (midnight)
  const [timeUntilReset, setTimeUntilReset] = useState('');

  // 1. Initialize Date and check if completed
  useEffect(() => {
    // Generate date string in local timezone (YYYY-MM-DD)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    setDateStr(todayStr);

    // Calculate reset countdown timer
    const calculateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diffMs = tomorrow - now;
      
      const hrs = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      setTimeUntilReset(`${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    };

    calculateCountdown();
    const intervalId = setInterval(calculateCountdown, 1000);

    if (!user) {
      setLoading(false);
      return;
    }

    async function checkCompletionStatus() {
      try {
        const docRef = doc(db, 'users', user.uid, 'dailyChallenges', todayStr);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setCompletedData(snap.data());
        }
      } catch (e) {
        console.error("Error reading daily challenge completion status:", e);
      } finally {
        setLoading(false);
      }
    }

    checkCompletionStatus();

    return () => clearInterval(intervalId);
  }, [user]);

  // 2. Load and deterministically select daily questions
  const startChallenge = async () => {
    setLoadingPools(true);
    try {
      // Load all pool datasets in parallel
      const [me, qa, di, dilr, lr] = await Promise.all([
        import('../data/mechEngQuestions.js'),
        import('../data/quantsQuestions.js'),
        import('../data/dataInterpretationQuestions.js'),
        import('../data/dilrQuestions.js'),
        import('../data/logicalReasoningQuestions.js')
      ]);

      const pool = [...me.default, ...qa.default, ...di.default, ...dilr.default, ...lr.default];
      // Sort deterministically by id
      pool.sort((a, b) => a.id - b.id);

      // Seed pseudo-random generator based on date
      const seed = getSeedForDate(dateStr);
      const rng = seedRandom(seed);

      // Shuffle pool deterministically and pick top 10 questions
      const shuffled = seededShuffle(pool, rng);
      const challengeQs = shuffled.slice(0, 10);

      setQuestions(challengeQs);
      setActiveSession(true);
      setTestTimeRemaining(600); // 10 minutes
      setTestTimeSpent(0);
      setCurrentIdx(0);
      setSelectedOptions({});
      setSubmitted(false);
    } catch (e) {
      console.error("Error generating daily seeded challenge paper:", e);
    } finally {
      setLoadingPools(false);
    }
  };

  // 3. Test Timer Effect
  useEffect(() => {
    if (!activeSession || submitted) return;

    if (testTimeRemaining <= 0) {
      submitChallenge(true);
      return;
    }

    const timerId = setInterval(() => {
      setTestTimeRemaining(prev => prev - 1);
      setTestTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [activeSession, testTimeRemaining, submitted]);

  const submitChallenge = async (auto = false) => {
    if (submitted) return;
    setSubmitted(true);

    let correct = 0;
    let incorrect = 0;

    const report = questions.map(q => {
      const sel = selectedOptions[q.id];
      const isCorrect = sel === q.correct;
      if (isCorrect) correct++;
      else incorrect++;

      return {
        id: q.id,
        isCorrect,
        userAnswer: sel !== undefined ? sel : null
      };
    });

    const finalScore = correct; // 1 point per correct answer

    const payload = {
      date: dateStr,
      score: finalScore,
      correct,
      incorrect,
      timeSpentSeconds: testTimeSpent,
      completedAt: new Date().toISOString()
    };

    setCompletedData(payload);

    try {
      if (user) {
        // Save to daily challenges collection
        const docRef = doc(db, 'users', user.uid, 'dailyChallenges', dateStr);
        await setDoc(docRef, payload);

        // Award bonus XP (+50 XP for daily challenge completion)
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          xp: increment(50 + correct * 10) // 50 XP bonus + 10 XP per correct question
        });

        // Record detailed answers in adaptive context
        const avgTimeMs = Math.round((testTimeSpent / questions.length) * 1000);
        const promises = questions.map((q, idx) => {
          const item = report[idx];
          return recordDetailedAnswer(q, item.isCorrect, avgTimeMs, null);
        });
        await Promise.all(promises);
      }
    } catch (e) {
      console.error("Error saving daily challenge progress:", e);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      submitChallenge();
    }
  };

  const formatTimeRemaining = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="page-content daily-challenge-page">
        <div className="loading" style={{ textAlign: 'center', padding: '5rem 0' }}>
          <div className="spinner" style={{ border: '4px solid var(--border)', borderTop: '4px solid var(--accent)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
          <p>Connecting to daily challenge registers...</p>
        </div>
      </div>
    );
  }

  // A. Completed state view
  if (completedData && !activeSession) {
    return (
      <div className="page-content daily-challenge-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '65vh' }}>
        <div className="card daily-challenge-completed-card" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <Sparkles size={48} style={{ color: 'var(--accent)', marginBottom: '1.25rem' }} />
          <h2>Challenge Completed Today! 🏆</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Excellent work! You have finished today's seeded daily test. Refreshing or logging out will not unlock another attempt.
          </p>

          <div className="daily-xp-glow">+{50 + completedData.correct * 10} XP</div>

          <div className="revision-complete-details" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', padding: '1rem', background: 'var(--bg-body)', borderRadius: '8px', border: '1px solid var(--border)', margin: '1.5rem 0' }}>
            <div>
              <span className="revision-stat-num" style={{ color: 'var(--text-primary)' }}>{completedData.score} / 10</span>
              <span className="revision-stat-lbl">Score</span>
            </div>
            <div>
              <span className="revision-stat-num" style={{ color: 'var(--success)' }}>{completedData.correct}</span>
              <span className="revision-stat-lbl">Correct</span>
            </div>
            <div>
              <span className="revision-stat-num">{Math.round(completedData.timeSpentSeconds / 60)}m</span>
              <span className="revision-stat-lbl">Time</span>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>NEXT CHALLENGE UNLOCKS IN</span>
            <div className="daily-countdown-box" style={{ width: 'fit-content', margin: '0 auto' }}>
              {timeUntilReset}
            </div>
          </div>

          <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={() => navigate('/')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // B. Active test execution view
  if (activeSession) {
    const question = questions[currentIdx];
    const selected = selectedOptions[question?.id] ?? null;

    return (
      <div className="page-content daily-challenge-page">
        <header className="practice-header" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem' }}>Daily seeded Challenge ⚡</h1>
            <p className="practice-subtitle">Question {currentIdx + 1} of {questions.length}</p>
          </div>
          <div className={`timer-badge ${testTimeRemaining <= 30 ? 'danger' : ''}`} style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
            <Clock size={16} /> {formatTimeRemaining(testTimeRemaining)}
          </div>
        </header>

        {loadingPools || !question ? (
          <div className="card text-center" style={{ padding: '4rem 2rem' }}>
            <div className="spinner" style={{ border: '4px solid var(--border)', borderTop: '4px solid var(--accent)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
            <p>Seeding matching questions...</p>
          </div>
        ) : (
          <div className="question-card card">
            <div className="question-header-row" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <div className="question-meta">
                <span className="badge badge-accent">{question.category}</span>
                <span className="badge badge-secondary">{question.topic}</span>
              </div>
            </div>

            {question.contextHtml && (
              <div className="question-context card" style={{ marginBottom: '1.5rem', background: 'var(--bg-body)', padding: '1rem' }} dangerouslySetInnerHTML={{ __html: question.contextHtml }} />
            )}

            <h2 className="question-text" style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }} dangerouslySetInnerHTML={{ __html: question.question }} />

            <div className="options">
              {question.options.map((opt, optIdx) => {
                const isSelected = selected === optIdx;
                return (
                  <button
                    key={optIdx}
                    className={`option ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedOptions(prev => ({ ...prev, [question.id]: optIdx }))}
                  >
                    <span className="option-key">{String.fromCharCode(65 + optIdx)}</span>
                    <span className="option-value" dangerouslySetInnerHTML={{ __html: opt }} />
                  </button>
                );
              })}
            </div>

            <div className="question-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button 
                className="btn btn-primary"
                onClick={handleNext}
                disabled={selected === null}
              >
                {currentIdx < questions.length - 1 ? 'Save & Next' : 'Submit Challenge'} <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // C. Start lobby screen
  return (
    <div className="page-content daily-challenge-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '65vh' }}>
      <div className="daily-challenge-hero" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <Sparkles size={40} style={{ color: 'var(--accent)' }} />
        <h2 className="daily-challenge-title">The Daily Seeded Challenge</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '450px', margin: '0 auto' }}>
          Solve 10 questions in 10 minutes. The challenge paper is generated deterministically from today's date. Every user gets the same questions. You only get one attempt.
        </p>

        <div style={{ display: 'flex', gap: '1.5rem', margin: '1rem 0' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Format</span>
            <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>10 MCQ / NAT</span>
          </div>
          <div style={{ borderLeft: '1px solid var(--border)' }}></div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Time limit</span>
            <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>10 Minutes</span>
          </div>
          <div style={{ borderLeft: '1px solid var(--border)' }}></div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Rewards</span>
            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--success)' }}>+50 XP Bonus</span>
          </div>
        </div>

        {loadingPools ? (
          <button className="btn btn-primary" style={{ padding: '0.75rem 2rem' }} disabled>
            Initializing seeded paper...
          </button>
        ) : (
          <button className="btn btn-primary" style={{ padding: '0.75rem 2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }} onClick={startChallenge}>
            <Play size={16} fill="currentColor" /> Start Daily Challenge
          </button>
        )}

        <div style={{ marginTop: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>NEXT CHALLENGE UNLOCKS IN</span>
          <div className="daily-countdown-box" style={{ fontSize: '0.95rem', padding: '0.35rem 0.85rem' }}>
            {timeUntilReset}
          </div>
        </div>
      </div>
    </div>
  );
}
