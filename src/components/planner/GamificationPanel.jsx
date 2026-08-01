import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Pencil, Check, X, Plus, Trash2 } from 'lucide-react';
import './GamificationPanel.css';

const COLOR_OPTIONS = ['#ec4899', '#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#14b8a6', '#6366f1'];

const DEFAULT_SUBJECTS = [
  { id: 's1', name: 'Thermodynamics', progress: 92, color: '#ec4899' },
  { id: 's2', name: 'SOM', progress: 74, color: '#10b981' },
  { id: 's3', name: 'FM', progress: 56, color: '#ef4444' },
  { id: 's4', name: 'TOM', progress: 81, color: '#3b82f6' },
];

export default function GamificationPanel() {
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
  const [level, setLevel] = useState('Level 12 Scholar');
  const [xp, setXp] = useState(1476);
  const [nextRankXp, setNextRankXp] = useState(230);
  const [xpTotal, setXpTotal] = useState(1706); // xp + nextRankXp

  const [editMode, setEditMode] = useState(false);

  // Level edit
  const [editingLevel, setEditingLevel] = useState(false);
  const [draftLevel, setDraftLevel] = useState(level);
  const [draftXp, setDraftXp] = useState(xp);
  const [draftNextRankXp, setDraftNextRankXp] = useState(nextRankXp);

  // Subject edit
  const [editingSubId, setEditingSubId] = useState(null);
  const [draftSub, setDraftSub] = useState(null);

  // Computed XP bar fill
  const xpPercent = Math.min(100, Math.round((xp / (xp + nextRankXp)) * 100));

  // Level save
  const openLevelEdit = () => {
    setDraftLevel(level); setDraftXp(xp); setDraftNextRankXp(nextRankXp);
    setEditingLevel(true);
  };
  const saveLevelEdit = () => {
    setLevel(draftLevel);
    setXp(Math.max(0, draftXp));
    setNextRankXp(Math.max(1, draftNextRankXp));
    setEditingLevel(false);
  };

  // Subject edit
  const startSubEdit = (s) => { setEditingSubId(s.id); setDraftSub({ ...s }); };
  const saveSubEdit = () => {
    setSubjects(prev => prev.map(s => s.id === editingSubId ? { ...draftSub, progress: Math.min(100, Math.max(0, Number(draftSub.progress))) } : s));
    setEditingSubId(null); setDraftSub(null);
  };
  const cancelSubEdit = () => { setEditingSubId(null); setDraftSub(null); };

  const addSubject = () => {
    setSubjects(prev => [...prev, {
      id: `s${Date.now()}`,
      name: 'New Subject',
      progress: 50,
      color: COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)]
    }]);
  };
  const removeSub = (id) => setSubjects(prev => prev.filter(s => s.id !== id));

  return (
    <div className="gamification-container">
      {/* User Level Card */}
      <div className="level-card glass-card" style={{ position: 'relative' }}>
        {editingLevel ? (
          <div className="level-edit-form">
            <label className="gedit-label">Level Name</label>
            <input className="gedit-input" value={draftLevel} onChange={e => setDraftLevel(e.target.value)} placeholder="e.g. Level 12 Scholar" />
            <label className="gedit-label">Current XP</label>
            <input className="gedit-input" type="number" value={draftXp} min={0} onChange={e => setDraftXp(Number(e.target.value))} />
            <label className="gedit-label">XP to Next Rank</label>
            <input className="gedit-input" type="number" value={draftNextRankXp} min={1} onChange={e => setDraftNextRankXp(Number(e.target.value))} />
            <div className="gedit-action-row">
              <button className="btn-gsave" onClick={saveLevelEdit}><Check size={13} /> Save</button>
              <button className="btn-gcancel" onClick={() => setEditingLevel(false)}><X size={13} /> Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div className="level-header">
              <div className="l-left">
                <div className="level-badge">
                  <Crown className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3>{level}</h3>
                  <p>Next Rank in {nextRankXp} XP</p>
                </div>
              </div>
              <div className="l-right">
                <span className="total-xp">{xp.toLocaleString()} XP</span>
              </div>
            </div>
            <div className="xp-bar-wrapper">
              <div className="xp-bar-bg">
                <motion.div
                  className="xp-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPercent}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </div>
            </div>
            <button className="btn-level-edit" title="Edit XP & Level" onClick={openLevelEdit}>
              <Pencil size={13} />
            </button>
          </>
        )}
      </div>

      {/* Subject Mastery */}
      <div className="mastery-section">
        <div className="mastery-header-row">
          <h4>Subject Mastery</h4>
          <button
            className={`btn-mastery-edit ${editMode ? 'active' : ''}`}
            onClick={() => { setEditMode(e => !e); setEditingSubId(null); setDraftSub(null); }}
          >
            {editMode ? <><Check size={12} /> Done</> : <><Pencil size={12} /> Edit</>}
          </button>
        </div>

        <div className="mastery-chips">
          <AnimatePresence>
            {subjects.map((sub, idx) => (
              <motion.div
                key={sub.id}
                className={`mastery-chip ${editMode ? 'chip-edit-mode' : ''}`}
                whileHover={!editMode ? { y: -3 } : {}}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: idx * 0.07 }}
                layout
              >
                {editingSubId === sub.id && draftSub ? (
                  <div className="sub-edit-form">
                    <input
                      className="sub-edit-input"
                      value={draftSub.name}
                      onChange={e => setDraftSub(d => ({ ...d, name: e.target.value }))}
                      placeholder="Subject name"
                    />
                    <div className="sub-progress-row">
                      <input
                        className="sub-edit-input pct"
                        type="number"
                        value={draftSub.progress}
                        min={0} max={100}
                        onChange={e => setDraftSub(d => ({ ...d, progress: e.target.value }))}
                      />
                      <span className="sub-pct-sign">%</span>
                    </div>
                    <div className="sub-color-row">
                      {COLOR_OPTIONS.map((c, ci) => (
                        <button
                          key={ci}
                          className={`sub-color-swatch ${draftSub.color === c ? 'selected' : ''}`}
                          style={{ background: c }}
                          onClick={() => setDraftSub(d => ({ ...d, color: c }))}
                        />
                      ))}
                    </div>
                    <div className="gedit-action-row">
                      <button className="btn-gsave small" onClick={saveSubEdit}><Check size={11} /></button>
                      <button className="btn-gcancel small" onClick={cancelSubEdit}><X size={11} /></button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="m-chip-top">
                      <span className="m-name">{sub.name}</span>
                      <span className="m-pct" style={{ color: sub.color }}>{sub.progress}%</span>
                    </div>
                    <div className="m-bar-bg">
                      <motion.div
                        className="m-bar-fill"
                        style={{ background: sub.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${sub.progress}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.1 }}
                      />
                    </div>
                    {editMode && (
                      <div className="chip-controls">
                        <button className="btn-chip-edit" onClick={() => startSubEdit(sub)}><Pencil size={11} /></button>
                        <button className="btn-chip-delete" onClick={() => removeSub(sub.id)}><Trash2 size={11} /></button>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {editMode && (
            <motion.button
              className="btn-add-subject"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={addSubject}
              layout
            >
              <Plus size={14} /> Add Subject
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
