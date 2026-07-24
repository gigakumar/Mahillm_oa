import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Brain, Target, Sparkles } from 'lucide-react';
import './HeroSection.css';

const data = [
  { day: 'Day 1', retention: 100 },
  { day: 'Day 2', retention: 85 },
  { day: 'Day 3', retention: 92 }, // after review
  { day: 'Day 4', retention: 80 },
  { day: 'Day 5', retention: 88 },
  { day: 'Day 6', retention: 76 },
  { day: 'Day 7', retention: 84 },
];

export default function HeroSection({ dueTodayCount = 0 }) {
  // Mock data for completion ring
  const completed = 8;
  const total = 18;
  const percentage = Math.round((completed / total) * 100);

  return (
    <div className="hero-section">
      {/* Aurora Background Elements */}
      <div className="aurora aurora-1"></div>
      <div className="aurora aurora-2"></div>
      
      <div className="hero-content">
        <div className="hero-left">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="ai-badge">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>AI Study Coach</span>
            </div>
            
            <h1 className="hero-title">Intelligent Study Planner</h1>
            
            <div className="ai-coach-message glass-card">
              <Brain className="w-5 h-5 text-purple-400" />
              <p>
                <strong>AI Insight:</strong> Your Fluid Mechanics retention dropped 14% over the last 5 days. 
                Reviewing Bernoulli today could recover approximately 12% retention.
              </p>
            </div>
          </motion.div>
        </div>

        <div className="hero-right">
          {/* Today's Goal */}
          <motion.div 
            className="goal-card glass-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="goal-header">
              <Target className="w-5 h-5 text-emerald-400" />
              <h3>Today's Goal</h3>
            </div>
            <p className="goal-subtext">Review {total} Questions • 35 mins</p>
            
            <div className="progress-ring-container">
              <svg className="progress-ring" width="100" height="100">
                <circle className="progress-ring__circle" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="transparent" r="40" cx="50" cy="50"/>
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
          </motion.div>

          {/* Retention Graph */}
          <motion.div 
            className="retention-card glass-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4>Memory Retention</h4>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="retention" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRetention)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
