import { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  GraduationCap,
  Target,
  Trophy,
  Flame,
  BookOpen,
  Clock3,
  TrendingUp,
  Award,
  Settings,
  LogOut,
  Sun,
  Moon,
  CalendarDays,
  CheckCircle2,
  Brain,
  ChevronRight,
  Zap,
  BarChart3,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useScore } from '../contexts/ScoreContext';
import { useUserData } from '../contexts/UserDataContext';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

import './Profile.css';

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { scoreData } = useScore();
  const { masteryScores, questionProgress } = useUserData();
  const navigate = useNavigate();

  const [dbProfile, setDbProfile] = useState(null);
  const [testsCompleted, setTestsCompleted] = useState(0);

  // 1. Fetch user's academic details & preferences from Firestore
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          setDbProfile(snap.data());
        }
      } catch (err) {
        console.error("Error fetching academic profile:", err);
      }
    };

    const fetchTestsCompleted = async () => {
      try {
        const testsCol = collection(db, 'users', user.uid, 'tests');
        const snap = await getDocs(testsCol);
        setTestsCompleted(snap.size);
      } catch (err) {
        console.error("Error fetching tests count:", err);
      }
    };

    fetchProfile();
    fetchTestsCompleted();
  }, [user]);

  // 2. Compute dynamic stats from contexts & Firestore
  const profile = useMemo(() => {
    // Determine Strongest and Weakest topics
    let strongestTopic = 'Thermodynamics';
    let weakestTopic = 'Industrial Engineering';

    const masteryList = Object.values(masteryScores || {});
    if (masteryList.length > 0) {
      const sorted = [...masteryList].sort((a, b) => b.score - a.score);
      strongestTopic = sorted[0]?.topic || strongestTopic;
      weakestTopic = sorted[sorted.length - 1]?.topic || weakestTopic;
    }

    // Solve time calculation
    const totalSolveTimeMs = Object.values(questionProgress || {}).reduce(
      (acc, curr) => acc + (curr.solveTimeMs || 0),
      0
    );
    const studyHours = Math.max(1, Math.round(totalSolveTimeMs / 3600000)) || Math.round((scoreData?.totalAttempted || 0) * 1.5 / 60) || 1;

    // Level calculations
    const xp = scoreData?.xp || 0;
    const level = Math.floor(xp / 500) + 1;
    const nextLevelXp = level * 500;

    // Percentile & Rank dynamic mapping
    const accuracy = scoreData?.accuracy || 0;
    const percentile = Math.min(99.9, Math.max(50, parseFloat((50 + (accuracy * 0.5)).toFixed(1))));
    const rank = Math.max(1, 250 - Math.round(xp / 20));

    // Format Joined Date
    let joinedDate = 'January 2026';
    if (dbProfile?.createdAt) {
      try {
        joinedDate = new Date(dbProfile.createdAt).toLocaleDateString(undefined, {
          month: 'long',
          year: 'numeric',
        });
      } catch (e) {
        // Fallback
      }
    }

    return {
      name: dbProfile?.name || user?.displayName || 'Mechanical Aspirant',
      email: user?.email || 'student@mechprep.in',
      photoURL: user?.photoURL || null,

      branch: dbProfile?.branch || 'Mechanical Engineering',
      college: dbProfile?.college || 'Birla Institute of Technology, Mesra',
      graduationYear: dbProfile?.graduationYear || '2027',
      targetRole: dbProfile?.targetRole || 'Graduate Engineer Trainee',

      level,
      xp,
      nextLevelXp,

      streak: dbProfile?.streak || 14,
      questionsSolved: scoreData?.totalAttempted || 0,
      accuracy,
      testsCompleted: testsCompleted || scoreData?.testsCompleted || 0,
      studyHours,

      joinedDate,

      strongestTopic,
      weakestTopic,

      rank,
      percentile,
    };
  }, [user, dbProfile, scoreData, masteryScores, questionProgress, testsCompleted]);

  const xpProgress = Math.min(
    Math.round((profile.xp / profile.nextLevelXp) * 100),
    100
  );

  const initials = profile.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0])
    .join('')
    .toUpperCase();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="profile-page">
      <button
        className="profile-theme-toggle"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        type="button"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <main className="profile-shell">
        {/* PROFILE HERO */}
        <section className="profile-hero">
          <div className="profile-hero-pattern" />

          <div className="profile-hero-content">
            <div className="profile-avatar-wrapper">
              {profile.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.name}
                  className="profile-avatar"
                />
              ) : (
                <div className="profile-avatar profile-avatar-fallback">
                  {initials}
                </div>
              )}

              <span
                className="profile-online-indicator"
                aria-label="Active"
              />
            </div>

            <div className="profile-identity">
              <div className="profile-name-row">
                <h1>{profile.name}</h1>

                <span className="profile-level-badge">
                  <Zap size={14} />
                  Level {profile.level}
                </span>
              </div>

              <p className="profile-headline">
                Mechanical Engineering student preparing for core engineering
                placements and technical assessments.
              </p>

              <div className="profile-meta">
                <span>
                  <GraduationCap size={16} />
                  {profile.branch}
                </span>

                <span>
                  <Target size={16} />
                  {profile.targetRole}
                </span>

                <span>
                  <CalendarDays size={16} />
                  Batch of {profile.graduationYear}
                </span>
              </div>
            </div>

            <button
              className="profile-edit-btn"
              type="button"
              onClick={() => navigate('/settings')}
            >
              <Settings size={17} />
              Edit Profile
            </button>
          </div>
        </section>

        {/* XP PROGRESS */}
        <section className="profile-xp-card">
          <div className="xp-header">
            <div>
              <span className="xp-label">LEVEL PROGRESS</span>
              <h3>Keep building your placement readiness</h3>
            </div>

            <strong>
              {profile.xp.toLocaleString()} /{' '}
              {profile.nextLevelXp.toLocaleString()} XP
            </strong>
          </div>

          <div className="xp-track">
            <div
              className="xp-progress"
              style={{ width: `${xpProgress}%` }}
            />
          </div>

          <p className="xp-description">
            {profile.nextLevelXp - profile.xp} XP remaining to reach Level{' '}
            {profile.level + 1}. Complete practice sets and mock assessments to
            earn more XP.
          </p>
        </section>

        {/* MAIN GRID */}
        <div className="profile-grid">
          <div className="profile-main-column">
            {/* PERFORMANCE */}
            <section className="profile-section">
              <div className="profile-section-header">
                <div>
                  <span className="section-eyebrow">PERFORMANCE</span>
                  <h2>Your preparation at a glance</h2>
                </div>

                <button
                  className="section-link"
                  type="button"
                  onClick={() => navigate('/readiness')}
                >
                  View analytics
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="profile-stat-grid">
                <StatCard
                  icon={<BookOpen size={21} />}
                  value={profile.questionsSolved.toLocaleString()}
                  label="Questions Solved"
                  description="Across technical and aptitude topics"
                />

                <StatCard
                  icon={<CheckCircle2 size={21} />}
                  value={`${profile.accuracy}%`}
                  label="Overall Accuracy"
                  description="Based on all attempted questions"
                />

                <StatCard
                  icon={<Trophy size={21} />}
                  value={profile.testsCompleted}
                  label="Tests Completed"
                  description="Practice tests and full assessments"
                />

                <StatCard
                  icon={<Clock3 size={21} />}
                  value={`${profile.studyHours}h`}
                  label="Focused Practice"
                  description="Total active preparation time"
                />
              </div>
            </section>

            {/* SUBJECT INSIGHTS */}
            <section className="profile-section">
              <div className="profile-section-header">
                <div>
                  <span className="section-eyebrow">KNOWLEDGE PROFILE</span>
                  <h2>What your attempts tell us</h2>
                </div>

                <Brain size={24} className="section-header-icon" />
              </div>

              <div className="insight-grid">
                <div className="insight-card insight-strong">
                  <div className="insight-icon">
                    <TrendingUp size={21} />
                  </div>

                  <div>
                    <span>STRONGEST AREA</span>
                    <h3>{profile.strongestTopic}</h3>
                    <p>
                      Your recent attempts show consistently high accuracy and
                      strong concept retention in this subject.
                    </p>
                  </div>
                </div>

                <div className="insight-card insight-focus">
                  <div className="insight-icon">
                    <Target size={21} />
                  </div>

                  <div>
                    <span>NEEDS ATTENTION</span>
                    <h3>{profile.weakestTopic}</h3>
                    <p>
                      More focused practice is recommended. Review core concepts
                      before attempting timed question sets.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* RECENT MILESTONES */}
            <section className="profile-section">
              <div className="profile-section-header">
                <div>
                  <span className="section-eyebrow">MILESTONES</span>
                  <h2>Recent achievements</h2>
                </div>

                <Award size={24} className="section-header-icon" />
              </div>

              <div className="achievement-list">
                <Achievement
                  icon={<Flame size={20} />}
                  title="14 Day Momentum"
                  description="Maintained a continuous 14-day practice streak."
                  xp="+250 XP"
                />

                <Achievement
                  icon={<BookOpen size={20} />}
                  title="Question Machine"
                  description="Solved more than 1,000 placement questions."
                  xp="+500 XP"
                />

                <Achievement
                  icon={<Target size={20} />}
                  title="Precision Matters"
                  description="Achieved over 75% overall question accuracy."
                  xp="+300 XP"
                />
              </div>
            </section>
          </div>

          {/* SIDEBAR */}
          <aside className="profile-sidebar">
            <section className="profile-side-card streak-card">
              <div className="streak-icon">
                <Flame size={28} />
              </div>

              <strong>{profile.streak}</strong>
              <span>day streak</span>

              <p>
                You've practiced consistently for {profile.streak} days. Missing
                today resets the streak. A charming little threat from software.
              </p>

              <div className="streak-days">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                  <div
                    className={`streak-day ${index < 5 ? 'completed' : ''}`}
                    key={`${day}-${index}`}
                  >
                    {index < 5 ? <CheckCircle2 size={15} /> : day}
                  </div>
                ))}
              </div>
            </section>

            <section className="profile-side-card rank-card">
              <div className="side-card-title">
                <BarChart3 size={19} />
                Placement Readiness
              </div>

              <div className="percentile-ring">
                <div className="percentile-ring-inner">
                  <strong>{profile.percentile}%</strong>
                  <span>Percentile</span>
                </div>
              </div>

              <p>
                You currently rank <strong>#{profile.rank}</strong> among active
                MechPrep learners.
              </p>
            </section>

            <section className="profile-side-card about-card">
              <div className="side-card-title">
                <User size={19} />
                Profile Details
              </div>

              <ProfileDetail
                icon={<Mail size={17} />}
                label="Email"
                value={profile.email}
              />

              <ProfileDetail
                icon={<GraduationCap size={17} />}
                label="Institution"
                value={profile.college}
              />

              <ProfileDetail
                icon={<Target size={17} />}
                label="Target"
                value={profile.targetRole}
              />

              <ProfileDetail
                icon={<CalendarDays size={17} />}
                label="Member since"
                value={profile.joinedDate}
              />
            </section>

            <button
              className="profile-logout-btn"
              type="button"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, value, label, description }) {
  return (
    <div className="profile-stat-card">
      <div className="stat-icon">{icon}</div>

      <div className="stat-content">
        <strong>{value}</strong>
        <span>{label}</span>
        <p>{description}</p>
      </div>
    </div>
  );
}

function Achievement({ icon, title, description, xp }) {
  return (
    <div className="achievement-item">
      <div className="achievement-icon">{icon}</div>

      <div className="achievement-content">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <span className="achievement-xp">{xp}</span>
    </div>
  );
}

function ProfileDetail({ icon, label, value }) {
  return (
    <div className="profile-detail">
      <div className="profile-detail-icon">{icon}</div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}
