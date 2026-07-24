import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext(null);

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return ctx;
}

export const TIERS = {
  FREE: 'free',
  PRO: 'pro',
  ELITE: 'elite',
};

export const TIER_DETAILS = {
  free: {
    id: 'free',
    name: 'GATE Free',
    tagline: 'Essential Prep & Daily Practice',
    badge: 'FREE',
    color: '#94a3b8',
    priceMonthly: 0,
    priceAnnual: 0,
    features: [
      'Unlimited MCQ & Subject PYQs Practice',
      'Standard Daily Challenge & Streak Counter',
      'Basic Performance Summary & Scorecard',
      'Public Rank Leaderboard',
      'Community Discussions & Solutions'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Mahi Pro',
    tagline: 'Complete AIR-1 GATE Mastery Suite',
    badge: 'PRO',
    color: '#6366f1',
    priceMonthly: 499, // INR / ~$6
    priceAnnual: 399,
    features: [
      'Everything in GATE Free',
      'AI Voice Technical Viva & Mock Interview Coach',
      'GATE Rank & PSU Eligibility Predictor (IOCL, ONGC, ISRO)',
      '1v1 Speed Duel Arena & Live PvP Challenges',
      'Step-by-Step Attempt Playback & Time-Loss Diagnostic',
      'Smart PDF & LaTeX Practice Paper Exporter',
      'Advanced BKT Micro-Skill Readiness Heatmap',
      'Formula Flashcards & Revision Deck Generator'
    ]
  },
  elite: {
    id: 'elite',
    name: 'Mahi Elite AI',
    tagline: 'Ultimate 1-on-1 AI Topper Ecosystem',
    badge: 'ELITE',
    color: '#f59e0b',
    priceMonthly: 999, // INR / ~$12
    priceAnnual: 799,
    features: [
      'Everything in Mahi Pro',
      '24/7 AI Voice & Strategy Coach ("Mahi AI Master")',
      'Interactive 3D/Formula Step-by-Step Physics Solver',
      'Custom 65-Question GATE Mock Blueprint Builder',
      'Unlimited AI Question Generation & Tailored Drills',
      'Priority 1-on-1 Doubt Resolution & Weak Area Remediation',
      'Guaranteed PSU Interview Prep Pass & Mock Vivas'
    ]
  }
};

// Feature access rules
const FEATURE_ACCESS = {
  'ai_tutor': [TIERS.PRO, TIERS.ELITE],
  'mock_interview': [TIERS.PRO, TIERS.ELITE],
  'gate_predictor': [TIERS.PRO, TIERS.ELITE],
  'attempt_replay': [TIERS.PRO, TIERS.ELITE],
  'peer_duel': [TIERS.PRO, TIERS.ELITE],
  'pdf_generator': [TIERS.PRO, TIERS.ELITE],
  'ai_solver': [TIERS.ELITE],
  'ai_coach': [TIERS.ELITE],
  'mock_builder': [TIERS.PRO, TIERS.ELITE],
  'readiness_deep': [TIERS.PRO, TIERS.ELITE],
};

export function SubscriptionProvider({ children }) {
  const { user } = useAuth();
  // Default tier stored in localStorage for instant load, syncs with Firestore
  const [tier, setTier] = useState(() => {
    const saved = localStorage.getItem('mahi_user_tier');
    return saved && Object.values(TIERS).includes(saved) ? saved : TIERS.FREE;
  });
  
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [targetFeature, setTargetFeature] = useState(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState({
    status: 'active',
    renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    billingCycle: 'monthly'
  });

  // Sync tier from user's Firestore document
  useEffect(() => {
    if (!user) return;
    async function fetchUserTier() {
      try {
        const docRef = doc(db, 'users', user.uid, 'subscription', 'plan');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.tier && Object.values(TIERS).includes(data.tier)) {
            setTier(data.tier);
            localStorage.setItem('mahi_user_tier', data.tier);
            setSubscriptionDetails(data);
          }
        }
      } catch (err) {
        console.error("Error fetching user subscription tier:", err);
      }
    }
    fetchUserTier();
  }, [user]);

  // Update tier function (simulated checkout / upgrade)
  const upgradeTier = async (newTier, billingCycle = 'monthly') => {
    if (!Object.values(TIERS).includes(newTier)) return;

    setTier(newTier);
    localStorage.setItem('mahi_user_tier', newTier);

    const subData = {
      tier: newTier,
      status: 'active',
      updatedAt: new Date().toISOString(),
      renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      billingCycle
    };
    setSubscriptionDetails(subData);

    if (user) {
      try {
        const docRef = doc(db, 'users', user.uid, 'subscription', 'plan');
        await setDoc(docRef, subData, { merge: true });
      } catch (err) {
        console.error("Error updating user tier in Firestore:", err);
      }
    }
  };

  const hasAccess = (featureId) => {
    if (tier === TIERS.ELITE) return true; // Elite has everything
    const requiredTiers = FEATURE_ACCESS[featureId];
    if (!requiredTiers) return true; // Unrestricted feature
    return requiredTiers.includes(tier);
  };

  const openPricingModal = (feature = null) => {
    setTargetFeature(feature);
    setIsPricingModalOpen(true);
  };

  const closePricingModal = () => {
    setIsPricingModalOpen(false);
    setTargetFeature(null);
  };

  const value = {
    tier,
    tierDetails: TIER_DETAILS[tier],
    subscriptionDetails,
    hasAccess,
    upgradeTier,
    isPricingModalOpen,
    openPricingModal,
    closePricingModal,
    targetFeature
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}
