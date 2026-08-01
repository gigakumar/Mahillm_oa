import React, { useState } from 'react';
import { Calculator, X, RotateCcw, Copy, Check } from 'lucide-react';
import './GateCalculatorModal.css';

export default function GateCalculatorModal({ isOpen, onClose }) {
  const [display, setDisplay] = useState('0');
  const [memory, setMemory] = useState(0);
  const [isRad, setIsRad] = useState(false); // Deg / Rad
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleNum = (val) => {
    if (display === '0' || display === 'Error') {
      setDisplay(val);
    } else {
      setDisplay(display + val);
    }
  };

  const handleClear = () => {
    setDisplay('0');
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleOp = (op) => {
    setDisplay(display + ' ' + op + ' ');
  };

  const handleEval = () => {
    try {
      // Replace safe math symbols
      let expr = display
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, Math.PI.toString())
        .replace(/e/g, Math.E.toString());

      // Evaluate safely without direct eval
      const res = Function('"use strict"; return (' + expr + ')')();
      if (isNaN(res) || !isFinite(res)) {
        setDisplay('Error');
      } else {
        setDisplay(Number(res.toFixed(8)).toString());
      }
    } catch {
      setDisplay('Error');
    }
  };

  const handleFunc = (fn) => {
    try {
      const num = parseFloat(display);
      if (isNaN(num)) return;

      let res = 0;
      switch (fn) {
        case 'sin':
          res = isRad ? Math.sin(num) : Math.sin((num * Math.PI) / 180);
          break;
        case 'cos':
          res = isRad ? Math.cos(num) : Math.cos((num * Math.PI) / 180);
          break;
        case 'tan':
          res = isRad ? Math.tan(num) : Math.tan((num * Math.PI) / 180);
          break;
        case 'sqrt':
          res = Math.sqrt(num);
          break;
        case 'sqr':
          res = num * num;
          break;
        case 'log':
          res = Math.log10(num);
          break;
        case 'ln':
          res = Math.log(num);
          break;
        case 'exp':
          res = Math.exp(num);
          break;
        case 'inv':
          res = 1 / num;
          break;
        default:
          return;
      }

      if (isNaN(res) || !isFinite(res)) {
        setDisplay('Error');
      } else {
        setDisplay(Number(res.toFixed(8)).toString());
      }
    } catch {
      setDisplay('Error');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="gate-calc-overlay" onClick={onClose}>
      <div className="gate-calc-modal" onClick={e => e.stopPropagation()}>
        <div className="gate-calc-header">
          <div className="gc-title">
            <Calculator size={18} className="text-amber-400" />
            <span>TCS iON Official GATE Scientific Calculator</span>
          </div>
          <div className="gc-actions">
            <button className={`mode-btn ${isRad ? 'active' : ''}`} onClick={() => setIsRad(!isRad)}>
              {isRad ? 'Rad' : 'Deg'}
            </button>
            <button className="icon-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Display Screen */}
        <div className="gate-calc-screen">
          <div className="gc-mode-indicator">{isRad ? 'RAD' : 'DEG'}</div>
          <div className="gc-display-text">{display}</div>
        </div>

        {/* Keypad Grid */}
        <div className="gate-calc-keypad">
          {/* Row 1 Functions */}
          <button className="gc-btn fn" onClick={() => handleFunc('sin')}>sin</button>
          <button className="gc-btn fn" onClick={() => handleFunc('cos')}>cos</button>
          <button className="gc-btn fn" onClick={() => handleFunc('tan')}>tan</button>
          <button className="gc-btn op" onClick={handleClear}>C</button>
          <button className="gc-btn op" onClick={handleBackspace}>⌫</button>

          {/* Row 2 Functions */}
          <button className="gc-btn fn" onClick={() => handleFunc('sqrt')}>√x</button>
          <button className="gc-btn fn" onClick={() => handleFunc('sqr')}>x²</button>
          <button className="gc-btn fn" onClick={() => handleFunc('log')}>log</button>
          <button className="gc-btn fn" onClick={() => handleFunc('ln')}>ln</button>
          <button className="gc-btn op" onClick={() => handleOp('÷')}>÷</button>

          {/* Row 3 Digits */}
          <button className="gc-btn num" onClick={() => handleNum('7')}>7</button>
          <button className="gc-btn num" onClick={() => handleNum('8')}>8</button>
          <button className="gc-btn num" onClick={() => handleNum('9')}>9</button>
          <button className="gc-btn fn" onClick={() => handleFunc('inv')}>1/x</button>
          <button className="gc-btn op" onClick={() => handleOp('×')}>×</button>

          {/* Row 4 Digits */}
          <button className="gc-btn num" onClick={() => handleNum('4')}>4</button>
          <button className="gc-btn num" onClick={() => handleNum('5')}>5</button>
          <button className="gc-btn num" onClick={() => handleNum('6')}>6</button>
          <button className="gc-btn fn" onClick={() => handleNum('π')}>π</button>
          <button className="gc-btn op" onClick={() => handleOp('-')}>-</button>

          {/* Row 5 Digits */}
          <button className="gc-btn num" onClick={() => handleNum('1')}>1</button>
          <button className="gc-btn num" onClick={() => handleNum('2')}>2</button>
          <button className="gc-btn num" onClick={() => handleNum('3')}>3</button>
          <button className="gc-btn fn" onClick={() => handleNum('e')}>e</button>
          <button className="gc-btn op" onClick={() => handleOp('+')}>+</button>

          {/* Row 6 Bottom */}
          <button className="gc-btn num span-2" onClick={() => handleNum('0')}>0</button>
          <button className="gc-btn num" onClick={() => handleNum('.')}>.</button>
          <button className="gc-btn copy-btn" onClick={handleCopy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <button className="gc-btn equals" onClick={handleEval}>=</button>
        </div>
      </div>
    </div>
  );
}
