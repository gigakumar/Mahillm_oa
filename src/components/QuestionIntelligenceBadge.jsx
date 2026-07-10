import { ShieldCheck, Beaker } from 'lucide-react';

export default function QuestionIntelligenceBadge({ attempts = 0 }) {
  const isBeta = attempts < 20;

  if (isBeta) {
    return (
      <span className="badge" style={{ 
        background: 'rgba(245, 158, 11, 0.15)', 
        color: '#f59e0b', 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '0.25rem',
        border: '1px solid rgba(245, 158, 11, 0.3)'
      }}>
        <Beaker size={12} /> Beta
      </span>
    );
  }

  return (
    <span className="badge" style={{ 
      background: 'rgba(16, 185, 129, 0.15)', 
      color: '#10b981', 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '0.25rem',
      border: '1px solid rgba(16, 185, 129, 0.3)'
    }}>
      <ShieldCheck size={12} /> Verified
    </span>
  );
}
