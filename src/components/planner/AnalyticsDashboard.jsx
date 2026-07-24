import React from 'react';
import { motion } from 'framer-motion';
import { Target, Clock, Activity, Crosshair, Award, BatteryCharging } from 'lucide-react';
import './AnalyticsDashboard.css';

export default function AnalyticsDashboard() {
  const metrics = [
    { label: 'Accuracy', value: '78%', trend: '+5%', icon: Target, color: '#10b981', trendUp: true },
    { label: 'Avg Recall', value: '82%', trend: '+2%', icon: Activity, color: '#6366f1', trendUp: true },
    { label: 'Questions Today', value: '124', trend: '+18', icon: Crosshair, color: '#f59e0b', trendUp: true },
    { label: 'Time Studied', value: '2h 15m', trend: '+30m', icon: Clock, color: '#3b82f6', trendUp: true },
    { label: 'Predicted Rank', value: 'Top 5%', trend: 'Improving', icon: Award, color: '#8b5cf6', trendUp: true },
    { label: 'Focus Score', value: '92/100', trend: 'High', icon: BatteryCharging, color: '#ec4899', trendUp: true }
  ];

  return (
    <div className="analytics-dashboard-container">
      <h3>Performance Snapshot</h3>
      <div className="analytics-grid">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div 
              key={i} 
              className="analytics-card glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5, boxShadow: '0 8px 25px rgba(0,0,0,0.15)' }}
            >
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
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
