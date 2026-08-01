import React from 'react';
import { Target, ClipboardList, Flame, Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import './PerformanceCards.css';

function Delta({ value, suffix = '', inverse = false }) {
  if (value === null || value === undefined || value === 0) {
    return <span className="perf-trend trend-neutral"><Minus size={12} /> No change</span>;
  }
  const isUp = inverse ? value < 0 : value > 0;
  const Icon = isUp ? TrendingUp : TrendingDown;
  const cls = isUp ? 'trend-up' : 'trend-down';
  return (
    <span className={`perf-trend ${cls}`}>
      <Icon size={12} /> {value > 0 ? '+' : ''}{value}{suffix}
    </span>
  );
}

export default function PerformanceCards({ stats = {} }) {
  const {
    accuracy = 0,
    accuracyDelta = 0,
    totalMocks = 0,
    mocksThisWeek = 0,
    streak = 0,
    longestStreak = 0,
    predictedRank = '—'
  } = stats;

  const cards = [
    {
      icon: Target,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
      label: 'Average Score',
      value: `${accuracy}%`,
      footer: <Delta value={accuracyDelta} suffix="% vs last week" />
    },
    {
      icon: ClipboardList,
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.1)',
      label: 'Mocks Completed',
      value: totalMocks,
      footer: mocksThisWeek > 0
        ? <span className="perf-trend trend-up"><TrendingUp size={12} /> {mocksThisWeek} this week</span>
        : <span className="perf-trend trend-neutral"><Minus size={12} /> None this week</span>
    },
    {
      icon: Flame,
      color: '#f97316',
      bg: 'rgba(249, 115, 22, 0.1)',
      label: 'Current Streak',
      value: streak > 0 ? `${streak} Days` : '—',
      footer: <span className="perf-trend text-secondary">Best: {longestStreak} days</span>
    },
    {
      icon: Trophy,
      color: '#eab308',
      bg: 'rgba(234, 179, 8, 0.1)',
      label: 'Predicted OA Rank',
      value: accuracy > 0 ? predictedRank : '—',
      footer: accuracy > 0
        ? <span className="perf-trend trend-up"><TrendingUp size={12} /> Based on {accuracy}% accuracy</span>
        : <span className="perf-trend trend-neutral"><Minus size={12} /> Complete a mock to predict</span>
    }
  ];

  return (
    <div className="perf-cards-grid">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div key={i} className="perf-card card">
            <div className="perf-card-header">
              <div className="perf-icon-wrapper" style={{ color: card.color, background: card.bg }}>
                <Icon size={20} />
              </div>
              <div className="perf-title">{card.label}</div>
            </div>
            <div className="perf-value">{card.value}</div>
            {card.footer}
          </div>
        );
      })}
    </div>
  );
}
