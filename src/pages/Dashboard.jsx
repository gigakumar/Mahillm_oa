import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PenTool, Mic, Flame, Target, Zap } from 'lucide-react';
import './Dashboard.css';

import mechEngQuestions from '../data/mechEngQuestions';
import quantsQuestions from '../data/quantsQuestions';
import dataInterpretationQuestions from '../data/dataInterpretationQuestions';
import dilrQuestions from '../data/dilrQuestions';
import logicalReasoningQuestions from '../data/logicalReasoningQuestions';

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.displayName?.split(' ')[0] || 'there';

  const totalQs = mechEngQuestions.length + quantsQuestions.length + dataInterpretationQuestions.length + dilrQuestions.length + logicalReasoningQuestions.length;

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

      {/* Quick Links */}
      <section className="quick-links">
        <h2>Pick your battle ⚔️</h2>
        <div className="links-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          <Link to="/oa-practice?cat=Mechanical+Engineering" className="link-card card card-interactive">
            <span className="link-emoji">🔩</span>
            <h3>Mechanical Engg</h3>
            <p>Thermo, Fluids, SOM, Manufacturing, Machine Design & more</p>
            <span className="badge badge-accent">~{mechEngQuestions.length.toLocaleString()} Qs</span>
          </Link>
          <Link to="/oa-practice?cat=Quantitative+Aptitude" className="link-card card card-interactive">
            <span className="link-emoji">🧮</span>
            <h3>Quantitative Aptitude</h3>
            <p>Percentages, Profit & Loss, Time & Work, Algebra, Geometry</p>
            <span className="badge badge-secondary">~{quantsQuestions.length.toLocaleString()} Qs</span>
          </Link>
          <Link to="/oa-practice?cat=Data+Interpretation" className="link-card card card-interactive">
            <span className="link-emoji">📊</span>
            <h3>Data Interpretation</h3>
            <p>Tables, Bar, Pie, Line charts — read data, spot trends</p>
            <span className="badge badge-warning">~{dataInterpretationQuestions.length.toLocaleString()} Qs</span>
          </Link>
          <Link to="/oa-practice?cat=DILR" className="link-card card card-interactive">
            <span className="link-emoji">🧩</span>
            <h3>DILR Puzzles</h3>
            <p>Logical Seating arrangements, constraint satisfaction, ordering</p>
            <span className="badge badge-success">~{dilrQuestions.length.toLocaleString()} Qs</span>
          </Link>
          <Link to="/oa-practice?cat=Logical+Reasoning" className="link-card card card-interactive">
            <span className="link-emoji">🧠</span>
            <h3>Logical Reasoning</h3>
            <p>Series, coding-decoding, direction sense, syllogisms</p>
            <span className="badge badge-accent" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>~{logicalReasoningQuestions.length.toLocaleString()} Qs</span>
          </Link>
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
    </div>
  );
}
