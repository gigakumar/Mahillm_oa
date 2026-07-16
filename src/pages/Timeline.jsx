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
        topicTracking[topic] = { firstAttempt: false, mistakesInRow: 0, recovered: false };
      }

      const tracking = topicTracking[topic];

      // First attempt
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

      if (status === 'incorrect' || status === 'skipped') {
        tracking.mistakesInRow += 1;
        tracking.recovered = false;
        if (tracking.mistakesInRow === 3) {
          events.push({
            id: `weak-${topic}-${updatedAt}`,
            date: date,
            dateStr,
            title: `Weakness detected in ${topic}`,
            description: `You struggled with multiple questions in a row. Time to review!`,
            type: 'weakness',
            icon: <AlertCircle size={20} />
          });
        }
      } else if (status === 'correct') {
        if (tracking.mistakesInRow >= 3 && !tracking.recovered) {
          events.push({
            id: `recover-${topic}-${updatedAt}`,
            date: date,
            dateStr,
            title: `Recovered in ${topic}`,
            description: `Great job! You bounced back and answered correctly.`,
            type: 'recovery',
            icon: <CheckCircle size={20} />
          });
          tracking.recovered = true;
        }
        tracking.mistakesInRow = 0;
      }
    });

    // Mastered events from masteryScores
    if (masteryScores) {
      Object.entries(masteryScores).forEach(([key, doc]) => {
        if (doc.score > 0.8 && doc.lastUpdated) {
          events.push({
            id: `master-${doc.topic}-${doc.lastUpdated}`,
            date: new Date(doc.lastUpdated),
            dateStr: new Date(doc.lastUpdated).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
            title: `${doc.topic} Mastered`,
            description: `You achieved a high mastery score in this topic!`,
            type: 'mastery',
            icon: <Award size={20} />
          });
        }
      });
    }

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
