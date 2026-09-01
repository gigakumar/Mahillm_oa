import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './OnSight.css';

/* ─── Valid access codes ─── */
const VALID_CODES = new Set(['mahillm', 'gate2026', 'onsight', 'demo', 'admin']);

/* ─── Color Themes for 3D Dot Grid ─── */
const THEMES = [
  { id: 'spectrum', label: '🌈 Spectrum' },
  { id: 'cyber',    label: '🔮 Cyber' },
  { id: 'crimson',  label: '🔥 Crimson' },
  { id: 'matrix',   label: '🌿 Matrix' },
];

/* ─── Physics Interaction Modes ─── */
const MODES = [
  { id: 'wave',  label: '🌊 Wave',   desc: 'Click & move to generate 3D ripples' },
  { id: 'repel', label: '⚡ Repel',  desc: 'Cursor pushes dots away with force' },
  { id: 'vortex',label: '🌀 Vortex', desc: 'Dots orbit around the cursor' },
];

/* ─────────────────────────────────────────────────────────
   Zero-Dependency Web Audio Synthesizer for Sci-Fi Feedback
───────────────────────────────────────────────────────── */
class SoundFx {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playKey() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const f = 350 + Math.random() * 250;
      osc.frequency.setValueAtTime(f, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (_) {}
  }

  playHover() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.015, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch (_) {}
  }

  playRipple() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch (_) {}
  }

  playError() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (_) {}
  }

  playSuccess() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const start = this.ctx.currentTime + idx * 0.05;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.06, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.35);
      });
    } catch (_) {}
  }
}

const audio = new SoundFx();

/* ─────────────────────────────────────────────────────────
   Interactive 3D Perspective Wave Grid Canvas Hook
───────────────────────────────────────────────────────── */
function useInteractive3DGrid(canvasRef, theme, mode, warpSpeed) {
  const mouseRef = useRef({ x: -9999, y: -9999, targetX: 0, targetY: 0, normX: 0, normY: 0 });
  const frameRef = useRef(0);
  const ripplesRef = useRef([]);
  const particlesRef = useRef([]);
  const rafRef = useRef(null);

  // Add click ripple
  const triggerRipple = useCallback((x, y, strength = 45, maxRadius = 380) => {
    ripplesRef.current.push({
      x,
      y,
      radius: 0,
      maxRadius,
      strength,
      speed: 7.5,
      life: 1,
    });
    audio.playRipple();
  }, []);

  // Add celebratory particle burst
  const triggerBurst = useCallback((cx, cy, count = 75) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2;
      particlesRef.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: ['#00ffcc', '#ff007f', '#ffffff', '#ffaa00', '#aa55ff'][Math.floor(Math.random() * 5)],
        radius: Math.random() * 3 + 1,
        life: 1,
        decay: Math.random() * 0.02 + 0.015,
      });
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H;

    const SPACING_X = 24;
    const SPACING_Z = 22;
    const COLS = 64;
    const ROWS = 48;
    const FOV = 420;
    const CAMERA_Z = -180;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };

    const getDotColor = (normX, brightness, alpha, themeId) => {
      if (themeId === 'spectrum') {
        // Growthr style: Emerald/Cyan on left -> Purple/Magenta in center -> Coral/Orange on right
        let h;
        if (normX < -0.2) {
          h = 160 + (normX + 1) * 30; // 136 - 184 (cyan-green)
        } else if (normX < 0.25) {
          h = 265 + (normX + 0.2) * 50; // 265 - 288 (violet-purple)
        } else {
          h = 10 + (normX - 0.25) * 35;  // 10 - 36 (red-orange)
        }
        const s = 45 + brightness * 45;
        const l = 16 + brightness * 50;
        return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
      } else if (themeId === 'cyber') {
        const h = 180 + (normX + 1) * 60; // cyan to magenta
        return `hsla(${h}, 70%, ${20 + brightness * 50}%, ${alpha})`;
      } else if (themeId === 'crimson') {
        const h = 345 + (normX + 1) * 25; // crimson to gold
        return `hsla(${h % 360}, 80%, ${18 + brightness * 50}%, ${alpha})`;
      } else {
        // Matrix
        const h = 135 + brightness * 25;
        return `hsla(${h}, 80%, ${15 + brightness * 60}%, ${alpha})`;
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      frameRef.current += warpSpeed ? 3.5 : 1;
      const f = frameRef.current;
      const speed = warpSpeed ? 0.045 : 0.016;

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const tiltX = (mouseRef.current.normX || 0) * 0.15;
      const tiltY = (mouseRef.current.normY || 0) * 0.15;

      const centerX = W / 2;
      const centerY = H * 0.52;

      // Update and filter active shockwave ripples
      for (let r = 0; r < ripplesRef.current.length; r++) {
        const rip = ripplesRef.current[r];
        rip.radius += rip.speed;
        rip.life = 1 - rip.radius / rip.maxRadius;
      }
      ripplesRef.current = ripplesRef.current.filter((rip) => rip.life > 0);

      // Render 3D undulating terrain dots
      for (let r = 0; r < ROWS; r++) {
        const z = (r - ROWS / 2) * SPACING_Z;

        for (let c = 0; c < COLS; c++) {
          const x = (c - COLS / 2) * SPACING_X;

          // 3D waves calculation
          const wave1 = Math.sin(x * 0.02 + f * speed) * 22;
          const wave2 = Math.cos(z * 0.03 + f * (speed * 0.8)) * 18;
          const wave3 = Math.sin((x + z) * 0.015 + f * speed) * 12;
          let y = wave1 + wave2 + wave3;

          // Base perspective projection
          const rotZ = z * Math.cos(tiltX) - x * Math.sin(tiltX);
          const rotX = z * Math.sin(tiltX) + x * Math.cos(tiltX);
          const rotY = y + (z * tiltY);

          const depth = rotZ + 400 - CAMERA_Z;
          if (depth <= 10) continue;

          const projScale = FOV / depth;
          let px = centerX + rotX * projScale;
          let py = centerY + rotY * projScale;

          // Interactive Cursor Physics
          const distToMouse = Math.hypot(px - mx, py - my);
          let interactionFactor = 0;

          if (mode === 'repel') {
            if (distToMouse < 180) {
              const force = (1 - distToMouse / 180) * 45;
              const angle = Math.atan2(py - my, px - mx);
              px += Math.cos(angle) * force;
              py += Math.sin(angle) * force;
              interactionFactor = force / 45;
            }
          } else if (mode === 'vortex') {
            if (distToMouse < 220) {
              const angle = Math.atan2(py - my, px - mx) + 0.8;
              const force = (1 - distToMouse / 220) * 35;
              px += Math.cos(angle) * force;
              py += Math.sin(angle) * force;
              interactionFactor = force / 35;
            }
          } else {
            // Wave mode: cursor elevates nearby dots
            if (distToMouse < 160) {
              const force = (1 - distToMouse / 160);
              py -= force * 18;
              interactionFactor = force;
            }
          }

          // Apply active shockwave ripples
          for (let ripIdx = 0; ripIdx < ripplesRef.current.length; ripIdx++) {
            const rip = ripplesRef.current[ripIdx];
            const distToRip = Math.hypot(px - rip.x, py - rip.y);
            const diff = Math.abs(distToRip - rip.radius);
            if (diff < 40) {
              const ripWave = Math.sin((diff / 40) * Math.PI) * rip.strength * rip.life;
              py -= ripWave * 0.6;
              interactionFactor = Math.max(interactionFactor, rip.life);
            }
          }

          // Dot appearance & brightness
          const normX = rotX / (COLS * SPACING_X * 0.5);
          const heightBrightness = (y + 50) / 100;
          const totalBrightness = Math.min(1, Math.max(0, heightBrightness * 0.45 + interactionFactor * 0.55));
          const alpha = Math.min(0.95, 0.2 + projScale * 0.45 + totalBrightness * 0.4);
          const radius = Math.max(0.6, (1.2 * projScale) + (interactionFactor * 1.5));

          ctx.beginPath();
          ctx.arc(px, py, radius, 0, Math.PI * 2);
          ctx.fillStyle = getDotColor(normX, totalBrightness, alpha, theme);
          ctx.fill();
        }
      }

      // Render celebratory particles
      for (let p = 0; p < particlesRef.current.length; p++) {
        const pt = particlesRef.current[p];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vx *= 0.98;
        pt.vy += 0.12; // gravity
        pt.life -= pt.decay;

        if (pt.life > 0) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.radius * pt.life, 0, Math.PI * 2);
          ctx.fillStyle = pt.color;
          ctx.globalAlpha = Math.max(0, pt.life);
          ctx.fill();
        }
      }
      particlesRef.current = particlesRef.current.filter((p) => p.life > 0);
      ctx.globalAlpha = 1;

      rafRef.current = requestAnimationFrame(draw);
    };

    const onMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.normX = (e.clientX / W) * 2 - 1;
      mouseRef.current.normY = (e.clientY / H) * 2 - 1;
    };

    const onTouchMove = (e) => {
      const t = e.touches[0];
      mouseRef.current.x = t.clientX;
      mouseRef.current.y = t.clientY;
      mouseRef.current.normX = (t.clientX / W) * 2 - 1;
      mouseRef.current.normY = (t.clientY / H) * 2 - 1;
    };

    const onMouseDown = (e) => {
      // Send ripple on background click
      triggerRipple(e.clientX, e.clientY, 50, 420);
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
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseleave', onMouseLeave);

    resize();
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [theme, mode, warpSpeed, triggerRipple]);

  return { triggerRipple, triggerBurst };
}

/* ─────────────────────────────────────────────────────────
   Interactive Sparkles on Headline Hook
───────────────────────────────────────────────────────── */
function useSparkles(canvasRef, wrapRef) {
  const sparklesRef = useRef([]);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      canvas.width = rect.width + 70;
      canvas.height = rect.height + 50;
    };

    const spawn = (isCursor = false, cx = 0, cy = 0) => {
      sparklesRef.current.push({
        x: isCursor ? cx : Math.random() * canvas.width,
        y: isCursor ? cy : Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.03 + 0.01,
        phase: Math.random() * Math.PI * 2,
        life: 0,
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (sparklesRef.current.length < 55 && Math.random() < 0.4) spawn();

      sparklesRef.current = sparklesRef.current.filter((s) => s.life < Math.PI / s.speed);

      for (const s of sparklesRef.current) {
        s.life += s.speed;
        const alpha = Math.max(0, Math.sin(s.phase + s.life));

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = alpha > 0.7 ? '#ffffff' : '#d8d0ff';
        ctx.globalAlpha = alpha;
        ctx.fill();

        // Cross star flare
        if (s.r > 1.3 && alpha > 0.45) {
          ctx.globalAlpha = alpha * 0.6;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 0.7;
          const len = s.r * 3.5;
          ctx.beginPath();
          ctx.moveTo(s.x - len, s.y);
          ctx.lineTo(s.x + len, s.y);
          ctx.moveTo(s.x, s.y - len);
          ctx.lineTo(s.x, s.y + len);
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };

    const onHeadlineHover = (e) => {
      const rect = canvas.getBoundingClientRect();
      spawn(true, e.clientX - rect.left, e.clientY - rect.top);
      audio.playHover();
    };

    wrap.addEventListener('mousemove', onHeadlineHover);
    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      wrap.removeEventListener('mousemove', onHeadlineHover);
      window.removeEventListener('resize', resize);
    };
  }, [canvasRef, wrapRef]);
}

/* ─────────────────────────────────────────────────────────
   Main OnSight Interactive Component
───────────────────────────────────────────────────────── */
export default function OnSight() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [granted, setGranted] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [muted, setMuted] = useState(false);

  // Interactive controls state
  const [theme, setTheme] = useState('spectrum');
  const [mode, setMode] = useState('wave');
  const [tilt, setTilt] = useState({ x: 0, y: 0, gleamX: 50, gleamY: 50 });

  const bgRef = useRef(null);
  const sparkRef = useRef(null);
  const headlineRef = useRef(null);
  const logoRef = useRef(null);
  const inputRef = useRef(null);

  const { triggerRipple, triggerBurst } = useInteractive3DGrid(bgRef, theme, mode, exiting);
  useSparkles(sparkRef, headlineRef);

  /* If already logged in, navigate straight to home */
  useEffect(() => {
    if (!authLoading && user) navigate('/', { replace: true });
  }, [authLoading, user, navigate]);

  /* If gate already unlocked in current session, skip */
  useEffect(() => {
    if (sessionStorage.getItem('onsight_granted') === '1') {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  /* 3D Logo Tilt Interaction */
  const handleLogoMouseMove = useCallback((e) => {
    if (!logoRef.current) return;
    const rect = logoRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);

    setTilt({
      x: -dy * 18,
      y: dx * 22,
      gleamX: Math.round(((e.clientX - rect.left) / rect.width) * 100),
      gleamY: Math.round(((e.clientY - rect.top) / rect.height) * 100),
    });
  }, []);

  const handleLogoMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0, gleamX: 50, gleamY: 50 });
  }, []);

  /* Logo Click Shockwave */
  const handleLogoClick = useCallback((e) => {
    const rect = logoRef.current?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : e.clientX;
    const cy = rect ? rect.top + rect.height / 2 : e.clientY;
    triggerRipple(cx, cy, 70, 520);
    triggerBurst(cx, cy, 40);
    audio.playRipple();
  }, [triggerRipple, triggerBurst]);

  /* Submit handler */
  const handleEnter = useCallback(() => {
    const val = code.trim().toLowerCase();
    if (!val) {
      setShaking(true);
      setError('ENTER ACCESS CODE');
      audio.playError();
      setTimeout(() => setShaking(false), 450);
      return;
    }

    if (VALID_CODES.has(val)) {
      setGranted(true);
      setError('');
      audio.playSuccess();
      sessionStorage.setItem('onsight_granted', '1');

      // Trigger celebratory blast from center
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      triggerBurst(cx, cy, 120);
      triggerRipple(cx, cy, 80, 600);

      // Hyperspace warp speed transition before navigating
      setTimeout(() => setExiting(true), 350);
      setTimeout(() => navigate('/login', { replace: true }), 950);
    } else {
      setShaking(true);
      setError('INVALID ACCESS CODE');
      audio.playError();
      setTimeout(() => setShaking(false), 450);
      setTimeout(() => setError(''), 2500);
    }
  }, [code, navigate, triggerBurst, triggerRipple]);

  /* Quick code autofill */
  const fillCode = useCallback((c) => {
    setCode(c);
    audio.playKey();
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const toggleMute = useCallback(() => {
    audio.muted = !audio.muted;
    setMuted(audio.muted);
    if (!audio.muted) audio.playHover();
  }, []);

  const cycleTheme = useCallback(() => {
    const idx = THEMES.findIndex((t) => t.id === theme);
    const next = THEMES[(idx + 1) % THEMES.length].id;
    setTheme(next);
    audio.playHover();
  }, [theme]);

  const cycleMode = useCallback(() => {
    const idx = MODES.findIndex((m) => m.id === mode);
    const next = MODES[(idx + 1) % MODES.length].id;
    setMode(next);
    audio.playHover();
  }, [mode]);

  return (
    <div className={`onsight-root${exiting ? ' onsight-exit' : ''}`}>
      {/* 3D Undulating Dot-Grid Canvas Background */}
      <canvas ref={bgRef} className="onsight-bg-canvas" />

      {/* Cinematic Overlays */}
      <div className="onsight-glow" />

      {/* Top Floating Action Bar */}
      <header className="onsight-topbar">
        <div className="onsight-badge">
          <span className="onsight-badge-dot" />
          <span>ON SIGHT · MAHI PROTOCOL</span>
        </div>

        <div className="onsight-top-controls">
          <button
            className="onsight-ctrl-btn"
            onClick={cycleTheme}
            title="Switch Visual Spectrum"
            type="button"
          >
            {THEMES.find((t) => t.id === theme)?.label}
          </button>

          <button
            className="onsight-ctrl-btn"
            onClick={cycleMode}
            title="Switch Physics Behavior"
            type="button"
          >
            {MODES.find((m) => m.id === mode)?.label}
          </button>

          <button
            className="onsight-ctrl-btn"
            onClick={toggleMute}
            title={muted ? 'Unmute Sci-Fi SFX' : 'Mute Sci-Fi SFX'}
            type="button"
          >
            {muted ? '🔇 Muted' : '🔊 Audio ON'}
          </button>
        </div>
      </header>

      {/* Central Interactive Main Stage */}
      <main className="onsight-stage">
        {/* 3D Metallic 'G' with Parallax Tilt & Light Gleam */}
        <div
          ref={logoRef}
          className="onsight-logo-container"
          onMouseMove={handleLogoMouseMove}
          onMouseLeave={handleLogoMouseLeave}
          onClick={handleLogoClick}
          title="Click to emit 3D shockwave"
        >
          <div
            className="onsight-logo-wrap"
            style={{
              transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(24px)`,
            }}
          >
            <div className="onsight-logo" aria-hidden="true">G</div>
            <div
              className="onsight-logo-gleam"
              style={{
                background: `radial-gradient(circle at ${tilt.gleamX}% ${tilt.gleamY}%, rgba(255,255,255,0.85) 0%, transparent 60%)`,
              }}
            />
          </div>
        </div>

        {/* Sparkling 'ON SIGHT' Headline */}
        <div ref={headlineRef} className="onsight-headline-wrap">
          <canvas ref={sparkRef} className="onsight-sparkle-canvas" />
          <h1 className="onsight-headline">ON SIGHT</h1>
        </div>

        {/* Access Form */}
        <form
          className="onsight-form-container"
          onSubmit={(e) => { e.preventDefault(); handleEnter(); }}
        >
          <div className="onsight-input-wrap">
            <input
              ref={inputRef}
              className={`onsight-input${shaking ? ' onsight-input--error' : ''}`}
              type="password"
              placeholder="ACCESS CODE"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                audio.playKey();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEnter();
              }}
              autoComplete="off"
              spellCheck={false}
              disabled={granted}
            />
          </div>

          <button
            className={`onsight-enter-btn${granted ? ' onsight-enter-btn--granted' : ''}`}
            type="submit"
            disabled={granted}
            onMouseEnter={() => audio.playHover()}
          >
            {granted ? '✓ ACCESS GRANTED' : 'ENTER'}
          </button>

          {/* Quick-Access Helper Chips */}
          <div className="onsight-hints-bar">
            <span className="onsight-hint-label">Quick Access:</span>
            {['mahillm', 'gate2026', 'onsight'].map((c) => (
              <span
                key={c}
                className="onsight-hint-chip"
                onClick={() => fillCode(c)}
                title={`Click to fill '${c}'`}
              >
                ⚡ {c}
              </span>
            ))}
          </div>

          {/* Status / Error Notification */}
          <div className="onsight-error-msg">
            {error && <span>⚠️ {error}</span>}
          </div>
        </form>
      </main>

      {/* Footer & Interactive Guide */}
      <footer className="onsight-footer">
        <div className="onsight-footer-links">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            onMouseEnter={() => audio.playHover()}
          >
            CONNECT ON INSTAGRAM®
          </a>
          <a
            href="https://mahillm-oa.vercel.app"
            target="_blank"
            rel="noreferrer"
            onMouseEnter={() => audio.playHover()}
          >
            MAHILLM LABS
          </a>
        </div>

        <div className="onsight-interactive-hint">
          <div className="onsight-mouse-icon" />
          <span>Click anywhere to send 3D shockwave</span>
        </div>
      </footer>
    </div>
  );
}
