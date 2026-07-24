import React from 'react';
import { motion } from 'framer-motion';
import { Play, TrendingDown, Target, Zap, RotateCcw } from 'lucide-react';
import './QuickActions.css';

const actions = [
  {
    id: 'continue',
    title: 'Continue Last Session',
    subtitle: 'Thermodynamics • Q. 42',
    icon: RotateCcw,
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.15)'
  },
  {
    id: 'weakest',
    title: 'Improve Weakest Subject',
    subtitle: 'Fluid Mechanics (56%)',
    icon: TrendingDown,
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.15)'
  },
  {
    id: 'challenge',
    title: 'Daily Challenge',
    subtitle: '20 Mixed Questions • +50 XP',
    icon: Zap,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)'
  },
  {
    id: 'formula',
    title: 'Formula Revision',
    subtitle: '15 High-Yield Formulas',
    icon: Target,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)'
  }
];

export default function QuickActions({ onNavigate }) {
  return (
    <div className="quick-actions-container">
      <div className="quick-actions-header">
        <h2>Quick Actions</h2>
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

      <div className="actions-grid">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.id}
              className="action-card glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * idx }}
              whileHover={{ 
                scale: 1.02, 
                rotateX: 5, 
                rotateY: 5, 
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)' 
              }}
            >
              <div className="action-icon-wrapper" style={{ background: action.bg, color: action.color }}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="action-details">
                <h3>{action.title}</h3>
                <p>{action.subtitle}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
