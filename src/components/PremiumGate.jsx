import React from 'react';
import { Crown, Sparkles, Check, Lock, Zap } from 'lucide-react';
import { useSubscription, TIER_DETAILS } from '../contexts/SubscriptionContext';
import './PremiumGate.css';

export default function PremiumGate({ 
  featureId, 
  title = "Unlock Premium Feature", 
  subtitle = "This advanced AI tool is reserved for Mahi Pro & Elite tier members to maximize GATE & PSU ranks.",
  highlights = [
    "Unlimited AI Step-by-Step Guidance & Analysis",
    "Detailed Performance Metrics & Historical Benchmarks",
    "Tailored AIR-1 Topper Strategy & Priority Drills"
  ],
  requiredTier = "pro",
  children 
}) {
  const { hasAccess, openPricingModal, upgradeTier, tier } = useSubscription();

  // If user already has access, render children directly
  if (hasAccess(featureId)) {
    return <>{children}</>;
  }

  const reqTierDetails = TIER_DETAILS[requiredTier] || TIER_DETAILS.pro;

  return (
    <div className="premium-gate-container">
      {/* Blurred Preview Background */}
      <div className="premium-gate-blur-wrapper">
        {children}
      </div>

      {/* Lock Overlay */}
      <div className="premium-gate-overlay">
        <div className="gate-badge-pill">
          <Crown size={15} />
          <span>{reqTierDetails.name} Feature</span>
        </div>

        <h3 className="gate-title">{title}</h3>
        <p className="gate-subtitle">{subtitle}</p>

        <div className="gate-features-list">
          {highlights.map((item, idx) => (
            <div key={idx} className="gate-feature-item">
              <Check size={16} className="gate-feature-check" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="gate-actions">
          <button 
            className="btn-gate-unlock"
            onClick={() => openPricingModal(featureId)}
          >
            <Sparkles size={18} />
            Unlock {reqTierDetails.name} (₹{reqTierDetails.priceMonthly}/mo)
          </button>

          <button 
            className="btn-gate-dev-preview"
            onClick={() => upgradeTier(requiredTier)}
            title="Dev Mode Instant Unlock for testing"
          >
            <Zap size={14} className="text-amber-400" />
            Instant Dev Unlock ({requiredTier.toUpperCase()})
          </button>
        </div>
      </div>
    </div>
  );
}
