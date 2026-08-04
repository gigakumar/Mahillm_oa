import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Command,
  Sparkles,
  ClipboardCheck,
  BookMarked,
  Layers,
  Activity,
  Mic,
  Swords,
  Compass,
  Calendar,
  Zap,
  ArrowRight,
  X
} from 'lucide-react';
import './CommandPalette.css';

const QUICK_ACTIONS = [
  { id: 'practice', title: 'Practice & PYQs', sub: 'Adaptive & topic practice questions', icon: Sparkles, color: 'var(--accent)', path: '/oa-practice' },
  { id: 'tests', title: 'Tests & Mocks Portal', sub: 'Full OA simulations & exam presets', icon: ClipboardCheck, color: '#38bdf8', path: '/tests' },
  { id: 'formulas', title: 'Formula Revision Hub', sub: 'Interactive LaTeX sheets & 3D memory flashcards', icon: Layers, color: '#34d399', path: '/formulas' },
  { id: 'readiness', title: 'Readiness & Skill Radar', sub: 'GitHub study heatmap & company target readiness', icon: Activity, color: 'var(--warning)', path: '/readiness' },
  { id: 'mistakes', title: 'Mistake Notebook', sub: 'Classify & resolve repeat error patterns', icon: BookMarked, color: '#f87171', path: '/mistakes' },
  { id: 'interview', title: 'AI Mock Interview', icon: Mic, sub: 'Live voice technical & HR interviewer', color: '#c084fc', path: '/mock-interview' },
  { id: 'duel', title: '1v1 Speed Duel', icon: Swords, sub: 'Real-time multiplayer mechanical duels', color: '#fb923c', path: '/duel' },
  { id: 'planner', title: 'Study Planner', icon: Calendar, sub: 'Customizable schedule & streak tracker', color: 'var(--accent)', path: '/planner' },
  { id: 'gate', title: 'GATE Rank Predictor', icon: Compass, sub: 'Marks & percentile analysis', color: '#22d3ee', path: '/gate-predictor' }
];

const TOPICS = [
  { name: 'Thermodynamics', cat: 'Mechanical', path: '/oa-practice?cat=Mechanical%20Engineering&topic=Thermodynamics' },
  { name: 'Fluid Mechanics', cat: 'Mechanical', path: '/oa-practice?cat=Mechanical%20Engineering&topic=Fluid%20Mechanics' },
  { name: 'Strength of Materials', cat: 'Mechanical', path: '/oa-practice?cat=Mechanical%20Engineering&topic=Strength%20of%20Materials' },
  { name: 'Heat Transfer', cat: 'Mechanical', path: '/oa-practice?cat=Mechanical%20Engineering&topic=Heat%20Transfer' },
  { name: 'Manufacturing Engineering', cat: 'Mechanical', path: '/oa-practice?cat=Mechanical%20Engineering&topic=Manufacturing%20Engineering' },
  { name: 'Machine Design', cat: 'Mechanical', path: '/oa-practice?cat=Mechanical%20Engineering&topic=Machine%20Design' },
  { name: 'Quantitative Aptitude', cat: 'Aptitude', path: '/oa-practice?cat=Quantitative%20Aptitude' }
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // ⌘K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Filter items
  const filteredActions = QUICK_ACTIONS.filter(a =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.sub.toLowerCase().includes(query.toLowerCase())
  );

  const filteredTopics = TOPICS.filter(t =>
    t.name.toLowerCase().includes(query.toLowerCase()) ||
    t.cat.toLowerCase().includes(query.toLowerCase())
  );

  const totalResults = filteredActions.length + filteredTopics.length;

  const handleSelect = (path) => {
    setOpen(false);
    navigate(path);
  };

  const handleKeyDownInMenu = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, totalResults));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + totalResults) % Math.max(1, totalResults));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex < filteredActions.length) {
        handleSelect(filteredActions[selectedIndex].path);
      } else {
        const topicItem = filteredTopics[selectedIndex - filteredActions.length];
        if (topicItem) handleSelect(topicItem.path);
      }
    }
  };

  return (
    <>
      {/* Floating KBD Trigger Button */}
      <button className="cmd-trigger-btn" onClick={() => setOpen(true)} title="Press ⌘K to open command palette">
        <Search size={14} />
        <span>Search features or topics...</span>
        <kbd className="cmd-kbd">⌘K</kbd>
      </button>

      {/* Command Palette Modal */}
      {open && (
        <div className="cmd-overlay" onClick={() => setOpen(false)}>
          <div className="cmd-modal" onClick={e => e.stopPropagation()} onKeyDown={handleKeyDownInMenu}>
            <div className="cmd-header">
              <Search size={18} className="cmd-search-icon" />
              <input
                ref={inputRef}
                type="text"
                className="cmd-input"
                placeholder="Type a feature, topic, or command..."
                value={query}
                onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
              />
              {query && (
                <button className="cmd-clear" onClick={() => setQuery('')}>
                  <X size={14} />
                </button>
              )}
              <kbd className="cmd-esc">ESC</kbd>
            </div>

            <div className="cmd-body">
              {totalResults === 0 ? (
                <div className="cmd-empty">
                  <span>🔍</span>
                  <p>No matching commands found for "{query}"</p>
                </div>
              ) : (
                <>
                  {filteredActions.length > 0 && (
                    <div className="cmd-group">
                      <div className="cmd-group-label">Quick Features</div>
                      {filteredActions.map((action, idx) => {
                        const Icon = action.icon;
                        const isSelected = idx === selectedIndex;
                        return (
                          <div
                            key={action.id}
                            className={`cmd-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleSelect(action.path)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                          >
                            <div className="cmd-item-icon" style={{ color: action.color, background: `${action.color}15` }}>
                              <Icon size={16} />
                            </div>
                            <div className="cmd-item-text">
                              <span className="cmd-item-title">{action.title}</span>
                              <span className="cmd-item-sub">{action.sub}</span>
                            </div>
                            <ArrowRight size={14} className="cmd-item-arrow" />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {filteredTopics.length > 0 && (
                    <div className="cmd-group">
                      <div className="cmd-group-label">Direct Practice Topics</div>
                      {filteredTopics.map((topic, idx) => {
                        const itemIndex = filteredActions.length + idx;
                        const isSelected = itemIndex === selectedIndex;
                        return (
                          <div
                            key={topic.name}
                            className={`cmd-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleSelect(topic.path)}
                            onMouseEnter={() => setSelectedIndex(itemIndex)}
                          >
                            <div className="cmd-item-icon" style={{ color: 'var(--warning)', background: 'rgba(245, 158, 11, 0.12)' }}>
                              <Zap size={16} />
                            </div>
                            <div className="cmd-item-text">
                              <span className="cmd-item-title">{topic.name}</span>
                              <span className="cmd-item-sub">{topic.cat} practice drill</span>
                            </div>
                            <ArrowRight size={14} className="cmd-item-arrow" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="cmd-footer">
              <span>Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
              <span><kbd>↵</kbd> to select</span>
              <span><kbd>ESC</kbd> to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
