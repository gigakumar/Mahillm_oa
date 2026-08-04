import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Sparkles, Building, Award, CheckCircle2, AlertTriangle, ArrowRight, Search, Filter } from 'lucide-react';
import './CollegePredictor.css';

const IIT_NIT_CUTOFFS = [
  {
    institute: 'IIT Bombay',
    tier: 'Top 7 IIT',
    location: 'Mumbai, Maharashtra',
    programs: [
      { name: 'Thermal & Fluids Engineering', minScore: 780, estAir: 180, stipend: '₹12,400 / mo' },
      { name: 'Design Engineering', minScore: 810, estAir: 120, stipend: '₹12,400 / mo' },
      { name: 'Manufacturing Engineering', minScore: 740, estAir: 280, stipend: '₹12,400 / mo' }
    ]
  },
  {
    institute: 'IIT Delhi',
    tier: 'Top 7 IIT',
    location: 'New Delhi',
    programs: [
      { name: 'Thermal Engineering', minScore: 760, estAir: 220, stipend: '₹12,400 / mo' },
      { name: 'Mechanical Design', minScore: 790, estAir: 150, stipend: '₹12,400 / mo' },
      { name: 'Production & Industrial', minScore: 720, estAir: 350, stipend: '₹12,400 / mo' }
    ]
  },
  {
    institute: 'IIT Madras',
    tier: 'Top 7 IIT',
    location: 'Chennai, Tamil Nadu',
    programs: [
      { name: 'Thermal Engineering', minScore: 750, estAir: 240, stipend: '₹12,400 / mo' },
      { name: 'Mechanical Design', minScore: 785, estAir: 160, stipend: '₹12,400 / mo' },
      { name: 'Manufacturing Technology', minScore: 710, estAir: 380, stipend: '₹12,400 / mo' }
    ]
  },
  {
    institute: 'IIT Kharagpur',
    tier: 'Top 7 IIT',
    location: 'Kharagpur, West Bengal',
    programs: [
      { name: 'Thermal Science & Systems', minScore: 720, estAir: 350, stipend: '₹12,400 / mo' },
      { name: 'Mechanical Systems Design', minScore: 750, estAir: 250, stipend: '₹12,400 / mo' },
      { name: 'Manufacturing Science', minScore: 680, estAir: 520, stipend: '₹12,400 / mo' }
    ]
  },
  {
    institute: 'IIT Roorkee',
    tier: 'Top 7 IIT',
    location: 'Roorkee, Uttarakhand',
    programs: [
      { name: 'Thermal Engineering', minScore: 710, estAir: 390, stipend: '₹12,400 / mo' },
      { name: 'Machine Design Engineering', minScore: 735, estAir: 300, stipend: '₹12,400 / mo' },
      { name: 'Production & Industrial', minScore: 660, estAir: 650, stipend: '₹12,400 / mo' }
    ]
  },
  {
    institute: 'NIT Trichy',
    tier: 'Top NIT',
    location: 'Tiruchirappalli, Tamil Nadu',
    programs: [
      { name: 'Thermal Power Engineering', minScore: 620, estAir: 1100, stipend: '₹12,400 / mo' },
      { name: 'Industrial Design', minScore: 640, estAir: 950, stipend: '₹12,400 / mo' },
      { name: 'Manufacturing Technology', minScore: 580, estAir: 1600, stipend: '₹12,400 / mo' }
    ]
  },
  {
    institute: 'NIT Surathkal (Karnataka)',
    tier: 'Top NIT',
    location: 'Surathkal, Karnataka',
    programs: [
      { name: 'Thermal Engineering', minScore: 610, estAir: 1200, stipend: '₹12,400 / mo' },
      { name: 'Mechatronics & Automation', minScore: 630, estAir: 1000, stipend: '₹12,400 / mo' },
      { name: 'Manufacturing Engineering', minScore: 570, estAir: 1800, stipend: '₹12,400 / mo' }
    ]
  }
];

export default function CollegePredictor() {
  const navigate = useNavigate();
  const [gateScore, setGateScore] = useState(720);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('All');

  const filteredInstitutes = IIT_NIT_CUTOFFS.filter(inst => {
    const matchesTier = tierFilter === 'All' || inst.tier === tierFilter;
    const matchesSearch = searchQuery.trim() === '' ||
      inst.institute.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.programs.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTier && matchesSearch;
  });

  return (
    <div className="page-content college-predictor-page">
      <header className="cp-header card">
        <div className="cp-badge">
          <GraduationCap size={14} className="text-amber-400" />
          <span>M.Tech COAP & CCMT Predictor</span>
        </div>
        <h1>IIT & NIT M.Tech Admission Chance Estimator 🎓</h1>
        <p>
          Predict M.Tech specialization call prospects across Top IITs and NITs based on official COAP & CCMT GATE ME cutoff scores.
        </p>

        {/* Score Input Slider */}
        <div className="cp-score-slider-box">
          <div className="cp-slider-header">
            <span>Your Target GATE Score (/1000):</span>
            <strong className="cp-score-val">{gateScore} / 1000</strong>
          </div>
          <input
            type="range"
            min="350"
            max="950"
            step="10"
            value={gateScore}
            onChange={e => setGateScore(parseInt(e.target.value))}
            className="cp-slider"
          />
        </div>
      </header>

      {/* Filter Bar */}
      <div className="cp-filter-bar card">
        <div className="cp-search">
          <Search size={16} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Search institute or branch (e.g. Thermal, Design, IIT Bombay...)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="cp-pills">
          {['All', 'Top 7 IIT', 'Top NIT'].map(tier => (
            <button
              key={tier}
              className={`pill ${tierFilter === tier ? 'active' : ''}`}
              onClick={() => setTierFilter(tier)}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Institutes & Programs Grid */}
      <div className="cp-institutes-grid">
        {filteredInstitutes.map(inst => (
          <div key={inst.institute} className="cp-inst-card card">
            <div className="cp-inst-header">
              <div>
                <span className="cp-inst-tier">{inst.tier}</span>
                <h2>{inst.institute}</h2>
                <span className="cp-inst-loc">📍 {inst.location}</span>
              </div>
            </div>

            <div className="cp-programs-list">
              {inst.programs.map((prog, idx) => {
                const isLikely = gateScore >= prog.minScore + 20;
                const isBorderline = gateScore >= prog.minScore - 30 && !isLikely;
                const bandClass = isLikely ? 'likely' : isBorderline ? 'borderline' : 'unlikely';
                const bandText = isLikely ? 'High Admission Call Chance' : isBorderline ? 'Borderline Call' : 'Unlikely';

                return (
                  <div key={idx} className="cp-program-row">
                    <div className="cp-prog-info">
                      <strong className="cp-prog-name">{prog.name}</strong>
                      <span className="cp-prog-meta">
                        Cutoff Score: <strong className="text-indigo-400">{prog.minScore}+</strong> | Est. AIR: <strong>&lt; #{prog.estAir}</strong> | Stipend: {prog.stipend}
                      </span>
                    </div>

                    <span className={`cp-chance-badge ${bandClass}`}>
                      {bandText}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
