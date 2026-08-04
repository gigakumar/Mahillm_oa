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
  Zap,
  SlidersHorizontal
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
  },
  {
    id: 'cantilever_beam',
    name: 'Cantilever Beam Deflection & Stress',
    category: 'Strength of Materials',
    description: 'Simulates elastic bending deformation of a fixed-end cantilever beam subject to a concentrated point load at the free end.',
    svgType: 'beam',
    parameters: [
      { name: 'Point Load (P)', defaultVal: 5000, min: 500, max: 20000, unit: 'N' },
      { name: 'Beam Length (L)', defaultVal: 2.5, min: 0.5, max: 6.0, unit: 'm' },
      { name: 'Modulus E', defaultVal: 200, min: 50, max: 300, unit: 'GPa' }
    ],
    keyFormulas: [
      '\\delta_{max} = \\frac{P \\cdot L^3}{3 \\cdot E \\cdot I}',
      'M_{max} = P \\cdot L'
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
    } else if (selectedComponent.id === 'cantilever_beam') {
      const P = params.p1;
      const L = params.p2;
      const E_GPa = params.p3;
      const E = E_GPa * 1e9; // Pa
      const I = 8.33e-6; // m4 for 100mm x 100mm beam
      const deltaM = (P * Math.pow(L, 3)) / (3 * E * I);
      const momentNm = P * L;
      return [
        { label: 'Max Deflection (δ_max)', val: `${(deltaM * 1000).toFixed(2)} mm` },
        { label: 'Max Bending Moment (M_max)', val: `${(momentNm / 1000).toFixed(2)} kN·m` }
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
            <span>Interactive Physics Engine</span>
          </div>
          <h1>Mechanical Component Inspector & Physics Simulator</h1>
          <p>Real-time parametric simulation, thermodynamic cycle analysis, and formula verification for core engineering components.</p>
        </div>

        <div className="inspector-controls-bar">
          <button className="btn btn-outline btn-sm" onClick={handlePrintPDF}>
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Selector Tabs */}
      <div className="component-selector-tabs">
        {COMPONENTS_3D.map(comp => (
          <button
            key={comp.id}
            className={`tab-btn ${selectedComponent.id === comp.id ? 'active' : ''}`}
            onClick={() => handleComponentSelect(comp)}
          >
            <Layers className="w-4 h-4" />
            <span>{comp.name}</span>
          </button>
        ))}
      </div>

      {/* Main Simulation View Area */}
      <div className="inspector-grid">
        {/* Left: 2D/3D Diagram Canvas */}
        <div className="diagram-canvas-card card">
          <div className="canvas-header">
            <h3>{selectedComponent.name}</h3>
            <span className="badge badge-accent">{selectedComponent.category}</span>
          </div>

          <div className="canvas-viewport">
            <div className={`viewport-render ${isRotating ? 'rotating' : ''}`}>
              {selectedComponent.svgType === 'pump' && (
                <svg viewBox="0 0 200 200" className="comp-svg">
                  <circle cx="100" cy="100" r="70" fill="none" stroke="var(--accent)" strokeWidth="4" />
                  <circle cx="100" cy="100" r="25" fill="#38bdf8" opacity="0.3" />
                  <path d="M100 30 Q120 70 100 100 Q80 70 100 30" fill="var(--accent)" />
                  <path d="M170 100 Q130 120 100 100 Q130 80 170 100" fill="var(--accent)" />
                  <path d="M100 170 Q80 130 100 100 Q120 130 100 170" fill="var(--accent)" />
                  <path d="M30 100 Q70 80 100 100 Q70 120 30 100" fill="var(--accent)" />
                </svg>
              )}

              {selectedComponent.svgType === 'engine' && (
                <svg viewBox="0 0 200 200" className="comp-svg">
                  <rect x="60" y="20" width="80" height="120" rx="6" fill="none" stroke="#f43f5e" strokeWidth="4" />
                  <rect x="65" y="50" width="70" height="40" rx="4" fill="#fb923c" opacity="0.5" />
                  <line x1="100" y1="90" x2="100" y2="160" stroke="var(--warning)" strokeWidth="6" strokeLinecap="round" />
                  <circle cx="100" cy="160" r="16" fill="none" stroke="#38bdf8" strokeWidth="4" />
                </svg>
              )}

              {selectedComponent.svgType === 'turbine' && (
                <svg viewBox="0 0 200 200" className="comp-svg">
                  <circle cx="100" cy="100" r="60" fill="none" stroke="#34d399" strokeWidth="4" />
                  <circle cx="100" cy="100" r="12" fill="#34d399" />
                  <path d="M100 40 A20 20 0 0 1 100 20 A20 20 0 0 1 100 40" fill="#38bdf8" />
                  <path d="M160 100 A20 20 0 0 1 180 100 A20 20 0 0 1 160 100" fill="#38bdf8" />
                  <path d="M100 160 A20 20 0 0 1 100 180 A20 20 0 0 1 100 160" fill="#38bdf8" />
                  <path d="M40 100 A20 20 0 0 1 20 100 A20 20 0 0 1 40 100" fill="#38bdf8" />
                </svg>
              )}

              {selectedComponent.svgType === 'beam' && (
                <svg viewBox="0 0 200 200" className="comp-svg">
                  <rect x="20" y="40" width="15" height="120" fill="var(--text-secondary)" />
                  <path d="M35 95 Q110 98 175 125" fill="none" stroke="#f87171" strokeWidth="6" strokeLinecap="round" />
                  <line x1="175" y1="70" x2="175" y2="120" stroke="var(--warning)" strokeWidth="3" markerEnd="url(#arrow)" />
                </svg>
              )}
            </div>
          </div>

          <p className="canvas-description">{selectedComponent.description}</p>
        </div>

        {/* Right: Parametric Sliders & Physics Calculations */}
        <div className="params-card card">
          <div className="card-title">
            <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
            <span>Parametric Controls</span>
          </div>

          <div className="sliders-list">
            {selectedComponent.parameters.map((param, idx) => {
              const key = `p${idx + 1}`;
              const currentVal = params[key];
              return (
                <div key={idx} className="slider-group">
                  <div className="slider-label-row">
                    <span>{param.name}</span>
                    <strong className="text-indigo-400">{currentVal} {param.unit}</strong>
                  </div>
                  <input
                    type="range"
                    min={param.min}
                    max={param.max}
                    value={currentVal}
                    onChange={e => handleParamChange(idx, e.target.value)}
                  />
                </div>
              );
            })}
          </div>

          {/* Real-Time Calculated Physics Outputs */}
          <div className="outputs-box">
            <h4>Live Computed Physics Outputs</h4>
            <div className="outputs-grid">
              {calculatedOutputs.map((out, i) => (
                <div key={i} className="output-row">
                  <span className="out-label">{out.label}</span>
                  <span className="out-val">{out.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Governing LaTeX Formulas */}
          <div className="formulas-box">
            <h4>Governing Equations</h4>
            <div className="math-list">
              {selectedComponent.keyFormulas.map((f, i) => (
                <div key={i} className="math-row">
                  <MathRenderer math={f} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
