import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Brain, Target, Sparkles, Pencil, Check, X, Plus, Trash2 } from 'lucide-react';
import './HeroSection.css';

const DEFAULT_DATA = [
  { day: 'Day 1', retention: 100 },
  { day: 'Day 2', retention: 85 },
  { day: 'Day 3', retention: 92 },
  { day: 'Day 4', retention: 80 },
  { day: 'Day 5', retention: 88 },
  { day: 'Day 6', retention: 76 },
  { day: 'Day 7', retention: 84 },
];

export default function HeroSection({ dueTodayCount = 0 }) {
  // ── Editable state ──────────────────────────────────────────
  const [goalQuestions, setGoalQuestions] = useState(18);
  const [goalMinutes, setGoalMinutes] = useState(35);
  const [completed, setCompleted] = useState(8);
  const [aiInsight, setAiInsight] = useState(
    "Your Fluid Mechanics retention dropped 14% over the last 5 days. Reviewing Bernoulli today could recover approximately 12% retention."
  );
  const [chartData, setChartData] = useState(DEFAULT_DATA);

  // ── Edit modes ──────────────────────────────────────────────
  const [editingGoal, setEditingGoal] = useState(false);
  const [editingInsight, setEditingInsight] = useState(false);
  const [editingChart, setEditingChart] = useState(false);

  // Draft states
  const [draftQuestions, setDraftQuestions] = useState(goalQuestions);
  const [draftMinutes, setDraftMinutes] = useState(goalMinutes);
  const [draftCompleted, setDraftCompleted] = useState(completed);
  const [draftInsight, setDraftInsight] = useState(aiInsight);
  const [draftChartData, setDraftChartData] = useState(chartData);

  const percentage = Math.min(100, Math.round((completed / goalQuestions) * 100));

  // ── Goal handlers ───────────────────────────────────────────
  const openGoalEdit = () => {
    setDraftQuestions(goalQuestions);
    setDraftMinutes(goalMinutes);
    setDraftCompleted(completed);
    setEditingGoal(true);
  };
  const saveGoal = () => {
    setGoalQuestions(Math.max(1, draftQuestions));
    setGoalMinutes(Math.max(1, draftMinutes));
    setCompleted(Math.max(0, Math.min(draftCompleted, draftQuestions)));
    setEditingGoal(false);
  };
  const cancelGoal = () => setEditingGoal(false);

  // ── Insight handlers ────────────────────────────────────────
  const openInsightEdit = () => { setDraftInsight(aiInsight); setEditingInsight(true); };
  const saveInsight = () => { setAiInsight(draftInsight); setEditingInsight(false); };
  const cancelInsight = () => setEditingInsight(false);

  // ── Chart handlers ──────────────────────────────────────────
  const openChartEdit = () => { setDraftChartData([...chartData]); setEditingChart(true); };
  const saveChart = () => { setChartData(draftChartData); setEditingChart(false); };
  const cancelChart = () => setEditingChart(false);
  const updateChartRow = (idx, field, val) => {
    const updated = draftChartData.map((d, i) =>
      i === idx ? { ...d, [field]: field === 'retention' ? Math.min(100, Math.max(0, Number(val))) : val } : d
    );
    setDraftChartData(updated);
  };
  const addChartRow = () => setDraftChartData(prev => [...prev, { day: `Day ${prev.length + 1}`, retention: 80 }]);
  const removeChartRow = (idx) => setDraftChartData(prev => prev.filter((_, i) => i !== idx));

  return (
    <div className="hero-section">
      {/* Aurora Background */}
      <div className="aurora aurora-1" />
      <div className="aurora aurora-2" />

      <div className="hero-content">
        {/* ── LEFT: AI Insight ── */}
        <div className="hero-left">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="ai-badge">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>AI Study Coach</span>
            </div>

            <h1 className="hero-title">Intelligent Study Planner</h1>

            <div className="ai-coach-message glass-card" style={{ position: 'relative' }}>
              <Brain className="w-5 h-5 text-purple-400" style={{ flexShrink: 0 }} />
              {editingInsight ? (
                <div className="insight-edit-area">
                  <textarea
                    className="insight-textarea"
                    value={draftInsight}
                    onChange={e => setDraftInsight(e.target.value)}
                    rows={3}
                    autoFocus
                  />
                  <div className="edit-action-row">
                    <button className="btn-save-edit" onClick={saveInsight}><Check size={14} /> Save</button>
                    <button className="btn-cancel-edit" onClick={cancelInsight}><X size={14} /> Cancel</button>
                  </div>
                </div>
              ) : (
                <p>
                  <strong>AI Insight:</strong> {aiInsight}
                </p>
              )}
              {!editingInsight && (
                <button className="inline-edit-btn" title="Edit insight" onClick={openInsightEdit}>
                  <Pencil size={13} />
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── RIGHT: Goal + Chart ── */}
        <div className="hero-right">
          {/* Today's Goal Card */}
          <motion.div
            className="goal-card glass-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ position: 'relative' }}
          >
            <div className="goal-header">
              <Target className="w-5 h-5 text-emerald-400" />
              <h3>Today's Goal</h3>
            </div>

            {editingGoal ? (
              <div className="goal-edit-panel">
                <label className="edit-label">Questions</label>
                <input type="number" className="edit-input" value={draftQuestions} min={1} onChange={e => setDraftQuestions(Number(e.target.value))} />
                <label className="edit-label">Minutes</label>
                <input type="number" className="edit-input" value={draftMinutes} min={1} onChange={e => setDraftMinutes(Number(e.target.value))} />
                <label className="edit-label">Completed</label>
                <input type="number" className="edit-input" value={draftCompleted} min={0} onChange={e => setDraftCompleted(Number(e.target.value))} />
                <div className="edit-action-row">
                  <button className="btn-save-edit" onClick={saveGoal}><Check size={14} /> Save</button>
                  <button className="btn-cancel-edit" onClick={cancelGoal}><X size={14} /> Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <p className="goal-subtext">Review {goalQuestions} Questions • {goalMinutes} mins</p>
                <div className="progress-ring-container">
                  <svg className="progress-ring" width="100" height="100">
                    <circle className="progress-ring__circle" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="transparent" r="40" cx="50" cy="50" />
                    <motion.circle
                      className="progress-ring__circle progress-ring__circle--fill"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                      initial={{ strokeDasharray: '251.2', strokeDashoffset: '251.2' }}
                      animate={{ strokeDashoffset: 251.2 - (251.2 * percentage) / 100 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#4f46e5" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="progress-text">
                    <span className="progress-value">{percentage}%</span>
                  </div>
                </div>
                <p className="goal-completed-label">{completed} / {goalQuestions} done</p>
              </>
            )}

            {!editingGoal && (
              <button className="inline-edit-btn goal-edit-btn" title="Edit goal" onClick={openGoalEdit}>
                <Pencil size={13} />
              </button>
            )}
          </motion.div>

          {/* Retention Chart */}
          <motion.div
            className="retention-card glass-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ position: 'relative' }}
          >
            <div className="retention-header-row">
              <h4>Memory Retention</h4>
              {!editingChart ? (
                <button className="inline-edit-btn-sm" title="Edit chart data" onClick={openChartEdit}>
                  <Pencil size={13} />
                </button>
              ) : null}
            </div>

            <AnimatePresence mode="wait">
              {editingChart ? (
                <motion.div key="chart-edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="chart-edit-panel">
                  <div className="chart-edit-list">
                    {draftChartData.map((row, idx) => (
                      <div key={idx} className="chart-edit-row">
                        <input
                          className="chart-input-day"
                          value={row.day}
                          onChange={e => updateChartRow(idx, 'day', e.target.value)}
                          placeholder="Label"
                        />
                        <input
                          className="chart-input-val"
                          type="number"
                          value={row.retention}
                          min={0} max={100}
                          onChange={e => updateChartRow(idx, 'retention', e.target.value)}
                        />
                        <span className="chart-pct-label">%</span>
                        <button className="btn-remove-row" onClick={() => removeChartRow(idx)}><Trash2 size={12} /></button>
                      </div>
                    ))}
                  </div>
                  <button className="btn-add-row" onClick={addChartRow}><Plus size={12} /> Add Day</button>
                  <div className="edit-action-row">
                    <button className="btn-save-edit" onClick={saveChart}><Check size={14} /> Save</button>
                    <button className="btn-cancel-edit" onClick={cancelChart}><X size={14} /> Cancel</button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="chart-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Tooltip
                        contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        itemStyle={{ color: '#e2e8f0' }}
                      />
                      <Area type="monotone" dataKey="retention" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRetention)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
