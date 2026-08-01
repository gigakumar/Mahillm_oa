import React, { useState } from 'react';
import { FORMULA_SHEETS } from '../data/formulaSheets';
import { Search, Brain, HelpCircle, Play, AlertTriangle, ArrowRight, Calculator, Layers, RotateCw, CheckCircle, XCircle, Sparkles, BookOpen, RefreshCw, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MathRenderer from '../components/MathRenderer';
import './Formulas.css';

const SUBJECTS = ['All', 'Thermodynamics', 'Strength of Materials', 'Fluid Mechanics', 'Heat Transfer', 'Quantitative Aptitude'];

export default function Formulas() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [viewMode, setViewMode] = useState('sheet'); // 'sheet' | 'flashcard'

  // Flashcard mode states
  const [flashcardIdx, setFlashcardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mastered_formulas') || '[]');
    } catch { return []; }
  });

  // Calculator states
  const [activeCalculator, setActiveCalculator] = useState(null); // formula ID
  const [calcValues, setCalcValues] = useState({});

  const handleInputChange = (field, val) => {
    setCalcValues(prev => ({ ...prev, [field]: val }));
  };

  const toggleMastered = (id) => {
    setMasteredIds(prev => {
      const next = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      localStorage.setItem('mastered_formulas', JSON.stringify(next));
      return next;
    });
  };

  // Filtered formulas
  const filteredFormulas = FORMULA_SHEETS.filter(item => {
    const matchesSubject = subjectFilter === 'All' || item.subject === subjectFilter;
    const matchesSearch = searchQuery.trim() === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.readable.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.subject && item.subject.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSubject && matchesSearch;
  });

  const currentFlashcard = filteredFormulas[flashcardIdx % Math.max(1, filteredFormulas.length)];

  const handleNextFlashcard = () => {
    setIsFlipped(false);
    setFlashcardIdx(prev => (prev + 1) % Math.max(1, filteredFormulas.length));
  };

  const handlePrevFlashcard = () => {
    setIsFlipped(false);
    setFlashcardIdx(prev => (prev - 1 + filteredFormulas.length) % Math.max(1, filteredFormulas.length));
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
        <div className="calc-panel">
          <h4>Interactive First Law Solver</h4>
          <div className="calc-grid">
            <div className="calc-field">
              <label>Heat (dQ in J)</label>
              <input type="number" placeholder="e.g. 500" value={calcValues.dQ || ''} onChange={e => handleInputChange('dQ', e.target.value)} />
            </div>
            <div className="calc-field">
              <label>Internal Energy (dU in J)</label>
              <input type="number" placeholder="e.g. 200" value={calcValues.dU || ''} onChange={e => handleInputChange('dU', e.target.value)} />
            </div>
            <div className="calc-field">
              <label>Work (dW in J)</label>
              <input type="number" placeholder="Leave blank if target" value={calcValues.dW || ''} onChange={e => handleInputChange('dW', e.target.value)} />
            </div>
          </div>
          <div className="calc-result">{calculateResult(formulaId)}</div>
        </div>
      );
    }

    if (formulaId === 'thermo_polytropic_work') {
      return (
        <div className="calc-panel">
          <h4>Polytropic Work Calculator</h4>
          <div className="calc-grid">
            <div className="calc-field"><label>P1 (Pa)</label><input type="number" value={calcValues.p1 || ''} onChange={e => handleInputChange('p1', e.target.value)} /></div>
            <div className="calc-field"><label>V1 (m³)</label><input type="number" value={calcValues.v1 || ''} onChange={e => handleInputChange('v1', e.target.value)} /></div>
            <div className="calc-field"><label>P2 (Pa)</label><input type="number" value={calcValues.p2 || ''} onChange={e => handleInputChange('p2', e.target.value)} /></div>
            <div className="calc-field"><label>V2 (m³)</label><input type="number" value={calcValues.v2 || ''} onChange={e => handleInputChange('v2', e.target.value)} /></div>
            <div className="calc-field"><label>Index (n)</label><input type="number" step="0.1" placeholder="e.g. 1.3" value={calcValues.n || ''} onChange={e => handleInputChange('n', e.target.value)} /></div>
          </div>
          <div className="calc-result">{calculateResult(formulaId)}</div>
        </div>
      );
    }

    if (formulaId === 'som_axial_deformation') {
      return (
        <div className="calc-panel">
          <h4>Axial Deformation Calculator</h4>
          <div className="calc-grid">
            <div className="calc-field"><label>Load P (N)</label><input type="number" value={calcValues.p || ''} onChange={e => handleInputChange('p', e.target.value)} /></div>
            <div className="calc-field"><label>Length L (m)</label><input type="number" value={calcValues.l || ''} onChange={e => handleInputChange('l', e.target.value)} /></div>
            <div className="calc-field"><label>Area A (m²)</label><input type="number" value={calcValues.a || ''} onChange={e => handleInputChange('a', e.target.value)} /></div>
            <div className="calc-field"><label>Modulus E (Pa)</label><input type="number" value={calcValues.e || ''} onChange={e => handleInputChange('e', e.target.value)} /></div>
          </div>
          <div className="calc-result">{calculateResult(formulaId)}</div>
        </div>
      );
    }

    if (formulaId === 'quant_successive_profit_loss') {
      return (
        <div className="calc-panel">
          <h4>Net Loss Solver</h4>
          <div className="calc-grid">
            <div className="calc-field"><label>Common % (x)</label><input type="number" placeholder="e.g. 20" value={calcValues.x || ''} onChange={e => handleInputChange('x', e.target.value)} /></div>
          </div>
          <div className="calc-result">{calculateResult(formulaId)}</div>
        </div>
      );
    }

    if (formulaId === 'quant_classical_probability') {
      return (
        <div className="calc-panel">
          <h4>Probability Calculator</h4>
          <div className="calc-grid">
            <div className="calc-field"><label>Favorable N(A)</label><input type="number" value={calcValues.na || ''} onChange={e => handleInputChange('na', e.target.value)} /></div>
            <div className="calc-field"><label>Total Sample N(S)</label><input type="number" value={calcValues.ns || ''} onChange={e => handleInputChange('ns', e.target.value)} /></div>
          </div>
          <div className="calc-result">{calculateResult(formulaId)}</div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="page-content formulas-page">
      <header className="formulas-header">
        <div>
          <h1>Formula Revision & Memory Hub 📐</h1>
          <p className="formulas-subtitle">
            Master essential Mechanical Engineering & Aptitude equations, test your memory with interactive flashcards, and run live calculations.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="mode-switcher">
          <button
            className={`mode-btn ${viewMode === 'sheet' ? 'active' : ''}`}
            onClick={() => setViewMode('sheet')}
          >
            <BookOpen size={16} /> Formula Sheets
          </button>
          <button
            className={`mode-btn ${viewMode === 'flashcard' ? 'active' : ''}`}
            onClick={() => setViewMode('flashcard')}
          >
            <Layers size={16} /> Flashcard Deck ({masteredIds.length}/{FORMULA_SHEETS.length})
          </button>
          <button
            className="mode-btn print-btn"
            onClick={() => window.print()}
            title="Print or Save PDF Cheat Sheet"
          >
            <Sparkles size={16} className="text-amber-400" /> Export PDF Sheet
          </button>
        </div>
      </header>

      {/* Filter and Search Bar */}
      <div className="formulas-controls card">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search equations, concepts, or variables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="subject-pills">
          {SUBJECTS.map(subj => (
            <button
              key={subj}
              className={`pill ${subjectFilter === subj ? 'active' : ''}`}
              onClick={() => { setSubjectFilter(subj); setFlashcardIdx(0); }}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {/* FLASHCARD MODE */}
      {viewMode === 'flashcard' && (
        <div className="flashcard-container">
          {filteredFormulas.length === 0 ? (
            <div className="card empty-flashcard">
              <p>No formulas matched your search/filter.</p>
            </div>
          ) : (
            <div className="flashcard-deck">
              <div className="flashcard-progress-bar">
                <span>Card {flashcardIdx + 1} of {filteredFormulas.length}</span>
                <div className="fc-track">
                  <div className="fc-fill" style={{ width: `${((flashcardIdx + 1) / filteredFormulas.length) * 100}%` }} />
                </div>
                <span className="fc-mastered-tag">
                  {masteredIds.includes(currentFlashcard.id) ? '✅ Mastered' : '⏳ Learning'}
                </span>
              </div>

              {/* Interactive 3D Flip Card */}
              <div
                className={`flashcard-scene ${isFlipped ? 'flipped' : ''}`}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div className="flashcard-card">
                  {/* Card Front */}
                  <div className="flashcard-face flashcard-front card">
                    <span className="fc-subject-badge">{currentFlashcard.subject}</span>
                    <h2 className="fc-title">{currentFlashcard.name}</h2>
                    <p className="fc-instruction">Click card to reveal formula & variables 🔄</p>

                    <div className="fc-variables-preview">
                      <strong>Variables involved:</strong>
                      <ul>
                        {currentFlashcard.variables.map((v, i) => (
                          <li key={i}>{v}</li>
                        ))}
                      </ul>
                    </div>

                    {currentFlashcard.common_trap && (
                      <div className="fc-trap-box">
                        <AlertTriangle size={14} />
                        <span><strong>Common Trap:</strong> {currentFlashcard.common_trap}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Back */}
                  <div className="flashcard-face flashcard-back card">
                    <span className="fc-subject-badge">{currentFlashcard.subject}</span>
                    <h3 className="fc-back-title">{currentFlashcard.name}</h3>

                    <div className="fc-formula-box">
                      <MathRenderer math={currentFlashcard.formula || currentFlashcard.readable} />
                    </div>

                    <div className="fc-details">
                      {currentFlashcard.conditions && (
                        <p className="fc-conditions"><strong>Conditions:</strong> {currentFlashcard.conditions}</p>
                      )}
                    </div>

                    <button className="fc-flip-again" onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}>
                      <RotateCw size={14} /> Flip Back
                    </button>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flashcard-actions">
                <button className="btn btn-secondary fc-nav-btn" onClick={handlePrevFlashcard}>
                  ← Previous
                </button>

                <button
                  className="btn btn-secondary fc-nav-btn"
                  onClick={() => {
                    if (!window.speechSynthesis || !currentFlashcard) return;
                    window.speechSynthesis.cancel();
                    const text = `${currentFlashcard.name}. ${currentFlashcard.readable}. ${currentFlashcard.common_trap ? 'Common trap: ' + currentFlashcard.common_trap : ''}`;
                    const u = new SpeechSynthesisUtterance(text);
                    u.rate = 0.95;
                    window.speechSynthesis.speak(u);
                  }}
                  title="Listen to formula pronunciation"
                >
                  <Volume2 size={16} /> Listen
                </button>

                <button
                  className={`btn ${masteredIds.includes(currentFlashcard.id) ? 'btn-success' : 'btn-primary'} fc-master-btn`}
                  onClick={() => toggleMastered(currentFlashcard.id)}
                >
                  {masteredIds.includes(currentFlashcard.id) ? '✅ Mastered' : '⭐ Mark as Mastered'}
                </button>

                <button className="btn btn-secondary fc-nav-btn" onClick={handleNextFlashcard}>
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FORMULA SHEETS MODE */}
      {viewMode === 'sheet' && (
        <div className="formulas-grid">
          {filteredFormulas.map(item => (
            <div key={item.id} className="formula-card card">
              <div className="formula-card-header">
                <div>
                  <span className="formula-subject-badge">{item.subject}</span>
                  <h3>{item.name}</h3>
                </div>
                <button
                  className={`bookmark-btn ${masteredIds.includes(item.id) ? 'bookmarked' : ''}`}
                  onClick={() => toggleMastered(item.id)}
                  title="Mark as Mastered"
                >
                  <CheckCircle size={18} fill={masteredIds.includes(item.id) ? '#10b981' : 'none'} color={masteredIds.includes(item.id) ? '#10b981' : '#64748b'} />
                </button>
              </div>

              <div className="formula-math-container">
                <MathRenderer math={item.formula || item.readable} />
              </div>

              {item.variables && item.variables.length > 0 && (
                <div className="formula-section">
                  <h4>Variables</h4>
                  <ul>
                    {item.variables.map((v, idx) => (
                      <li key={idx}>{v}</li>
                    ))}
                  </ul>
                </div>
              )}

              {item.units && item.units.length > 0 && (
                <div className="formula-section">
                  <h4>Units</h4>
                  <ul>
                    {item.units.map((u, idx) => (
                      <li key={idx}>{u}</li>
                    ))}
                  </ul>
                </div>
              )}

              {item.conditions && (
                <div className="formula-conditions">
                  <strong>Prerequisite Conditions:</strong> {item.conditions}
                </div>
              )}

              {item.common_trap && (
                <div className="formula-trap">
                  <AlertTriangle size={16} className="trap-icon" />
                  <div>
                    <strong>Common Trap:</strong> {item.common_trap}
                  </div>
                </div>
              )}

              {/* Calculator Toggle */}
              {['thermo_first_law', 'thermo_polytropic_work', 'som_axial_deformation', 'quant_successive_profit_loss', 'quant_classical_probability'].includes(item.id) && (
                <div className="calculator-trigger">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setActiveCalculator(activeCalculator === item.id ? null : item.id)}
                  >
                    <Calculator size={14} />
                    {activeCalculator === item.id ? 'Hide Calculator' : 'Run Calculation'}
                  </button>
                </div>
              )}

              {/* Interactive Calculator Drawer */}
              {activeCalculator === item.id && renderCalculator(item.id)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
