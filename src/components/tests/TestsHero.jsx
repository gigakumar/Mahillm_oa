import React, { useMemo } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';
import './TestsHero.css';

// Fallback chart data shown when user has no test history
const FALLBACK_CHART = [
  { day: 'Mock 1', score: 0 },
  { day: 'Mock 2', score: 0 },
  { day: 'Mock 3', score: 0 },
];

export default function TestsHero({ stats = {} }) {
  const navigate = useNavigate();
  const {
    lastMock,
    accuracy,
    accuracyDelta,
    performanceTrend = [],
    totalMocks
  } = stats;

  // Chart data — use real history or minimal placeholder
  const chartData = performanceTrend.length >= 2 ? performanceTrend : FALLBACK_CHART;
  const hasRealChart = performanceTrend.length >= 2;

  // Last mock info
  const mockName = lastMock?.name || lastMock?.title || (lastMock ? 'Recent Mock' : 'No mocks taken yet');
  const mockScore = lastMock
    ? Math.min(100, Math.round((lastMock.score || lastMock.correctCount || 0) /
        Math.max(1, lastMock.totalCount || lastMock.totalQuestions || 1) * 100))
    : 0;
  const mockQsAnswered = lastMock?.questionsAnswered || lastMock?.correctCount || 0;
  const mockTotalQs = lastMock?.totalCount || lastMock?.totalQuestions || 0;
  const progressPct = mockTotalQs > 0 ? Math.min(100, Math.round((mockQsAnswered / mockTotalQs) * 100)) : 0;

  // Score ring color
  const ringColor = mockScore >= 75 ? '#10b981' : mockScore >= 50 ? 'var(--warning)' : '#ef4444';
  const statusLabel = mockScore >= 80 ? 'Excellent! 🎉' : mockScore >= 65 ? 'Good Job! 💪' : mockScore >= 50 ? 'Keep Going! 🔥' : totalMocks === 0 ? 'Start a Mock! 🚀' : 'Needs Work 📚';

  // Accuracy delta display
  const accDeltaAbs = Math.abs(accuracyDelta || 0);
  const accDeltaUp = (accuracyDelta || 0) >= 0;

  return (
    <div className="tests-hero-container card">
      <div className="hero-content">
        <div className="hero-left">
          <div className="hero-next-label">
            <RotateCcw size={14} />
            {lastMock ? 'Continue Your Last Mock' : 'Start Your First Mock'}
          </div>
          <h1>{mockName}</h1>
          {lastMock ? (
            <p className="hero-subtitle">
              {mockQsAnswered > 0
                ? `You answered ${mockQsAnswered}/${mockTotalQs} questions`
                : `${mockTotalQs} questions total`}
              {lastMock.duration ? ` • ${lastMock.duration} min` : ''}
            </p>
          ) : (
            <p className="hero-subtitle">Take your first mock test to start tracking your progress</p>
          )}

          <div className="hero-progress-bar-container">
            <div className="hero-progress-bar" style={{ width: `${progressPct}%` }} />
            <span className="hero-progress-text">{progressPct}%</span>
          </div>

          <div className="hero-actions">
            {lastMock ? (
              <>
                <button className="btn btn-primary hero-btn" onClick={() => navigate('/tests/session')}>
                  <Play size={16} fill="currentColor" /> Resume Mock
                </button>
                <button className="btn btn-secondary hero-btn-outline" onClick={() => navigate('/tests')}>
                  Review Answers
                </button>
              </>
            ) : (
              <button className="btn btn-primary hero-btn" onClick={() => navigate('/tests/session')}>
                <Play size={16} fill="currentColor" /> Start First Mock
              </button>
            )}
          </div>
        </div>

        <div className="hero-right">
          {/* Score Ring */}
          <div className="hero-score-ring">
            <div className="score-ring-title">
              {totalMocks > 0 ? 'Last Mock Score' : 'Estimated Score'}
            </div>
            <div className="score-ring-circle">
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path
                  className="circle-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="circle"
                  stroke={ringColor}
                  strokeDasharray={`${mockScore}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="score-ring-content">
                <span className="score-ring-value">{mockScore}</span>
                <span className="score-ring-total">/100</span>
              </div>
            </div>
            <div className="score-ring-status">{statusLabel}</div>
            <div className="score-ring-trend">
              Accuracy{' '}
              {accDeltaAbs > 0 ? (
                <span className={accDeltaUp ? 'trend-up' : 'trend-down'}>
                  {accDeltaUp ? '↑' : '↓'} {accDeltaAbs}%
                </span>
              ) : (
                <span className="trend-neutral">{accuracy}%</span>
              )}
            </div>
          </div>

          {/* Performance Trend Chart */}
          <div className="hero-chart-container">
            <div className="chart-header">
              <span className="chart-title">Your Performance Trend</span>
              <span className="chart-dropdown">
                Last {Math.max(chartData.length, 5)} Mocks ▾
              </span>
            </div>
            <div className="chart-wrapper">
              {hasRealChart ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} dy={10} />
                    <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                      itemStyle={{ color: 'var(--accent)' }}
                      formatter={(v) => [`${v}%`, 'Score']}
                    />
                    <Area type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#scoreGradient)" activeDot={{ r: 6, fill: '#8b5cf6', stroke: 'var(--bg-card)', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty-state">
                  <p>Complete {Math.max(2 - performanceTrend.length, 0)} more mock{performanceTrend.length !== 1 ? 's' : ''} to see your trend</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
