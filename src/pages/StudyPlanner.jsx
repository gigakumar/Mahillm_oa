import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUserData } from '../contexts/UserDataContext';
import { predictForgettingRisks, calculateRetentionProbability } from '../intelligence/forgettingPredictor';
import { BookOpen } from 'lucide-react';

import HeroSection from '../components/planner/HeroSection';
import QuickActions from '../components/planner/QuickActions';
import SmartSchedule from '../components/planner/SmartSchedule';
import ReviewTasks from '../components/planner/ReviewTasks';
import AnalyticsDashboard from '../components/planner/AnalyticsDashboard';
import GamificationPanel from '../components/planner/GamificationPanel';
import EmptyState from '../components/planner/EmptyState';

import './StudyPlanner.css';

export default function StudyPlanner() {
  const navigate = useNavigate();
  const { spacedRepetition } = useUserData();

  const [selectedDateOffset, setSelectedDateOffset] = useState(0); // 0 = Today
  const [selectedSubject, setSelectedSubject] = useState('All');

  const now = new Date();
  const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + selectedDateOffset);

  // Compute Spaced Repetition queue items
  const srItems = useMemo(() => {
    return Object.values(spacedRepetition || {}).map(item => {
      const pRecall = calculateRetentionProbability({
        lastReviewedTime: item.lastReviewed,
        stabilityHours: (item.intervalDays || 1) * 24,
        currentTime: currentDate.getTime()
      });

      const nextReviewDate = new Date(item.nextReviewDate || (item.lastReviewed + (item.intervalDays || 1) * 86400000));
      const isDue = nextReviewDate <= currentDate;

      return {
        ...item,
        pRecall,
        risk: parseFloat((1 - pRecall).toFixed(3)),
        nextReviewDate,
        isDue
      };
    });
  }, [spacedRepetition, selectedDateOffset]);

  const highRiskItems = useMemo(() => {
    return srItems
      .filter(item => selectedSubject === 'All' || item.subject === selectedSubject || item.topic === selectedSubject)
      .sort((a, b) => b.risk - a.risk);
  }, [srItems, selectedSubject]);

  const dueTodayCount = useMemo(() => {
    return srItems.filter(item => item.isDue).length;
  }, [srItems]);

  const weekSchedule = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const dayStart = d.getTime();
      const dayEnd = dayStart + 86400000;

      const dueCount = srItems.filter(item => {
        const reviewTime = item.nextReviewDate.getTime();
        return reviewTime >= dayStart && reviewTime < dayEnd;
      }).length;

      days.push({
        offset: i,
        dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateStr: `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`,
        dueCount
      });
    }
    return days;
  }, [srItems]);

  const subjectsList = ['All', 'Thermodynamics', 'Fluid Mechanics', 'Strength of Materials', 'Theory of Machines', 'Manufacturing Science'];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div 
      className="study-planner-container"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants}>
        <HeroSection dueTodayCount={dueTodayCount} />
      </motion.div>

      <motion.div variants={itemVariants}>
        <QuickActions onNavigate={navigate} />
      </motion.div>

      <motion.div variants={itemVariants}>
        <AnalyticsDashboard />
      </motion.div>

      <div className="planner-main-grid">
        <div className="planner-left-col">
          <motion.div variants={itemVariants}>
            <SmartSchedule 
              weekSchedule={weekSchedule} 
              selectedDateOffset={selectedDateOffset} 
              setSelectedDateOffset={setSelectedDateOffset} 
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            {/* Subject Filter Bar */}
            <div className="planner-filter-bar glass-card">
              <span className="filter-title"><BookOpen className="w-4 h-4" /> Subject Filter:</span>
              <div className="filter-pills">
                {subjectsList.map(sub => (
                  <button
                    key={sub}
                    className={`filter-pill ${selectedSubject === sub ? 'active' : ''}`}
                    onClick={() => setSelectedSubject(sub)}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            {highRiskItems.length === 0 ? (
              <EmptyState />
            ) : (
              <ReviewTasks highRiskItems={highRiskItems} selectedDateOffset={selectedDateOffset} />
            )}
          </motion.div>
        </div>

        <div className="planner-right-col">
          <motion.div variants={itemVariants}>
            <GamificationPanel />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
