import React from 'react';
import { Clock, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './TestsSidebar.css';

function formatStudyTime(hrs, mins) {
  if (hrs === 0 && mins === 0) return '0m';
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

function formatAvgTime(mins, secs) {
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export default function TestsSidebar({ stats = {} }) {
  const navigate = useNavigate();
  const {
    weekStudyHrs = 0,
    weekStudyRemMins = 0,
    studyDeltaHrs = 0,
    studyDeltaMins = 0,
    studyTimeDelta = 0,
    accuracy = 0,
    accuracyDelta = 0,
    totalQsSolved = 0,
    weekQsSolvedFromProgress = 0,
    avgTimeMins = 1,
    avgTimeSecs = 24,
    consistencyScore = 0,
    activeDays = 0,
    weakestTopicName = null,
    weakestTopicAccuracy = null,
    // milestone / rank
    totalMocks = 0
  } = stats;

  const studyTimeStr = formatStudyTime(weekStudyHrs, weekStudyRemMins);
  const deltaStr = formatStudyTime(studyDeltaHrs, studyDeltaMins);
  const avgTimeStr = formatAvgTime(avgTimeMins, avgTimeSecs);

  // Consistency label
  const consistencyLabel =
    consistencyScore >= 85 ? '⭐ Great!' :
    consistencyScore >= 60 ? '👍 Good' :
    consistencyScore >= 40 ? '📈 Improving' : '🔥 Start Now';

  // Milestone (rough estimate: aiming for rank Top 300 based on total mocks)
  const targetMocks = 100;
  const mocksAway = Math.max(0, targetMocks - totalMocks);
  const milestoneProgress = Math.min(100, Math.round((totalMocks / targetMocks) * 100));

  // Rough rank estimate (every 10 mocks completed ~ 40 rank improvement from 500)
  const estimatedRank = Math.max(50, 500 - totalMocks * 4);
  const nextMilestoneRank = estimatedRank <= 300 ? 'Top 100' : 'Top 300';

  // Weakest topic fallback
  const topicName = weakestTopicName || (totalQsSolved > 0 ? 'Complete more practice' : 'No data yet');
  const topicAcc = weakestTopicAccuracy !== null ? weakestTopicAccuracy : null;

  return (
    <div className="tests-sidebar">

      {/* Study Overview */}
      <div className="sidebar-card card">
        <div className="sidebar-header">
          <h3>Study Overview</h3>
          <span className="sidebar-filter">This Week ▾</span>
        </div>

        <div className="overview-stats">
          <div className="overview-row">
            <div className="overview-icon"><Clock size={16} color="#3b82f6" /></div>
            <div className="overview-info">
              <span className="overview-label">Total Study Time</span>
              <span className="overview-value">{studyTimeStr || '—'}</span>
            </div>
            {studyTimeDelta !== 0 && (
              <div className={`overview-trend ${studyTimeDelta > 0 ? 'trend-up' : 'trend-down'}`}>
                {studyTimeDelta > 0 ? '↑' : '↓'} {deltaStr}
              </div>
            )}
          </div>

          <div className="overview-row">
            <div className="overview-icon"><CheckCircle size={16} color="#10b981" /></div>
            <div className="overview-info">
              <span className="overview-label">Accuracy</span>
              <span className="overview-value">{accuracy > 0 ? `${accuracy}%` : '—'}</span>
            </div>
            {accuracyDelta !== 0 && (
              <div className={`overview-trend ${accuracyDelta > 0 ? 'trend-up' : 'trend-down'}`}>
                {accuracyDelta > 0 ? '↑' : '↓'} {Math.abs(accuracyDelta)}%
              </div>
            )}
          </div>

          <div className="overview-row">
            <div className="overview-icon" style={{ background: 'rgba(234,179,8,0.2)', padding: '4px', borderRadius: '4px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#eab308' }}>Q</span>
            </div>
            <div className="overview-info">
              <span className="overview-label">Questions Solved</span>
              <span className="overview-value">{totalQsSolved > 0 ? totalQsSolved.toLocaleString() : '—'}</span>
            </div>
            {weekQsSolvedFromProgress > 0 && (
              <div className="overview-trend trend-up">↑ {weekQsSolvedFromProgress}</div>
            )}
          </div>

          <div className="overview-row">
            <div className="overview-icon"><Clock size={16} color="#8b5cf6" /></div>
            <div className="overview-info">
              <span className="overview-label">Avg. Time / Qs</span>
              <span className="overview-value">{avgTimeStr}</span>
            </div>
          </div>
        </div>

        {/* Consistency Ring */}
        <div className="consistency-score">
          <div className="consistency-info">
            <div className="consistency-title">Consistency Score</div>
            <div className="consistency-stars">{consistencyLabel}</div>
            <div className="consistency-days-label">{activeDays}/7 days active</div>
          </div>
          <div className="consistency-ring">
            <svg viewBox="0 0 36 36">
              <path className="circle-bg" stroke="var(--border)" strokeWidth="3" fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="circle"
                stroke={consistencyScore >= 70 ? '#10b981' : consistencyScore >= 40 ? 'var(--warning)' : '#ef4444'}
                strokeWidth="3"
                strokeDasharray={`${consistencyScore}, 100`}
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="consistency-val">{consistencyScore}<span style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>/100</span></div>
          </div>
        </div>
      </div>

      {/* Weakest Topic */}
      <div className="sidebar-card card">
        <div className="sidebar-header">
          <h3>Weakest Topic</h3>
          <span className="sidebar-filter">By Accuracy ▾</span>
        </div>

        <div className="weak-topic-content">
          <div className="weak-topic-title">
            <AlertCircle size={16} color={topicAcc !== null ? '#ef4444' : 'var(--text-secondary)'} />
            {topicName}
          </div>
          {topicAcc !== null ? (
            <>
              <div className="weak-topic-accuracy">Accuracy <span>{topicAcc}%</span></div>
              <div className="progress-bar-container mt-2 mb-3">
                <div className="progress-bar"
                  style={{
                    width: `${topicAcc}%`,
                    background: topicAcc < 40 ? 'linear-gradient(90deg, #ef4444, #f97316)' :
                      topicAcc < 65 ? 'linear-gradient(90deg, var(--warning), #eab308)' :
                        'linear-gradient(90deg, #10b981, #34d399)'
                  }}
                />
              </div>
              <button
                className="btn btn-primary w-100"
                style={{ padding: '0.6rem' }}
                onClick={() => navigate('/oa-practice')}
              >
                Practice Now
              </button>
            </>
          ) : (
            <div className="weak-topic-empty">
              <Zap size={14} />
              <span>Solve more questions to find your weak spots</span>
            </div>
          )}
        </div>
      </div>

      {/* Next Milestone */}
      <div className="sidebar-card card">
        <div className="sidebar-header">
          <h3>Next Milestone</h3>
          <span className="sidebar-filter">Rank ▾</span>
        </div>

        <div className="milestone-content">
          <div className="milestone-row">
            <div>
              <div className="milestone-label">Current Rank</div>
              <div className="milestone-val">#{estimatedRank.toLocaleString()}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="milestone-label">Next Milestone</div>
              <div className="milestone-val">{nextMilestoneRank}</div>
            </div>
          </div>

          <div className="progress-bar-container my-3" style={{ height: '8px' }}>
            <div className="progress-bar"
              style={{ width: `${milestoneProgress}%`, background: 'linear-gradient(90deg, #f97316, #eab308)' }}
            />
          </div>

          <div className="milestone-hint">
            {mocksAway > 0
              ? `~${mocksAway} more mock${mocksAway !== 1 ? 's' : ''} to next milestone`
              : `🎉 Milestone reached! Keep going!`}
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="sidebar-card card">
        <div className="sidebar-header">
          <h3>Achievements</h3>
          <span className="sidebar-link">View all ›</span>
        </div>

        <div className="achievements-row">
          <div className="achievement-badge"
            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.05))', borderColor: 'rgba(139,92,246,0.5)' }}
            title="First Mock">🛡️</div>
          <div className="achievement-badge"
            style={{
              background: totalMocks >= 5 ? 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(234,179,8,0.05))' : 'var(--border)',
              borderColor: totalMocks >= 5 ? 'rgba(234,179,8,0.5)' : 'var(--border)',
              opacity: totalMocks >= 5 ? 1 : 0.4
            }}
            title="5 Mocks (5-Star)">⭐</div>
          <div className="achievement-badge"
            style={{
              background: totalMocks >= 10 ? 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.05))' : 'var(--border)',
              borderColor: totalMocks >= 10 ? 'rgba(59,130,246,0.5)' : 'var(--border)',
              opacity: totalMocks >= 10 ? 1 : 0.4
            }}
            title="10 Mocks (Diamond)">💎</div>
          <div className="achievement-badge"
            style={{
              background: totalQsSolved >= 100 ? 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))' : 'var(--border)',
              borderColor: totalQsSolved >= 100 ? 'rgba(16,185,129,0.5)' : 'var(--border)',
              opacity: totalQsSolved >= 100 ? 1 : 0.4
            }}
            title="100 Questions Solved">🌿</div>
          <div className="achievement-more">+{Math.max(0, totalMocks - 4)}</div>
        </div>
      </div>

    </div>
  );
}
