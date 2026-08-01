import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ShieldAlert, Target, Award, Sparkles, CheckCircle2, Zap, ArrowRight, BarChart2 } from 'lucide-react';
import './ExamStrategy.css';

const STRATEGY_PHASES = [
  {
    phase: 'Phase 1: Low-Hanging Fruit Sprint (First 35 Mins)',
    focus: 'General Aptitude + Easy 1-Mark MCQs',
    recommendedTime: 35,
    targetQs: 18,
    strategy: 'Attempt all 10 Aptitude questions and scan for direct formula-based 1-mark mechanical questions. Skip any lengthier NATs immediately.',
    tip: 'Build early momentum and secure guaranteed 20+ marks in the first half hour.'
  },
  {
    phase: 'Phase 2: High-Weightage 2-Mark Core (Mins 36 – 135)',
    focus: '2-Mark Core Mechanical MCQs & NATs',
    recommendedTime: 100,
    targetQs: 28,
    strategy: 'Focus deeply on 2-mark questions in your strongest domains (Thermodynamics, SOM, Manufacturing). Double-check calculations for NAT questions as there is no negative marking.',
    tip: 'NAT questions carry 0 negative marking — attempt every single NAT even if estimating!'
  },
  {
    phase: 'Phase 3: Difficult / Lengthy Questions (Mins 136 – 165)',
    focus: 'Complex 2-Mark Multi-Step Numericals',
    recommendedTime: 30,
    targetQs: 12,
    strategy: 'Return to bookmarked lengthier numericals (e.g. Epicyclic gear trains, Castigliano strain energy integrals, LMTD heat exchangers).',
    tip: 'If unsure between 2 choices on MCQs, evaluate elimination risk: -0.66 deduction vs +2.0 reward.'
  },
  {
    phase: 'Phase 4: Sanity Check & NAT Verification (Final 15 Mins)',
    focus: 'Unit Conversions & Rounding Precision',
    recommendedTime: 15,
    targetQs: 0,
    strategy: 'Verify units on all NAT numerical inputs (e.g. mm vs m, kW vs W, kPa vs Pa). Verify virtual calculator decimal points.',
    tip: 'Never leave NAT inputs blank! Input your best computed decimal.'
  }
];

export default function ExamStrategy() {
  const navigate = useNavigate();
  const [targetScore, setTargetScore] = useState(75);
  const [totalExamMins, setTotalExamMins] = useState(180);

  return (
    <div className="page-content exam-strategy-page">
      <header className="es-header card">
        <div className="es-badge">
          <Clock size={14} className="text-amber-400" />
          <span>3-Hour GATE Strategy Engine</span>
        </div>
        <h1>GATE ME Exam Strategy & Time Allocation Planner ⏱️</h1>
        <p>
          Optimize your 180-minute time allocation, negative marking risk management, and phase-wise question scanning strategy.
        </p>
      </header>

      {/* Target Strategy Calculator Box */}
      <div className="es-calculator-card card">
        <div className="es-calc-header">
          <h3><Target size={18} className="text-indigo-400" /> Custom Strategy Calibrator</h3>
          <span className="es-target-tag">Target: {targetScore} Marks out of 100</span>
        </div>

        <div className="es-calc-grid">
          <div className="es-field">
            <label>Target GATE Raw Marks:</label>
            <input
              type="range"
              min="40"
              max="95"
              value={targetScore}
              onChange={e => setTargetScore(parseInt(e.target.value))}
            />
            <div className="es-field-val">{targetScore} Marks (Est. AIR &lt; #{targetScore >= 80 ? 150 : targetScore >= 65 ? 600 : 2500})</div>
          </div>

          <div className="es-field">
            <label>Exam Duration:</label>
            <select value={totalExamMins} onChange={e => setTotalExamMins(parseInt(e.target.value))}>
              <option value={180}>180 Minutes (Full GATE Paper)</option>
              <option value={60}>60 Minutes (Full Placement OA)</option>
              <option value={45}>45 Minutes (Standard Test)</option>
            </select>
            <div className="es-field-val">{totalExamMins} Minutes Allocated</div>
          </div>
        </div>

        <div className="es-summary-bar">
          <div className="es-stat">
            <span className="lbl">Req. 1-Mark Correct</span>
            <strong className="val text-emerald-400">18 / 25 Qs</strong>
          </div>
          <div className="es-stat">
            <span className="lbl">Req. 2-Mark Correct</span>
            <strong className="val text-indigo-400">24 / 30 Qs</strong>
          </div>
          <div className="es-stat">
            <span className="lbl">Max Allowed Negative Penalty</span>
            <strong className="val text-rose-400">&lt; -4.0 Marks</strong>
          </div>
          <div className="es-stat">
            <span className="lbl">NAT Answer Strategy</span>
            <strong className="val text-amber-400">Attempt 100% NATs (0 Risk)</strong>
          </div>
        </div>
      </div>

      {/* 4-Phase Strategy Breakdown */}
      <div className="es-phases-grid">
        {STRATEGY_PHASES.map((p, idx) => (
          <div key={idx} className="es-phase-card card">
            <div className="es-phase-header">
              <span className="es-phase-num">0{idx + 1}</span>
              <div>
                <h3>{p.phase}</h3>
                <span className="es-phase-focus">{p.focus}</span>
              </div>
            </div>

            <div className="es-phase-meta">
              <div className="meta-chip">
                <Clock size={13} /> {p.recommendedTime} Mins
              </div>
              {p.targetQs > 0 && (
                <div className="meta-chip">
                  <Target size={13} /> ~{p.targetQs} Target Qs
                </div>
              )}
            </div>

            <p className="es-phase-desc">{p.strategy}</p>

            <div className="es-phase-tip">
              <Sparkles size={14} className="text-amber-400" />
              <span><strong>Pro Tip:</strong> {p.tip}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
