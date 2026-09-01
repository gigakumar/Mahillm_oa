import React, { useEffect, useRef } from 'react';
import './AnimatedBackground.css';

export default function AnimatedBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999, normX: 0, normY: 0 });
  const frameRef = useRef(0);
  const ripplesRef = useRef([]);
  const ambientBubblesRef = useRef([]);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H;

    // Generate floating ambient glass bubbles
    const initAmbientBubbles = (width, height) => {
      const bubbles = [];
      const count = Math.max(18, Math.floor((width * height) / 45000));
      for (let i = 0; i < count; i++) {
        bubbles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 22 + 8,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -Math.random() * 0.5 - 0.2, // gently float upward
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
      initAmbientBubbles(W, H);
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      frameRef.current++;
      const f = frameRef.current;
      const speed = 0.012;

      const isLight = document.documentElement.getAttribute('data-theme') === 'light' || 
                      document.body.classList.contains('light-mode');

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const tiltX = (mouseRef.current.normX || 0) * 0.18;
      const tiltY = (mouseRef.current.normY || 0) * 0.15;

      const centerX = W / 2;
      const centerY = H * 0.5;

      // Update active shockwave ripples
      for (let r = 0; r < ripplesRef.current.length; r++) {
        const rip = ripplesRef.current[r];
        rip.radius += rip.speed;
        rip.life = 1 - rip.radius / rip.maxRadius;
      }
      ripplesRef.current = ripplesRef.current.filter((rip) => rip.life > 0);

      /* ──────────────────────────────────────────────────
         1. FULL-SCREEN 3D UNDULATING BUBBLE / DOT GRID
      ────────────────────────────────────────────────── */
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

          // 3D terrain wave equation
          const wave1 = Math.sin(x * 0.02 + f * speed) * 28;
          const wave2 = Math.cos(z * 0.026 + f * (speed * 0.85)) * 22;
          const wave3 = Math.sin((x + z) * 0.015 + f * speed) * 16;
          const y = wave1 + wave2 + wave3;

          // 3D perspective rotation by camera tilt
          const rotZ = z * Math.cos(tiltX) - x * Math.sin(tiltX);
          const rotX = z * Math.sin(tiltX) + x * Math.cos(tiltX);
          const rotY = y + (z * tiltY);

          const depth = rotZ + 460 - CAMERA_Z;
          if (depth <= 10) continue;

          const projScale = FOV / depth;
          let px = centerX + rotX * projScale;
          let py = centerY + rotY * projScale;

          // Skip if far outside screen boundary
          if (px < -60 || px > W + 60 || py < -60 || py > H + 60) continue;

          // Mouse proximity reaction (bubbles swell & push outward)
          const distToMouse = Math.hypot(px - mx, py - my);
          let interactionFactor = 0;
          if (distToMouse < 220) {
            const force = (1 - distToMouse / 220);
            const angle = Math.atan2(py - my, px - mx);
            px += Math.cos(angle) * force * 18;
            py += Math.sin(angle) * force * 18;
            interactionFactor = force;
          }

          // Apply expanding shockwave ripples
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

          // Spectrum coloration across full screen
          const normX = rotX / (COLS * SPACING_X * 0.5);
          let hue;
          if (normX < -0.22) {
            hue = 160 + (normX + 1) * 35; // Emerald to Cyan
          } else if (normX < 0.25) {
            hue = 250 + (normX + 0.2) * 65; // Electric Violet to Magenta
          } else {
            hue = 10 + (normX - 0.25) * 38; // Coral Red to Amber
          }

          const heightBrightness = (y + 60) / 120;
          const totalBright = Math.min(1, Math.max(0, heightBrightness * 0.45 + interactionFactor * 0.55));
          
          let alpha, lightness;
          if (isLight) {
            alpha = Math.min(0.5, 0.12 + projScale * 0.22 + totalBright * 0.28);
            lightness = 45 - totalBright * 25;
          } else {
            alpha = Math.min(0.98, 0.3 + projScale * 0.45 + totalBright * 0.45);
            lightness = 28 + totalBright * 55;
          }

          const radius = Math.max(1.0, (1.6 * projScale) + (interactionFactor * 2.2));

          // Outer glowing bubble body
          ctx.beginPath();
          ctx.arc(px, py, radius, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${hue}, ${isLight ? '75%' : '88%'}, ${lightness}%, ${alpha})`;
          ctx.fill();

          // Specular glowing bubble glint / core
          if (!isLight && (totalBright > 0.6 || projScale > 0.85)) {
            ctx.beginPath();
            ctx.arc(px - radius * 0.3, py - radius * 0.3, Math.max(0.6, radius * 0.35), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.75})`;
            ctx.fill();
          }
        }
      }

      /* ──────────────────────────────────────────────────
         2. FLOATING AMBIENT GLASS BUBBLES / ORBS
      ────────────────────────────────────────────────── */
      for (let i = 0; i < ambientBubblesRef.current.length; i++) {
        const b = ambientBubblesRef.current[i];
        b.x += b.vx + Math.sin(f * 0.015 + b.phase) * 0.3;
        b.y += b.vy;

        // Wrap around screen edges
        if (b.y < -b.radius * 2) {
          b.y = H + b.radius * 2;
          b.x = Math.random() * W;
        }
        if (b.x < -b.radius * 2) b.x = W + b.radius * 2;
        if (b.x > W + b.radius * 2) b.x = -b.radius * 2;

        // Mouse hover interaction with glass bubbles
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

        // Glass bubble body with radial gradient
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

        // Glass bubble rim outline
        ctx.beginPath();
        ctx.arc(drawX, drawY, b.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${b.hue}, 80%, 75%, ${b.alpha * 0.8})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Top-left specular gleam
        ctx.beginPath();
        ctx.arc(drawX - b.radius * 0.35, drawY - b.radius * 0.35, b.radius * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${b.alpha * 1.8})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    const onMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.normX = (e.clientX / W) * 2 - 1;
      mouseRef.current.normY = (e.clientY / H) * 2 - 1;
    };

    const onTouchMove = (e) => {
      if (!e.touches[0]) return;
      mouseRef.current.x = e.touches[0].clientX;
      mouseRef.current.y = e.touches[0].clientY;
      mouseRef.current.normX = (e.touches[0].clientX / W) * 2 - 1;
      mouseRef.current.normY = (e.touches[0].clientY / H) * 2 - 1;
    };

    const onClick = (e) => {
      ripplesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: 520,
        strength: 55,
        speed: 9,
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
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('click', onClick);
    window.addEventListener('mouseleave', onMouseLeave);

    resize();
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('click', onClick);
      window.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <div className="animated-bg-container" aria-hidden="true">
      <canvas ref={canvasRef} className="animated-bg-canvas" />
      <div className="bg-top-nebula" />
      <div className="bg-vignette" />
    </div>
  );
}
