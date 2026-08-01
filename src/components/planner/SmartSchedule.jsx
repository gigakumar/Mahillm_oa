import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Flame, CheckCircle, Clock, Pencil, Check, X } from 'lucide-react';
import './SmartSchedule.css';

export default function SmartSchedule({ weekSchedule, selectedDateOffset, setSelectedDateOffset }) {
  const [streak, setStreak] = useState(7);
  const [editingStreak, setEditingStreak] = useState(false);
  const [draftStreak, setDraftStreak] = useState(7);

  // Day notes
  const [dayNotes, setDayNotes] = useState({});
  const [editingNoteOffset, setEditingNoteOffset] = useState(null);
  const [draftNote, setDraftNote] = useState('');

  const getStatus = (offset, dueCount) => {
    if (offset < 0) return 'completed';
    if (offset === 0) return dueCount > 0 ? 'urgent' : 'completed';
    return 'upcoming';
  };

  const saveStreak = () => { setStreak(Math.max(0, draftStreak)); setEditingStreak(false); };

  const openNoteEdit = (offset, e) => {
    e.stopPropagation();
    setEditingNoteOffset(offset);
    setDraftNote(dayNotes[offset] || '');
  };
  const saveNote = (e) => {
    e.stopPropagation();
    setDayNotes(prev => ({ ...prev, [editingNoteOffset]: draftNote }));
    setEditingNoteOffset(null);
  };
  const cancelNote = (e) => {
    e.stopPropagation();
    setEditingNoteOffset(null);
  };

  return (
    <div className="smart-schedule-container glass-card">
      <div className="schedule-header">
        <h2>
          <CalendarIcon className="w-5 h-5" /> 7-Day Smart Schedule
        </h2>
        <div className="streak-edit-wrapper">
          {editingStreak ? (
            <div className="streak-edit-inline" onClick={e => e.stopPropagation()}>
              <input
                className="streak-input"
                type="number"
                value={draftStreak}
                min={0}
                onChange={e => setDraftStreak(Number(e.target.value))}
                autoFocus
              />
              <span className="streak-unit">day streak</span>
              <button className="btn-streak-save" onClick={saveStreak}><Check size={13} /></button>
              <button className="btn-streak-cancel" onClick={() => setEditingStreak(false)}><X size={13} /></button>
            </div>
          ) : (
            <div className="streak-indicator" onClick={() => { setDraftStreak(streak); setEditingStreak(true); }} title="Click to edit streak">
              <Flame className="w-5 h-5 text-orange-500" />
              <span>{streak} Day Streak!</span>
              <Pencil size={11} className="streak-edit-icon" />
            </div>
          )}
        </div>
      </div>

      <div className="days-timeline">
        {weekSchedule.map((day, idx) => {
          const status = getStatus(day.offset, day.dueCount);
          const isActive = selectedDateOffset === day.offset;
          const isEditingNote = editingNoteOffset === day.offset;
          const note = dayNotes[day.offset];

          let statusClass = '';
          let StatusIcon = null;

          if (status === 'completed') { statusClass = 'status-green'; StatusIcon = CheckCircle; }
          else if (status === 'urgent') { statusClass = 'status-red'; StatusIcon = Flame; }
          else { statusClass = 'status-yellow'; StatusIcon = Clock; }

          const compPct = status === 'completed' ? 100 : (status === 'urgent' ? 45 : 0);

          return (
            <motion.div
              key={day.offset}
              className={`timeline-day-card ${isActive ? 'active' : ''} ${statusClass}`}
              onClick={() => setSelectedDateOffset(day.offset)}
              whileHover={{ y: -5 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <div className="day-top">
                <span className="day-name">{day.dayName}</span>
                <span className="day-date">{day.dateStr}</span>
              </div>

              <div className="day-metrics">
                <div className="metric-row">
                  <span className="metric-label">Due:</span>
                  <span className="metric-value">{day.dueCount}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Est:</span>
                  <span className="metric-value">{day.dueCount * 2}m</span>
                </div>
              </div>

              <div className="completion-bar">
                <div className="comp-fill" style={{ width: `${compPct}%` }} />
              </div>

              {/* Day Note */}
              {isEditingNote ? (
                <div className="day-note-edit" onClick={e => e.stopPropagation()}>
                  <input
                    className="day-note-input"
                    value={draftNote}
                    onChange={e => setDraftNote(e.target.value)}
                    placeholder="Add a note..."
                    autoFocus
                  />
                  <div className="day-note-actions">
                    <button className="btn-note-save" onClick={saveNote}><Check size={11} /></button>
                    <button className="btn-note-cancel" onClick={cancelNote}><X size={11} /></button>
                  </div>
                </div>
              ) : (
                <div className="day-note-area" onClick={e => openNoteEdit(day.offset, e)}>
                  {note ? (
                    <span className="day-note-text">📝 {note}</span>
                  ) : (
                    <span className="day-note-placeholder">+ note</span>
                  )}
                </div>
              )}

              <div className={`status-icon ${statusClass}`}>
                <StatusIcon className="w-4 h-4" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
