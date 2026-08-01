import React, { useState, useEffect } from 'react';
import { Clock, Calendar, CheckSquare, Zap, Sparkles, Target, ArrowRight, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './DashboardCountdown.css';

const GATE_EXAM_DATE = new Date('2026-02-07T09:30:00+05:30'); // Next GATE ME Exam date

export default function DashboardCountdown() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining());
  const [dailyChecklist, setDailyChecklist] = useState(() => {
    try {
      const todayKey = `daily_targets_${new Date().toISOString().split('T')[0]}`;
      return JSON.parse(localStorage.getItem(todayKey) || '{"q20": false, "flashcard": false, "weakness": false, "formula": false}');
    } catch { return { q20: false, flashcard: false, weakness: false, formula: false }; }
  });

  function getTimeRemaining() {
    const diff = GATE_EXAM_DATE.getTime() - new Date().getTime();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return { days, hours, minutes, seconds };
  }

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeRemaining()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleCheck = (key) => {
    setDailyChecklist(prev => {
      const next = { ...prev, [key]: !prev[key] };
      const todayKey = `daily_targets_${new Date().toISOString().split('T')[0]}`;
      localStorage.setItem(todayKey, JSON.stringify(next));
      return next;
    });
  };

  const tasksCount = Object.keys(dailyChecklist).length;
  const completedCount = Object.values(dailyChecklist).filter(Boolean).length;
  const targetPct = Math.round((completedCount / tasksCount) * 100);

  return (
    <div className="dashboard-countdown-card card">
      {/* Left: GATE 2026 Countdown Ticker */}
      <div className="dc-countdown-box">
        <div className="dc-badge">
          <Calendar size={13} className="text-amber-400" />
          <span>GATE ME 2026 Target Countdown</span>
        </div>

        <div className="dc-timer-grid">
          <div className="dc-timer-unit">
            <span className="dc-num">{timeLeft.days}</span>
            <span className="dc-unit-label">DAYS</span>
          </div>
          <span className="dc-colon">:</span>
          <div className="dc-timer-unit">
            <span className="dc-num">{timeLeft.hours.toString().padStart(2, '0')}</span>
            <span className="dc-unit-label">HOURS</span>
          </div>
          <span className="dc-colon">:</span>
          <div className="dc-timer-unit">
            <span className="dc-num">{timeLeft.minutes.toString().padStart(2, '0')}</span>
            <span className="dc-unit-label">MINS</span>
          </div>
          <span className="dc-colon">:</span>
          <div className="dc-timer-unit">
            <span className="dc-num">{timeLeft.seconds.toString().padStart(2, '0')}</span>
            <span className="dc-unit-label">SECS</span>
          </div>
        </div>

        <div className="dc-actions-row">
          <button className="btn btn-primary btn-sm dc-sprint-btn" onClick={() => navigate('/oa-practice')}>
            <Zap size={14} /> Quick Daily 10-Q Practice Sprint
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/syllabus')}>
            Syllabus Roadmap →
          </button>
        </div>
      </div>

      {/* Right: Daily Target Goals Checklist */}
      <div className="dc-checklist-box">
        <div className="dc-checklist-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Target size={16} className="text-indigo-400" />
            <strong style={{ color: '#f1f5f9', fontSize: '0.92rem' }}>Today's Target Sprint ({completedCount}/{tasksCount})</strong>
          </div>
          <span className="dc-pct-tag" style={{ color: targetPct === 100 ? '#34d399' : '#818cf8' }}>
            {targetPct}% Done
          </span>
        </div>

        <div className="dc-checklist-bar">
          <div className="dc-cb-fill" style={{ width: `${targetPct}%`, background: targetPct === 100 ? '#10b981' : '#6366f1' }} />
        </div>

        <div className="dc-items-list">
          <div className={`dc-item ${dailyChecklist.q20 ? 'done' : ''}`} onClick={() => toggleCheck('q20')}>
            <span className="dc-checkbox">{dailyChecklist.q20 ? '✓' : ''}</span>
            <span>Solve 20 Practice Questions</span>
          </div>

          <div className={`dc-item ${dailyChecklist.flashcard ? 'done' : ''}`} onClick={() => toggleCheck('flashcard')}>
            <span className="dc-checkbox">{dailyChecklist.flashcard ? '✓' : ''}</span>
            <span>Review 5 3D Formula Flashcards</span>
          </div>

          <div className={`dc-item ${dailyChecklist.weakness ? 'done' : ''}`} onClick={() => toggleCheck('weakness')}>
            <span className="dc-checkbox">{dailyChecklist.weakness ? '✓' : ''}</span>
            <span>Re-attempt 1 Notebook Mistake</span>
          </div>

          <div className={`dc-item ${dailyChecklist.formula ? 'done' : ''}`} onClick={() => toggleCheck('formula')}>
            <span className="dc-checkbox">{dailyChecklist.formula ? '✓' : ''}</span>
            <span>Complete 15m Focus Stopwatch Session</span>
          </div>
        </div>
      </div>
    </div>
  );
}
