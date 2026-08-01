import React, { useState, useEffect, useRef } from 'react';
import { Headphones, Play, Pause, Volume2, VolumeX, Sparkles, CloudRain, Wind, Waves, Radio } from 'lucide-react';
import './FocusAudioPlayer.css';

const TRACKS = [
  { id: 'binaural', name: '432Hz Alpha Focus Waves', icon: Radio, desc: 'Binaural tone for deep concentration & memory retention' },
  { id: 'rain', name: 'Ambient Rain Synth', icon: CloudRain, desc: 'Gentle rainfall white noise background' },
  { id: 'wind', name: 'Deep Forest Breeze', icon: Wind, desc: 'Calming pink noise wind envelope' },
  { id: 'waves', name: 'Ocean Tide Rhythm', icon: Waves, desc: 'Low-frequency ocean wave oscillations' }
];

export default function FocusAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(TRACKS[0]);
  const [volume, setVolume] = useState(0.5);
  const [isOpen, setIsOpen] = useState(false);

  const audioCtxRef = useRef(null);
  const gainNodeRef = useRef(null);
  const oscNodesRef = useRef([]);

  // Cleanup Web Audio nodes
  const stopAudio = () => {
    oscNodesRef.current.forEach(node => {
      try { node.stop(); node.disconnect(); } catch (e) {}
    });
    oscNodesRef.current = [];
    if (audioCtxRef.current) {
      try { audioCtxRef.current.suspend(); } catch (e) {}
    }
  };

  useEffect(() => {
    return () => stopAudio();
  }, []);

  // Update volume
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume * 0.2, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  // Start sound synthesis based on track
  const startAudio = (trackId) => {
    stopAudio();

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    audioCtxRef.current = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume * 0.2, ctx.currentTime);
    masterGain.connect(ctx.destination);
    gainNodeRef.current = masterGain;

    if (trackId === 'binaural') {
      // 432Hz Alpha wave binaural beats (Left: 432Hz, Right: 442Hz -> 10Hz Alpha beat)
      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();
      const merger = ctx.createChannelMerger(2);

      oscL.type = 'sine';
      oscL.frequency.setValueAtTime(432, ctx.currentTime);
      oscL.connect(merger, 0, 0);

      oscR.type = 'sine';
      oscR.frequency.setValueAtTime(442, ctx.currentTime);
      oscR.connect(merger, 0, 1);

      merger.connect(masterGain);
      oscL.start();
      oscR.start();
      oscNodesRef.current = [oscL, oscR];
    } else if (trackId === 'rain') {
      // White noise generator filtered to rain spectrum
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(masterGain);
      whiteNoise.start();
      oscNodesRef.current = [whiteNoise];
    } else if (trackId === 'wind') {
      // Pink noise + LFO modulation for wind gusts
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        b6 = white * 0.115926;
      }

      const pinkNoise = ctx.createBufferSource();
      pinkNoise.buffer = noiseBuffer;
      pinkNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, ctx.currentTime);
      filter.Q.setValueAtTime(1.0, ctx.currentTime);

      pinkNoise.connect(filter);
      filter.connect(masterGain);
      pinkNoise.start();
      oscNodesRef.current = [pinkNoise];
    } else if (trackId === 'waves') {
      // Low frequency ocean swell
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(80, ctx.currentTime);

      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // 0.12 Hz wave cycle

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(40, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      osc.connect(masterGain);
      osc.start();
      lfo.start();
      oscNodesRef.current = [osc, lfo];
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
    } else {
      startAudio(currentTrack.id);
      setIsPlaying(true);
    }
  };

  const selectTrack = (track) => {
    setCurrentTrack(track);
    if (isPlaying) {
      startAudio(track.id);
    }
  };

  const TrackIcon = currentTrack.icon;

  return (
    <>
      {/* Floating Audio Trigger */}
      <button
        className={`focus-audio-pill ${isPlaying ? 'playing' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Open Ambient Study Beats Player"
      >
        <Headphones size={15} className={isPlaying ? 'animate-pulse text-emerald-400' : ''} />
        <span>{isPlaying ? currentTrack.name : 'Focus Beats'}</span>
        {isPlaying && <span className="audio-wave-bar" />}
      </button>

      {/* Audio Player Card Drawer */}
      {isOpen && (
        <div className="audio-player-card card">
          <div className="ap-header">
            <div className="ap-title">
              <Headphones size={16} className="text-emerald-400" />
              <span>Ambient Focus Soundscapes</span>
            </div>
            <button className="ap-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          {/* Current Track Info & Play Button */}
          <div className="ap-now-playing">
            <div className="ap-track-icon">
              <TrackIcon size={20} className="text-emerald-400" />
            </div>
            <div className="ap-track-info">
              <span className="ap-track-name">{currentTrack.name}</span>
              <span className="ap-track-desc">{currentTrack.desc}</span>
            </div>

            <button className={`ap-play-btn ${isPlaying ? 'active' : ''}`} onClick={togglePlay}>
              {isPlaying ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
            </button>
          </div>

          {/* Volume Control */}
          <div className="ap-volume-row">
            {volume === 0 ? <VolumeX size={14} className="text-slate-400" /> : <Volume2 size={14} className="text-emerald-400" />}
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              className="ap-vol-slider"
            />
            <span className="ap-vol-pct">{Math.round(volume * 100)}%</span>
          </div>

          {/* Tracks List */}
          <div className="ap-tracks-list">
            {TRACKS.map(t => {
              const Icon = t.icon;
              const isSelected = t.id === currentTrack.id;
              return (
                <div
                  key={t.id}
                  className={`ap-track-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => selectTrack(t)}
                >
                  <Icon size={14} className="t-icon" />
                  <span className="t-name">{t.name}</span>
                  {isSelected && isPlaying && <span className="t-playing-dot">●</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
