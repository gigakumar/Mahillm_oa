import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Clock, Activity, Crosshair, Award, BatteryCharging, Pencil, Check, X, Plus, Trash2 } from 'lucide-react';
import './AnalyticsDashboard.css';

const ICON_MAP = { Target, Clock, Activity, Crosshair, Award, BatteryCharging };
const ICON_KEYS = Object.keys(ICON_MAP);
const COLOR_PRESETS = ['#10b981', '#6366f1', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#14b8a6'];

const DEFAULT_METRICS = [
  { id: 'm1', label: 'Accuracy', value: '78%', trend: '+5%', iconKey: 'Target', color: '#10b981', trendUp: true },
  { id: 'm2', label: 'Avg Recall', value: '82%', trend: '+2%', iconKey: 'Activity', color: '#6366f1', trendUp: true },
  { id: 'm3', label: 'Questions Today', value: '124', trend: '+18', iconKey: 'Crosshair', color: '#f59e0b', trendUp: true },
  { id: 'm4', label: 'Time Studied', value: '2h 15m', trend: '+30m', iconKey: 'Clock', color: '#3b82f6', trendUp: true },
  { id: 'm5', label: 'Predicted Rank', value: 'Top 5%', trend: 'Improving', iconKey: 'Award', color: '#8b5cf6', trendUp: true },
  { id: 'm6', label: 'Focus Score', value: '92/100', trend: 'High', iconKey: 'BatteryCharging', color: '#ec4899', trendUp: true },
];

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState(DEFAULT_METRICS);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);

  const startEdit = (m) => { setEditingId(m.id); setDraft({ ...m }); };
  const saveDraft = () => {
    setMetrics(prev => prev.map(m => m.id === editingId ? { ...draft } : m));
    setEditingId(null); setDraft(null);
  };
  const cancelDraft = () => { setEditingId(null); setDraft(null); };

  const removeMetric = (id) => setMetrics(prev => prev.filter(m => m.id !== id));

  const addMetric = () => {
    setMetrics(prev => [...prev, {
      id: `m${Date.now()}`,
      label: 'New Metric',
      value: '0',
      trend: '+0',
      iconKey: 'Target',
      color: COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)],
      trendUp: true
    }]);
  };

  return (
    <div className="analytics-dashboard-container">
      <div className="analytics-header-row">
        <h3>Performance Snapshot</h3>
        <button
          className={`btn-analytics-edit ${editMode ? 'active' : ''}`}
          onClick={() => { setEditMode(e => !e); setEditingId(null); setDraft(null); }}
        >
          {editMode ? <><Check size={13} /> Done</> : <><Pencil size={13} /> Customize</>}
        </button>
      </div>

      <div className="analytics-grid">
        <AnimatePresence>
          {metrics.map((m, i) => {
            const Icon = ICON_MAP[m.iconKey] || Target;
            const isEditing = editMode && editingId === m.id;

            return (
              <motion.div
                key={m.id}
                className={`analytics-card glass-card ${editMode ? 'editable' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ delay: i * 0.08 }}
                layout
              >
                {isEditing ? (
                  <div className="metric-edit-form">
                    <input
                      className="metric-edit-input"
                      value={draft.label}
                      onChange={e => setDraft(d => ({ ...d, label: e.target.value }))}
                      placeholder="Label"
                    />
                    <input
                      className="metric-edit-input"
                      value={draft.value}
                      onChange={e => setDraft(d => ({ ...d, value: e.target.value }))}
                      placeholder="Value"
                    />
                    <input
                      className="metric-edit-input"
                      value={draft.trend}
                      onChange={e => setDraft(d => ({ ...d, trend: e.target.value }))}
                      placeholder="Trend (e.g. +5%)"
                    />
                    <div className="metric-color-row">
                      {COLOR_PRESETS.map((c, ci) => (
                        <button
                          key={ci}
                          className={`m-color-swatch ${draft.color === c ? 'selected' : ''}`}
                          style={{ background: c }}
                          onClick={() => setDraft(d => ({ ...d, color: c }))}
                        />
                      ))}
                    </div>
                    <div className="metric-trend-toggle">
                      <label>
                        <input type="checkbox" checked={draft.trendUp} onChange={e => setDraft(d => ({ ...d, trendUp: e.target.checked }))} />
                        &nbsp;Trend is positive
                      </label>
                    </div>
                    <div className="edit-action-row">
                      <button className="btn-save-edit" onClick={saveDraft}><Check size={13} /> Save</button>
                      <button className="btn-cancel-edit" onClick={cancelDraft}><X size={13} /> Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="a-card-top">
                      <div className="a-icon-wrapper" style={{ color: m.color, background: `${m.color}22` }}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`a-trend ${m.trendUp ? 'text-green-400' : 'text-red-400'}`}>
                        {m.trend}
                      </span>
                    </div>
                    <div className="a-card-bottom">
                      <span className="a-value">{m.value}</span>
                      <span className="a-label">{m.label}</span>
                    </div>
                    {editMode && (
                      <div className="metric-card-controls">
                        <button className="btn-metric-edit" onClick={() => startEdit(m)}><Pencil size={11} /></button>
                        <button className="btn-metric-delete" onClick={() => removeMetric(m.id)}><Trash2 size={11} /></button>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {editMode && (
          <motion.button
            className="btn-add-metric glass-card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={addMetric}
            layout
          >
            <Plus size={18} />
            <span>Add Metric</span>
          </motion.button>
        )}
      </div>
    </div>
  );
}
