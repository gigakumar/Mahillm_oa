import React, { useState } from 'react';
import { FORMULA_SHEETS } from '../data/formulaSheets';
import { Search, Brain, HelpCircle, Play, AlertTriangle, ArrowRight, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MathRenderer from '../components/MathRenderer';
import './Formulas.css';

const SUBJECTS = ['All', 'Thermodynamics', 'Strength of Materials', 'Quantitative Aptitude'];

export default function Formulas() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  
  // Calculator states
  const [activeCalculator, setActiveCalculator] = useState(null); // formula ID
  const [calcValues, setCalcValues] = useState({});

  const handleInputChange = (field, val) => {
    setCalcValues(prev => ({ ...prev, [field]: val }));
  };

  const calculateResult = (formulaId) => {
    try {
      if (formulaId === 'thermo_first_law') {
        const dQ = parseFloat(calcValues.dQ);
        const dU = parseFloat(calcValues.dU);
        const dW = parseFloat(calcValues.dW);
        
        let count = 0;
        if (!isNaN(dQ)) count++;
        if (!isNaN(dU)) count++;
        if (!isNaN(dW)) count++;

        if (count < 2) return 'Enter at least two values to compute the third.';
        if (isNaN(dQ)) return `dQ = ${(dU + dW).toFixed(2)} J`;
        if (isNaN(dU)) return `dU = ${(dQ - dW).toFixed(2)} J`;
        if (isNaN(dW)) return `dW = ${(dQ - dU).toFixed(2)} J`;
        return `All values provided: dQ = dU + dW is ${dQ === dU + dW ? 'Balanced ✅' : 'Unbalanced ❌'}`;
      }
      
      if (formulaId === 'thermo_polytropic_work') {
        const p1 = parseFloat(calcValues.p1);
        const v1 = parseFloat(calcValues.v1);
        const p2 = parseFloat(calcValues.p2);
        const v2 = parseFloat(calcValues.v2);
        const n = parseFloat(calcValues.n);
        
        if (isNaN(p1) || isNaN(v1) || isNaN(p2) || isNaN(v2) || isNaN(n)) {
          return 'Enter all values.';
        }
        if (n === 1) {
          return 'n cannot be 1 (isothermal).';
        }
        const w = (p1 * v1 - p2 * v2) / (n - 1);
        return `Work done (W) = ${w.toFixed(2)} J`;
      }

      if (formulaId === 'som_axial_deformation') {
        const p = parseFloat(calcValues.p);
        const l = parseFloat(calcValues.l);
        const a = parseFloat(calcValues.a);
        const e = parseFloat(calcValues.e);

        if (isNaN(p) || isNaN(l) || isNaN(a) || isNaN(e)) {
          return 'Enter all values.';
        }
        if (a <= 0 || e <= 0) {
          return 'Area and Modulus must be > 0.';
        }
        const def = (p * l) / (a * e);
        return `Deformation (δ) = ${(def * 1000).toFixed(4)} mm`;
      }

      if (formulaId === 'quant_successive_profit_loss') {
        const x = parseFloat(calcValues.x);
        if (isNaN(x)) return 'Enter percentage x.';
        const loss = Math.pow(x / 10, 2);
        return `Net Loss = ${loss.toFixed(2)}%`;
      }

      if (formulaId === 'quant_classical_probability') {
        const na = parseFloat(calcValues.na);
        const ns = parseFloat(calcValues.ns);

        if (isNaN(na) || isNaN(ns)) return 'Enter both values.';
        if (ns <= 0) return 'Total outcomes must be > 0.';
        if (na > ns) return 'Favorable outcomes cannot exceed total outcomes.';
        const prob = na / ns;
        return `P(A) = ${prob.toFixed(4)} (${(prob * 100).toFixed(1)}%)`;
      }
    } catch (e) {
      return 'Calculation error.';
    }
    return '';
  };

  const renderCalculator = (formulaId) => {
    if (formulaId === 'thermo_first_law') {
      return (
        <div className="calculator-inputs">
          <div className="input-group">
            <label>dQ (Heat, J)</label>
            <input type="number" placeholder="Leave empty to solve" value={calcValues.dQ || ''} onChange={e => handleInputChange('dQ', e.target.value)} />
          </div>
          <div className="input-group">
            <label>dU (Int Energy, J)</label>
            <input type="number" placeholder="Leave empty to solve" value={calcValues.dU || ''} onChange={e => handleInputChange('dU', e.target.value)} />
          </div>
          <div className="input-group">
            <label>dW (Work, J)</label>
            <input type="number" placeholder="Leave empty to solve" value={calcValues.dW || ''} onChange={e => handleInputChange('dW', e.target.value)} />
          </div>
        </div>
      );
    }
    if (formulaId === 'thermo_polytropic_work') {
      return (
        <div className="calculator-inputs">
          <div className="input-group"><label>P1 (Pa)</label><input type="number" value={calcValues.p1 || ''} onChange={e => handleInputChange('p1', e.target.value)} /></div>
          <div className="input-group"><label>V1 (m³)</label><input type="number" step="0.001" value={calcValues.v1 || ''} onChange={e => handleInputChange('v1', e.target.value)} /></div>
          <div className="input-group"><label>P2 (Pa)</label><input type="number" value={calcValues.p2 || ''} onChange={e => handleInputChange('p2', e.target.value)} /></div>
          <div className="input-group"><label>V2 (m³)</label><input type="number" step="0.001" value={calcValues.v2 || ''} onChange={e => handleInputChange('v2', e.target.value)} /></div>
          <div className="input-group"><label>n (Index)</label><input type="number" step="0.1" value={calcValues.n || '1.4'} onChange={e => handleInputChange('n', e.target.value)} /></div>
        </div>
      );
    }
    if (formulaId === 'som_axial_deformation') {
      return (
        <div className="calculator-inputs">
          <div className="input-group"><label>Load P (N)</label><input type="number" value={calcValues.p || ''} onChange={e => handleInputChange('p', e.target.value)} /></div>
          <div className="input-group"><label>Length L (m)</label><input type="number" value={calcValues.l || ''} onChange={e => handleInputChange('l', e.target.value)} /></div>
          <div className="input-group"><label>Area A (m²)</label><input type="number" step="0.0001" value={calcValues.a || ''} onChange={e => handleInputChange('a', e.target.value)} /></div>
          <div className="input-group"><label>Modulus E (Pa)</label><input type="number" value={calcValues.e || '2e11'} onChange={e => handleInputChange('e', e.target.value)} /></div>
        </div>
      );
    }
    if (formulaId === 'quant_successive_profit_loss') {
      return (
        <div className="calculator-inputs">
          <div className="input-group">
            <label>Change x (%)</label>
            <input type="number" value={calcValues.x || ''} onChange={e => handleInputChange('x', e.target.value)} />
          </div>
        </div>
      );
    }
    if (formulaId === 'quant_classical_probability') {
      return (
        <div className="calculator-inputs">
          <div className="input-group"><label>Favorable N(A)</label><input type="number" value={calcValues.na || ''} onChange={e => handleInputChange('na', e.target.value)} /></div>
          <div className="input-group"><label>Total N(S)</label><input type="number" value={calcValues.ns || ''} onChange={e => handleInputChange('ns', e.target.value)} /></div>
        </div>
      );
    }
    return null;
  };

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
            const solvable = ['thermo_first_law', 'thermo_polytropic_work', 'som_axial_deformation', 'quant_successive_profit_loss', 'quant_classical_probability'].includes(item.id);

            return (
              <div key={item.id} className={`card formula-card ${classSubject}`}>
                <div className="formula-card-header">
                  <span className="formula-card-title">{item.name}</span>
                  <span className="badge badge-accent" style={{ fontSize: '0.75rem' }}>{item.subject}</span>
                </div>

                {/* Math layout display */}
                <div className="formula-math-display">
                  <MathRenderer formula={item.formula} />
                  {item.readable && (
                    <div className="formula-readable-subtitle">
                      {item.readable}
                    </div>
                  )}
                </div>

                <div className="formula-details-list">
                  <div>
                    <span className="formula-details-heading">Variables</span>
                    <div className="formula-variables-grid">
                      {item.variables.map((v, idx) => (
                        <div key={idx} style={{ color: 'var(--text-secondary)' }}>
                          • <MathRenderer text={v} inline />
                        </div>
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

                  {/* Sandbox Calculator Option */}
                  {solvable && (
                    <div className="calculator-section">
                      <button 
                        className="btn btn-ghost calculator-toggle-btn"
                        onClick={() => {
                          if (activeCalculator === item.id) {
                            setActiveCalculator(null);
                          } else {
                            setActiveCalculator(item.id);
                            setCalcValues({});
                          }
                        }}
                      >
                        <Calculator size={14} />
                        {activeCalculator === item.id ? 'Close Sandbox Calculator' : 'Open Sandbox Calculator'}
                      </button>

                      {activeCalculator === item.id && (
                        <div className="calculator-panel">
                          {renderCalculator(item.id)}
                          <div className="calculator-result-box">
                            <strong>Result:</strong> {calculateResult(item.id)}
                          </div>
                        </div>
                      )}
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
