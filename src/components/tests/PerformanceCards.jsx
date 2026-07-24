import React from 'react';
import { Target, ClipboardList, Flame, Trophy, TrendingUp } from 'lucide-react';
import './PerformanceCards.css';

export default function PerformanceCards() {
  return (
    <div className="perf-cards-grid">
      <div className="perf-card card">
        <div className="perf-card-header">
          <div className="perf-icon-wrapper" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
            <Target size={20} />
          </div>
          <div className="perf-title">Average Score</div>
        </div>
        <div className="perf-value">74%</div>
        <div className="perf-trend trend-up">
          <TrendingUp size={12} /> 5% vs last 7 days
        </div>
      </div>
      
      <div className="perf-card card">
        <div className="perf-card-header">
          <div className="perf-icon-wrapper" style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}>
            <ClipboardList size={20} />
          </div>
          <div className="perf-title">Mocks Completed</div>
        </div>
        <div className="perf-value">18</div>
        <div className="perf-trend trend-up">
          <TrendingUp size={12} /> 3 this week
        </div>
      </div>
      
      <div className="perf-card card">
        <div className="perf-card-header">
          <div className="perf-icon-wrapper" style={{ color: '#f97316', background: 'rgba(249, 115, 22, 0.1)' }}>
            <Flame size={20} />
          </div>
          <div className="perf-title">Current Streak</div>
        </div>
        <div className="perf-value">5 Days</div>
        <div className="perf-trend text-secondary">
          Best: 12 days
        </div>
      </div>
      
      <div className="perf-card card">
        <div className="perf-card-header">
          <div className="perf-icon-wrapper" style={{ color: '#eab308', background: 'rgba(234, 179, 8, 0.1)' }}>
            <Trophy size={20} />
          </div>
          <div className="perf-title">Predicted OA Rank</div>
        </div>
        <div className="perf-value">Top 18%</div>
        <div className="perf-trend trend-up">
          <TrendingUp size={12} /> 7% this week
        </div>
      </div>
    </div>
  );
}
