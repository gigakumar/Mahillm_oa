import React, { useState } from 'react';
import { Calendar, Target, CheckCircle2, ChevronRight, Sparkles, BookOpen } from 'lucide-react';
import './GateScheduleRoadmap.css';

const ROADMAP_PHASES = [
  {
    month: 'Month 1',
    title: 'Thermal Sciences & Basic Thermodynamics',
    topics: ['Laws of Thermodynamics', 'Entropy & Exergy', 'Air & Vapor Power Cycles', 'IC Engines & Refrigeration'],
    targetHours: '45 Hours',
    status: 'In Progress'
  },
  {
    month: 'Month 2',
    title: 'Solid Mechanics & Machine Design',
    topics: ['Stresses, Strains & Elastic Constants', 'Mohr’s Circle & Bending Stresses', 'Castigliano’s Theorem & Torsion', 'Fatigue Failure & Spur Gears'],
    targetHours: '50 Hours',
    status: 'Upcoming'
  },
  {
    month: 'Month 3',
    title: 'Fluid Mechanics & Turbo-Machinery',
    topics: ['Fluid Statics & Kinematics', 'Bernoulli & Navier-Stokes Equations', 'Boundary Layer Theory & Drag', 'Pelton, Francis & Kaplan Turbines'],
    targetHours: '45 Hours',
    status: 'Upcoming'
  },
  {
    month: 'Month 4',
    title: 'Manufacturing & Industrial Engineering',
    topics: ['Metal Casting, Welding & Forming', 'Machining & Merchant Circle Analysis', 'NC/CNC & Metrology', 'Linear Programming & PERT/CPM'],
    targetHours: '55 Hours',
    status: 'Upcoming'
  },
  {
    month: 'Month 5',
    title: 'Heat Transfer & Theory of Machines',
    topics: ['Conduction, Convection & Radiation', 'Heat Exchangers (LMTD & NTU)', 'Kutzbach Criterion & Cams', 'Governors, Flywheels & Vibrations'],
    targetHours: '45 Hours',
    status: 'Upcoming'
  },
  {
    month: 'Month 6',
    title: 'GATE Full-Length Mock Tests & PYQ Sprints',
    topics: ['10 Full-Length GATE Mock Exams', '20-Year PYQ Revision Sprints', 'Formula Revision & High-Yield Drills', 'Time Management & Speed Calibration'],
    targetHours: '60 Hours',
    status: 'Upcoming'
  }
];

export default function GateScheduleRoadmap() {
  const [completedPhases, setCompletedPhases] = useState([0]);

  const togglePhase = (idx) => {
    setCompletedPhases(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="gate-roadmap-card card" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '20px' }}>
      <div className="roadmap-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={20} color="#fbbf24" />
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f1f5f9' }}>GATE 2026 6-Month Preparation Roadmap</h3>
        </div>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#34d399', background: 'rgba(16, 185, 129, 0.12)', padding: '0.3rem 0.75rem', borderRadius: '999px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
          {completedPhases.length} of 6 Months Completed
        </span>
      </div>

      <div className="roadmap-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {ROADMAP_PHASES.map((phase, idx) => {
          const isDone = completedPhases.includes(idx);
          return (
            <div
              key={idx}
              className={`roadmap-phase-box ${isDone ? 'done' : ''}`}
              style={{
                background: isDone ? 'rgba(16, 185, 129, 0.06)' : 'rgba(30, 41, 59, 0.5)',
                border: isDone ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '1.1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => togglePhase(idx)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isDone ? '#34d399' : '#818cf8', textTransform: 'uppercase' }}>
                  {phase.month}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                  ⏱️ {phase.targetHours}
                </span>
              </div>

              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#f1f5f9' }}>
                {phase.title}
              </h4>

              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {phase.topics.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>

              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 700, color: isDone ? '#34d399' : '#fbbf24' }}>
                {isDone ? <CheckCircle2 size={16} /> : <Sparkles size={16} />}
                <span>{isDone ? 'Completed' : 'Click to mark month complete'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
