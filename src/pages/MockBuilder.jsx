import React, { useState } from 'react';
import { Layers, Play, Sparkles, CheckCircle, Sliders } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PremiumGate from '../components/PremiumGate';
import './MockBuilder.css';

export default function MockBuilder() {
  const navigate = useNavigate();
  const [aptitudeWeight, setAptitudeWeight] = useState(15); // 15 marks
  const [mathWeight, setMathWeight] = useState(13); // 13 marks
  const [coreWeight, setCoreWeight] = useState(72); // 72 marks
  const [difficulty, setDifficulty] = useState('GATE Standard');

  const totalMarks = aptitudeWeight + mathWeight + coreWeight;

  const handleLaunchCustomMock = () => {
    // Navigate to test session with custom configuration
    navigate('/tests/session', {
      state: {
        customMock: true,
        title: `Custom ${difficulty} Blueprint Mock`,
        aptitudeWeight,
        mathWeight,
        coreWeight,
        totalMarks
      }
    });
  };

  return (
    <div className="page-content mock-builder-page">
      <header className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.2)', color: '#6366f1' }}>
            <Sliders size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc' }}>
              Custom GATE Mock Blueprint Builder 🛠️
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.92rem' }}>
              Tailor-make 65-question 100-mark full GATE Mechanical tests with custom subject weightages.
            </p>
          </div>
        </div>
      </header>

      <PremiumGate 
        featureId="mock_builder" 
        requiredTier="pro"
        title="Unlock Custom GATE Mock Blueprint Builder"
        subtitle="Create personalized full-length or targeted sectional mocks tailored to your target IIT exam pattern."
      >
        <div className="builder-card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1.5rem' }}>
            Subject Weightage Allocator
          </h3>

          <div className="weightage-slider-group">
            <div className="slider-header">
              <span>General Aptitude & Verbal</span>
              <span style={{ color: '#6366f1' }}>{aptitudeWeight} Marks (15%)</span>
            </div>
            <input
              type="range"
              min="5"
              max="25"
              value={aptitudeWeight}
              onChange={(e) => setAptitudeWeight(Number(e.target.value))}
              className="range-slider"
            />
          </div>

          <div className="weightage-slider-group">
            <div className="slider-header">
              <span>Engineering Mathematics</span>
              <span style={{ color: '#6366f1' }}>{mathWeight} Marks (13%)</span>
            </div>
            <input
              type="range"
              min="5"
              max="25"
              value={mathWeight}
              onChange={(e) => setMathWeight(Number(e.target.value))}
              className="range-slider"
            />
          </div>

          <div className="weightage-slider-group">
            <div className="slider-header">
              <span>Core Mechanical Engineering (Thermo, SOM, FM, Mfg)</span>
              <span style={{ color: '#6366f1' }}>{coreWeight} Marks (72%)</span>
            </div>
            <input
              type="range"
              min="40"
              max="90"
              value={coreWeight}
              onChange={(e) => setCoreWeight(Number(e.target.value))}
              className="range-slider"
            />
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '1rem', margin: '1.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Total Calculated Exam Weightage:</span>
            <span style={{ color: '#10b981', fontWeight: 800, fontSize: '1.2rem' }}>{totalMarks} Marks</span>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '0.5rem', fontWeight: 600 }}>Select Target Difficulty Calibration</label>
            <select className="solver-input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="GATE Standard">IIT GATE Standard (Balanced MSQs/NATs)</option>
              <option value="PSU Speed Test">PSU Speed Test (Rapid 100 MCQs in 90 Mins)</option>
              <option value="Topper Challenge">AIR-1 Topper Hard Mode (Advanced Numericals)</option>
            </select>
          </div>

          <button className="btn-solve" onClick={handleLaunchCustomMock}>
            <Play size={18} /> Launch Custom Blueprint Mock Test
          </button>
        </div>
      </PremiumGate>
    </div>
  );
}
