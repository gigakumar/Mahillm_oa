import React from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Flame, CheckCircle, Clock } from 'lucide-react';
import './SmartSchedule.css';

export default function SmartSchedule({ weekSchedule, selectedDateOffset, setSelectedDateOffset }) {
  
  // Helper to determine status color based on offset and due count
  const getStatus = (offset, dueCount) => {
    if (offset < 0) return 'completed'; // past
    if (offset === 0) {
      // today: if due > 0, pending. if 0, completed.
      return dueCount > 0 ? 'urgent' : 'completed';
    }
    return 'upcoming';
  };

  return (
    <div className="smart-schedule-container glass-card">
      <div className="schedule-header">
        <h2>
          <CalendarIcon className="w-5 h-5" /> 7-Day Smart Schedule
        </h2>
        <div className="streak-indicator">
          <Flame className="w-5 h-5 text-orange-500" />
          <span>7 Day Streak!</span>
        </div>
      </div>

      <div className="days-timeline">
        {weekSchedule.map((day, idx) => {
          const status = getStatus(day.offset, day.dueCount);
          const isActive = selectedDateOffset === day.offset;
          
          let statusClass = '';
          let StatusIcon = null;
          
          if (status === 'completed') {
            statusClass = 'status-green';
            StatusIcon = CheckCircle;
          } else if (status === 'urgent') {
            statusClass = 'status-red';
            StatusIcon = Flame;
          } else {
            statusClass = 'status-yellow';
            StatusIcon = Clock;
          }

          // Mock completion %
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
                <div className="comp-fill" style={{ width: `${compPct}%` }}></div>
              </div>

              {/* Status Indicator Icon */}
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
