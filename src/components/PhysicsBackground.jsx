import React, { useMemo } from 'react';

/**
 * Lightweight CSS-only floating particle background.
 * Replaced heavy Matter.js physics engine (25 bodies + full canvas renderer at 60fps)
 * with GPU-accelerated CSS animations — zero JS per frame overhead.
 */
const PARTICLE_COUNT = 12;

const COLORS = [
  'rgba(59, 130, 246, 0.15)',
  'rgba(16, 185, 129, 0.15)',
  'rgba(139, 92, 246, 0.15)',
  'rgba(251, 191, 36, 0.12)',
];

export default function PhysicsBackground() {
  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      size: 30 + Math.random() * 60,
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 12 + Math.random() * 10,
      color: COLORS[i % COLORS.length],
      shape: i % 3 === 0 ? '30%' : '50%', // Mix circles and rounded squares
    }));
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw', height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            borderRadius: p.shape,
            background: p.color,
            border: `1.5px solid ${p.color.replace('0.15', '0.3').replace('0.12', '0.25')}`,
            animation: `pbFloat ${p.duration}s ${p.delay}s ease-in-out infinite`,
            willChange: 'transform, opacity',
          }}
        />
      ))}
      <style>{`
        @keyframes pbFloat {
          0%   { transform: translateY(0) rotate(0deg);   opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.7; }
          100% { transform: translateY(-110vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
