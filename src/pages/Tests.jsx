import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../contexts/UserDataContext';
import { useScore } from '../contexts/ScoreContext';
import { Award, Clipboard, Plus, BarChart2 } from 'lucide-react';
import { MOCK_TESTS } from '../data/mockSeriesConfig';

// Sub-components
import TestsHero from '../components/tests/TestsHero';
import PerformanceCards from '../components/tests/PerformanceCards';
import TestsQuickActions from '../components/tests/TestsQuickActions';
import MockGrid from '../components/tests/MockGrid';
import TestsSidebar from '../components/tests/TestsSidebar';
import CustomTestBuilder from '../components/tests/CustomTestBuilder';

import './Tests.css';

const PRESETS = [
  { id: 'quick', name: 'Quick Test ⚡', desc: '10 random questions, 15 minutes. Great for a quick daily sprint.', count: 10, time: 15, dist: { ME: 40, QA: 30, LR: 20, DI: 10 } },
  { id: 'standard', name: 'Standard OA 📋', desc: '30 questions, 45 minutes. Mimics typical first-round placement assessments.', count: 30, time: 45, dist: { ME: 50, QA: 20, LR: 15, DI: 15 } },
  { id: 'full', name: 'Full OA Simulation 🏆', desc: '50 questions, 60 minutes. High-pressure mixed placement simulation.', count: 50, time: 60, dist: { ME: 60, QA: 20, LR: 10, DI: 10 } },
  { id: 'mechanical', name: 'Mechanical Technical 🔩', desc: '50 core mechanical engineering questions, 60 minutes. Gate/PSU format.', count: 50, time: 60, dist: { ME: 100, QA: 0, LR: 0, DI: 0 } },
  { id: 'thermo_special', name: 'Thermodynamics & Heat Transfer 🌡️', desc: '20 targeted thermal engineering questions, 30 minutes.', count: 20, time: 30, dist: { ME: 100, QA: 0, LR: 0, DI: 0 } },
  { id: 'som_design', name: 'SOM & Machine Design ⚙️', desc: '20 solid mechanics & machine element questions, 30 minutes.', count: 20, time: 30, dist: { ME: 100, QA: 0, LR: 0, DI: 0 } },
  { id: 'fluids_sprint', name: 'Fluid Mechanics & Hydraulics 🌊', desc: '20 fluid dynamics & turbo-machinery questions, 30 minutes.', count: 20, time: 30, dist: { ME: 100, QA: 0, LR: 0, DI: 0 } },
  { id: 'aptitude', name: 'General Aptitude Round 🧮', desc: '30 general aptitude & reasoning questions, 30 minutes.', count: 30, time: 30, dist: { ME: 0, QA: 50, LR: 30, DI: 20 } }
];

export default function Tests() {
  const { user } = useAuth();
  const { testHistory = [], masteryScores = {}, questionProgress = {}, loading: historyLoading } = useUserData();
  const { scoreData } = useScore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('mocks');

  // ── Derived Stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const weekAgoStr = new Date(now - 7 * 86400000).toISOString().split('T')[0];

    // --- Questions solved this week (from dailyStats) ---
    const dailyStats = scoreData?.dailyStats || {};
    let weekQuestions = 0;
    let weekCorrect = 0;
    let weekStudyMs = 0;
    Object.entries(dailyStats).forEach(([date, ds]) => {
      if (date >= weekAgoStr) {
        weekQuestions += ds.questions || 0;
        weekCorrect += ds.correct || 0;
        weekStudyMs += (ds.studyMinutes || 0) * 60000;
      }
    });

    // --- Total study time this week (from questionProgress) ---
    const weekProgressEntries = Object.values(questionProgress).filter(p => {
      if (!p.updatedAt) return false;
      const d = new Date(p.updatedAt).toISOString().split('T')[0];
      return d >= weekAgoStr;
    });
    const weekQsSolvedFromProgress = weekProgressEntries.length;

    // --- Total questions solved (questionProgress) ---
    const totalQsSolved = Object.keys(questionProgress).length;

    // --- Accuracy from scoreData ---
    const accuracy = scoreData?.accuracy || 0;

    // --- Last week accuracy (estimated from dailyStats) ---
    const prevWeekStr = new Date(now - 14 * 86400000).toISOString().split('T')[0];
    let prevWeekCorrect = 0, prevWeekQs = 0;
    Object.entries(dailyStats).forEach(([date, ds]) => {
      if (date >= prevWeekStr && date < weekAgoStr) {
        prevWeekCorrect += ds.correct || 0;
        prevWeekQs += ds.questions || 0;
      }
    });
    const prevAccuracy = prevWeekQs > 0 ? Math.round((prevWeekCorrect / prevWeekQs) * 100) : accuracy;
    const accuracyDelta = accuracy - prevAccuracy;

    // --- Study time this week (sum of studyMinutes from dailyStats) ---
    let weekStudyMinutes = 0;
    Object.entries(dailyStats).forEach(([date, ds]) => {
      if (date >= weekAgoStr) weekStudyMinutes += ds.studyMinutes || 0;
    });
    const weekStudyHrs = Math.floor(weekStudyMinutes / 60);
    const weekStudyRemMins = Math.round(weekStudyMinutes % 60);

    // --- Previous week study time ---
    let prevWeekStudyMinutes = 0;
    Object.entries(dailyStats).forEach(([date, ds]) => {
      if (date >= prevWeekStr && date < weekAgoStr) prevWeekStudyMinutes += ds.studyMinutes || 0;
    });
    const studyTimeDelta = weekStudyMinutes - prevWeekStudyMinutes;
    const studyDeltaHrs = Math.floor(Math.abs(studyTimeDelta) / 60);
    const studyDeltaMins = Math.round(Math.abs(studyTimeDelta) % 60);

    // --- Average time per question (fastest solve time proxy) ---
    const avgTimeMs = scoreData?.fastestSolveTime
      ? Math.round(scoreData.fastestSolveTime / 1000)
      : 84; // fallback 1m 24s
    const avgTimeMins = Math.floor(avgTimeMs / 60);
    const avgTimeSecs = avgTimeMs % 60;

    // --- Mocks completed this week ---
    const mocksThisWeek = testHistory.filter(t => {
      const d = t.completedAt || t.startedAt;
      if (!d) return false;
      const dateStr = new Date(d).toISOString().split('T')[0];
      return dateStr >= weekAgoStr;
    }).length;

    const totalMocks = testHistory.length;

    // --- Streak ---
    const streak = scoreData?.streak || 0;
    const longestStreak = scoreData?.longestStreak || 0;

    // --- Predicted rank based on accuracy ---
    let predictedRank = 'Top 50%';
    if (accuracy >= 90) predictedRank = 'Top 5%';
    else if (accuracy >= 80) predictedRank = 'Top 10%';
    else if (accuracy >= 70) predictedRank = 'Top 18%';
    else if (accuracy >= 60) predictedRank = 'Top 25%';
    else if (accuracy >= 50) predictedRank = 'Top 35%';

    // --- Weakest topic from masteryScores ---
    const topicEntries = Object.entries(masteryScores)
      .map(([key, val]) => ({
        key,
        name: val.topic || key.split('__')[1] || key,
        score: val.probabilityKnown || val.score || 0,
        attempts: val.attemptsCount || val.attempts || 0
      }))
      .filter(t => t.attempts >= 3);

    const weakestTopic = topicEntries.sort((a, b) => a.score - b.score)[0] || null;
    const weakestTopicName = weakestTopic
      ? (weakestTopic.name.length > 20 ? weakestTopic.name.substring(0, 20) + '…' : weakestTopic.name)
      : 'Heat Transfer';
    const weakestTopicAccuracy = weakestTopic
      ? Math.round(weakestTopic.score * 100)
      : null;

    // --- Consistency score (based on days active this week vs 7) ---
    const activeDays = new Set(
      Object.keys(dailyStats).filter(d => d >= weekAgoStr && (dailyStats[d].questions || 0) > 0)
    ).size;
    const consistencyScore = Math.round((activeDays / 7) * 100);

    // --- Last mock for hero ---
    const sortedMocks = [...testHistory].sort((a, b) => {
      const ta = a.completedAt || a.startedAt || 0;
      const tb = b.completedAt || b.startedAt || 0;
      return new Date(tb) - new Date(ta);
    });
    const lastMock = sortedMocks[0] || null;

    // --- Performance trend (last 5 mocks) ---
    const performanceTrend = sortedMocks
      .slice(0, 5)
      .reverse()
      .map((t, i) => {
        const d = t.completedAt || t.startedAt;
        const label = d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : `Mock ${i + 1}`;
        return {
          day: label,
          score: Math.round((t.score || t.correctCount || 0) / Math.max(1, t.totalCount || t.totalQuestions || 1) * 100)
        };
      });

    // If no real trend data, don't show fake data - return empty array
    return {
      accuracy,
      accuracyDelta,
      prevAccuracy,
      totalMocks,
      mocksThisWeek,
      streak,
      longestStreak,
      predictedRank,
      weekStudyHrs,
      weekStudyRemMins,
      studyTimeDelta,
      studyDeltaHrs,
      studyDeltaMins,
      weekQuestions,
      weekQsSolvedFromProgress,
      totalQsSolved,
      avgTimeMins,
      avgTimeSecs,
      weakestTopicName,
      weakestTopicAccuracy,
      consistencyScore,
      activeDays,
      lastMock,
      performanceTrend
    };
  }, [scoreData, testHistory, masteryScores, questionProgress]);

  const handleStartMock = (mock) => {
    const config = {
      name: mock.name,
      duration: mock.duration,
      difficulty: 'all',
      negativeMarking: mock.negativeMarking,
      distribution: mock.distribution,
      count: mock.count,
      seed: Math.random().toString(36).substring(2, 9)
    };
    localStorage.setItem('current_test_config', JSON.stringify(config));
    localStorage.removeItem('current_test_session');
    sessionStorage.removeItem('active_session_config');
    navigate('/tests/session', { state: config });
  };

  const handleCustomTest = () => {
    setActiveTab('custom');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="page-content tests-portal">
      {activeTab === 'mocks' ? (
        <div className="dashboard-layout">
          <div className="dashboard-main">
            <TestsHero stats={stats} />
            <PerformanceCards stats={stats} />
            <TestsQuickActions onCustomTest={handleCustomTest} />
            <MockGrid mocks={MOCK_TESTS} onStartMock={handleStartMock} />
          </div>

          <aside className="dashboard-sidebar">
            <TestsSidebar stats={stats} />
          </aside>
        </div>
      ) : (
        <>
          <header className="portal-header card" style={{ marginBottom: '1.5rem' }}>
            <div>
              <h1>Online Assessments & Practice Tests 🏆</h1>
              <p className="portal-sub">Simulate placement tests, challenge your weakness areas, and review mock scorecard history.</p>
            </div>
          </header>

          <div className="portal-tabs" style={{ marginBottom: '1.5rem' }}>
            <button className={`tab-btn ${activeTab === 'mocks' ? 'active' : ''}`} onClick={() => setActiveTab('mocks')}>
              <Award size={16} /> Dashboard
            </button>
            <button className={`tab-btn ${activeTab === 'presets' ? 'active' : ''}`} onClick={() => setActiveTab('presets')}>
              <Clipboard size={16} /> Exam Presets
            </button>
            <button className={`tab-btn ${activeTab === 'custom' ? 'active' : ''}`} onClick={() => setActiveTab('custom')}>
              <Plus size={16} /> Custom Builder
            </button>
            <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
              <BarChart2 size={16} /> Scorecards
            </button>
          </div>

          <div className="portal-view card">
            {activeTab === 'presets' && (
              <div className="presets-list">
                <h2>Select a Test Preset ⚡</h2>
                <div className="presets-grid" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginTop: '1rem' }}>
                  {PRESETS.map((p) => (
                    <div key={p.id} className="preset-card card card-interactive" style={{ padding: '1.5rem' }}>
                      <h3>{p.name}</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.5rem 0' }}>{p.desc}</p>
                      <button className="btn btn-primary mt-3" onClick={() => navigate('/tests/session')}>Start Preset</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'custom' && (
              <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <CustomTestBuilder />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="history-view" style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Scorecards</h2>
                <p>History will be displayed here.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
