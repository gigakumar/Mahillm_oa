import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Sparkles, 
  Layers, 
  RotateCw, 
  CheckCircle, 
  BookOpen, 
  Sliders,
  Maximize2,
  Activity,
  Zap
} from 'lucide-react';
import { FORMULA_SHEETS } from '../data/formulaSheets';
import MathRenderer from '../components/MathRenderer';
import { 
  pumpHeadFromRPM, 
  pumpPowerFromRPM, 
  ottoCycleEfficiency, 
  peltonOptimalBucketSpeed, 
  peltonPowerOutput 
} from '../utils/inspectorPhysics';
import './ComponentInspector.css';

const COMPONENTS_3D = [
  {
    id: 'centrifugal_pump',
    name: 'Centrifugal Pump',
    category: 'Fluid Machinery',
    description: 'Converts rotational kinetic energy into hydrodynamic energy of the fluid flow. Energy is supplied by an electric motor or engine.',
    svgType: 'pump',
    parameters: [
      { name: 'Impeller Speed (RPM)', defaultVal: 1450, min: 500, max: 3000, unit: 'rpm' },
      { name: 'Flow Rate (Q)', defaultVal: 45, min: 10, max: 100, unit: 'L/s' },
      { name: 'Manometric Head (H)', defaultVal: 25, min: 5, max: 60, unit: 'm' }
    ],
    keyFormulas: [
      'P_{water} = \\rho \\cdot g \\cdot Q \\cdot H',
      'H_{new} = H_{ref} \\cdot \\left(\\frac{N_{new}}{N_{ref}}\\right)^2'
    ]
  },
  {
    id: 'four_stroke_ic_engine',
    name: '4-Stroke Internal Combustion Engine',
    category: 'Thermal Engineering',
    description: 'Executes four piston strokes per thermodynamic cycle: Intake, Compression, Power, and Exhaust.',
    svgType: 'engine',
    parameters: [
      { name: 'Compression Ratio (r)', defaultVal: 10, min: 6, max: 18, unit: ':1' },
      { name: 'Bore Diameter (d)', defaultVal: 85, min: 50, max: 120, unit: 'mm' },
      { name: 'Stroke Length (L)', defaultVal: 88, min: 60, max: 130, unit: 'mm' }
    ],
    keyFormulas: [
      '\\eta_{otto} = 1 - \\frac{1}{r^{\\gamma - 1}}',
      'V_s = \\frac{\\pi}{4} \\cdot d^2 \\cdot L'
    ]
  },
  {
    id: 'pelton_wheel',
    name: 'Pelton Wheel Impulse Turbine',
    category: 'Hydraulic Machines',
    description: 'High-head tangential flow impulse turbine utilizing high-velocity water jets to strike double-hemispherical buckets.',
    svgType: 'turbine',
    parameters: [
      { name: 'Jet Velocity (V1)', defaultVal: 65, min: 30, max: 120, unit: 'm/s' },
      { name: 'Mass Flow Rate (m)', defaultVal: 15, min: 2, max: 50, unit: 'kg/s' },
      { name: 'Jet Diameter (d)', defaultVal: 40, min: 10, max: 80, unit: 'mm' }
    ],
    keyFormulas: [
      'u_{opt} = 0.46 \\cdot V_1',
      'P_{mech} = m \\cdot u \\cdot (V_1 - u) \\cdot (1 + \\cos \\beta)'
    ]
  }
];

export default function ComponentInspector() {
  const [selectedComponent, setSelectedComponent] = useState(COMPONENTS_3D[0]);
  const [params, setParams] = useState({
    p1: COMPONENTS_3D[0].parameters[0].defaultVal,
    p2: COMPONENTS_3D[0].parameters[1].defaultVal,
    p3: COMPONENTS_3D[0].parameters[2].defaultVal
  });
  const [isRotating, setIsRotating] = useState(true);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [flashcardIdx, setFlashcardIdx] = useState(0);

  const handleParamChange = (idx, val) => {
    setParams(prev => ({ ...prev, [`p${idx + 1}`]: parseFloat(val) }));
  };

  const handleComponentSelect = (comp) => {
    setSelectedComponent(comp);
    setParams({
      p1: comp.parameters[0].defaultVal,
      p2: comp.parameters[1].defaultVal,
      p3: comp.parameters[2].defaultVal
    });
  };

  // Dynamic Live Calculation Engine outputs
  const calculatedOutputs = useMemo(() => {
    if (selectedComponent.id === 'centrifugal_pump') {
      const scaledHead = pumpHeadFromRPM(25, 1450, params.p1);
      const scaledPowerKW = pumpPowerFromRPM(15, 1450, params.p1);
      return [
        { label: 'Dynamic Manometric Head (H)', val: `${scaledHead.toFixed(1)} m` },
        { label: 'Est. Shaft Power', val: `${scaledPowerKW.toFixed(1)} kW` }
      ];
    } else if (selectedComponent.id === 'four_stroke_ic_engine') {
      const eff = ottoCycleEfficiency(params.p1);
      const strokeM = params.p3 / 1000;
      const boreM = params.p2 / 1000;
      const sweptVolCc = (Math.PI / 4) * Math.pow(boreM * 100, 2) * (strokeM * 100);
      return [
        { label: 'Ideal Air-Standard Efficiency (η)', val: `${(eff * 100).toFixed(2)} %` },
        { label: 'Swept Volume (Vs)', val: `${sweptVolCc.toFixed(1)} cc` }
      ];
    } else if (selectedComponent.id === 'pelton_wheel') {
      const uOpt = peltonOptimalBucketSpeed(params.p1);
      const pKw = peltonPowerOutput(params.p1, params.p2, uOpt) / 1000;
      return [
        { label: 'Optimal Bucket Speed (u)', val: `${uOpt.toFixed(1)} m/s` },
        { label: 'Theoretical Mechanical Power', val: `${pKw.toFixed(1)} kW` }
      ];
    }
    return [];
  }, [selectedComponent.id, params]);

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="inspector-container">
      {/* Header Banner */}
      <div className="inspector-header-card">
        <div className="header-info">
          <div className="header-badge">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Interactive Visual Learning Suite</span>
          </div>
          <h1>3D Mechanical Component Inspector & PDF Notes Generator</h1>
          <p>Explore interactive engineering mechanisms, parameter dynamics, and export formatted PDF revision cheat sheets.</p>
        </div>

        <button className="export-pdf-btn" onClick={handlePrintPDF}>
          <Download className="w-4 h-4" /> Export PDF Study Notes
        </button>
      </div>

      {/* Component Selector Tabs */}
      <div className="component-tabs-bar">
        {COMPONENTS_3D.map(comp => (
          <button
            key={comp.id}
            className={`comp-tab-btn ${selectedComponent.id === comp.id ? 'active' : ''}`}
            onClick={() => handleComponentSelect(comp)}
          >
            <Layers className="w-4 h-4" /> {comp.name}
          </button>
        ))}
      </div>

      {/* Main Grid: Interactive 3D Model + Controls */}
      <div className="inspector-grid">
        {/* Interactive Visual Canvas */}
        <div className="visual-canvas-card">
          <div className="canvas-header">
            <span className="comp-cat-badge">{selectedComponent.category}</span>
            <button className={`rotate-toggle ${isRotating ? 'active' : ''}`} onClick={() => setIsRotating(!isRotating)}>
              <RotateCw className={`w-4 h-4 ${isRotating ? 'animate-spin' : ''}`} /> {isRotating ? 'Rotation On' : 'Paused'}
            </button>
          </div>

          <div className="svg-canvas-wrapper">
            {selectedComponent.svgType === 'pump' && (
              <svg className={`mech-svg ${isRotating ? 'rotating-svg' : ''}`} viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="80" fill="none" stroke="#6366f1" strokeWidth="6" strokeDasharray="8 4" />
                <circle cx="100" cy="100" r="45" fill="rgba(99, 102, 241, 0.2)" stroke="#818cf8" strokeWidth="4" />
                <path d="M 100 55 L 100 145 M 55 100 L 145 100 M 68 68 L 132 132 M 68 132 L 132 68" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
                <circle cx="100" cy="100" r="12" fill="#fbbf24" />
              </svg>
            )}

            {selectedComponent.svgType === 'engine' && (
              <svg className="mech-svg" viewBox="0 0 200 200">
                <rect x="60" y="30" width="80" height="110" fill="none" stroke="#475569" strokeWidth="6" rx="4" />
                <rect x="66" y={50 + (isRotating ? (Math.sin(Date.now() / 200) * 20) : 0)} width="68" height="35" fill="rgba(244, 63, 94, 0.4)" stroke="#f43f5e" strokeWidth="3" rx="3" />
                <line x1="100" y1={85 + (isRotating ? (Math.sin(Date.now() / 200) * 20) : 0)} x2="100" y2="155" stroke="#38bdf8" strokeWidth="5" />
                <circle cx="100" cy="155" r="16" fill="none" stroke="#fbbf24" strokeWidth="4" />
              </svg>
            )}

            {selectedComponent.svgType === 'turbine' && (
              <svg className={`mech-svg ${isRotating ? 'rotating-svg' : ''}`} viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="70" fill="none" stroke="#38bdf8" strokeWidth="5" />
                <circle cx="100" cy="100" r="25" fill="#4f46e5" />
                <path d="M 100 30 Q 115 30 115 45 Q 115 60 100 60 Q 85 60 85 45 Z" fill="#fbbf24" />
                <path d="M 100 140 Q 115 140 115 155 Q 115 170 100 170 Q 85 170 85 155 Z" fill="#fbbf24" />
                <path d="M 30 100 Q 30 115 45 115 Q 60 115 60 100 Q 60 85 45 85 Z" fill="#fbbf24" />
                <path d="M 140 100 Q 140 115 155 115 Q 170 115 170 100 Q 170 85 155 85 Z" fill="#fbbf24" />
              </svg>
            )}
          </div>

          <p className="comp-desc">{selectedComponent.description}</p>
        </div>

        {/* Live Controls & Calculated Outputs */}
        <div className="controls-card">
          <h3><Sliders className="w-5 h-5 text-indigo-400" /> Parameter Dynamics</h3>

          <div className="sliders-list">
            {selectedComponent.parameters.map((p, idx) => (
              <div key={idx} className="slider-group">
                <div className="slider-header">
                  <span>{p.name}</span>
                  <strong className="text-amber-400">{params[`p${idx + 1}`]} {p.unit}</strong>
                </div>
                <input
                  type="range"
                  min={p.min}
                  max={p.max}
                  value={params[`p${idx + 1}`]}
                  onChange={(e) => handleParamChange(idx, e.target.value)}
                  className="param-slider"
                />
              </div>
            ))}
          </div>

          {/* Live Physics Calculations Box */}
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '8px', padding: '1rem', marginTop: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#818cf8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Zap size={16} /> Live Theoretical Engine Outputs:
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {calculatedOutputs.map((calc, i) => (
                <div key={i} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.6rem 0.75rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{calc.label}</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#34d399', marginTop: '0.1rem' }}>{calc.val}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="key-formulas-box" style={{ marginTop: '1rem' }}>
            <h4><BookOpen className="w-4 h-4 text-indigo-400 inline mr-1" /> Core Governing Equations:</h4>
            {selectedComponent.keyFormulas.map((eq, i) => (
              <div key={i} className="formula-math-row">
                <MathRenderer text={`$$${eq}$$`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revision Flashcards Section */}
      <div className="flashcards-section-card">
        <div className="fc-header">
          <h3><Layers className="w-5 h-5 text-emerald-400" /> Interactive Revision Flashcard Deck</h3>
          <span className="fc-count">Card {flashcardIdx + 1} of {FORMULA_SHEETS.length}</span>
        </div>

        <div className="flashcard-container" onClick={() => setFlashcardFlipped(!flashcardFlipped)}>
          <div className={`flashcard ${flashcardFlipped ? 'flipped' : ''}`}>
            <div className="fc-front">
              <span className="fc-subject">{FORMULA_SHEETS[flashcardIdx].subject}</span>
              <h2>{FORMULA_SHEETS[flashcardIdx].name}</h2>
              <p className="fc-tap-prompt">Tap card to reveal formula & common traps</p>
            </div>
            <div className="fc-back">
              <MathRenderer text={`$$${FORMULA_SHEETS[flashcardIdx].formula}$$`} />
              <div className="fc-trap-box">
                <strong>Common Trap:</strong> {FORMULA_SHEETS[flashcardIdx].common_trap}
              </div>
            </div>
          </div>
        </div>

        <div className="fc-nav-controls">
          <button 
            className="fc-nav-btn"
            onClick={() => { setFlashcardIdx(i => Math.max(0, i - 1)); setFlashcardFlipped(false); }}
            disabled={flashcardIdx === 0}
          >
            Previous Card
          </button>
          <button 
            className="fc-nav-btn primary"
            onClick={() => { setFlashcardIdx(i => Math.min(FORMULA_SHEETS.length - 1, i + 1)); setFlashcardFlipped(false); }}
            disabled={flashcardIdx === FORMULA_SHEETS.length - 1}
          >
            Next Card
          </button>
        </div>
      </div>
    </div>
  );
}
