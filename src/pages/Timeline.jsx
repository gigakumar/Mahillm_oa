import React, { useState, useEffect, useMemo } from 'react';
import { useUserData } from '../contexts/UserDataContext';
import { BookOpen, AlertCircle, CheckCircle, Award } from 'lucide-react';
import './Timeline.css';

export default function Timeline() {
  const { questionProgress, masteryScores } = useUserData();
  const [allQuestions, setAllQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAllPools() {
      try {
        const [me, qa, di, dilr, lr] = await Promise.all([
          import('../data/mechEngQuestions.js'),
          import('../data/quantsQuestions.js'),
          import('../data/dataInterpretationQuestions.js'),
          import('../data/dilrQuestions.js'),
          import('../data/logicalReasoningQuestions.js')
        ]);
        const combined = [...me.default, ...qa.default, ...di.default, ...dilr.default, ...lr.default];
        setAllQuestions(combined);
      } catch (e) {
        console.error("Error loading question sets for timeline page:", e);
      } finally {
        setLoading(false);
      }
    }
    loadAllPools();
  }, []);

  const timelineEvents = useMemo(() => {
    if (loading || !questionProgress || Object.keys(questionProgress).length === 0) return [];

    const events = [];
    const topicTracking = {};

    // Sort progress by date
    const sortedProgress = Object.entries(questionProgress)
      .map(([id, prog]) => {
        const quest = allQuestions.find(q => q.id.toString() === id);
        return {
          id,
          topic: quest ? quest.topic : 'General',
          ...prog
        };
      })
      .filter(p => p.updatedAt)
      .sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));

    sortedProgress.forEach(attempt => {
      const { topic, status, updatedAt } = attempt;
      const date = new Date(updatedAt);
      const dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

      if (!topicTracking[topic]) {
        topicTracking[topic] = { 
          firstAttempt: false, 
          firstCorrect: false,
          correctCount: 0,
          totalQuestions: 0,
          mistakesInRow: 0, 
          state: 'learning' // 'learning', 'mastered', 'forgotten'
        };
      }

      const tracking = topicTracking[topic];
      tracking.totalQuestions += 1;

      // Started
      if (!tracking.firstAttempt) {
        events.push({
          id: `start-${topic}-${updatedAt}`,
          date: date,
          dateStr,
          title: `Started ${topic}`,
          description: `You took your first steps in mastering ${topic}.`,
          type: 'start',
          icon: <BookOpen size={20} />
        });
        tracking.firstAttempt = true;
      }

      if (status === 'correct') {
        tracking.correctCount += 1;
        tracking.mistakesInRow = 0;
        
        // First Correct
        if (!tracking.firstCorrect) {
          events.push({
            id: `first-correct-${topic}-${updatedAt}`,
            date: date,
            dateStr,
            title: `First Correct in ${topic}`,
            description: `You got your first question right in this topic!`,
            type: 'first-correct',
            icon: <CheckCircle size={20} />
          });
          tracking.firstCorrect = true;
        }

        // Recovered
        if (tracking.state === 'forgotten') {
           events.push({
            id: `recover-${topic}-${updatedAt}`,
            date: date,
            dateStr,
            title: `Recovered in ${topic}`,
            description: `You bounced back and regained your footing!`,
            type: 'recovery',
            icon: <CheckCircle size={20} />
          });
          tracking.state = 'learning';
        }

        // Mastery Levels (mocking based on correct count)
        if (tracking.correctCount === 5 && tracking.state !== 'mastered') {
           events.push({
            id: `50-mastery-${topic}-${updatedAt}`,
            date: date,
            dateStr,
            title: `50% Mastery in ${topic}`,
            description: `You're halfway to mastering this topic.`,
            type: 'mastery-50',
            icon: <Award size={20} />
          });
        }
        
        if (tracking.correctCount === 8 && tracking.state !== 'mastered') {
           events.push({
            id: `75-mastery-${topic}-${updatedAt}`,
            date: date,
            dateStr,
            title: `75% Mastery in ${topic}`,
            description: `Almost there! Your skills are sharp.`,
            type: 'mastery-75',
            icon: <Award size={20} />
          });
        }

        if (tracking.correctCount === 10 && tracking.state !== 'mastered') {
           events.push({
            id: `mastered-${topic}-${updatedAt}`,
            date: date,
            dateStr,
            title: `Mastered ${topic}`,
            description: `Outstanding! You have mastered this topic.`,
            type: 'mastery',
            icon: <Award size={20} />
          });
          tracking.state = 'mastered';
        }

      } else if (status === 'incorrect' || status === 'skipped') {
        tracking.mistakesInRow += 1;
        
        // Forgotten
        if (tracking.mistakesInRow >= 3 && tracking.state !== 'forgotten') {
          events.push({
            id: `forgotten-${topic}-${updatedAt}`,
            date: date,
            dateStr,
            title: `Forgotten Concept in ${topic}`,
            description: `You seem to be struggling. Time to review!`,
            type: 'forgotten',
            icon: <AlertCircle size={20} />
          });
          tracking.state = 'forgotten';
        }
      }
    });

    return events.sort((a, b) => a.date - b.date);
  }, [questionProgress, allQuestions, loading, masteryScores]);

  if (loading) {
    return <div className="page-content timeline-loading">Loading your journey...</div>;
  }

  return (
    <div className="page-content timeline-page">
      <header className="timeline-header">
        <h1>Your Learning Journey</h1>
        <p className="subtitle">A chronological story of your preparation.</p>
      </header>

      <div className="timeline-container">
        {timelineEvents.length === 0 ? (
          <div className="timeline-empty">Start practicing to build your timeline!</div>
        ) : (
          <div className="timeline-track">
            {timelineEvents.map((event, index) => (
              <div key={event.id} className={`timeline-card-wrapper ${index % 2 === 0 ? 'left' : 'right'}`} style={{animationDelay: `${index * 0.1}s`}}>
                <div className="timeline-dot-center">{event.icon}</div>
                <div className={`timeline-card type-${event.type}`}>
                  <span className="timeline-date">{event.dateStr}</span>
                  <h3>{event.title}</h3>
                  <p>{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
