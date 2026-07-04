import React, { useState } from 'react';
import { FORMULA_SHEETS } from '../data/formulaSheets';
import { Search, Brain, HelpCircle, Play, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Formulas.css';

const SUBJECTS = ['All', 'Thermodynamics', 'Strength of Materials', 'Quantitative Aptitude'];

export default function Formulas() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');

  // Filter formulas
  const filteredFormulas = FORMULA_SHEETS.filter(item => {
    // Subject filter
    if (subjectFilter !== 'All' && item.subject !== subjectFilter) return false;

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchFormula = item.formula.toLowerCase().includes(q);
      const matchSubject = item.subject.toLowerCase().includes(q);
      return matchName || matchFormula || matchSubject;
    }

    return true;
  });

  const handlePracticeFormula = (formula) => {
    if (!formula.linkedQuestions || formula.linkedQuestions.length === 0) return;

    // Resolve category of the linked questions to set up the config distribution
    // For simplicity, map subject to categories:
    let category = "Mechanical Engineering";
    if (formula.subject === "Quantitative Aptitude") {
      category = "Quantitative Aptitude";
    }

    localStorage.setItem('current_test_config', JSON.stringify({
      name: `Formula Practice: ${formula.name}`,
      duration: Math.max(5, formula.linkedQuestions.length * 2), // 2 mins per question
      difficulty: 'all',
      negativeMarking: false,
      distribution: { [category]: 100 },
      count: formula.linkedQuestions.length,
      overrideQuestionIds: formula.linkedQuestions // pass explicitly
    }));

    localStorage.removeItem('current_test_session');
    navigate(`/tests/session`);
  };

  return (
    <div className="page-content formulas-page">
      <h1>Formula Revision Sheets 📋</h1>
      <p className="practice-subtitle" style={{ marginBottom: '2rem' }}>
        Review core engineering and aptitude equations. Access prerequisites, common traps, and linked practice questions.
      </p>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flexGrow: 1, maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.2rem', margin: 0, height: '38px' }}
            placeholder="Search equations, symbols, subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-pills" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {SUBJECTS.map(s => (
            <button
              key={s}
              className={`pill ${subjectFilter === s ? 'active' : ''}`}
              onClick={() => setSubjectFilter(s)}
              style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Formulas Grid */}
      {filteredFormulas.length === 0 ? (
        <div className="card text-center" style={{ padding: '4rem 2rem' }}>
          <HelpCircle size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No equations found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="formulas-grid">
          {filteredFormulas.map((item) => {
            const classSubject = item.subject.toLowerCase().replace(/\s+/g, '-');
            const hasQuestions = item.linkedQuestions && item.linkedQuestions.length > 0;

            return (
              <div key={item.id} className={`card formula-card ${classSubject}`}>
                <div className="formula-card-header">
                  <span className="formula-card-title">{item.name}</span>
                  <span className="badge badge-accent" style={{ fontSize: '0.75rem' }}>{item.subject}</span>
                </div>

                {/* Math layout display */}
                <div className="formula-math-display">
                  {/* Since mathjax requires full DOM compile, we provide clean LaTeX strings styled nicely */}
                  {item.formula}
                </div>

                <div className="formula-details-list">
                  <div>
                    <span className="formula-details-heading">Variables</span>
                    <div className="formula-variables-grid">
                      {item.variables.map((v, idx) => (
                        <div key={idx} style={{ color: 'var(--text-secondary)' }}>• {v}</div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="formula-details-heading">SI Units</span>
                    <div className="formula-variables-grid" style={{ color: 'var(--text-secondary)' }}>
                      {item.units.map((u, idx) => (
                        <div key={idx}>• {u}</div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="formula-details-heading">Prerequisites / Conditions</span>
                    <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{item.conditions}</p>
                  </div>

                  {item.common_trap && (
                    <div className="formula-trap-box">
                      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                        <AlertTriangle size={12} /> Common Trap
                      </div>
                      {item.common_trap}
                    </div>
                  )}
                </div>

                {hasQuestions ? (
                  <button 
                    className="formula-practice-btn"
                    onClick={() => handlePracticeFormula(item)}
                  >
                    <Play size={12} fill="currentColor" /> Practice this formula ({item.linkedQuestions.length} Q)
                  </button>
                ) : (
                  <span className="text-secondary" style={{ fontSize: '0.8rem', fontStyle: 'italic', marginTop: 'auto' }}>
                    No linked questions in core pack
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
