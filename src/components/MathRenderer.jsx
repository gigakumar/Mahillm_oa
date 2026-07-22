import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Helper to check if a single $ snippet is math vs currency.
 */
function isMathSnippet(inner) {
  if (!inner || !inner.trim()) return false;
  const s = inner.trim();
  // Pure currency amounts like "$20", "$20,000", "$100.50", "$200K"
  if (/^\d[\d,.]*[kKMm]?$/.test(s)) return false;
  if (/^\$\d+/.test(s)) return false;
  // If it contains math operators/symbols or commands
  if (/[\\=+\-*/^_<>(){}\[\]]|(\balpha|\bbeta|\bgamma|\bdelta|\btheta|\bpi|\bsigma|\bmu|\brho|\btau|\bomega|\bfrac|\bsqrt|\bpartial|\bint|\bsum)/i.test(s)) {
    return true;
  }
  // Single variable like $P$, $V$, $T$, $dQ$, $x$
  if (/^[A-Za-z](?:_[A-Za-z0-9]+)?$/.test(s)) {
    return true;
  }
  return false;
}

/**
 * MathRenderer component for rendering LaTeX and text seamlessly.
 */
export default function MathRenderer({ text, formula, inline = false, className = '' }) {
  const renderedContent = useMemo(() => {
    let raw = formula || text || '';
    if (!raw) return null;

    // Check if raw contains regular English words with spaces
    const isEnglishSentence = /[a-zA-Z]{2,}\s+[a-zA-Z]{2,}\s+[a-zA-Z]{2,}/.test(raw);

    // Direct formula string (e.g. formulaSheets.js item.formula)
    if (formula || (!isEnglishSentence && !raw.includes('$') && !raw.includes('\\[') && !raw.includes('\\(') && (raw.includes('\\') || raw.includes('^') || raw.includes('_') || raw.includes('=')))) {
      try {
        const html = katex.renderToString(raw, {
          displayMode: !inline,
          throwOnError: false,
        });
        return <span className="math-latex-container" dangerouslySetInnerHTML={{ __html: html }} />;
      } catch (e) {
        return <span className="math-fallback">{raw}</span>;
      }
    }

    // Auto-wrap loose un-delimited LaTeX commands like \Delta U or \sigma in sentences
    if (isEnglishSentence && !raw.includes('$') && raw.includes('\\')) {
      raw = raw.replace(/(\\([a-zA-Z]+)(?:\s+[a-zA-Z0-9]+)?)/g, '$$$1$$');
    }

    // Split text containing math delimiters: $$, \[\], \(\), or single $
    const regex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|(?:\$(?!\s)[^$\n]+(?<!\s)\$))/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(raw)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: raw.substring(lastIndex, match.index) });
      }

      const matchStr = match[0];
      if (matchStr.startsWith('$$') && matchStr.endsWith('$$')) {
        parts.push({ type: 'block', content: matchStr.slice(2, -2).trim() });
      } else if (matchStr.startsWith('\\[') && matchStr.endsWith('\\]')) {
        parts.push({ type: 'block', content: matchStr.slice(2, -2).trim() });
      } else if (matchStr.startsWith('\\(') && matchStr.endsWith('\\)')) {
        parts.push({ type: 'inline', content: matchStr.slice(2, -2).trim() });
      } else if (matchStr.startsWith('$') && matchStr.endsWith('$')) {
        const inner = matchStr.slice(1, -1).trim();
        if (isMathSnippet(inner)) {
          parts.push({ type: 'inline', content: inner });
        } else {
          parts.push({ type: 'text', content: matchStr });
        }
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < raw.length) {
      parts.push({ type: 'text', content: raw.substring(lastIndex) });
    }

    return parts.map((part, index) => {
      if (part.type === 'text') {
        return <span key={index}>{part.content}</span>;
      }
      try {
        const html = katex.renderToString(part.content, {
          displayMode: part.type === 'block',
          throwOnError: false,
        });
        return (
          <span
            key={index}
            className={`math-rendered-span ${part.type === 'block' ? 'math-block' : 'math-inline'}`}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      } catch (e) {
        return <span key={index} className="math-fallback">{part.content}</span>;
      }
    });
  }, [text, formula, inline]);

  return <span className={`math-renderer ${className}`}>{renderedContent}</span>;
}

