import React, { useState, useMemo } from 'react';
import { Activity, Flame, Award, Calendar, CheckCircle2, TrendingUp } from 'lucide-react';
import './GitHubHeatmap.css';

/**
 * GitHub Contribution Style Heatmap Visualizer Component
 *
 * Renders a 52-week calendar grid matrix with 5 intensity levels matching
 * GitHub's contribution graph visual style.
 */
export default function GitHubHeatmap({ questionProgress = {}, testHistory = [], scoreData = {} }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [hoveredDay, setHoveredDay] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Generate 52 weeks (364 days) leading up to today
  const calendarDays = useMemo(() => {
    const today = new Date();
    const days = [];

    // Map progress updates by YYYY-MM-DD
    const activityMap = {};

    Object.entries(questionProgress || {}).forEach(([qId, prog]) => {
      if (!prog) return;
      const cat = prog.category || 'General';
      if (selectedCategory !== 'ALL' && cat !== selectedCategory) return;

      const dateStr = prog.updatedAt ? prog.updatedAt.split('T')[0] : today.toISOString().split('T')[0];
      if (!activityMap[dateStr]) {
        activityMap[dateStr] = { count: 0, correct: 0, xp: 0, topics: new Set() };
      }
      activityMap[dateStr].count += 1;
      if (prog.status === 'correct') activityMap[dateStr].correct += 1;
      if (prog.topic) activityMap[dateStr].topics.add(prog.topic);
    });

    // Also include test history completions
    (testHistory || []).forEach(t => {
      const dateStr = t.completedAt ? t.completedAt.split('T')[0] : today.toISOString().split('T')[0];
      if (!activityMap[dateStr]) {
        activityMap[dateStr] = { count: 0, correct: 0, xp: 0, topics: new Set() };
      }
      activityMap[dateStr].count += (t.report ? t.report.length : 10);
      activityMap[dateStr].correct += (t.score || 0);
      if (t.testCategory) activityMap[dateStr].topics.add(t.testCategory);
    });

    // Build array of 52 weeks x 7 days
    const endDate = new Date(today);
    // Align to Saturday so the last week ends on Saturday
    const currentDayOfWeek = endDate.getDay(); // 0 = Sun, 6 = Sat
    const daysToSaturday = 6 - currentDayOfWeek;
    endDate.setDate(endDate.getDate() + daysToSaturday);

    const totalDays = 52 * 7;
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const act = activityMap[dateKey] || { count: 0, correct: 0, topics: new Set() };

      // Calculate intensity level (0 to 4)
      let level = 0;
      if (act.count > 0) {
        if (act.count <= 2) level = 1;
        else if (act.count <= 5) level = 2;
        else if (act.count <= 10) level = 3;
        else level = 4;
      }

      days.push({
        dateStr: dateKey,
        dateObj: d,
        count: act.count,
        correct: act.correct,
        accuracy: act.count > 0 ? Math.round((act.correct / act.count) * 100) : 0,
        level,
        topics: Array.from(act.topics)
      });
    }

    return days;
  }, [questionProgress, testHistory, selectedCategory]);

  // Group days into 52 weeks (7 days per week)
  const weeks = useMemo(() => {
    const w = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      w.push(calendarDays.slice(i, i + 7));
    }
    return w;
  }, [calendarDays]);

  // Calculate Month Headers
  const monthHeaders = useMemo(() => {
    const months = [];
    let currentMonth = -1;

    weeks.forEach((week, idx) => {
      const firstDayInWeek = week[0];
      if (firstDayInWeek) {
        const m = firstDayInWeek.dateObj.getMonth();
        if (m !== currentMonth) {
          currentMonth = m;
          const monthName = firstDayInWeek.dateObj.toLocaleString('en-US', { month: 'short' });
          months.push({ name: monthName, weekIndex: idx });
        }
      }
    });
    return months;
  }, [weeks]);

  // Statistics summaries
  const totalContributions = useMemo(() => {
    return calendarDays.reduce((sum, d) => sum + d.count, 0);
  }, [calendarDays]);

  const activeDaysCount = useMemo(() => {
    return calendarDays.filter(d => d.count > 0).length;
  }, [calendarDays]);

  const handleCellMouseEnter = (day, e) => {
    setHoveredDay(day);
    setTooltipPos({ x: e.clientX, y: e.clientY - 40 });
  };

  const handleCellMouseLeave = () => {
    setHoveredDay(null);
  };

  const categories = [
    { key: 'ALL', label: 'All Categories' },
    { key: 'Mechanical Engineering', label: '🔩 Mechanical' },
    { key: 'Quantitative Aptitude', label: '🧮 Quants' },
    { key: 'Logical Reasoning', label: '🧠 Reasoning' },
    { key: 'Data Interpretation', label: '📊 DI' },
    { key: 'DILR', label: '🧩 DILR' },
  ];

  return (
    <div className="github-heatmap-card">
      <div className="github-heatmap-header">
        <div className="github-heatmap-title-group">
          <h3>
            <Activity size={20} style={{ color: '#39d353' }} /> 
            GitHub Activity Matrix
          </h3>
          <p className="github-heatmap-subtitle">
            Continuous daily practice log & syllabus submission frequency (GitHub contribution graph)
          </p>
        </div>

        <div className="github-heatmap-stats">
          <div className="github-stat-item">
            <span className="github-stat-value">{totalContributions}</span>
            <span className="github-stat-label">Solved (1 yr)</span>
          </div>
          <div className="github-stat-item">
            <span className="github-stat-value" style={{ color: '#39d353' }}>{activeDaysCount}</span>
            <span className="github-stat-label">Active Days</span>
          </div>
          <div className="github-stat-item">
            <span className="github-stat-value" style={{ color: '#fdcb6e' }}>{scoreData?.streak || 0} 🔥</span>
            <span className="github-stat-label">Current Streak</span>
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="github-category-filters">
        {categories.map(cat => (
          <button
            key={cat.key}
            className={`github-cat-chip ${selectedCategory === cat.key ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid Container */}
      <div className="github-grid-scroll-wrapper">
        <div className="github-calendar-grid">
          {/* Month labels header */}
          <div className="github-months-row">
            {monthHeaders.map((m, idx) => (
              <span 
                key={idx} 
                className="github-month-label"
                style={{ flex: idx === monthHeaders.length - 1 ? '0 0 auto' : undefined }}
              >
                {m.name}
              </span>
            ))}
          </div>

          <div className="github-days-and-cells">
            {/* Row Day Labels (Mon, Wed, Fri) */}
            <div className="github-day-labels">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>

            {/* Weeks columns */}
            <div className="github-weeks-container">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="github-week-column">
                  {week.map((day, dIdx) => (
                    <div
                      key={dIdx}
                      className={`github-day-cell level-${day.level}`}
                      onMouseEnter={(e) => handleCellMouseEnter(day, e)}
                      onMouseLeave={handleCellMouseLeave}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Legend */}
      <div className="github-heatmap-footer">
        <span>Learn more about how contribution graphs prioritize consistent daily engineering practice.</span>
        <div className="github-legend">
          <span>Less</span>
          <div className="github-legend-cell level-0" />
          <div className="github-legend-cell level-1" />
          <div className="github-legend-cell level-2" />
          <div className="github-legend-cell level-3" />
          <div className="github-legend-cell level-4" />
          <span>More</span>
        </div>
      </div>

      {/* Interactive Hover Tooltip */}
      {hoveredDay && (
        <div 
          className="github-tooltip" 
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
        >
          <strong>{hoveredDay.dateStr}</strong>: {hoveredDay.count === 0 ? 'No questions solved' : `${hoveredDay.count} questions solved (${hoveredDay.accuracy}% accuracy)`}
          {hoveredDay.topics && hoveredDay.topics.length > 0 && (
            <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.2rem' }}>
              Topics: {hoveredDay.topics.slice(0, 2).join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
