import React, { useState, useEffect } from 'react';
import { FileText, X, Sparkles, Copy, Download, Check, Minimize2, Maximize2 } from 'lucide-react';
import './QuickNotesModal.css';

export default function QuickNotesModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [noteContent, setNoteContent] = useState(() => {
    return localStorage.getItem('quick_study_notes') || '';
  });
  const [copied, setCopied] = useState(false);
  const [isAiCleaning, setIsAiCleaning] = useState(false);

  useEffect(() => {
    localStorage.setItem('quick_study_notes', noteContent);
  }, [noteContent]);

  const handleCopy = () => {
    navigator.clipboard.writeText(noteContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([noteContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MahiLLM_Study_Notes_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAiFormat = () => {
    if (!noteContent.trim()) return;
    setIsAiCleaning(true);

    // AI cleaning simulation: format note text into clean markdown with bullets and key formulas
    setTimeout(() => {
      const lines = noteContent.split('\n').filter(l => l.trim());
      const formatted = `### 📝 Study Notes (${new Date().toLocaleDateString()})\n\n` +
        `**Key Summary:**\n` +
        lines.map(l => `- ${l.replace(/^-\s*/, '')}`).join('\n') +
        `\n\n*Auto-formatted by MahiLLM AI Copilot ✨*`;
      setNoteContent(formatted);
      setIsAiCleaning(false);
    }, 800);
  };

  return (
    <>
      {/* Floating Trigger Pill */}
      {!isOpen && (
        <button className="quick-notes-trigger" onClick={() => setIsOpen(true)} title="Open Quick Scratchpad Notes">
          <FileText size={16} />
          <span>Quick Notes</span>
        </button>
      )}

      {/* Floating Notes Modal */}
      {isOpen && (
        <div className={`quick-notes-window ${isMinimized ? 'minimized' : ''}`}>
          <div className="qn-header">
            <div className="qn-title">
              <FileText size={16} className="text-indigo-400" />
              <span>Study Scratchpad</span>
            </div>

            <div className="qn-actions">
              <button className="qn-btn" onClick={handleAiFormat} disabled={isAiCleaning} title="Auto-format with AI">
                <Sparkles size={14} className={isAiCleaning ? 'animate-spin text-amber-400' : 'text-amber-400'} />
                <span>{isAiCleaning ? 'Formatting...' : 'AI Format'}</span>
              </button>

              <button className="qn-icon-btn" onClick={handleCopy} title="Copy notes">
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>

              <button className="qn-icon-btn" onClick={handleDownload} title="Download notes">
                <Download size={14} />
              </button>

              <button className="qn-icon-btn" onClick={() => setIsMinimized(!isMinimized)} title={isMinimized ? 'Expand' : 'Minimize'}>
                {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              </button>

              <button className="qn-icon-btn qn-close" onClick={() => setIsOpen(false)} title="Close">
                <X size={14} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="qn-body">
              <textarea
                className="qn-textarea"
                placeholder="Jot down formulas, key concepts, quick calculations, or rough notes during practice..."
                value={noteContent}
                onChange={e => setNoteContent(e.target.value)}
              />
              <div className="qn-footer">
                <span>{noteContent.length} characters</span>
                <span>Auto-saved to your browser</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
