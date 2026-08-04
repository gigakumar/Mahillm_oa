import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, TrendingDown, Target, Zap, RotateCcw, Pencil, Check, X, Plus, Trash2, GripVertical } from 'lucide-react';
import './QuickActions.css';

const ICON_OPTIONS = { RotateCcw, TrendingDown, Zap, Target };
const COLOR_PRESETS = [
  { color: 'var(--accent)', bg: 'rgba(99, 102, 241, 0.15)' },
  { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  { color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.15)' },
  { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' },
];

const DEFAULT_ACTIONS = [
  { id: 'continue', title: 'Continue Last Session', subtitle: 'Thermodynamics • Q. 42', iconKey: 'RotateCcw', colorIdx: 0 },
  { id: 'weakest',  title: 'Improve Weakest Subject', subtitle: 'Fluid Mechanics (56%)', iconKey: 'TrendingDown', colorIdx: 1 },
  { id: 'challenge', title: 'Daily Challenge', subtitle: '20 Mixed Questions • +50 XP', iconKey: 'Zap', colorIdx: 2 },
  { id: 'formula',  title: 'Formula Revision', subtitle: '15 High-Yield Formulas', iconKey: 'Target', colorIdx: 3 },
];

export default function QuickActions({ onNavigate }) {
  const [actions, setActions] = useState(DEFAULT_ACTIONS);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);

  const startEdit = (action) => {
    setEditingId(action.id);
    setDraft({ ...action });
  };
  const saveDraft = () => {
    setActions(prev => prev.map(a => a.id === editingId ? { ...draft } : a));
    setEditingId(null);
    setDraft(null);
  };
  const cancelDraft = () => { setEditingId(null); setDraft(null); };

  const addAction = () => {
    const newId = `action_${Date.now()}`;
    setActions(prev => [...prev, {
      id: newId,
      title: 'New Action',
      subtitle: 'Add a description',
      iconKey: 'Zap',
      colorIdx: Math.floor(Math.random() * COLOR_PRESETS.length)
    }]);
  };

  const removeAction = (id) => {
    setActions(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="quick-actions-container">
      <div className="quick-actions-header">
        <h2>Quick Actions</h2>
        <div className="qa-header-right">
          <motion.button
            className={`btn-edit-mode ${editMode ? 'active' : ''}`}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setEditMode(e => !e); setEditingId(null); setDraft(null); }}
          >
            {editMode ? <><Check size={14} /> Done</> : <><Pencil size={14} /> Edit</>}
          </motion.button>
          <motion.button
            className="resume-studying-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('/oa-practice')}
          >
            <Play className="w-4 h-4 fill-current" />
            Resume Studying
          </motion.button>
        </div>
      </div>

      <div className="actions-grid">
        <AnimatePresence>
          {actions.map((action, idx) => {
            const { color, bg } = COLOR_PRESETS[action.colorIdx] || COLOR_PRESETS[0];
            const Icon = ICON_OPTIONS[action.iconKey] || Zap;
            const isEditing = editMode && editingId === action.id;

            return (
              <motion.div
                key={action.id}
                className={`action-card glass-card ${editMode ? 'edit-mode-active' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: 0.05 * idx }}
                whileHover={!editMode ? { scale: 1.02 } : {}}
                layout
              >
                {isEditing ? (
                  <div className="action-edit-form">
                    <input
                      className="action-edit-input"
                      value={draft.title}
                      onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                      placeholder="Action title"
                    />
                    <input
                      className="action-edit-input sub"
                      value={draft.subtitle}
                      onChange={e => setDraft(d => ({ ...d, subtitle: e.target.value }))}
                      placeholder="Subtitle"
                    />
                    <div className="color-picker-row">
                      {COLOR_PRESETS.map((p, ci) => (
                        <button
                          key={ci}
                          className={`color-swatch ${draft.colorIdx === ci ? 'selected' : ''}`}
                          style={{ background: p.color }}
                          onClick={() => setDraft(d => ({ ...d, colorIdx: ci }))}
                        />
                      ))}
                    </div>
                    <div className="edit-action-row">
                      <button className="btn-save-edit" onClick={saveDraft}><Check size={13} /> Save</button>
                      <button className="btn-cancel-edit" onClick={cancelDraft}><X size={13} /> Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="action-icon-wrapper" style={{ background: bg, color }}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="action-details">
                      <h3>{action.title}</h3>
                      <p>{action.subtitle}</p>
                    </div>
                    {editMode && (
                      <div className="action-edit-controls">
                        <button className="btn-action-edit" onClick={() => startEdit(action)} title="Edit">
                          <Pencil size={13} />
                        </button>
                        <button className="btn-action-delete" onClick={() => removeAction(action.id)} title="Remove">
                          <Trash2 size={13} />
                        </button>
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
            className="btn-add-action glass-card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={addAction}
          >
            <Plus size={18} />
            <span>Add Action</span>
          </motion.button>
        )}
      </div>
    </div>
  );
}
