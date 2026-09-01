import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, RotateCcw, Volume2, VolumeX, LogOut, Settings } from 'lucide-react';
import './FocusMode.css';

export default function FocusMode() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [muted, setMuted] = useState(true);

  // Engine hum audio (placeholder sound URL or just visual)
  // In a real app we'd load a local MP3. Here we just pretend with state.

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Play a bell sound here in real life
      if (isBreak) {
        setTimeLeft(25 * 60);
        setIsBreak(false);
        setIsActive(false);
      } else {
        setTimeLeft(5 * 60);
        setIsBreak(true);
        setIsActive(false);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isBreak]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(isBreak ? 5 * 60 : 25 * 60);
  };
  
  const toggleMute = () => setMuted(!muted);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="focus-mode-container">
      {/* Background ambient overlay */}
      <div className={`focus-ambient-bg ${isActive ? 'pulsing' : ''}`}></div>
      
      <div className="focus-header">
        <button className="focus-btn-icon" onClick={() => navigate('/')}>
          <LogOut size={20} />
          <span>Exit Engine Room</span>
        </button>
        <div className="focus-status">
          {isBreak ? "Cooling Down" : "Deep Work"}
        </div>
        <button className="focus-btn-icon" onClick={toggleMute}>
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          <span>Ambient Hum</span>
        </button>
      </div>

      <div className="focus-main">
        <div className="timer-ring-container">
          <svg className="timer-ring" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" className="timer-ring-bg"></circle>
            <circle 
              cx="50" cy="50" r="45" 
              className="timer-ring-progress"
              style={{
                strokeDashoffset: 283 - (283 * (timeLeft / (isBreak ? 300 : 1500)))
              }}
            ></circle>
          </svg>
          <div className="timer-display">
            <h1>{formatTime(timeLeft)}</h1>
            <p>{isBreak ? 'REST' : 'FOCUS'}</p>
          </div>
        </div>

        <div className="timer-controls">
          <button className="timer-btn primary" onClick={toggleTimer}>
            {isActive ? <Pause size={28} /> : <Play size={28} />}
          </button>
          <button className="timer-btn secondary" onClick={resetTimer}>
            <RotateCcw size={24} />
          </button>
        </div>
      </div>
      
      <div className="focus-footer">
        <p>Close all other tabs. Mute notifications. Forge your future.</p>
      </div>
    </div>
  );
}
