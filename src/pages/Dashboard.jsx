import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../contexts/UserDataContext';
import TiltCard from '../components/TiltCard';

import { 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  Layers, 
  CheckCircle2, 
  Check,
  Cog, 
  Rocket, 
  Building2, 
  FileText, 
  Shield, 
  Flame, 
  BarChart2, 
  BookOpen, 
  Video, 
  Zap, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  Swords, 
  Mic, 
  Compass,
  Sliders
} from 'lucide-react';

import { useTheme } from '../contexts/ThemeContext';
import AIStudyCoach from '../components/AIStudyCoach';
import DashboardCountdown from '../components/DashboardCountdown';
import './Dashboard.css';

const DIGITAL_BOOKS = [
  {
    id: 'book_thermo_heat',
    title: 'Thermodynamics & Heat Transfer',
    subtitle: 'GATE & ESE Comprehensive Bank',
    tag: 'CORE SYLLABUS',
    colorGradient: 'linear-gradient(135deg, rgba(5, 150, 105, 0.25) 0%, rgba(16, 185, 129, 0.08) 100%)',
    badgeText: 'FREE FORMULA SHEET',
    route: '/formulas'
  },
  {
    id: 'book_fluids',
    title: 'Fluid Mechanics & Hydraulics',
    subtitle: 'Numerical & Objective Vol 2',
    tag: 'SOLVED PAPERS',
    colorGradient: 'linear-gradient(135deg, rgba(2, 132, 199, 0.25) 0%, rgba(56, 189, 248, 0.08) 100%)',
    badgeText: 'BESTSELLER',
    route: '/oa-practice?topic=Fluid Mechanics'
  },
  {
    id: 'book_tom_vib',
    title: 'Theory of Machines & Vibrations',
    subtitle: 'Theory & Solved Questions Vol 1',
    tag: 'FORMULA BANK',
    colorGradient: 'linear-gradient(135deg, rgba(124, 58, 237, 0.25) 0%, rgba(168, 85, 247, 0.08) 100%)',
    badgeText: 'MUST PRACTICE',
    route: '/formulas'
  },
  {
    id: 'book_high_yield_nat',
    title: 'GATE Top 1000 Numerical PYQs',
    subtitle: 'Step-by-step Detailed Solutions',
    tag: 'HIGH YIELD',
    colorGradient: 'linear-gradient(135deg, rgba(51, 65, 85, 0.4) 0%, rgba(30, 41, 59, 0.15) 100%)',
    badgeText: '2026 EDITION',
    route: '/oa-practice?cat=Mechanical Engineering'
  },
  {
    id: 'book_rank_booster',
    title: 'GATE ME Rank Booster Series',
    subtitle: 'Advanced NAT & MSQ Masterclass',
    tag: 'RANK BOOSTER',
    colorGradient: 'linear-gradient(135deg, rgba(220, 38, 38, 0.25) 0%, rgba(239, 68, 68, 0.08) 100%)',
    badgeText: 'TARGET AIR < 100',
    route: '/tests'
  },
  {
    id: 'book_99_percentile',
    title: '99th Percentile Question Bank',
    subtitle: 'GATE & PSU Specials for ME',
    tag: 'QUESTION BANK',
    colorGradient: 'linear-gradient(135deg, rgba(30, 58, 138, 0.3) 0%, rgba(37, 99, 235, 0.1) 100%)',
    badgeText: 'NEW 2026',
    route: '/syllabus'
  }
];

const PYQ_BANKS = [
  { id: 'gate_main', name: 'GATE ME (Core)', badge: '2026 QS ADDED', category: 'Mechanical Engineering', icon: Cog, emoji: '⚙️' },
  { id: 'nta_abhyas', name: 'GATE NTA Abhyas', badge: 'VERIFIED', isCheck: true, category: 'Mechanical Engineering', icon: CheckCircle2, emoji: '✅' },
  { id: 'isro', name: 'ISRO & BARC', badge: 'SPACE EXAMS', category: 'General Aptitude', icon: Rocket, emoji: '🚀' },
  { id: 'psu_state', name: 'State PSUs / ESE', badge: '2026 QS ADDED', category: 'Mechanical Engineering', icon: Building2, emoji: '🏛️' },
  { id: 'ese_prelims', name: 'ESE Prelims', badge: 'OBJECTIVE', category: 'Mechanical Engineering', icon: FileText, emoji: '📜' },
  { id: 'drdo', name: 'DRDO RAC', badge: 'DEFENCE', category: 'Mechanical Engineering', icon: Shield, emoji: '🛡️' },
  { id: 'gate_adv', name: 'GATE AIR 1-100', badge: '2026 QS ADDED', category: 'Mechanical Engineering', icon: Flame, emoji: '🔥' },
  { id: 'aptitude', name: 'Engineering Aptitude', badge: 'ALL EXAMS', category: 'General Aptitude', icon: BarChart2, emoji: '📊' }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { uiMode } = useTheme();
  const { masteryScores, mistakes, questionProgress } = useUserData();

  const [carouselIdx, setCarouselIdx] = useState(0);

  // Dynamic Daily Goal target from localStorage
  const [userTargetGoal, setUserTargetGoal] = useState(() => parseInt(localStorage.getItem('mahi_daily_target') || '15'));
  const [showGoalModal, setShowGoalModal] = useState(false);

  // Daily goal questions count solved today
  const questionsSolvedToday = Object.values(questionProgress || {}).filter(prog => {
    if (!prog.updatedAt) return false;
    const date = new Date(prog.updatedAt);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }).length;

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

  useEffect(() => {
    document.title = 'Dashboard — MahiLLM GATE Prep';
  }, []);

  const totalSolved = Object.keys(questionProgress || {}).length;
  const correctCount = Object.values(questionProgress || {}).filter(p => p.status === 'correct').length;
  const accuracyPct = totalSolved > 0 ? Math.round((correctCount / totalSolved) * 100) : 0;
  const unresolvedMistakes = Object.values(mistakes || {}).filter(m => !m.isResolved).length;
  const coveredTopics = Object.keys(masteryScores || {}).length;

  return (
    <div className="dashboard-container">
      {/* Live GATE 2026 Countdown & Daily Target Sprint Card */}
      <DashboardCountdown />

      {/* STATS ROW: Conditional between Modern KPI Grid & Classic Stat Chips */}
      {uiMode === 'classic' ? (
        <div className="dashboard-stats-row">
          <div className="stat-chip" onClick={() => navigate('/oa-practice')}>
            <span className="stat-chip-val">{totalSolved}</span>
            <span className="stat-chip-label">Solved</span>
          </div>
          <div className="stat-chip" onClick={() => navigate('/readiness')}>
            <span className="stat-chip-val" style={{ color: '#10b981' }}>{accuracyPct}%</span>
            <span className="stat-chip-label">Accuracy</span>
          </div>
          <div className="stat-chip" onClick={() => navigate('/mistakes')}>
            <span className="stat-chip-val" style={{ color: '#f97316' }}>{unresolvedMistakes}</span>
            <span className="stat-chip-label">Mistakes</span>
          </div>
          <div className="stat-chip" onClick={() => navigate('/syllabus')}>
            <span className="stat-chip-val" style={{ color: '#a78bfa' }}>{coveredTopics}</span>
            <span className="stat-chip-label">Topics</span>
          </div>
        </div>
      ) : (
        <div className="dashboard-kpi-grid">
          <div className="kpi-card" onClick={() => navigate('/oa-practice')}>
            <div className="kpi-header">
              <span className="kpi-title">SOLVED</span>
              <div className="kpi-icon-wrap icon-cyan">
                <Target size={16} />
              </div>
            </div>
            <div className="kpi-body">
              <span className="kpi-val">{totalSolved}</span>
              <span className="kpi-sub-badge">Practice questions</span>
            </div>
            <div className="kpi-footer-bar">
              <div className="kpi-bar-fill bar-cyan" style={{ width: `${Math.min(100, (totalSolved / 500) * 100)}%` }} />
            </div>
          </div>

          <div className="kpi-card" onClick={() => navigate('/readiness')}>
            <div className="kpi-header">
              <span className="kpi-title">ACCURACY</span>
              <div className="kpi-icon-wrap icon-emerald">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="kpi-body">
              <span className="kpi-val text-emerald">{accuracyPct}%</span>
              <span className="kpi-sub-badge">{accuracyPct >= 75 ? 'Target achieved' : 'Target: 80%+'}</span>
            </div>
            <div className="kpi-footer-bar">
              <div className="kpi-bar-fill bar-emerald" style={{ width: `${accuracyPct}%` }} />
            </div>
          </div>

          <div className="kpi-card" onClick={() => navigate('/mistakes')}>
            <div className="kpi-header">
              <span className="kpi-title">MISTAKES</span>
              <div className="kpi-icon-wrap icon-amber">
                <AlertTriangle size={16} />
              </div>
            </div>
            <div className="kpi-body">
              <span className="kpi-val text-amber">{unresolvedMistakes}</span>
              <span className="kpi-sub-badge">Needs revision</span>
            </div>
            <div className="kpi-footer-bar">
              <div className="kpi-bar-fill bar-amber" style={{ width: `${Math.min(100, (unresolvedMistakes / 50) * 100)}%` }} />
            </div>
          </div>

          <div className="kpi-card" onClick={() => navigate('/syllabus')}>
            <div className="kpi-header">
              <span className="kpi-title">TOPICS</span>
              <div className="kpi-icon-wrap icon-indigo">
                <Layers size={16} />
              </div>
            </div>
            <div className="kpi-body">
              <span className="kpi-val text-indigo">{coveredTopics}</span>
              <span className="kpi-sub-badge">Active syllabus topics</span>
            </div>
            <div className="kpi-footer-bar">
              <div className="kpi-bar-fill bar-indigo" style={{ width: `${Math.min(100, (coveredTopics / 45) * 100)}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* DAILY GOAL PROGRESSION BAR — Conditional between Modern Milestone & Classic Runner Emojis */}
      <div className={`dashboard-daily-goal-card ${uiMode === 'classic' ? 'classic-goal-card' : ''}`}>
        <div className="goal-header-row">
          <div className="goal-title" onClick={() => navigate('/oa-practice')}>
            {uiMode === 'classic' ? (
              <>
                <span>Your Daily Goal</span>
                <strong className="goal-nums">({questionsSolvedToday}/{targetDailyGoal} Qs)</strong>
                <span className="goal-arrow">›</span>
              </>
            ) : (
              <>
                <span className="goal-badge-label">DAILY MILESTONES</span>
                <h3 className="goal-heading">
                  Today's Practice Pace 
                  <span className="goal-nums"> ({questionsSolvedToday} / {targetDailyGoal} Questions)</span>
                </h3>
              </>
            )}
          </div>

          <button 
            className="btn-edit-goal"
            onClick={(e) => {
              e.stopPropagation();
              setShowGoalModal(true);
            }}
          >
            {uiMode === 'classic' ? (
              <span>⚙️ Edit Target Goal</span>
            ) : (
              <>
                <Sliders size={13} />
                <span>Target: {userTargetGoal} Qs</span>
              </>
            )}
          </button>
        </div>

        {/* Milestone Progression Track */}
        {uiMode === 'classic' ? (
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
        ) : (
          <div className="milestone-track-container" onClick={() => navigate('/oa-practice')}>
            <div className="milestone-line-bg">
              <div className="milestone-line-fill" style={{ width: `${goalPercent}%` }} />
            </div>

            <div className="milestone-nodes-row">
              <div className={`milestone-node ${questionsSolvedToday > 0 ? 'completed' : 'active'}`}>
                <div className="node-bubble">
                  {questionsSolvedToday > 0 ? <Check size={12} /> : <span>0</span>}
                </div>
                <span className="node-label">Start</span>
              </div>

              <div className={`milestone-node ${questionsSolvedToday >= step1Threshold ? 'completed' : (questionsSolvedToday > 0 ? 'active' : '')}`}>
                <div className="node-bubble">
                  {questionsSolvedToday >= step1Threshold ? <Check size={12} /> : <span>1</span>}
                </div>
                <span className="node-label">Warmup ({step1Threshold} Qs)</span>
              </div>

              <div className={`milestone-node ${questionsSolvedToday >= step2Threshold ? 'completed' : ''}`}>
                <div className="node-bubble">
                  {questionsSolvedToday >= step2Threshold ? <Check size={12} /> : <span>2</span>}
                </div>
                <span className="node-label">Core ({step2Threshold} Qs)</span>
              </div>

              <div className={`milestone-node ${questionsSolvedToday >= step3Threshold ? 'completed' : ''}`}>
                <div className="node-bubble">
                  {questionsSolvedToday >= step3Threshold ? <Check size={12} /> : <span>3</span>}
                </div>
                <span className="node-label">Pro Sprint ({step3Threshold} Qs)</span>
              </div>

              <div className={`milestone-node finish ${questionsSolvedToday >= targetDailyGoal ? 'completed' : ''}`}>
                <div className="node-bubble">
                  {questionsSolvedToday >= targetDailyGoal ? <Check size={12} /> : <span>★</span>}
                </div>
                <span className="node-label">Target ({targetDailyGoal} Qs)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DAILY GOAL MODAL */}
      {showGoalModal && (
        <div className="goal-modal-backdrop" onClick={() => setShowGoalModal(false)}>
          <div className="goal-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Set Your Target Daily Practice Goal</h3>
            <p>Pick a daily target questions goal to build long-term retention & speed:</p>

            <div className="goal-options-grid">
              {[
                { val: 5, label: '5 Questions / Day', sub: 'Light Warmup' },
                { val: 15, label: '15 Questions / Day', sub: 'Standard GATE Practice' },
                { val: 30, label: '30 Questions / Day', sub: 'Intensive Practice' },
                { val: 50, label: '50 Questions / Day', sub: 'AIR < 100 Rank Mode' }
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
              Apply Target Goal
            </button>
          </div>
        </div>
      )}

      {/* HERO PROMO BANNER */}
      <div className="hero-banner-container">
        <button className="banner-nav-btn left" onClick={handlePrevBanner} aria-label="Previous">
          <ChevronLeft size={18} />
        </button>

        <div className="hero-banner-card">
          <div className="banner-badge-tags">
            <span><BookOpen size={13} /> Digital Books</span>
            <span><CheckCircle2 size={13} /> Chapter & Full Tests</span>
            <span><Video size={13} /> Video Solutions</span>
            <span><Zap size={13} /> Must-Do PYQs</span>
          </div>

          <h2 className="banner-main-title">
            MahiLLM <span className="highlight-no1">AI-Powered</span> GATE & Mechanical <span className="highlight-exam">Practice Suite</span>
          </h2>

          <button className="btn-unlock-premium" onClick={() => navigate('/oa-practice')}>
            <span>Explore Practice Suite</span>
            <ArrowRight size={15} />
          </button>

          {/* Carousel dots */}
          <div className="carousel-dots">
            <span className={`dot ${carouselIdx === 0 ? 'active' : ''}`} onClick={() => setCarouselIdx(0)} />
            <span className={`dot ${carouselIdx === 1 ? 'active' : ''}`} onClick={() => setCarouselIdx(1)} />
          </div>
        </div>

        <button className="banner-nav-btn right" onClick={handleNextBanner} aria-label="Next">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* SECTION 1: DIGITAL BOOKS */}
      <div className="dashboard-section">
        <div className="section-header">
          <div>
            <h3 className="section-title">Essential Digital Engineering Books</h3>
            <p className="section-subtitle">Structured formula references and curated question banks for GATE ME</p>
          </div>
          <button className="btn-view-all" onClick={() => navigate('/oa-practice')}>
            View All →
          </button>
        </div>

        <div className="books-horizontal-scroll">
          {DIGITAL_BOOKS.map((book) => (
            <div key={book.id} className="book-card-3d" onClick={() => navigate(book.route || `/oa-practice?cat=${book.id}`)}>
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
            <h3 className="section-title">Chapter-wise Previous Year Question Bank</h3>
            <p className="section-subtitle">Targeted previous year questions grouped by subjects and competitive exams</p>
          </div>
          <button className="btn-view-all" onClick={() => navigate('/oa-practice')}>
            View All →
          </button>
        </div>

        <div className="pyq-banks-grid">
          {PYQ_BANKS.map((bank) => {
            const IconComponent = bank.icon;
            return (
              <div key={bank.id} className="pyq-bank-card" onClick={() => navigate(`/oa-practice?cat=${encodeURIComponent(bank.category)}`)}>
                <div className="bank-card-content">
                  {uiMode === 'classic' ? (
                    <span className="bank-emoji" style={{ fontSize: '1.25rem' }}>{bank.emoji}</span>
                  ) : (
                    <div className="bank-icon-box">
                      <IconComponent size={18} className="text-cyan-400" />
                    </div>
                  )}
                  <span className="bank-name">{bank.name}</span>
                </div>
                <div className={`bank-badge ${bank.isCheck ? 'check-badge' : ''}`}>
                  <span>{bank.badge}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: SPECIALIZED POWER MODULES (Bento Grid) */}
      <div className="dashboard-section">
        <div className="section-header">
          <div>
            <h3 className="section-title">Interactive AI Modules & Practice Arenas</h3>
            <p className="section-subtitle">Real-time speed duels, voice coaching, physics simulators & rank predictors</p>
          </div>
        </div>

        <div className="bento-modules-grid">
          <TiltCard className="bento-card duel-card" onClick={() => navigate('/duel')}>
            <div className="bento-icon-box icon-indigo">
              <Swords size={22} />
            </div>
            <div className="bento-info">
              <h4>1v1 Speed Duel Arena</h4>
              <p>Challenge peers live or practice against AI bots in timed question duels</p>
            </div>
            <ArrowRight size={18} className="bento-arrow" />
          </TiltCard>

          <TiltCard className="bento-card interview-card" onClick={() => navigate('/mock-interview')}>
            <div className="bento-icon-box icon-emerald">
              <Mic size={22} />
            </div>
            <div className="bento-info">
              <h4>Voice Coach Mock Interview</h4>
              <p>Practice technical & PSU interview questions with real-time speech evaluation</p>
            </div>
            <ArrowRight size={18} className="bento-arrow" />
          </TiltCard>

          <TiltCard className="bento-card predictor-card" onClick={() => navigate('/gate-predictor')}>
            <div className="bento-icon-box icon-amber">
              <Compass size={22} />
            </div>
            <div className="bento-info">
              <h4>GATE Target Rank Predictor</h4>
              <p>Interactive score simulator & PSU cut-off qualification probabilities</p>
            </div>
            <ArrowRight size={18} className="bento-arrow" />
          </TiltCard>

          <TiltCard className="bento-card heatmap-card" onClick={() => navigate('/readiness')}>
            <div className="bento-icon-box icon-cyan">
              <Layers size={22} />
            </div>
            <div className="bento-info">
              <h4>Topic Readiness Heatmap</h4>
              <p>Real-time cognitive mastery map across all Mechanical Engineering topics</p>
            </div>
            <ArrowRight size={18} className="bento-arrow" />
          </TiltCard>
        </div>
      </div>

      {/* AI STUDY COACH WIDGET */}
      <div className="dashboard-section">
        <AIStudyCoach />
      </div>

    </div>
  );
}
