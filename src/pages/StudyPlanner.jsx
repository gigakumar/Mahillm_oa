import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserData } from '../contexts/UserDataContext';
import { predictForgettingRisks, calculateRetentionProbability } from '../intelligence/forgettingPredictor';
import { 
  Calendar as CalendarIcon, 
  Brain, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Sparkles, 
  Play, 
  ChevronLeft, 
  ChevronRight,
  Flame,
  Zap,
  Target,
  BookOpen
} from 'lucide-react';
import './StudyPlanner.css';

export default function StudyPlanner() {
  const navigate = useNavigate();
  const { spacedRepetition, masteryScores, mistakes } = useUserData();

  const [selectedDateOffset, setSelectedDateOffset] = useState(0); // 0 = Today, 1 = Tomorrow, etc.
  const [selectedSubject, setSelectedSubject] = useState('All');

  const now = new Date();
  const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + selectedDateOffset);

  // Compute Spaced Repetition queue items with retention analysis
  const srItems = useMemo(() => {
    return Object.values(spacedRepetition || {}).map(item => {
      const pRecall = calculateRetentionProbability({
        lastReviewedTime: item.lastReviewed,
        stabilityHours: (item.intervalDays || 1) * 24,
        currentTime: currentDate.getTime()
      });

      const nextReviewDate = new Date(item.nextReviewDate || (item.lastReviewed + (item.intervalDays || 1) * 86400000));
      const isDue = nextReviewDate <= currentDate;

      return {
        ...item,
        pRecall,
        risk: parseFloat((1 - pRecall).toFixed(3)),
        nextReviewDate,
        isDue
      };
    });
  }, [spacedRepetition, selectedDateOffset]);

  // Priority ranking: Higher forgetting risk first
  const highRiskItems = useMemo(() => {
    return srItems
      .filter(item => selectedSubject === 'All' || item.subject === selectedSubject || item.topic === selectedSubject)
      .sort((a, b) => b.risk - a.risk);
  }, [srItems, selectedSubject]);

  const dueTodayCount = useMemo(() => {
    return srItems.filter(item => item.isDue).length;
  }, [srItems]);

  const urgentReviewCount = useMemo(() => {
    return srItems.filter(item => item.pRecall < 0.6).length;
  }, [srItems]);

  // Generate 7-day schedule map
  const weekSchedule = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const dayStart = d.getTime();
      const dayEnd = dayStart + 86400000;

      const dueCount = srItems.filter(item => {
        const reviewTime = item.nextReviewDate.getTime();
        return reviewTime >= dayStart && reviewTime < dayEnd;
      }).length;

      days.push({
        offset: i,
        dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateStr: `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`,
        dueCount
      });
    }
    return days;
  }, [srItems]);

  const subjectsList = ['All', 'Thermodynamics', 'Fluid Mechanics', 'Strength of Materials', 'Theory of Machines', 'Manufacturing Science'];

  return (
    <div className="study-planner-container">
      {/* Header Banner */}
      <div className="planner-header-card">
        <div className="planner-header-content">
          <div className="planner-badge">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>AI Spaced Repetition Engine</span>
          </div>
          <h1>Intelligent Daily Study Planner</h1>
          <p>Automated revision schedule calibrated using Ebbinghaus Forgetting Curve to maximize long-term retention.</p>
        </div>

        <div className="planner-stats-grid">
          <div className="planner-stat-pill">
            <div className="stat-icon-wrapper bg-amber-500/20 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="stat-value">{dueTodayCount}</div>
              <div className="stat-label">Due for Review</div>
            </div>
          </div>

          <div className="planner-stat-pill">
            <div className="stat-icon-wrapper bg-rose-500/20 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="stat-value">{urgentReviewCount}</div>
              <div className="stat-label">High Decay Risk (&lt;60% recall)</div>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Interactive Timeline Selector */}
      <div className="week-selector-card">
        <div className="week-header">
          <h2><CalendarIcon className="w-5 h-5" /> 7-Day Smart Schedule</h2>
          <button 
            className="start-revision-btn"
            onClick={() => navigate('/revision')}
          >
            <Play className="w-4 h-4 fill-current" /> Start Instant Revision Session
          </button>
        </div>

        <div className="days-grid">
          {weekSchedule.map(day => (
            <button
              key={day.offset}
              className={`day-card ${selectedDateOffset === day.offset ? 'active' : ''}`}
              onClick={() => setSelectedDateOffset(day.offset)}
            >
              <span className="day-name">{day.dayName}</span>
              <span className="day-date">{day.dateStr}</span>
              <span className={`day-badge ${day.dueCount > 0 ? 'has-reviews' : ''}`}>
                {day.dueCount > 0 ? `${day.dueCount} Due` : 'Clear'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Subject Filter Bar */}
      <div className="planner-filter-bar">
        <span className="filter-title"><BookOpen className="w-4 h-4" /> Subject Filter:</span>
        <div className="filter-pills">
          {subjectsList.map(sub => (
            <button
              key={sub}
              className={`filter-pill ${selectedSubject === sub ? 'active' : ''}`}
              onClick={() => setSelectedSubject(sub)}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Planned Tasks / Revision Queue */}
      <div className="planner-queue-section">
        <div className="queue-header">
          <h3>
            <Brain className="w-5 h-5 text-indigo-400" />
            Recommended Review Tasks for {weekSchedule.find(d => d.offset === selectedDateOffset)?.dayName}
          </h3>
          <span className="queue-count">{highRiskItems.length} Concepts Identified</span>
        </div>

        {highRiskItems.length === 0 ? (
          <div className="empty-queue-state">
            <CheckCircle className="w-12 h-12 text-emerald-400" />
            <h4>All clear for this selection!</h4>
            <p>No concepts are at high risk of forgetting. You can launch a custom practice set to build fresh mastery.</p>
            <button className="practice-more-btn" onClick={() => navigate('/oa-practice')}>
              <Target className="w-4 h-4" /> Go to Practice Modules
            </button>
          </div>
        ) : (
          <div className="queue-items-grid">
            {highRiskItems.map((item, idx) => {
              const recallPct = Math.round(item.pRecall * 100);
              const recallColor = recallPct >= 80 ? 'text-emerald-400' : recallPct >= 60 ? 'text-amber-400' : 'text-rose-400';
              const progressBg = recallPct >= 80 ? 'bg-emerald-500' : recallPct >= 60 ? 'bg-amber-500' : 'bg-rose-500';

              return (
                <div key={item.questionId || idx} className="planner-item-card">
                  <div className="item-card-top">
                    <span className="item-topic-badge">{item.topic || 'General Mechanical'}</span>
                    <span className={`item-recall-val ${recallColor}`}>
                      {recallPct}% Recall Est.
                    </span>
                  </div>

                  <h4 className="item-title">{item.questionText || `Concept Review #${item.questionId || idx + 1}`}</h4>

                  <div className="recall-bar-wrapper">
                    <div className="recall-bar-bg">
                      <div className={`recall-bar-fill ${progressBg}`} style={{ width: `${recallPct}%` }} />
                    </div>
                  </div>

                  <div className="item-card-footer">
                    <span className="item-interval">
                      <Clock className="w-3.5 h-3.5" /> Interval: {item.intervalDays || 1}d
                    </span>
                    <button 
                      className="item-review-btn"
                      onClick={() => navigate('/revision')}
                    >
                      <Zap className="w-3.5 h-3.5" /> Review Concept
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
