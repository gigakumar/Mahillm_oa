import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, Zap, Star } from 'lucide-react';
import './ReviewTasks.css';

export default function ReviewTasks({ highRiskItems, selectedDateOffset }) {
  const navigate = useNavigate();
  
  // Categorize items
  const highPriority = highRiskItems.filter(i => i.pRecall < 0.6);
  const medPriority = highRiskItems.filter(i => i.pRecall >= 0.6 && i.pRecall < 0.8);
  const optional = highRiskItems.filter(i => i.pRecall >= 0.8);

  const renderQueue = (title, items, colorClass) => {
    if (items.length === 0) return null;
    return (
      <div className="task-queue">
        <h4 className={`queue-title ${colorClass}`}>{title} ({items.length})</h4>
        <div className="queue-grid">
          {items.map((item, idx) => {
            const recallPct = Math.round(item.pRecall * 100);
            return (
              <motion.div 
                key={item.questionId || idx} 
                className={`task-card ${colorClass}-border`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -4, boxShadow: '0 8px 25px rgba(0,0,0,0.2)' }}
              >
                <div className="task-top">
                  <span className="task-topic">{item.topic || 'General Mechanical'}</span>
                  <span className={`task-recall ${colorClass}`}>
                    {recallPct}% Recall
                  </span>
                </div>
                
                <h5 className="task-desc">{item.questionText || `Concept Review #${item.questionId || idx + 1}`}</h5>
                
                <div className="task-metrics">
                  <span className="t-metric"><Zap className="w-3 h-3 text-yellow-500" /> +15 XP</span>
                  <span className="t-metric"><Clock className="w-3 h-3" /> ~2m</span>
                  <span className="t-metric">Diff: High</span>
                </div>

                <button className="task-action-btn" onClick={() => navigate('/revision')}>
                  Review Now
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="review-tasks-container">
      <div className="tasks-header">
        <h3>Today's Review Queues</h3>
      </div>
      
      {renderQueue("High Priority (Urgent)", highPriority, "urgent-color")}
      {renderQueue("Medium Priority", medPriority, "med-color")}
      {renderQueue("Optional Revision", optional, "opt-color")}
      
      {/* Mocking formula and missed queues for premium feel */}
      <div className="task-queue">
        <h4 className="queue-title special-color">Formula Flashcards (5)</h4>
        <div className="queue-grid">
          <motion.div className="task-card special-color-border" whileHover={{ y: -4 }}>
            <div className="task-top"><span className="task-topic">Thermodynamics</span></div>
            <h5 className="task-desc">Maxwell Relations & Tds Equations</h5>
            <div className="task-metrics"><span className="t-metric"><Zap className="w-3 h-3 text-yellow-500" /> +25 XP</span><span className="t-metric"><Clock className="w-3 h-3" /> 5m</span></div>
            <button className="task-action-btn" onClick={() => navigate('/revision')}>Practice Formulas</button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
