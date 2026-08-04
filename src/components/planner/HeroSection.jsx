import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Target, Sparkles } from 'lucide-react';
import './HeroSection.css';

export default function HeroSection({ dueTodayCount = 0 }) {
  return (
    <div className="hero-section">
      {/* Aurora Background */}
      <div className="aurora aurora-1" />
      <div className="aurora aurora-2" />

      <div className="hero-content">
        {/* ── LEFT: Welcome Message ── */}
        <div className="hero-left">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="ai-badge">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>AI Study Coach</span>
            </div>

            <h1 className="hero-title">Intelligent Study Planner</h1>

            <div className="ai-coach-message glass-card" style={{ position: 'relative' }}>
              <Brain className="w-5 h-5 text-purple-400" style={{ flexShrink: 0 }} />
              <p>
                <strong>Welcome back!</strong> Let's review your upcoming tasks and optimize your retention with spaced repetition.
              </p>
            </div>
          </motion.div>
        </div>

        {/* ── RIGHT: Tasks Due ── */}
        <div className="hero-right">
          <motion.div
            className="goal-card glass-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="goal-header">
              <Target className="w-5 h-5 text-emerald-400" />
              <h3>Today's Tasks</h3>
            </div>
            
            <div className="goal-progress-wrap">
              <div className="goal-stats" style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span className="goal-count" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{dueTodayCount}</span>
                <span className="goal-divider" style={{ color: 'var(--text-secondary)' }}> tasks due</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Complete your due tasks to maintain high retention rates across all subjects.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
