import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { useUserData } from '../contexts/UserDataContext';
import { compileLearnerState } from '../intelligence/learnerStateModel';
import { deriveInsights } from '../intelligence/learnerInsights/cognitiveInsightEngine';
import { getWeakestTopics } from '../utils/adaptiveEngine';
import { MOCK_TESTS } from '../data/mockSeriesConfig';

import { 
  Play, 
  TrendingUp, 
  Target, 
  Activity, 
  ArrowRight,
  Brain,
  Clock,
  Calendar,
  AlertTriangle,
  BookOpen,
  Sparkles,
  Award,
  Swords,
  Layers,
  Mic,
  ChevronLeft,
  ChevronRight,
  Compass,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';

import { QuestionBankRegistry } from '../data/questionBankRegistry';
import AIStudyCoach from '../components/AIStudyCoach';
import './Dashboard.css';

const DIGITAL_BOOKS = [
  {
    id: 'book1',
    title: 'Thermodynamics & Heat Transfer',
    subtitle: 'GATE & ESE MCQs',
    tag: 'CONCEPT BOOK',
    colorGradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    badgeText: 'FREE FORMULA SHEET'
  },
  {
    id: 'book2',
    title: 'Fluid Mechanics & Hydraulics',
    subtitle: 'MCQ Edition Vol 2',
    tag: 'SOLVED PAPERS',
    colorGradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
    badgeText: 'BESTSELLER'
  },
  {
    id: 'book3',
    title: 'Theory of Machines & Vibrations',
    subtitle: 'MCQ Edition Vol 1',
    tag: 'FORMULA BANK',
    colorGradient: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    badgeText: 'MUST PRACTICE'
  },
  {
    id: 'book4',
    title: 'GATE Top 1000 Numerical PYQs',
    subtitle: 'MCQs for GATE ME',
    tag: 'HIGH YIELD',
    colorGradient: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    badgeText: '2026 EDITION'
  },
  {
    id: 'book5',
    title: 'GATE 2027 RANK BOOSTER',
    subtitle: 'Advanced Numerical Problems',
    tag: 'RANK BOOSTER',
    colorGradient: 'linear-gradient(135deg, #991b1b 0%, #ef4444 100%)',
    badgeText: 'TARGET AIR < 100'
  },
  {
    id: 'book6',
    title: '99 Percentile Question Bank',
    subtitle: 'GATE & PSU Specials',
    tag: 'QUESTION BANK',
    colorGradient: 'linear-gradient(135deg, #172554 0%, #1e40af 100%)',
    badgeText: 'NEW 2026'
  }
];

const PYQ_BANKS = [
  { id: 'gate_main', name: 'GATE ME (Core)', badge: '2026 QS ADDED', category: 'Mechanical Engineering', icon: '⚙️' },
  { id: 'nta_abhyas', name: 'GATE NTA Abhyas', badge: 'VERIFIED', isCheck: true, category: 'Mechanical Engineering', icon: '✅' },
  { id: 'isro', name: 'ISRO & BARC GA', badge: 'SPACE EXAMS', category: 'General Aptitude', route: '/aptitude', icon: '🚀' },
  { id: 'psu_state', name: 'State PSUs / ESE', badge: '2026 QS ADDED', category: 'Mechanical Engineering', icon: '🏛️' },
  { id: 'ese_prelims', name: 'ESE Prelims', badge: 'OBJECTIVE', category: 'Mechanical Engineering', icon: '📜' },
  { id: 'drdo', name: 'DRDO RAC', badge: 'DEFENCE', category: 'Mechanical Engineering', icon: '🛡️' },
  { id: 'gate_adv', name: 'GATE AIR 1-100', badge: '2026 QS ADDED', category: 'Mechanical Engineering', icon: '🔥' },
  { id: 'aptitude', name: 'General Aptitude Suite', badge: '400+ QS', category: 'General Aptitude', route: '/aptitude', icon: '🧮' }
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { masteryScores, spacedRepetition, mistakes, questionProgress, testHistory, scoreData } = useUserData();
  const firstName = user?.displayName?.split(' ')[0] || 'harshit';

  const [loadingPools, setLoadingPools] = useState(true);
  const [allQuestions, setAllQuestions] = useState([]);
  const [carouselIdx, setCarouselIdx] = useState(0);

  useEffect(() => {
    setLoadingPools(false);
  }, []);

  const [resolvedMetadata, setResolvedMetadata] = useState({});

  useEffect(() => {
    if (!questionProgress) return;
    const idsToFetch = Object.keys(questionProgress).filter(id => {
      const prog = questionProgress[id];
      return !prog.topic || prog.topic === 'General' || !prog.category || prog.category === 'General';
    });

    if (idsToFetch.length === 0) return;

    async function fetchMetadata() {
      const metadata = {};
      try {
        const chunkSize = 30;
        for (let i = 0; i < idsToFetch.length; i += chunkSize) {
          const chunk = idsToFetch.slice(i, i + chunkSize);
          const qSnap = await getDocs(query(
            collection(db, 'questions'),
            where('id', 'in', chunk.map(id => parseInt(id) || id))
          ));
          qSnap.forEach(docSnap => {
            const data = docSnap.data();
            if (data && data.id) {
              metadata[data.id.toString()] = {
                topic: data.topic,
                category: data.category
              };
            }
          });
        }
        setResolvedMetadata(prev => ({ ...prev, ...metadata }));
      } catch (err) {
        console.error("Error fetching question metadata:", err);
      }
    }

    fetchMetadata();
  }, [questionProgress]);

  // Dynamic Daily Goal target from localStorage or scaled based on actual progress
  const [userTargetGoal, setUserTargetGoal] = useState(() => parseInt(localStorage.getItem('mahi_daily_target') || '15'));
  const [showGoalModal, setShowGoalModal] = useState(false);

  // Daily goal questions count solved today
  const questionsSolvedToday = Object.values(questionProgress || {}).filter(prog => {
    if (!prog.updatedAt) return false;
    const date = new Date(prog.updatedAt);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }).length;

  // Dynamically scale target goal if user surpasses initial target
  let targetDailyGoal = userTargetGoal;
  if (questionsSolvedToday > targetDailyGoal) {
    if (questionsSolvedToday <= 30) targetDailyGoal = 30;
    else if (questionsSolvedToday <= 50) targetDailyGoal = 50;
    else targetDailyGoal = Math.ceil(questionsSolvedToday / 25) * 25;
  }

  const goalPercent = Math.min(100, Math.round((questionsSolvedToday / targetDailyGoal) * 100));

  const step1Threshold = Math.max(1, Math.round(targetDailyGoal * 0.25));
  const step2Threshold = Math.max(2, Math.round(targetDailyGoal * 0.50));
  const step3Threshold = Math.max(3, Math.round(targetDailyGoal * 0.75));

  const setCustomGoal = (newGoal) => {
    setUserTargetGoal(newGoal);
    localStorage.setItem('mahi_daily_target', newGoal.toString());
    setShowGoalModal(false);
  };

  const handlePrevBanner = () => {
    setCarouselIdx(prev => (prev === 0 ? 1 : 0));
  };
  const handleNextBanner = () => {
    setCarouselIdx(prev => (prev === 1 ? 0 : 1));
  };

  return (
    <div className="dashboard-container">

      {/* TOP ROW: DAILY GOAL STEPPER CARD */}
      <div className="dashboard-daily-goal-card">
        <div className="goal-header-row">
          <div className="goal-title" onClick={() => navigate('/oa-practice')}>
            <span>Your Daily Goal</span>
            <strong className="goal-nums">({questionsSolvedToday}/{targetDailyGoal} Qs)</strong>
            <span className="goal-arrow">›</span>
          </div>

          <button 
            className="btn-edit-goal"
            onClick={(e) => {
              e.stopPropagation();
              setShowGoalModal(true);
            }}
          >
            ⚙️ Edit Target Goal
          </button>
        </div>

        {/* Milestone Stepper Track */}
        <div className="goal-stepper-track" onClick={() => navigate('/oa-practice')}>
          <div className="stepper-line">
            <div className="stepper-progress-fill" style={{ width: `${goalPercent}%` }} />
          </div>
          <div className={`stepper-node node-start ${questionsSolvedToday >= 0 ? 'reached' : ''}`} title="Start">
            <span className="node-icon">📈</span>
          </div>
          <div className={`stepper-node node-1 ${questionsSolvedToday >= step1Threshold ? 'reached' : ''}`} title={`${step1Threshold} Qs`}>
            <span className="node-icon">🚶</span>
          </div>
          <div className={`stepper-node node-2 ${questionsSolvedToday >= step2Threshold ? 'reached' : ''}`} title={`${step2Threshold} Qs`}>
            <span className="node-icon">🏃</span>
          </div>
          <div className={`stepper-node node-3 ${questionsSolvedToday >= step3Threshold ? 'reached' : ''}`} title={`${step3Threshold} Qs`}>
            <span className="node-icon">🏃‍♂️</span>
          </div>
          <div className={`stepper-node node-finish ${questionsSolvedToday >= targetDailyGoal ? 'reached' : ''}`} title={`${targetDailyGoal} Qs Goal`}>
            <span className="node-icon">🏁</span>
          </div>
        </div>
      </div>

      {/* DAILY GOAL MODAL */}
      {showGoalModal && (
        <div className="goal-modal-backdrop" onClick={() => setShowGoalModal(false)}>
          <div className="goal-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Set Your Target Daily Practice Goal</h3>
            <p>Pick a daily target questions goal to build long-term retention & speed:</p>

            <div className="goal-options-grid">
              {[
                { val: 5, label: '🎯 5 Qs / Day', sub: 'Light Warmup' },
                { val: 15, label: '🏃 15 Qs / Day', sub: 'Standard GATE Practice' },
                { val: 30, label: '⚡ 30 Qs / Day', sub: 'Intensive Practice' },
                { val: 50, label: '🔥 50 Qs / Day', sub: 'AIR < 100 Rank Mode' }
              ].map(opt => (
                <button
                  key={opt.val}
                  className={`goal-opt-btn ${userTargetGoal === opt.val ? 'active' : ''}`}
                  onClick={() => setCustomGoal(opt.val)}
                >
                  <strong>{opt.label}</strong>
                  <span>{opt.sub}</span>
                </button>
              ))}
            </div>

            <button className="btn-close-modal" onClick={() => setShowGoalModal(false)}>
              Close & Apply
            </button>
          </div>
        </div>
      )}

      {/* HERO PROMO CAROUSEL BANNER */}
      <div className="hero-banner-container">
        <button className="banner-nav-btn left" onClick={handlePrevBanner}>
          <ChevronLeft size={20} />
        </button>

        <div className="hero-banner-card">
          <div className="banner-badge-tags">
            <span>📖 Digital Books</span>
            <span>📝 Chapter & Full Tests</span>
            <span>🎥 Video Soln</span>
            <span>⚡ Must Do PYQs</span>
          </div>

          <h2 className="banner-main-title">
            MahiLLM <span className="highlight-no1">AI-Powered</span> GATE & Mechanical <span className="highlight-exam">Practice Suite</span>
          </h2>

          <button className="btn-unlock-premium" onClick={() => navigate('/pricing')}>
            Explore MahiLLM Pro Suite ›
          </button>

          {/* Carousel dots */}
          <div className="carousel-dots">
            <span className={`dot ${carouselIdx === 0 ? 'active' : ''}`} onClick={() => setCarouselIdx(0)} />
            <span className={`dot ${carouselIdx === 1 ? 'active' : ''}`} onClick={() => setCarouselIdx(1)} />
          </div>
        </div>

        <button className="banner-nav-btn right" onClick={handleNextBanner}>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* SECTION 1: DIGITAL BOOKS */}
      <div className="dashboard-section">
        <div className="section-header">
          <div>
            <h3 className="section-title">Most Imp Digital Books for GATE / Engineering</h3>
            <p className="section-subtitle">No need to buy bulky physical books. Get them all in one place!</p>
          </div>
          <button className="btn-view-all" onClick={() => navigate('/oa-practice')}>
            VIEW ALL
          </button>
        </div>

        <div className="books-horizontal-scroll">
          {DIGITAL_BOOKS.map((book) => (
            <div key={book.id} className="book-card-3d" onClick={() => navigate('/oa-practice')}>
              <div className="book-cover" style={{ background: book.colorGradient }}>
                <span className="book-top-badge">{book.tag}</span>
                <h4 className="book-title">{book.title}</h4>
                <p className="book-sub">{book.subtitle}</p>
                <div className="book-footer-badge">{book.badgeText}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: CHAPTER WISE PYQ BANK */}
      <div className="dashboard-section">
        <div className="section-header">
          <div>
            <h3 className="section-title">Chapter wise PYQ Bank</h3>
            <p className="section-subtitle">Targeted previous year questions grouped by subjects and exams</p>
          </div>
          <button className="btn-view-all" onClick={() => navigate('/oa-practice')}>
            VIEW ALL
          </button>
        </div>

        <div className="pyq-banks-grid">
          {PYQ_BANKS.map((bank) => (
            <div key={bank.id} className="pyq-bank-card" onClick={() => navigate(bank.route || `/oa-practice?cat=${encodeURIComponent(bank.category)}`)}>
              <div className="bank-card-content">
                <span className="bank-emoji">{bank.icon}</span>
                <span className="bank-name">{bank.name}</span>
              </div>
              <div className={`bank-badge ${bank.isCheck ? 'check-badge' : ''}`}>
                {bank.isCheck ? (
                  <>
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span>{bank.badge}</span>
                  </>
                ) : (
                  <span>{bank.badge}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: SPECIALIZED POWER MODULES */}
      <div className="dashboard-section">
        <div className="section-header">
          <div>
            <h3 className="section-title">Interactive AI Modules & Practice Arenas</h3>
            <p className="section-subtitle">Real-time speed duels, voice interviews, physics calculators & rank predictors</p>
          </div>
        </div>

        <div className="modules-grid-row">
          <div className="module-card duel-mod-card" onClick={() => navigate('/duel')}>
            <Swords size={32} className="text-indigo-400" />
            <div className="mod-info">
              <h4>1v1 Speed Duel Arena</h4>
              <p>Challenge peers live or practice against AI bots in real time</p>
            </div>
            <ArrowRight size={20} className="mod-arrow" />
          </div>

          <div className="module-card interview-mod-card" onClick={() => navigate('/mock-interview')}>
            <Mic size={32} className="text-emerald-400" />
            <div className="mod-info">
              <h4>Voice Coach Mock Interview</h4>
              <p>Practice technical & HR questions with voice evaluation</p>
            </div>
            <ArrowRight size={20} className="mod-arrow" />
          </div>

          <div className="module-card predictor-mod-card" onClick={() => navigate('/gate-predictor')}>
            <Compass size={32} className="text-amber-400" />
            <div className="mod-info">
              <h4>GATE Target Rank Predictor</h4>
              <p>Interactive What-If marks simulator & qualifying analysis</p>
            </div>
            <ArrowRight size={20} className="mod-arrow" />
          </div>

          <div className="module-card inspector-mod-card" onClick={() => navigate('/inspector')}>
            <Layers size={32} className="text-cyan-400" />
            <div className="mod-info">
              <h4>Component Physics Inspector</h4>
              <p>Simulate pumps, Otto engines, and Pelton turbine physics</p>
            </div>
            <ArrowRight size={20} className="mod-arrow" />
          </div>
        </div>
      </div>

      {/* AI STUDY COACH WIDGET */}
      <div className="dashboard-section">
        <AIStudyCoach />
      </div>

    </div>
  );
}
