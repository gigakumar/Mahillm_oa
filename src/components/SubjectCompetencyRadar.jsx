import React from 'react';
import { Radar, Hexagon, Sparkles, Award } from 'lucide-react';
import './SubjectCompetencyRadar.css';

export default function SubjectCompetencyRadar({ masteryScores = {} }) {
  // Map long subject names to shorter labels for the radar chart
  const SUBJECT_LABELS = {
    'Thermodynamics': 'Thermal',
    'Strength of Materials': 'SOM',
    'Fluid Mechanics': 'Fluids',
    'Heat Transfer': 'Heat Tr.',
    'Manufacturing Engineering': 'Manufact.',
    'Quantitative Aptitude': 'Aptitude',
    'Engineering Mathematics': 'Maths',
    'Theory of Machines': 'TOM',
    'Machine Design': 'Design',
  };

  const scoreKeys = Object.keys(masteryScores || {});
  
  if (scoreKeys.length === 0) {
    return (
      <div className="radar-card card">
        <div className="radar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Award size={18} className="text-indigo-400" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f1f5f9' }}>Competency Radar</h3>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '260px', color: '#94a3b8' }}>
          No competency data available yet.
        </div>
      </div>
    );
  }

  const categories = scoreKeys.map(key => ({
    key,
    label: SUBJECT_LABELS[key] || key.substring(0, 8),
    val: masteryScores[key]
  }));

  // SVG Radar coordinates math (Hexagon 6 points)
  const cx = 140;
  const cy = 130;
  const radius = 90;

  const points = categories.map((cat, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const r = (cat.val / 100) * radius;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  const gridCircles = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="radar-card card">
      <div className="radar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Award size={18} className="text-indigo-400" />
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f1f5f9' }}>Competency Radar</h3>
        </div>
        <span className="radar-rank-tag">Tier: Specialist ⭐</span>
      </div>

      <div className="radar-body">
        {/* SVG Polygon Radar */}
        <div className="radar-svg-container">
          <svg viewBox="0 0 280 260" className="radar-svg">
            {/* Background Grid Hexagons */}
            {gridCircles.map((ratio, idx) => {
              const hexPoints = categories.map((_, i) => {
                const angle = (Math.PI / 3) * i - Math.PI / 2;
                const r = ratio * radius;
                return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
              }).join(' ');
              return (
                <polygon key={idx} points={hexPoints} className="radar-grid-hex" />
              );
            })}

            {/* Axis Lines */}
            {categories.map((_, i) => {
              const angle = (Math.PI / 3) * i - Math.PI / 2;
              return (
                <line
                  key={i}
                  x1={cx}
                  y1={cy}
                  x2={cx + radius * Math.cos(angle)}
                  y2={cy + radius * Math.sin(angle)}
                  className="radar-axis-line"
                />
              );
            })}

            {/* Data Polygon */}
            <polygon points={points} className="radar-data-poly" />

            {/* Data Points */}
            {categories.map((cat, i) => {
              const angle = (Math.PI / 3) * i - Math.PI / 2;
              const r = (cat.val / 100) * radius;
              const px = cx + r * Math.cos(angle);
              const py = cy + r * Math.sin(angle);
              return (
                <circle key={i} cx={px} cy={py} r="4" className="radar-data-dot" />
              );
            })}

            {/* Labels */}
            {categories.map((cat, i) => {
              const angle = (Math.PI / 3) * i - Math.PI / 2;
              const labelRadius = radius + 22;
              const lx = cx + labelRadius * Math.cos(angle);
              const ly = cy + labelRadius * Math.sin(angle);
              return (
                <text key={i} x={lx} y={ly} className="radar-label-text">
                  {cat.label} ({cat.val}%)
                </text>
              );
            })}
          </svg>
        </div>

        {/* Competency Score Chips */}
        <div className="radar-scores-grid">
          {categories.map(cat => (
            <div key={cat.key} className="score-chip">
              <span className="sc-name">{cat.label}</span>
              <strong className="sc-val">{cat.val}%</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
