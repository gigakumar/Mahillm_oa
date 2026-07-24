import React, { useState } from 'react';
import { Crown, Sparkles, Check, X, ShieldCheck, Zap, HelpCircle } from 'lucide-react';
import { useSubscription, TIER_DETAILS, TIERS } from '../contexts/SubscriptionContext';
import './Pricing.css';

export default function Pricing() {
  const { tier, upgradeTier } = useSubscription();
  const [billingCycle, setBillingCycle] = useState('annual');
  const [upgrading, setUpgrading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSelectPlan = async (targetTier) => {
    if (targetTier === tier) return;
    setUpgrading(true);
    setSuccessMsg(null);

    setTimeout(async () => {
      await upgradeTier(targetTier, billingCycle);
      setUpgrading(false);
      setSuccessMsg(`Switched to ${TIER_DETAILS[targetTier].name}! 🎉`);
    }, 600);
  };

  const featureMatrix = [
    { feature: "Full GATE PYQs & Practice MCQs", free: true, pro: true, elite: true },
    { feature: "Daily Challenge & XP Gamification", free: true, pro: true, elite: true },
    { feature: "Public Leaderboard & Rank Standings", free: true, pro: true, elite: true },
    { feature: "AI Voice Technical Viva & Mock Interview Coach", free: false, pro: true, elite: true },
    { feature: "GATE Rank & PSU Eligibility Predictor", free: false, pro: true, elite: true },
    { feature: "1v1 Live Speed Duel Arena", free: false, pro: true, elite: true },
    { feature: "Attempt Replay & Hesitation Diagnostics", free: false, pro: true, elite: true },
    { feature: "Smart PDF & LaTeX Practice Paper Exporter", free: false, pro: true, elite: true },
    { feature: "Interactive 3D/Formula Step-by-Step AI Solver", free: false, pro: false, elite: true },
    { feature: "24/7 AI Voice Study Coach ('Mahi AI Master')", free: false, pro: false, elite: true },
    { feature: "Custom 65-Question GATE Mock Blueprint Builder", free: false, pro: true, elite: true },
  ];

  return (
    <div className="page-content pricing-page">
      <div className="pricing-hero">
        <div className="pricing-hero-badge">
          <Crown size={16} />
          <span>PAYING TIER SUITE</span>
        </div>
        <h1>Choose the Right Plan for AIR-1 GATE Success</h1>
        <p>Flexible pricing designed for aspiring mechanical engineers, GATE rankers, and PSU job seekers.</p>

        <div className="pricing-cycle-toggle" style={{ marginTop: '1.75rem' }}>
          <button 
            className={`pricing-cycle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly Billing
          </button>
          <button 
            className={`pricing-cycle-btn ${billingCycle === 'annual' ? 'active' : ''}`}
            onClick={() => setBillingCycle('annual')}
          >
            Annual Plan <span className="discount-badge">SAVE 25%</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="alert alert-success" style={{ maxWidth: '600px', margin: '0 auto 2rem auto', textAlign: 'center', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.9rem', borderRadius: '12px' }}>
          {successMsg}
        </div>
      )}

      {/* Cards Grid */}
      <div className="pricing-grid">
        {/* FREE */}
        <div className="pricing-card">
          <div className="pricing-card-header">
            <div className="plan-name">{TIER_DETAILS.free.name}</div>
            <div className="plan-tagline">{TIER_DETAILS.free.tagline}</div>
          </div>
          <div className="plan-price-box">
            <span className="plan-price">₹0</span>
            <span className="plan-period">/ forever</span>
          </div>
          <ul className="plan-features-list">
            {TIER_DETAILS.free.features.map((f, i) => (
              <li key={i} className="plan-feature-item">
                <Check size={16} className="plan-feature-icon" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <button 
            className={`btn-select-plan free-btn ${tier === TIERS.FREE ? 'active-current' : ''}`}
            onClick={() => handleSelectPlan(TIERS.FREE)}
            disabled={upgrading}
          >
            {tier === TIERS.FREE ? 'Current Plan' : 'Select Free Plan'}
          </button>
        </div>

        {/* PRO */}
        <div className="pricing-card popular">
          <div className="popular-badge">RECOMMENDED FOR GATE TOPPERS</div>
          <div className="pricing-card-header">
            <div className="plan-name">{TIER_DETAILS.pro.name}</div>
            <div className="plan-tagline">{TIER_DETAILS.pro.tagline}</div>
          </div>
          <div className="plan-price-box">
            <span className="plan-price">
              ₹{billingCycle === 'annual' ? TIER_DETAILS.pro.priceAnnual : TIER_DETAILS.pro.priceMonthly}
            </span>
            <span className="plan-period">/ month</span>
          </div>
          <ul className="plan-features-list">
            {TIER_DETAILS.pro.features.map((f, i) => (
              <li key={i} className="plan-feature-item">
                <Check size={16} className="plan-feature-icon" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <button 
            className={`btn-select-plan pro-btn ${tier === TIERS.PRO ? 'active-current' : ''}`}
            onClick={() => handleSelectPlan(TIERS.PRO)}
            disabled={upgrading}
          >
            <Sparkles size={16} />
            {tier === TIERS.PRO ? 'Active Plan' : 'Upgrade to Mahi Pro'}
          </button>
        </div>

        {/* ELITE */}
        <div className="pricing-card elite">
          <div className="pricing-card-header">
            <div className="plan-name">{TIER_DETAILS.elite.name}</div>
            <div className="plan-tagline">{TIER_DETAILS.elite.tagline}</div>
          </div>
          <div className="plan-price-box">
            <span className="plan-price">
              ₹{billingCycle === 'annual' ? TIER_DETAILS.elite.priceAnnual : TIER_DETAILS.elite.priceMonthly}
            </span>
            <span className="plan-period">/ month</span>
          </div>
          <ul className="plan-features-list">
            {TIER_DETAILS.elite.features.map((f, i) => (
              <li key={i} className="plan-feature-item">
                <Check size={16} className="plan-feature-icon" style={{ color: '#f59e0b' }} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <button 
            className={`btn-select-plan elite-btn ${tier === TIERS.ELITE ? 'active-current' : ''}`}
            onClick={() => handleSelectPlan(TIERS.ELITE)}
            disabled={upgrading}
          >
            <Crown size={16} />
            {tier === TIERS.ELITE ? 'Active Plan' : 'Upgrade to Mahi Elite'}
          </button>
        </div>
      </div>

      {/* Feature Matrix Table */}
      <div className="pricing-comparison-table-wrapper">
        <h2 className="pricing-comparison-title">Comprehensive Feature Comparison</h2>
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Feature Capability</th>
              <th>GATE Free</th>
              <th>Mahi Pro</th>
              <th>Mahi Elite AI</th>
            </tr>
          </thead>
          <tbody>
            {featureMatrix.map((item, idx) => (
              <tr key={idx}>
                <td style={{ color: '#f8fafc', fontWeight: 600 }}>{item.feature}</td>
                <td>{item.free ? <Check size={18} className="check-green" /> : <X size={18} className="cross-red" />}</td>
                <td>{item.pro ? <Check size={18} className="check-green" /> : <X size={18} className="cross-red" />}</td>
                <td>{item.elite ? <Check size={18} className="check-green" /> : <X size={18} className="cross-red" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
