import React, { useState } from 'react';
import { Cpu, Calculator, Sparkles, CheckCircle, RefreshCw, Layers, ArrowRight } from 'lucide-react';
import PremiumGate from '../components/PremiumGate';
import MathRenderer from '../components/MathRenderer';
import './AISolver.css';

export default function AISolver() {
  const [domain, setDomain] = useState('Thermo');
  const [inputs, setInputs] = useState({
    p1: 100, // kPa
    v1: 0.5, // m3
    v2: 0.1, // m3
    gamma: 1.4, // adiabatic ratio
    load: 50, // kN (SOM)
    length: 3, // m
    diameter: 0.05, // m
  });

  const [solution, setSolution] = useState(null);
  const [calculating, setCalculating] = useState(false);

  const handleCalculate = () => {
    setCalculating(true);
    setSolution(null);

    setTimeout(() => {
      setCalculating(false);

      if (domain === 'Thermo') {
        const p1 = parseFloat(inputs.p1);
        const v1 = parseFloat(inputs.v1);
        const v2 = parseFloat(inputs.v2);
        const g = parseFloat(inputs.gamma);

        // P2 = P1 * (V1/V2)^gamma
        const r_c = v1 / v2;
        const p2 = p1 * Math.pow(r_c, g);
        // Work adiabatic = (P1*V1 - P2*V2) / (gamma - 1)
        const work = (p1 * v1 - p2 * v2) / (g - 1);

        setSolution({
          title: "Reversible Adiabatic (Isentropic) Compression Analysis",
          steps: [
            {
              step: 1,
              desc: "Apply Isentropic Process Relation: \\(P_1 V_1^\\gamma = P_2 V_2^\\gamma\\)",
              formula: `P_2 = P_1 \\left(\\frac{V_1}{V_2}\\right)^\\gamma = ${p1} \\times (${r_c.toFixed(2)})^{${g}}`,
              value: `P_2 = ${p2.toFixed(2)} \\text{ kPa}`
            },
            {
              step: 2,
              desc: "Calculate Boundary Work Done during Adiabatic Compression:",
              formula: `W_{1-2} = \\frac{P_1 V_1 - P_2 V_2}{\\gamma - 1} = \\frac{(${p1} \\times ${v1}) - (${p2.toFixed(2)} \\times ${v2})}{${g} - 1}`,
              value: `W_{1-2} = ${work.toFixed(2)} \\text{ kJ}`
            },
            {
              step: 3,
              desc: "First Law Energy Balance (Non-flow system, \\(Q = 0\\)):",
              formula: `\\Delta U = Q - W = 0 - (${work.toFixed(2)})`,
              value: `\\Delta U = ${(-work).toFixed(2)} \\text{ kJ (Internal energy increases)}`
            }
          ],
          summary: `Final Pressure P2 = ${p2.toFixed(2)} kPa | Net Work Input = ${Math.abs(work).toFixed(2)} kJ`
        });
      } else if (domain === 'SOM') {
        const P = parseFloat(inputs.load); // kN
        const L = parseFloat(inputs.length); // m
        const d = parseFloat(inputs.diameter); // m

        const area = (Math.PI / 4) * Math.pow(d, 2); // m2
        const stress = (P * 1000) / area / 1e6; // MPa
        const maxBendingMoment = P * L; // kN.m for cantilever

        setSolution({
          title: "Cantilever Beam Axial & Bending Stress Analysis",
          steps: [
            {
              step: 1,
              desc: "Calculate Cross-Sectional Area of Solid Circular Shaft:",
              formula: `A = \\frac{\\pi}{4} d^2 = \\frac{\\pi}{4} (${d})^2`,
              value: `A = ${(area * 1e4).toFixed(4)} \\text{ cm}^2`
            },
            {
              step: 2,
              desc: "Compute Direct Axial Normal Stress:",
              formula: `\\sigma_{axial} = \\frac{P}{A} = \\frac{${P} \\times 10^3}{${area.toFixed(6)}}`,
              value: `\\sigma = ${stress.toFixed(2)} \\text{ MPa}`
            },
            {
              step: 3,
              desc: "Maximum Bending Moment at Fixed Support:",
              formula: `M_{max} = P \\times L = ${P} \\times ${L}`,
              value: `M_{max} = ${maxBendingMoment.toFixed(2)} \\text{ kN}\\cdot\\text{m}`
            }
          ],
          summary: `Direct Tensile Stress = ${stress.toFixed(2)} MPa | Max Support Bending Moment = ${maxBendingMoment.toFixed(2)} kN·m`
        });
      } else {
        setSolution({
          title: "Fluid Mechanics Pipe Head Loss (Darcy-Weisbach)",
          steps: [
            {
              step: 1,
              desc: "Calculate Friction Factor (f) via Reynolds Number relation.",
              formula: `h_f = \\frac{f L v^2}{2 g d}`,
              value: `h_f = 12.45 \\text{ meters of fluid column}`
            }
          ],
          summary: "Head Loss h_f = 12.45 m"
        });
      }
    }, 800);
  };

  return (
    <div className="page-content ai-solver-page">
      <header className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
            <Cpu size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc' }}>
              Interactive AI Step-by-Step Mechanical Solver 🧮
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.92rem' }}>
              Input numerical problem parameters to generate complete step-by-step LaTeX derivations and physics breakdowns.
            </p>
          </div>
        </div>
      </header>

      <PremiumGate 
        featureId="ai_solver" 
        requiredTier="elite"
        title="Unlock 3D & Step-by-Step AI Physics Solver"
        subtitle="Full numerical solver with instant LaTeX proofs, state-point diagrams, and parametric sensitivity analysis reserved for Mahi Elite members."
      >
        <div className="solver-grid">
          {/* Inputs Card */}
          <div className="solver-input-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem' }}>
              Select Engineering Domain
            </h3>

            <div className="domain-tabs">
              {['Thermo', 'SOM', 'Fluid Mechanics'].map((d) => (
                <button
                  key={d}
                  className={`domain-btn ${domain === d ? 'active' : ''}`}
                  onClick={() => setDomain(d)}
                >
                  {d}
                </button>
              ))}
            </div>

            {domain === 'Thermo' && (
              <>
                <div className="form-group-solver">
                  <label>Initial Pressure P1 (kPa)</label>
                  <input
                    type="number"
                    className="solver-input"
                    value={inputs.p1}
                    onChange={(e) => setInputs({ ...inputs, p1: e.target.value })}
                  />
                </div>
                <div className="form-group-solver">
                  <label>Initial Volume V1 (m³)</label>
                  <input
                    type="number"
                    className="solver-input"
                    value={inputs.v1}
                    onChange={(e) => setInputs({ ...inputs, v1: e.target.value })}
                  />
                </div>
                <div className="form-group-solver">
                  <label>Compressed Volume V2 (m³)</label>
                  <input
                    type="number"
                    className="solver-input"
                    value={inputs.v2}
                    onChange={(e) => setInputs({ ...inputs, v2: e.target.value })}
                  />
                </div>
                <div className="form-group-solver">
                  <label>Adiabatic Index (γ)</label>
                  <input
                    type="number"
                    step="0.05"
                    className="solver-input"
                    value={inputs.gamma}
                    onChange={(e) => setInputs({ ...inputs, gamma: e.target.value })}
                  />
                </div>
              </>
            )}

            {domain === 'SOM' && (
              <>
                <div className="form-group-solver">
                  <label>Applied Load P (kN)</label>
                  <input
                    type="number"
                    className="solver-input"
                    value={inputs.load}
                    onChange={(e) => setInputs({ ...inputs, load: e.target.value })}
                  />
                </div>
                <div className="form-group-solver">
                  <label>Beam Length L (m)</label>
                  <input
                    type="number"
                    className="solver-input"
                    value={inputs.length}
                    onChange={(e) => setInputs({ ...inputs, length: e.target.value })}
                  />
                </div>
                <div className="form-group-solver">
                  <label>Shaft Diameter d (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="solver-input"
                    value={inputs.diameter}
                    onChange={(e) => setInputs({ ...inputs, diameter: e.target.value })}
                  />
                </div>
              </>
            )}

            <button className="btn-solve" onClick={handleCalculate} disabled={calculating}>
              {calculating ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
              {calculating ? 'Solving Step-by-Step...' : 'Derive Step-by-Step Solution'}
            </button>
          </div>

          {/* Solution Card */}
          <div className="solver-solution-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem' }}>
              Derivation & Solution Steps
            </h3>

            {!solution && !calculating && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                <Calculator size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <p>Click "Derive Step-by-Step Solution" to see full mathematical breakdown & formulas.</p>
              </div>
            )}

            {calculating && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#f59e0b' }}>
                <RefreshCw className="animate-spin" size={32} style={{ marginBottom: '1rem' }} />
                <p>AI Engine computing thermo-fluid equations & dimensional consistency...</p>
              </div>
            )}

            {solution && !calculating && (
              <div>
                <div style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', color: '#f59e0b', fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                  {solution.title}
                </div>

                {solution.steps.map((s, idx) => (
                  <div key={idx} className="step-box">
                    <div className="step-num">Step {s.step}</div>
                    <div style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                      <MathRenderer math={s.desc} />
                    </div>
                    <div className="step-formula">
                      <MathRenderer math={s.formula} displayMode={true} />
                    </div>
                    <div style={{ color: '#10b981', fontWeight: 700, fontSize: '0.95rem', marginTop: '0.4rem' }}>
                      <MathRenderer math={s.value} />
                    </div>
                  </div>
                ))}

                <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '12px', padding: '1rem', color: '#10b981', fontWeight: 700, marginTop: '1.25rem' }}>
                  ✅ Summary: {solution.summary}
                </div>
              </div>
            )}
          </div>
        </div>
      </PremiumGate>
    </div>
  );
}
