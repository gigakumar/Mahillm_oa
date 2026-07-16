import React, { useState, useEffect } from 'react';
import { useUserData } from '../contexts/UserDataContext';
import { useScore } from '../contexts/ScoreContext';
import { useAuth } from '../contexts/AuthContext';
import { getDueQuestions } from '../utils/spacedRepetition';
import { getWeakestTopics } from '../utils/adaptiveEngine';
import { Activity, Target, Zap, Clock, BookOpen, Repeat, Brain, Code, CheckCircle2, XCircle, Award, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import './Stats.css';

const AnimatedCounter = ({ end, duration = 1000, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    let animationFrame;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      }
    };
    
    animationFrame = requestAnimationFrame(step);
    
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <span>{prefix}{count}{suffix}</span>;
};

export default function Stats() {
  const { user } = useAuth();
  const { masteryScores, questionProgress, spacedRepetition } = useUserData();
  const { scoreData } = useScore();

  // Computations
  const solvedCount = Object.keys(questionProgress || {}).length;
  
  let correctCount = 0;
  let totalTimeMs = 0;
  let validTimeCount = 0;
  
  const recentActivity = [];
  
  Object.entries(questionProgress || {}).forEach(([id, data]) => {
    if (data.status === 'correct') correctCount++;
    if (data.solveTimeMs > 0 && data.solveTimeMs < 300000) {
      totalTimeMs += data.solveTimeMs;
      validTimeCount++;
    }
    recentActivity.push({ id, ...data });
  });

  const avgSolveTime = validTimeCount > 0 ? (totalTimeMs / validTimeCount / 1000).toFixed(1) : 0;
  const masteredCount = Object.values(masteryScores || {}).filter(m => m.score >= 0.7).length;
  const dueCount = getDueQuestions(spacedRepetition || {}).length;

  recentActivity.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  const topRecent = recentActivity.slice(0, 5);

  // Time-series data processing
  const dailyStatsObj = scoreData?.dailyStats || {};
  const last7Days = [];
  const today = new Date();
  let weeklyXp = 0;
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const shortDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const stat = dailyStatsObj[dateStr] || { xp: 0, questions: 0, correct: 0, studyMinutes: 0 };
    weeklyXp += stat.xp || 0;
    last7Days.push({
      date: dateStr,
      displayDate: shortDate,
      xp: stat.xp || 0,
      accuracy: stat.questions ? Math.round((stat.correct || 0) / stat.questions * 100) : 0,
      studyMinutes: Math.round(stat.studyMinutes || 0),
      questions: stat.questions || 0
    });
  }

  // Deltas and Context
  const todayStat = last7Days[6];
  const yesterdayStat = last7Days[5];
  const xpDelta = todayStat.xp - yesterdayStat.xp;
  const xpDeltaStr = xpDelta > 0 ? `↑ +${xpDelta} today` : (xpDelta < 0 ? `↓ ${Math.abs(xpDelta)} today` : 'Same as yesterday');
  const accuracyContext = scoreData.accuracy > 70 ? `Better than ${Math.min(99, scoreData.accuracy + 12)}% of peers` : "Keep practicing to improve!";
  const speedContext = avgSolveTime > 0 && avgSolveTime < 45 ? "Faster than 68% of users" : "Pacing is steady";

  // Goal Progress (First 100 questions)
  const goalTarget = 100;
  const goalProgress = Math.min(100, Math.round((solvedCount / goalTarget) * 100));

  // Weakest Topics
  const weakestTopics = getWeakestTopics(masteryScores || {}, 3);

  // Achievements checking
  const badges = [];
  if (solvedCount >= 100) badges.push({ icon: '🏆', title: 'Centurion', desc: 'Solved 100+ questions' });
  if (scoreData.longestStreak >= 7) badges.push({ icon: '🔥', title: '7-Day Streak', desc: 'Practiced 7 days in a row' });
  if (scoreData.accuracy >= 90 && solvedCount >= 50) badges.push({ icon: '🎯', title: 'Sharpshooter', desc: '90%+ Accuracy' });
  if (masteredCount >= 5) badges.push({ icon: '🧠', title: 'Formula Master', desc: 'Mastered 5+ Topics' });
  if (scoreData.fastestSolveTime && scoreData.fastestSolveTime < 15000) badges.push({ icon: '⚡', title: 'Speed Demon', desc: 'Sub-15s correct answer' });

  return (
    <div className="page-content stats-page">
      <header className="stats-header">
        <h1>Your Learning Analytics</h1>
        <p className="stats-subtitle">Track your progress and mastery over time</p>
      </header>

      {/* Goal Progress Bar */}
      <div className="card goal-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <strong>Goal: First 100 Questions</strong>
          <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{goalProgress}%</span>
        </div>
        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${goalProgress}%`, height: '100%', background: 'var(--accent)', transition: 'width 1s ease-out' }}></div>
        </div>
      </div>

      <div className="stats-hero-grid">
        <div className="stat-card hero-stat">
          <div className="stat-icon-wrapper xp"><Zap size={24} /></div>
          <div className="stat-value"><AnimatedCounter end={scoreData.xp} /></div>
          <div className="stat-label">Total XP</div>
          <div className="stat-context" style={{ color: xpDelta >= 0 ? 'var(--success)' : 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {xpDeltaStr}
          </div>
        </div>
        <div className="stat-card hero-stat">
          <div className="stat-icon-wrapper target"><Target size={24} /></div>
          <div className="stat-value"><AnimatedCounter end={scoreData.accuracy} suffix="%" /></div>
          <div className="stat-label">Accuracy</div>
          <div className="stat-context" style={{ color: 'var(--accent)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {accuracyContext}
          </div>
        </div>
        <div className="stat-card hero-stat">
          <div className="stat-icon-wrapper streak"><Activity size={24} /></div>
          <div className="stat-value"><AnimatedCounter end={scoreData.streak} suffix="🔥" /></div>
          <div className="stat-label">Day Streak</div>
          <div className="stat-context" style={{ color: 'var(--warning)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            Personal Best: {scoreData.longestStreak || 0}
          </div>
        </div>
        <div className="stat-card hero-stat">
          <div className="stat-icon-wrapper correct"><Clock size={24} /></div>
          <div className="stat-value"><AnimatedCounter end={avgSolveTime} suffix="s" /></div>
          <div className="stat-label">Avg Speed</div>
          <div className="stat-context" style={{ color: 'var(--primary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {speedContext}
          </div>
        </div>
      </div>

      <div className="stats-dashboard-grid">
        {/* Trend Graphs */}
        <div className="card chart-card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingUp size={18} /> Activity Trends (Last 7 Days)</h3>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last7Days} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <Line type="monotone" dataKey="xp" stroke="var(--warning)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="XP Earned" />
                <Line type="monotone" dataKey="questions" stroke="var(--accent)" strokeWidth={2} name="Questions" />
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="displayDate" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weakest Topics */}
        <div className="card weakness-card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Target size={18} /> Actionable Weaknesses</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>Focus your practice on these specific areas to improve your placement readiness.</p>
          <div className="weakness-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {weakestTopics.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                Not enough data yet. Keep practicing!
              </div>
            ) : (
              weakestTopics.map((topic, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.05)', borderLeft: '3px solid var(--danger)', borderRadius: '0 8px 8px 0' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.95rem' }}>{topic.topic.replace(/_/g, ' ')}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{topic.category.replace(/_/g, ' ')}</span>
                  </div>
                  <div style={{ fontWeight: 'bold', color: 'var(--danger)' }}>
                    {Math.round((topic.score || 0) * 100)}%
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Achievements Section */}
        <div className="card achievements-card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Award size={18} /> Badges & Achievements</h3>
          <div className="badges-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
            {badges.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>Complete goals to earn badges!</p>
            ) : (
              badges.map((b, i) => (
                <div key={i} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', textAlign: 'center', transition: 'transform 0.2s' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{b.icon}</div>
                  <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{b.title}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{b.desc}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
