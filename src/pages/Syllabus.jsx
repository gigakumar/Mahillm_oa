import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Zap,
  Target,
  ChevronRight,
  TrendingUp,
  Sparkles,
  BarChart2,
  Search,
  Filter,
  Check,
  Award
} from 'lucide-react';
import './Syllabus.css';

const SYLLABUS_SECTIONS = [
  {
    id: 'general_aptitude',
    title: 'General Aptitude (GA)',
    weightage: '15%',
    weightageVal: 15,
    recommendedHours: 40,
    color: 'var(--accent)',
    description: 'Verbal Aptitude, Quantitative Aptitude, Analytical Aptitude, Spatial Aptitude',
    topics: [
      { name: 'Verbal Ability & Grammar', count: 120, highYield: true },
      { name: 'Numerical Computation & Estimation', count: 250, highYield: true },
      { name: 'Data Interpretation & Graphs', count: 180, highYield: true },
      { name: 'Spatial Aptitude & Paper Folding', count: 80, highYield: false }
    ]
  },
  {
    id: 'engg_math',
    title: 'Engineering Mathematics',
    weightage: '13%',
    weightageVal: 13,
    recommendedHours: 50,
    color: '#38bdf8',
    description: 'Linear Algebra, Calculus, Differential Equations, Complex Variables, Probability & Statistics, Numerical Methods',
    topics: [
      { name: 'Linear Algebra (Matrices, Eigenvalues)', count: 210, highYield: true },
      { name: 'Calculus (Limits, Maxima-Minima, Line Integrals)', count: 320, highYield: true },
      { name: 'Differential Equations (1st & 2nd Order)', count: 190, highYield: true },
      { name: 'Probability & Statistics (Distributions, Bayes)', count: 180, highYield: true },
      { name: 'Numerical Methods (Newton-Raphson, Trapezoidal)', count: 140, highYield: false }
    ]
  },
  {
    id: 'manufacturing',
    title: 'Manufacturing & Industrial Engineering',
    weightage: '17%',
    weightageVal: 17,
    recommendedHours: 65,
    color: '#34d399',
    description: 'Casting, Forming, Joining, Machining, Metrology, Production Planning, Operations Research',
    topics: [
      { name: 'Metal Casting (Gating Ratio, Riser Design)', count: 280, highYield: true },
      { name: 'Forming Processes (Rolling, Forging, Extrusion)', count: 230, highYield: true },
      { name: 'Welding & Joining (Arc Welding Math)', count: 190, highYield: true },
      { name: 'Metal Cutting & Merchant Circle Theory', count: 350, highYield: true },
      { name: 'Metrology & Inspection (Limits, Fits, Gauges)', count: 160, highYield: false },
      { name: 'Operations Research (Linear Programming, PERT/CPM)', count: 290, highYield: true },
      { name: 'Inventory Control (EOQ Models)', count: 170, highYield: true }
    ]
  },
  {
    id: 'thermo',
    title: 'Thermodynamics & Thermal Applications',
    weightage: '12%',
    weightageVal: 12,
    recommendedHours: 55,
    color: 'var(--warning)',
    description: 'Basic Thermodynamics, IC Engines, Refrigeration & Air Conditioning, Power Plant Engineering',
    topics: [
      { name: 'First & Second Law Systems', count: 420, highYield: true },
      { name: 'Entropy & Availability Analysis', count: 260, highYield: true },
      { name: 'Pure Substances & Steam Tables', count: 180, highYield: false },
      { name: 'Vapour Power Cycles (Rankine, Reheat)', count: 220, highYield: true },
      { name: 'Gas Power Cycles (Otto, Diesel, Dual, Brayton)', count: 290, highYield: true },
      { name: 'Refrigeration (VCR Cycle) & Psychrometry', count: 210, highYield: true }
    ]
  },
  {
    id: 'som',
    title: 'Strength of Materials (Mechanics of Materials)',
    weightage: '11%',
    weightageVal: 11,
    recommendedHours: 50,
    color: '#f87171',
    description: 'Stress-Strain, Mohr Circle, Thin/Thick Cylinders, Deflection of Beams, Torsion, Columns',
    topics: [
      { name: 'Stress & Strain Relationships', count: 310, highYield: true },
      { name: 'Principal Stresses & Mohr\'s Circle', count: 270, highYield: true },
      { name: 'Shear Force & Bending Moment Diagrams', count: 240, highYield: true },
      { name: 'Deflection of Beams (Castigliano, Double Int)', count: 230, highYield: true },
      { name: 'Torsion of Shafts & Euler Buckling Columns', count: 260, highYield: true }
    ]
  },
  {
    id: 'fluid_mech',
    title: 'Fluid Mechanics & Hydraulic Machines',
    weightage: '10%',
    weightageVal: 10,
    recommendedHours: 45,
    color: '#c084fc',
    description: 'Fluid Statics, Kinematics, Dynamics, Pipe Flow, Boundary Layer, Turbomachinery',
    topics: [
      { name: 'Fluid Statics & Buoyancy', count: 190, highYield: false },
      { name: 'Bernoulli Equation & Flow Meters', count: 260, highYield: true },
      { name: 'Viscous Pipe Flow (Darcy Loss, Laminar/Turb)', count: 280, highYield: true },
      { name: 'Boundary Layer Theory & Drag Force', count: 170, highYield: true },
      { name: 'Hydraulic Turbines (Pelton, Francis) & Pumps', count: 210, highYield: false }
    ]
  },
  {
    id: 'tom_vibrations',
    title: 'Theory of Machines & Mechanical Vibrations',
    weightage: '9%',
    weightageVal: 9,
    recommendedHours: 45,
    color: '#fb923c',
    description: 'Kinematic Pairs & Mechanisms, Gears & Gear Trains, Flywheels, Governors, Single DOF Vibrations',
    topics: [
      { name: 'Velocity & Acceleration Analysis', count: 210, highYield: true },
      { name: 'Gear Trains (Epicyclic Gear Trains)', count: 230, highYield: true },
      { name: 'Flywheels & Turning Moment Diagrams', count: 180, highYield: true },
      { name: 'Free & Damped 1-DOF Vibrations', count: 310, highYield: true },
      { name: 'Forced Vibrations & Transmissibility', count: 240, highYield: true }
    ]
  },
  {
    id: 'heat_transfer',
    title: 'Heat Transfer',
    weightage: '8%',
    weightageVal: 8,
    recommendedHours: 30,
    color: '#22d3ee',
    description: '1D/2D Conduction, Transient Conduction, Fins, Free/Forced Convection, Radiation Shape Factors, Heat Exchangers (LMTD, NTU)',
    topics: [
      { name: 'Conduction & Critical Thickness of Insulation', count: 220, highYield: true },
      { name: 'Extended Surfaces (Fins Efficiency)', count: 150, highYield: false },
      { name: 'Convection & Dimensionless Numbers (Nu, Pr, Re)', count: 190, highYield: true },
      { name: 'Radiation View Factors & Enclosure Theory', count: 210, highYield: true },
      { name: 'Heat Exchangers (LMTD & NTU Method)', count: 240, highYield: true }
    ]
  },
  {
    id: 'machine_design',
    title: 'Machine Design',
    weightage: '5%',
    weightageVal: 5,
    recommendedHours: 25,
    color: '#a78bfa',
    description: 'Design for Static/Fluctuating Loads, Joints (Bolted, Welded, Riveted), Brakes, Clutches, Bearings',
    topics: [
      { name: 'Fluctuating Loads & Goodman/Soderberg Lines', count: 210, highYield: true },
      { name: 'Welded & Bolted Joint Design', count: 180, highYield: true },
      { name: 'Clutches & Brakes (Uniform Wear/Pressure)', count: 160, highYield: true },
      { name: 'Rolling Element Bearings (L10 Life Math)', count: 190, highYield: true }
    ]
  }
];

export default function Syllabus() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [completedTopics, setCompletedTopics] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('completed_syllabus_topics') || '[]');
    } catch { return []; }
  });

  const toggleTopicCompleted = (topicName) => {
    setCompletedTopics(prev => {
      const next = prev.includes(topicName)
        ? prev.filter(t => t !== topicName)
        : [...prev, topicName];
      localStorage.setItem('completed_syllabus_topics', JSON.stringify(next));
      return next;
    });
  };

  // Stats
  const totalTopicsCount = SYLLABUS_SECTIONS.reduce((s, sec) => s + sec.topics.length, 0);
  const completedCount = completedTopics.length;
  const overallProgressPct = Math.round((completedCount / totalTopicsCount) * 100);

  const handlePracticeTopic = (topicName) => {
    navigate(`/oa-practice?cat=Mechanical%20Engineering&topic=${encodeURIComponent(topicName)}`);
  };

  return (
    <div className="page-content syllabus-page">
      {/* Header */}
      <header className="syllabus-header card">
        <div className="syllabus-header-left">
          <div className="syllabus-badge">
            <Sparkles size={14} className="text-amber-400" />
            <span>GATE ME 2026 High-Yield Roadmap</span>
          </div>
          <h1>Syllabus & Weightage Breakdown 🎯</h1>
          <p>
            Topic-wise weightage distribution, high-yield concept checklists, and target preparation roadmap based on historical GATE analysis.
          </p>
        </div>

        <div className="syllabus-overall-card">
          <div className="so-top">
            <span className="so-label">Overall Completion</span>
            <span className="so-pct">{overallProgressPct}%</span>
          </div>
          <div className="so-bar-bg">
            <div className="so-bar-fill" style={{ width: `${overallProgressPct}%` }} />
          </div>
          <span className="so-sub">{completedCount} of {totalTopicsCount} topics checked off</span>
        </div>
      </header>

      {/* Search Bar */}
      <div className="syllabus-search-bar card">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search GATE topics (e.g. Entropy, Merchant Circle, Mohr Circle...)"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="btn-clear-search" onClick={() => setSearchQuery('')}>Clear</button>
        )}
      </div>

      {/* Weightage Summary Cards Row */}
      <div className="weightage-summary-row">
        {SYLLABUS_SECTIONS.map(sec => {
          const secCompleted = sec.topics.filter(t => completedTopics.includes(t.name)).length;
          const secPct = Math.round((secCompleted / sec.topics.length) * 100);
          return (
            <div
              key={sec.id}
              className="weightage-mini-card card"
              style={{ '--sec-color': sec.color }}
            >
              <div className="wm-top">
                <span className="wm-weight">{sec.weightage}</span>
                <span className="wm-title">{sec.title.split('(')[0]}</span>
              </div>
              <div className="wm-bar">
                <div className="wm-fill" style={{ width: `${secPct}%`, background: sec.color }} />
              </div>
              <div className="wm-bottom">
                <span>{secCompleted}/{sec.topics.length} done</span>
                <span style={{ color: sec.color, fontWeight: 700 }}>{secPct}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Syllabus Sections Grid */}
      <div className="syllabus-sections-list">
        {SYLLABUS_SECTIONS.map(sec => {
          const filteredTopics = sec.topics.filter(t =>
            searchQuery.trim() === '' ||
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sec.title.toLowerCase().includes(searchQuery.toLowerCase())
          );

          if (filteredTopics.length === 0) return null;

          const secDone = sec.topics.filter(t => completedTopics.includes(t.name)).length;

          return (
            <div key={sec.id} className="syllabus-section-card card">
              <div className="sec-card-header">
                <div className="sec-header-left">
                  <div className="sec-weight-badge" style={{ background: `${sec.color}20`, color: sec.color, borderColor: `${sec.color}40` }}>
                    {sec.weightage} GATE Weightage
                  </div>
                  <h2>{sec.title}</h2>
                  <p>{sec.description}</p>
                </div>
                <div className="sec-header-right">
                  <div className="sec-hours-tag">
                    <Clock size={14} /> Est. {sec.recommendedHours} hrs
                  </div>
                  <div className="sec-done-tag">
                    {secDone}/{sec.topics.length} Completed
                  </div>
                </div>
              </div>

              {/* Topics Grid */}
              <div className="topics-checklist-grid">
                {filteredTopics.map(topic => {
                  const isChecked = completedTopics.includes(topic.name);
                  return (
                    <div
                      key={topic.name}
                      className={`topic-check-item ${isChecked ? 'completed' : ''}`}
                      onClick={() => toggleTopicCompleted(topic.name)}
                    >
                      <div className={`check-box ${isChecked ? 'checked' : ''}`}>
                        {isChecked && <Check size={13} />}
                      </div>

                      <div className="topic-info">
                        <div className="topic-name-row">
                          <span className="topic-name">{topic.name}</span>
                          {topic.highYield && (
                            <span className="high-yield-badge">🔥 High Yield</span>
                          )}
                        </div>
                        <span className="topic-q-count">{topic.count} practice questions</span>
                      </div>

                      <button
                        className="btn-topic-practice"
                        onClick={(e) => { e.stopPropagation(); handlePracticeTopic(topic.name); }}
                        title="Practice questions for this topic"
                      >
                        <Zap size={13} /> Practice
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
