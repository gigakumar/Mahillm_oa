import React from 'react';
import './AnimatedBackground.css';

export default function AnimatedBackground() {
  return (
    <div className="animated-bg-container">
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="bg-shape shape-3"></div>
      <div className="bg-noise"></div>
    </div>
  );
}
