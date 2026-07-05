import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../contexts/UserDataContext';
import { getRevisionSummary } from '../utils/spacedRepetition';
import { getWeakestTopics } from '../utils/adaptiveEngine';
import { MOCK_TESTS } from '../data/mockSeriesConfig';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { PenTool, Mic, Flame, Target, Zap, Clock, AlertTriangle, ArrowRight, Sparkles, Lock, Unlock, Play } from 'lucide-react';
import './Dashboard.css';

import metadata from '../data/metadata';


export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { spacedRepetition, masteryScores } = useUserData();
  const firstName = user?.displayName?.split(' ')[0] || 'there';

  const totalQs = metadata.totalCount;
  const meCount = metadata.categories['Mechanical Engineering'].count;
  const qaCount = metadata.categories['Quantitative Aptitude'].count;
  const diCount = metadata.categories['Data Interpretation'].count;
  const dilrCount = metadata.categories['DILR'].count;
  const lrCount = metadata.categories['Logical Reasoning'].count;

  const revisionSummary = getRevisionSummary(spacedRepetition);
  const weakTopics = getWeakestTopics(masteryScores, 3);

  const [dailyCompleted, setDailyCompleted] = useState(false);

  useEffect(() => {
    if (!user) return;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    async function checkDaily() {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid, 'dailyChallenges', todayStr));
        if (snap.exists()) {
          setDailyCompleted(snap.data().score !== undefined);
        }
      } catch (e) {
        console.error("Error loading daily challenge status on dashboard:", e);
      }
    }
    checkDaily();
  }, [user]);

  const handleStartMock = (mock) => {
    localStorage.setItem('current_test_config', JSON.stringify({
      name: mock.name,
      duration: mock.duration,
      difficulty: 'all',
      negativeMarking: mock.negativeMarking,
      distribution: mock.distribution,
      count: mock.count
    }));
    localStorage.removeItem('current_test_session');
    navigate('/tests/session');
  };

  return (
    <div className="page-content dashboard">
      {/* Hero */}
      <section className="hero">
        <div className="hero-text">
          <p className="hero-eyebrow">👋 Hey {firstName}</p>
          <h1>Placement season is <span className="gradient-text">almost here.</span></h1>
          <p className="hero-sub">
            You've got {totalQs.toLocaleString()} questions, mock interviews, and skill trackers — all in one place.
            No excuses. Let's get grinding.
          </p>
          <div className="hero-actions">
            <Link to="/oa-practice" className="btn btn-primary btn-lg">
              <PenTool size={18} />
              Start Practicing
            </Link>
            <Link to="/mock-interview" className="btn btn-ghost btn-lg">
              <Mic size={18} />
              Mock Interview
            </Link>
          </div>
        </div>
        <div className="hero-stats">
          <div className="hero-stat-card">
            <Flame size={22} className="stat-icon fire" />
            <div>
              <span className="stat-number">{totalQs.toLocaleString()}</span>
              <span className="stat-desc">Practice Qs</span>
            </div>
          </div>
          <div className="hero-stat-card">
            <Target size={22} className="stat-icon target" />
            <div>
              <span className="stat-number">5</span>
              <span className="stat-desc">Categories</span>
            </div>
          </div>
          <div className="hero-stat-card">
            <Zap size={22} className="stat-icon zap" />
            <div>
              <span className="stat-number">∞</span>
              <span className="stat-desc">Attempts</span>
            </div>
          </div>
        </div>
      </section>

      {/* Revision & Weakness Alerts */}
      <section className="dashboard-alerts" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        
        {/* Daily Challenge Widget */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Sparkles size={24} style={{ color: dailyCompleted ? 'var(--success)' : 'var(--accent)' }} />
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>Daily Challenge</h3>
          </div>
          {dailyCompleted ? (
            <>
              <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                You have completed today's challenge. Check back tomorrow for another seeded test!
              </p>
              <span className="badge badge-success" style={{ width: 'fit-content', padding: '0.35rem 0.75rem', marginTop: 'auto' }}>
                Completed ✓
              </span>
            </>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                Solve 10 questions in 10 minutes. Seeded challenge. One attempt only.
              </p>
              <Link to="/daily-challenge" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content', marginTop: 'auto' }}>
                Start Challenge <ArrowRight size={16} />
              </Link>
            </>
          )}
        </div>

        {/* Due for Revision Widget */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Clock size={24} style={{ color: revisionSummary.dueToday > 0 ? 'var(--warning)' : 'var(--success)' }} />
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>Revision Queue</h3>
          </div>
          {revisionSummary.dueToday > 0 ? (
            <>
              <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                You have <strong style={{ color: 'var(--text-primary)' }}>{revisionSummary.dueToday}</strong> question{revisionSummary.dueToday > 1 ? 's' : ''} due for review today. Keep your memory sharp!
              </p>
              <Link to="/revision" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content', marginTop: 'auto' }}>
                Start Revision <ArrowRight size={16} />
              </Link>
            </>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                Excellent work! Your revision queue is completely clear today.
              </p>
              <span className="badge badge-success" style={{ width: 'fit-content', padding: '0.35rem 0.75rem', marginTop: 'auto' }}>
                All Caught Up ✓
              </span>
            </>
          )}
        </div>

        {/* Weakest Topics Widget */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={24} style={{ color: weakTopics.length > 0 ? 'var(--danger)' : 'var(--success)' }} />
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>Mastery Weakness</h3>
          </div>
          {weakTopics.length > 0 ? (
            <>
              <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                Your lowest performing areas. Target these to boost your placement score:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                {weakTopics.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                    <Link to={`/oa-practice?cat=${encodeURIComponent(item.category)}&topic=${encodeURIComponent(item.topic)}`} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}>
                      {item.topic}
                    </Link>
                    <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: 'bold' }}>
                      {Math.round(item.score * 100)}% Mastery
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                Answer more questions to calibrate your topic mastery heatmap.
              </p>
              <Link to="/readiness" className="btn btn-secondary" style={{ width: 'fit-content', marginTop: 'auto' }}>
                View Heatmap
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Quick Links */}
      <section className="quick-links">
        <h2>Pick your battle ⚔️</h2>
        <div className="links-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          <Link to="/oa-practice?cat=Mechanical+Engineering" className="link-card card card-interactive">
            <span className="link-emoji">🔩</span>
            <h3>Mechanical Engg</h3>
            <p>Thermo, Fluids, SOM, Manufacturing, Machine Design & more</p>
            <span className="badge badge-accent">~{meCount.toLocaleString()} Qs</span>
          </Link>
          <Link to="/oa-practice?cat=Quantitative+Aptitude" className="link-card card card-interactive">
            <span className="link-emoji">🧮</span>
            <h3>Quantitative Aptitude</h3>
            <p>Percentages, Profit & Loss, Time & Work, Algebra, Geometry</p>
            <span className="badge badge-secondary">~{qaCount.toLocaleString()} Qs</span>
          </Link>
          <Link to="/oa-practice?cat=Data+Interpretation" className="link-card card card-interactive">
            <span className="link-emoji">📊</span>
            <h3>Data Interpretation</h3>
            <p>Tables, Bar, Pie, Line charts — read data, spot trends</p>
            <span className="badge badge-warning">~{diCount.toLocaleString()} Qs</span>
          </Link>
          <Link to="/oa-practice?cat=DILR" className="link-card card card-interactive">
            <span className="link-emoji">🧩</span>
            <h3>DILR Puzzles</h3>
            <p>Logical Seating arrangements, constraint satisfaction, ordering</p>
            <span className="badge badge-success">~{dilrCount.toLocaleString()} Qs</span>
          </Link>
          <Link to="/oa-practice?cat=Logical+Reasoning" className="link-card card card-interactive">
            <span className="link-emoji">🧠</span>
            <h3>Logical Reasoning</h3>
            <p>Series, coding-decoding, direction sense, syllogisms</p>
            <span className="badge badge-accent" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>~{lrCount.toLocaleString()} Qs</span>
          </Link>
        </div>
      </section>

      {/* Mock Test Series */}
      <section className="mock-tests-series" style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.25rem' }}>Scheduled Mock Tests 🏆</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {MOCK_TESTS.map(mock => {
            const isLocked = new Date() < new Date(mock.unlockDate);
            const dateStr = new Date(mock.unlockDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div key={mock.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: isLocked ? '4px solid var(--border)' : '4px solid var(--success)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{mock.name}</h3>
                  {isLocked ? <Lock size={16} style={{ color: 'var(--text-secondary)' }} /> : <Unlock size={16} style={{ color: 'var(--success)' }} />}
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{mock.description}</p>
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                  <span className="badge" style={{ background: 'var(--bg-body)' }}>{mock.duration} Mins</span>
                  <span className="badge" style={{ background: 'var(--bg-body)' }}>{mock.count} Qs</span>
                  {mock.negativeMarking && <span className="badge badge-danger-soft">-1/3 Mark</span>}
                </div>
                
                {isLocked ? (
                  <div style={{ marginTop: 'auto', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Unlocks: {dateStr}
                  </div>
                ) : (
                  <button 
                    className="btn btn-primary" 
                    style={{ marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }}
                    onClick={() => handleStartMock(mock)}
                  >
                    <Play size={12} fill="currentColor" /> Start Mock
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* More modules */}
      <section className="more-modules">
        <div className="module-banner card">
          <div>
            <h2>Mock Interview Prep 🎙️</h2>
            <p>Technical and HR questions with tips on how to answer each one. Practice speaking out loud.</p>
          </div>
          <Link to="/mock-interview" className="btn btn-primary">Go to Interviews</Link>
        </div>
        <div className="module-banner card">
          <div>
            <h2>Track Your Skills 📈</h2>
            <p>Visualize your strengths across core subjects and software tools. Know exactly where to improve.</p>
          </div>
          <Link to="/skills" className="btn btn-secondary">View Skills</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        textAlign: 'left', 
        padding: '2rem 0 1rem 0', 
        fontSize: '0.85rem', 
        color: 'var(--text-secondary)',
        borderTop: '1px solid var(--border-color)',
        marginTop: '3rem'
      }}>
        made by @conc.nitric.acid🥶
      </footer>
    </div>
  );
}
