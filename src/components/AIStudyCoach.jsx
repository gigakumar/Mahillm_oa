import React, { useMemo } from 'react';
import { Brain, Clock, ChevronRight } from 'lucide-react';
import { generateDailyRecommendations, generateCoachInsight } from '../intelligence/recommendationEngine';
import './AIStudyCoach.css';

export default function AIStudyCoach({ masteryScores, spacedRepetition, questionProgress, mistakes, topicElo }) {
  const recommendations = useMemo(() => {
    return generateDailyRecommendations(masteryScores, spacedRepetition, questionProgress);
  }, [masteryScores, spacedRepetition, questionProgress]);

  const insight = useMemo(() => {
    return generateCoachInsight(mistakes, topicElo);
  }, [mistakes, topicElo]);

  return (
    <div className="ai-coach-card">
      <div className="ai-coach-header">
        <div className="ai-icon-container">
          <Brain className="ai-icon" size={24} />
        </div>
        <div className="ai-title">AI Study Coach</div>
      </div>
      
      <div className="ai-insight-box">
        <p>"{insight}"</p>
      </div>

      <div className="ai-tasks-container">
        <h4 className="ai-tasks-heading">Today's Recommended Plan</h4>
        <div className="ai-tasks-list">
          {recommendations.map((task, idx) => (
            <div key={idx} className={`ai-task-item task-${task.type}`}>
              <div className="ai-task-content">
                <span className="ai-task-title">{task.title}</span>
                <span className="ai-task-meta">
                  <Clock size={14} /> {task.estimatedMinutes} min
                </span>
              </div>
              <ChevronRight size={16} className="ai-task-arrow" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
