import React from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import './TestsHero.css';

const MOCK_PERFORMANCE_DATA = [
  { day: '20 Jul', score: 82 },
  { day: '22 Jul', score: 76 },
  { day: '24 Jul', score: 71 },
  { day: '26 Jul', score: 79 },
  { day: '28 Jul', score: 84 },
];

export default function TestsHero() {
  return (
    <div className="tests-hero-container card">
      <div className="hero-content">
        <div className="hero-left">
          <div className="hero-next-label">
            <RotateCcw size={14} /> Continue Your Last Mock
          </div>
          <h1>Mechanical Core Mock 01</h1>
          <p className="hero-subtitle">You left off 18/25 questions • 17:24 time remaining</p>
          
          <div className="hero-progress-bar-container">
            <div className="hero-progress-bar" style={{ width: '72%' }}></div>
            <span className="hero-progress-text">72%</span>
          </div>
          
          <div className="hero-actions">
            <button className="btn btn-primary hero-btn">
              <Play size={16} fill="currentColor" /> Resume Mock
            </button>
            <button className="btn btn-secondary hero-btn-outline">
              Review Answers
            </button>
          </div>
        </div>
        
        <div className="hero-right">
          <div className="hero-score-ring">
            <div className="score-ring-title">Estimated Score</div>
            <div className="score-ring-circle">
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path className="circle-bg"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path className="circle"
                  strokeDasharray="68, 100"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="score-ring-content">
                <span className="score-ring-value">68</span>
                <span className="score-ring-total">/100</span>
              </div>
            </div>
            <div className="score-ring-status">Good Job! 💪</div>
            <div className="score-ring-trend">Accuracy last week <span className="trend-up">↑ 6%</span></div>
          </div>
          
          <div className="hero-chart-container">
            <div className="chart-header">
              <span className="chart-title">Your Performance Trend</span>
              <span className="chart-dropdown">Last 5 Mocks ▾</span>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_PERFORMANCE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} dy={10} />
                  <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    itemStyle={{ color: 'var(--accent)' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#scoreGradient)" activeDot={{ r: 6, fill: '#8b5cf6', stroke: 'var(--bg-card)', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
