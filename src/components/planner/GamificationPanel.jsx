import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Trophy, Medal, Star } from 'lucide-react';
import './GamificationPanel.css';

export default function GamificationPanel() {
  const subjects = [
    { name: 'Thermodynamics', progress: 92, color: '#ec4899' },
    { name: 'SOM', progress: 74, color: '#10b981' },
    { name: 'FM', progress: 56, color: '#ef4444' },
    { name: 'TOM', progress: 81, color: '#3b82f6' }
  ];

  return (
    <div className="gamification-container">
      {/* User Level */}
      <div className="level-card glass-card">
        <div className="level-header">
          <div className="l-left">
            <div className="level-badge">
              <Crown className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h3>Level 12 Scholar</h3>
              <p>Next Rank in 230 XP</p>
            </div>
          </div>
          <div className="l-right">
            <span className="total-xp">1,476 XP</span>
          </div>
        </div>
        <div className="xp-bar-wrapper">
          <div className="xp-bar-bg">
            <motion.div 
              className="xp-bar-fill" 
              initial={{ width: 0 }}
              animate={{ width: '75%' }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Subject Mastery Chips */}
      <div className="mastery-section">
        <h4>Subject Mastery</h4>
        <div className="mastery-chips">
          {subjects.map((sub, idx) => (
            <motion.div 
              key={sub.name} 
              className="mastery-chip"
              whileHover={{ y: -3 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="m-chip-top">
                <span className="m-name">{sub.name}</span>
                <span className="m-pct" style={{ color: sub.color }}>{sub.progress}%</span>
              </div>
              <div className="m-bar-bg">
                <div className="m-bar-fill" style={{ width: `${sub.progress}%`, background: sub.color }} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
