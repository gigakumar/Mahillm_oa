import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Checks if an inner string inside $...$ is a math snippet vs currency/plain text.
 */
export function isMathSnippet(inner) {
  if (!inner || !inner.trim()) return false;
  const s = inner.trim();
  // Pure currency amounts like "$20", "$20,000", "$100.50", "$200K"
  if (/^\d[\d,.]*[kKMm]?$/.test(s)) return false;
  if (/^\$\d+/.test(s)) return false;
  // Math operators, backslashes, exponents, subscripts, greek letters
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
 * Parses and formats any string containing HTML, plain text, and LaTeX math into
 * a clean, readable HTML string rendered with KaTeX.
 */
export function formatMathHtml(text) {
  if (!text) return '';
  let str = String(text);

  const isEnglishSentence = /[a-zA-Z]{2,}\s+[a-zA-Z]{2,}\s+[a-zA-Z]{2,}/.test(str);

  // If text has no math delimiters and looks like a raw LaTeX formula string (and not an English sentence)
  if (!isEnglishSentence && !str.includes('$') && !str.includes('\\[') && !str.includes('\\(') && (str.includes('\\frac') || str.includes('\\sqrt') || str.includes('\\partial') || str.includes('\\sigma') || str.includes('\\delta'))) {
    try {
      const rendered = katex.renderToString(str, {
        displayMode: true,
        throwOnError: false,
      });
      return `<span class="math-rendered math-block">${rendered}</span>`;
    } catch (e) {
      return str;
    }
  }

  // Auto-wrap un-delimited LaTeX commands in English sentences
  if (isEnglishSentence && !str.includes('$') && str.includes('\\')) {
    str = str.replace(/(\\([a-zA-Z]+)(?:\s+[a-zA-Z0-9]+)?)/g, '$$$1$$');
  }


  // Regex to match $$, \[\], \(\), or single $
  const regex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|(?:\$(?!\s)[^$\n]+(?<!\s)\$))/g;
  let result = '';
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      result += str.substring(lastIndex, match.index);
    }

    const matchStr = match[0];
    let isBlock = false;
    let mathCode = '';

    if (matchStr.startsWith('$$') && matchStr.endsWith('$$')) {
      isBlock = true;
      mathCode = matchStr.slice(2, -2).trim();
    } else if (matchStr.startsWith('\\[') && matchStr.endsWith('\\]')) {
      isBlock = true;
      mathCode = matchStr.slice(2, -2).trim();
    } else if (matchStr.startsWith('\\(') && matchStr.endsWith('\\)')) {
      isBlock = false;
      mathCode = matchStr.slice(2, -2).trim();
    } else if (matchStr.startsWith('$') && matchStr.endsWith('$')) {
      const inner = matchStr.slice(1, -1).trim();
      if (isMathSnippet(inner)) {
        isBlock = false;
        mathCode = inner;
      } else {
        result += matchStr;
        lastIndex = regex.lastIndex;
        continue;
      }
    }

    if (mathCode) {
      try {
        const rendered = katex.renderToString(mathCode, {
          displayMode: isBlock,
          throwOnError: false,
        });
        result += `<span class="math-rendered ${isBlock ? 'math-block' : 'math-inline'}">${rendered}</span>`;
      } catch (e) {
        result += matchStr;
      }
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < str.length) {
    result += str.substring(lastIndex);
  }

  return result;
}

/**
 * Shuffles a question's options array deterministically and updates the correct
 * index (or array of indices) to match the new option positions 1:1.
 */
export function shuffleQuestionOptions(question) {
  if (!question || question.type === 'NAT' || !Array.isArray(question.options) || question.options.length <= 1) {
    return question;
  }

  // Prevent double-shuffling if already shuffled
  if (question._shuffled) return question;

  const n = question.options.length;
  const indices = Array.from({ length: n }, (_, i) => i);

  // Fisher-Yates shuffle algorithm
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const shuffledOpts = indices.map(idx => question.options[idx]);

  let newCorrect;
  if (Array.isArray(question.correct)) {
    newCorrect = question.correct.map(origIdx => indices.indexOf(origIdx));
  } else {
    newCorrect = indices.indexOf(question.correct);
  }

  return {
    ...question,
    options: shuffledOpts,
    correct: newCorrect,
    _shuffled: true,
    _originalCorrect: question.correct,
  };
}
