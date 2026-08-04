import React, { useState, useEffect, useRef } from 'react';
import { Clock, Play, Pause, RotateCcw, Volume2, VolumeX, X, Sparkles, Trophy, Bell } from 'lucide-react';
import './FocusTimerModal.css';

const PRESETS = [
  { id: 'pomodoro', label: '25m Pomodoro 🧠', minutes: 25 },
  { id: 'short_sprint', label: '15m Quick Sprint ⚡', minutes: 15 },
  { id: 'standard_test', label: '45m Practice Test 📋', minutes: 45 },
  { id: 'full_mock', label: '60m Full Mock 🏆', minutes: 60 },
  { id: 'gate_exam', label: '180m Full GATE Exam 🎓', minutes: 180 }
];

export default function FocusTimerModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState(PRESETS[0]);
  const [timeLeft, setTimeLeft] = useState(PRESETS[0].minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sessionsCompleted, setSessionsCompleted] = useState(() => {
    try {
      return parseInt(localStorage.getItem('focus_sessions_completed') || '0', 10);
    } catch { return 0; }
  });

  const [audioCtx, setAudioCtx] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  const playNotificationBeep = () => {
    if (!soundEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      // First tone: 523Hz for 150ms
      osc.frequency.setValueAtTime(523, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.setValueAtTime(0, audioCtx.currentTime + 0.15);
      
      // Second tone: 659Hz for 150ms
      osc.frequency.setValueAtTime(659, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0, audioCtx.currentTime + 0.3);
      
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) { console.error(e); }
  };

  const handleTimerComplete = () => {
    setSessionsCompleted(prev => {
      const next = prev + 1;
      localStorage.setItem('focus_sessions_completed', next.toString());
      return next;
    });

    playNotificationBeep();
  };

  const selectPreset = (preset) => {
    setActivePreset(preset);
    setTimeLeft(preset.minutes * 60);
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(activePreset.minutes * 60);
  };

  const formatDisplayTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalSecs = activePreset.minutes * 60;
  const progressPct = Math.round(((totalSecs - timeLeft) / totalSecs) * 100);

  return (
    <>
      {/* Trigger Pill in Header */}
      <button className={`focus-timer-pill ${isRunning ? 'running' : ''}`} onClick={() => setIsOpen(true)}>
        <Clock size={15} className={isRunning ? 'animate-spin text-amber-400' : ''} />
        <span>{formatDisplayTime(timeLeft)}</span>
        {isRunning && <span className="running-dot" />}
      </button>

      {/* Timer Modal */}
      {isOpen && (
        <div className="ft-overlay" onClick={() => setIsOpen(false)}>
          <div className="ft-modal card" onClick={e => e.stopPropagation()}>
            <div className="ft-header">
              <div className="ft-title">
                <Clock size={18} className="text-indigo-400" />
                <span>Focus & Exam Stopwatch</span>
              </div>
              <div className="ft-header-right">
                <button
                  className="ft-icon-btn"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? 'Mute Chime' : 'Unmute Chime'}
                >
                  {soundEnabled ? <Volume2 size={16} className="text-amber-400" /> : <VolumeX size={16} />}
                </button>
                <button className="ft-icon-btn" onClick={() => setIsOpen(false)}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="ft-presets-row">
              {PRESETS.map(p => (
                <button
                  key={p.id}
                  className={`ft-preset-btn ${activePreset.id === p.id ? 'active' : ''}`}
                  onClick={() => selectPreset(p)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Main Circular Ring / Counter Display */}
            <div className="ft-display-box">
              <svg viewBox="0 0 100 100" className="ft-svg-ring">
                <circle cx="50" cy="50" r="44" className="ft-ring-bg" />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className="ft-ring-fill"
                  strokeDasharray="276.46"
                  strokeDashoffset={276.46 - (276.46 * progressPct) / 100}
                />
              </svg>

              <div className="ft-time-text">
                <span className="ft-time-num">{formatDisplayTime(timeLeft)}</span>
                <span className="ft-preset-name">{activePreset.label}</span>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="ft-controls">
              <button
                className={`btn ${isRunning ? 'btn-warning' : 'btn-primary'} ft-play-btn`}
                onClick={() => {
                  if (!audioCtx && window.AudioContext) {
                    setAudioCtx(new (window.AudioContext || window.webkitAudioContext)());
                  } else if (audioCtx && audioCtx.state === 'suspended') {
                    audioCtx.resume();
                  }
                  setIsRunning(!isRunning);
                }}
              >
                {isRunning ? (
                  <>
                    <Pause size={18} /> Pause Session
                  </>
                ) : (
                  <>
                    <Play size={18} fill="currentColor" /> Start Focus Session
                  </>
                )}
              </button>

              <button className="btn btn-ghost ft-reset-btn" onClick={resetTimer} title="Reset Timer">
                <RotateCcw size={16} /> Reset
              </button>
            </div>

            {/* Stats Footer */}
            <div className="ft-footer">
              <div className="ft-stat">
                <Trophy size={14} className="text-amber-400" />
                <span>{sessionsCompleted} sessions completed today</span>
              </div>
              <span className="ft-tip font-mono">Tip: Stay off distractions while timer runs</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
