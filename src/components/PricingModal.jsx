import React, { useState } from 'react';
import { X, Check, Sparkles, Crown, Zap, ShieldCheck, RefreshCw } from 'lucide-react';
import { useSubscription, TIER_DETAILS, TIERS } from '../contexts/SubscriptionContext';
import './PricingModal.css';

export default function PricingModal() {
  const { isPricingModalOpen, closePricingModal, tier, upgradeTier, targetFeature } = useSubscription();
  const [billingCycle, setBillingCycle] = useState('annual'); // 'monthly' | 'annual'
  const [upgrading, setUpgrading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isPricingModalOpen) return null;

  const handleSelectPlan = async (targetTier) => {
    if (targetTier === tier) return;
    setUpgrading(true);
    setSuccessMsg(null);

    setTimeout(async () => {
      await upgradeTier(targetTier, billingCycle);
      setUpgrading(false);
      setSuccessMsg(`Successfully upgraded to ${TIER_DETAILS[targetTier].name}! 🎉`);
      setTimeout(() => {
        setSuccessMsg(null);
        closePricingModal();
      }, 1200);
    }, 600);
  };

  return (
    <div className="pricing-modal-backdrop" onClick={closePricingModal}>
      <div className="pricing-modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="pricing-modal-close" onClick={closePricingModal}>
          <X size={20} />
        </button>

        <div className="pricing-modal-header">
          <h2>Upgrade to Mahi Pro & Elite Suites</h2>
          <p>Supercharge your GATE & PSU preparation with AI-powered tools & topper strategy.</p>

          <div className="pricing-cycle-toggle">
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
          <div className="alert alert-success" style={{ marginBottom: '1.5rem', textAlign: 'center', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.75rem', borderRadius: '12px' }}>
            {successMsg}
          </div>
        )}

        <div className="pricing-grid">
          {/* FREE PLAN */}
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
              {TIER_DETAILS.free.features.map((feat, idx) => (
                <li key={idx} className="plan-feature-item">
                  <Check size={16} className="plan-feature-icon" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            <button 
              className={`btn-select-plan free-btn ${tier === TIERS.FREE ? 'active-current' : ''}`}
              onClick={() => handleSelectPlan(TIERS.FREE)}
              disabled={upgrading}
            >
              {tier === TIERS.FREE ? 'Current Plan' : 'Downgrade to Free'}
            </button>
          </div>

          {/* PRO PLAN (POPULAR) */}
          <div className="pricing-card popular">
            <div className="popular-badge">MOST POPULAR FOR GATE</div>
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
              {TIER_DETAILS.pro.features.map((feat, idx) => (
                <li key={idx} className="plan-feature-item">
                  <Check size={16} className="plan-feature-icon" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            <button 
              className={`btn-select-plan pro-btn ${tier === TIERS.PRO ? 'active-current' : ''}`}
              onClick={() => handleSelectPlan(TIERS.PRO)}
              disabled={upgrading}
            >
              {upgrading ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
              {tier === TIERS.PRO ? 'Current Active Plan' : 'Upgrade to Mahi Pro'}
            </button>
          </div>

          {/* ELITE PLAN */}
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
              {TIER_DETAILS.elite.features.map((feat, idx) => (
                <li key={idx} className="plan-feature-item">
                  <Check size={16} className="plan-feature-icon" style={{ color: '#f59e0b' }} />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            <button 
              className={`btn-select-plan elite-btn ${tier === TIERS.ELITE ? 'active-current' : ''}`}
              onClick={() => handleSelectPlan(TIERS.ELITE)}
              disabled={upgrading}
            >
              {upgrading ? <RefreshCw className="animate-spin" size={16} /> : <Crown size={16} />}
              {tier === TIERS.ELITE ? 'Current Active Plan' : 'Upgrade to Mahi Elite'}
            </button>
          </div>
        </div>

        <div className="pricing-modal-footer">
          <span>🔒 256-bit Secure Encryption</span>
          <span>⚡ Instant 1-Click Activation</span>
          <span>💯 7-Day Money Back Guarantee</span>
          <span>🎓 Special Student Support Available</span>
        </div>
      </div>
    </div>
  );
}
