import React, { useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import './AnimatedBackground.css';

/**
 * Dual-Mode Animated Background:
 * - 'modern' (default): Architectural deep obsidian mesh with micro-stardust & ambient beam aura (Linear / Vercel style)
 * - 'classic': Full-screen 3D undulating wave bubble matrix with rainbow spectrum & floating ambient glass bubbles
 */
export default function AnimatedBackground() {
  const { uiMode } = useTheme();
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999, normX: 0, normY: 0 });
  const frameRef = useRef(0);
  const ripplesRef = useRef([]);
  const modernParticlesRef = useRef([]);
  const ambientBubblesRef = useRef([]);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H;

    /* ─── Initialize Particles for Modern UI ─── */
    const initModernParticles = (width, height) => {
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
      modernParticlesRef.current = pts;
    };

    /* ─── Initialize Floating Ambient Glass Bubbles for Classic UI ─── */
    const initClassicBubbles = (width, height) => {
      const count = Math.max(18, Math.floor((width * height) / 45000));
      const bubbles = [];
      for (let i = 0; i < count; i++) {
        bubbles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 22 + 8,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -Math.random() * 0.5 - 0.2,
          hue: [180, 270, 330, 210, 45][Math.floor(Math.random() * 5)],
          alpha: Math.random() * 0.25 + 0.08,
          phase: Math.random() * Math.PI * 2,
        });
      }
      ambientBubblesRef.current = bubbles;
    };

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      initModernParticles(W, H);
      initClassicBubbles(W, H);
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      frameRef.current++;
      const f = frameRef.current;

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const normX = mouseRef.current.normX || 0;
      const normY = mouseRef.current.normY || 0;

      // Update shockwave ripples
      for (let r = 0; r < ripplesRef.current.length; r++) {
        const rip = ripplesRef.current[r];
        rip.radius += rip.speed;
        rip.life = 1 - rip.radius / rip.maxRadius;
      }
      ripplesRef.current = ripplesRef.current.filter((rip) => rip.life > 0);

      // Render shockwaves
      for (const rip of ripplesRef.current) {
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.strokeStyle = uiMode === 'classic'
          ? `rgba(56, 189, 248, ${rip.life * 0.5})`
          : `rgba(56, 189, 248, ${rip.life * 0.22})`;
        ctx.lineWidth = uiMode === 'classic' ? 1.8 : 1.2;
        ctx.stroke();
      }

      /* ══════════════════════════════════════════════════
         MODE A: MODERN LINEAR / BESPOKE UI
      ══════════════════════════════════════════════════ */
      if (uiMode === 'modern') {
        for (let i = 0; i < modernParticlesRef.current.length; i++) {
          const p = modernParticlesRef.current[i];
          p.x += p.vx + Math.sin(f * 0.01 + p.phase) * 0.15;
          p.y += p.vy;

          if (p.y < -10) {
            p.y = H + 10;
            p.x = Math.random() * W;
          }
          if (p.x < -10) p.x = W + 10;
          if (p.x > W + 10) p.x = -10;

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
      } 
      
      /* ══════════════════════════════════════════════════
         MODE B: CLASSIC 3D UNDULATING BUBBLE MATRIX
      ══════════════════════════════════════════════════ */
      else {
        const speed = 0.012;
        const tiltX = normX * 0.18;
        const tiltY = normY * 0.15;
        const centerX = W / 2;
        const centerY = H * 0.5;

        const SPACING_X = Math.max(20, Math.floor(W / 55));
        const SPACING_Z = Math.max(18, Math.floor(H / 45));
        const COLS = Math.ceil(W / SPACING_X) + 20;
        const ROWS = Math.ceil(H / SPACING_Z) + 24;
        const FOV = 480;
        const CAMERA_Z = -200;

        for (let r = 0; r < ROWS; r++) {
          const z = (r - ROWS / 2) * SPACING_Z;

          for (let c = 0; c < COLS; c++) {
            const x = (c - COLS / 2) * SPACING_X;

            const wave1 = Math.sin(x * 0.02 + f * speed) * 28;
            const wave2 = Math.cos(z * 0.026 + f * (speed * 0.85)) * 22;
            const wave3 = Math.sin((x + z) * 0.015 + f * speed) * 16;
            const y = wave1 + wave2 + wave3;

            const rotZ = z * Math.cos(tiltX) - x * Math.sin(tiltX);
            const rotX = z * Math.sin(tiltX) + x * Math.cos(tiltX);
            const rotY = y + (z * tiltY);

            const depth = rotZ + 460 - CAMERA_Z;
            if (depth <= 10) continue;

            const projScale = FOV / depth;
            let px = centerX + rotX * projScale;
            let py = centerY + rotY * projScale;

            if (px < -60 || px > W + 60 || py < -60 || py > H + 60) continue;

            const distToMouse = Math.hypot(px - mx, py - my);
            let interactionFactor = 0;
            if (distToMouse < 220) {
              const force = (1 - distToMouse / 220);
              const angle = Math.atan2(py - my, px - mx);
              px += Math.cos(angle) * force * 18;
              py += Math.sin(angle) * force * 18;
              interactionFactor = force;
            }

            for (let ripIdx = 0; ripIdx < ripplesRef.current.length; ripIdx++) {
              const rip = ripplesRef.current[ripIdx];
              const distToRip = Math.hypot(px - rip.x, py - rip.y);
              const diff = Math.abs(distToRip - rip.radius);
              if (diff < 55) {
                const ripWave = Math.sin((diff / 55) * Math.PI) * rip.strength * rip.life;
                py -= ripWave * 0.8;
                interactionFactor = Math.max(interactionFactor, rip.life);
              }
            }

            const normXVal = rotX / (COLS * SPACING_X * 0.5);
            let hue;
            if (normXVal < -0.22) {
              hue = 160 + (normXVal + 1) * 35;
            } else if (normXVal < 0.25) {
              hue = 250 + (normXVal + 0.2) * 65;
            } else {
              hue = 10 + (normXVal - 0.25) * 38;
            }

            const heightBrightness = (y + 60) / 120;
            const totalBright = Math.min(1, Math.max(0, heightBrightness * 0.45 + interactionFactor * 0.55));
            const alpha = Math.min(0.98, 0.3 + projScale * 0.45 + totalBright * 0.45);
            const lightness = 28 + totalBright * 55;
            const radius = Math.max(1.0, (1.6 * projScale) + (interactionFactor * 2.2));

            ctx.beginPath();
            ctx.arc(px, py, radius, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${hue}, 88%, ${lightness}%, ${alpha})`;
            ctx.fill();

            if (totalBright > 0.6 || projScale > 0.85) {
              ctx.beginPath();
              ctx.arc(px - radius * 0.3, py - radius * 0.3, Math.max(0.6, radius * 0.35), 0, Math.PI * 2);
              ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.75})`;
              ctx.fill();
            }
          }
        }

        // Floating ambient glass orbs
        for (let i = 0; i < ambientBubblesRef.current.length; i++) {
          const b = ambientBubblesRef.current[i];
          b.x += b.vx + Math.sin(f * 0.015 + b.phase) * 0.3;
          b.y += b.vy;

          if (b.y < -b.radius * 2) {
            b.y = H + b.radius * 2;
            b.x = Math.random() * W;
          }
          if (b.x < -b.radius * 2) b.x = W + b.radius * 2;
          if (b.x > W + b.radius * 2) b.x = -b.radius * 2;

          const dist = Math.hypot(b.x - mx, b.y - my);
          let pushX = 0, pushY = 0;
          if (dist < 180) {
            const force = (1 - dist / 180) * 15;
            const angle = Math.atan2(b.y - my, b.x - mx);
            pushX = Math.cos(angle) * force;
            pushY = Math.sin(angle) * force;
          }

          const drawX = b.x + pushX;
          const drawY = b.y + pushY;

          const grad = ctx.createRadialGradient(
            drawX - b.radius * 0.35,
            drawY - b.radius * 0.35,
            b.radius * 0.1,
            drawX,
            drawY,
            b.radius
          );
          grad.addColorStop(0, `hsla(${b.hue}, 90%, 80%, ${b.alpha * 1.5})`);
          grad.addColorStop(0.5, `hsla(${b.hue}, 80%, 55%, ${b.alpha * 0.6})`);
          grad.addColorStop(1, `hsla(${b.hue}, 70%, 40%, 0)`);

          ctx.beginPath();
          ctx.arc(drawX, drawY, b.radius, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(drawX, drawY, b.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(${b.hue}, 80%, 75%, ${b.alpha * 0.8})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(drawX - b.radius * 0.35, drawY - b.radius * 0.35, b.radius * 0.25, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${b.alpha * 1.8})`;
          ctx.fill();
        }
      }

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
        maxRadius: uiMode === 'classic' ? 520 : 400,
        strength: uiMode === 'classic' ? 55 : 30,
        speed: uiMode === 'classic' ? 9 : 6.5,
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
  }, [uiMode]);

  return (
    <div className={`ambient-bg-container ${uiMode === 'classic' ? 'classic-mode' : 'modern-mode'}`} aria-hidden="true">
      {/* Modern Elements */}
      {uiMode === 'modern' && (
        <>
          <div className="ambient-grid-mesh" />
          <div className="ambient-light-beam" />
        </>
      )}

      {/* Classic Elements */}
      {uiMode === 'classic' && (
        <div className="bg-top-nebula" />
      )}

      <canvas ref={canvasRef} className="ambient-canvas" />
      <div className="ambient-vignette" />
    </div>
  );
}
