import React, { useEffect, useRef } from 'react';
import './AnimatedBackground.css';

/**
 * Architectural Ambient Background
 * Inspired by Linear / Raycast / Vercel:
 * - Deep obsidian canvas with fine isometric starfield grid
 * - Subtle ambient light beam aura
 * - Micro-stardust particles with smooth cursor parallax
 * - Smooth wave ripples on interaction
 */
export default function AnimatedBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999, normX: 0, normY: 0 });
  const ripplesRef = useRef([]);
  const particlesRef = useRef([]);
  const frameRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H;

    const initParticles = (width, height) => {
      const count = Math.max(45, Math.floor((width * height) / 25000));
      const pts = [];
      for (let i = 0; i < count; i++) {
        pts.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.2 + 0.6,
          vx: (Math.random() - 0.5) * 0.25,
          vy: -Math.random() * 0.3 - 0.05,
          alpha: Math.random() * 0.45 + 0.15,
          color: Math.random() > 0.4 ? '#38bdf8' : '#818cf8',
          phase: Math.random() * Math.PI * 2,
        });
      }
      particlesRef.current = pts;
    };

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      initParticles(W, H);
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      frameRef.current++;
      const f = frameRef.current;

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const normX = mouseRef.current.normX || 0;
      const normY = mouseRef.current.normY || 0;

      // Update click shockwaves
      for (let r = 0; r < ripplesRef.current.length; r++) {
        const rip = ripplesRef.current[r];
        rip.radius += rip.speed;
        rip.life = 1 - rip.radius / rip.maxRadius;
      }
      ripplesRef.current = ripplesRef.current.filter((rip) => rip.life > 0);

      // Render expanding subtle wave rings on interaction
      for (const rip of ripplesRef.current) {
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56, 189, 248, ${rip.life * 0.25})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Draw elegant micro-stardust particles with parallax
      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];
        p.x += p.vx + Math.sin(f * 0.01 + p.phase) * 0.15;
        p.y += p.vy;

        // Wrap around viewport
        if (p.y < -10) {
          p.y = H + 10;
          p.x = Math.random() * W;
        }
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;

        // Subtle mouse push
        const dist = Math.hypot(p.x - mx, p.y - my);
        let px = p.x + normX * 8;
        let py = p.y + normY * 8;

        if (dist < 140) {
          const force = (1 - dist / 140) * 12;
          const angle = Math.atan2(p.y - my, p.x - mx);
          px += Math.cos(angle) * force;
          py += Math.sin(angle) * force;
        }

        const pulseAlpha = p.alpha * (0.8 + Math.sin(f * 0.02 + p.phase) * 0.25);

        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, pulseAlpha);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      rafRef.current = requestAnimationFrame(draw);
    };

    const onMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.normX = (e.clientX / W) * 2 - 1;
      mouseRef.current.normY = (e.clientY / H) * 2 - 1;
    };

    const onClick = (e) => {
      ripplesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: 400,
        speed: 6.5,
        life: 1,
      });
    };

    const onMouseLeave = () => {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
      mouseRef.current.normX = 0;
      mouseRef.current.normY = 0;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);
    window.addEventListener('mouseleave', onMouseLeave);

    resize();
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onClick);
      window.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <div className="ambient-bg-container" aria-hidden="true">
      {/* Precision Geometric Grid Mesh */}
      <div className="ambient-grid-mesh" />

      {/* Top Center Ambient Light Beam Aura */}
      <div className="ambient-light-beam" />

      {/* Canvas for Micro-Stardust & Interaction Wave */}
      <canvas ref={canvasRef} className="ambient-canvas" />

      {/* Edge Vignette */}
      <div className="ambient-vignette" />
    </div>
  );
}
