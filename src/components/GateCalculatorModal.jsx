import React, { useState } from 'react';
import './GateCalculatorModal.css';

export default function GateCalculatorModal({ isOpen, onClose }) {
  const [display, setDisplay] = useState('0');
  const [history, setHistory] = useState('');
  const [memory, setMemory] = useState(0);
  const [isRad, setIsRad] = useState(false);

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
    setHistory('');
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleOp = (op) => {
    setHistory(display + ' ' + op);
    setDisplay('0');
  };

  const handleFunc = (fn) => {
    try {
      const num = parseFloat(display);
      if (isNaN(num)) return;
      let res = 0;
      switch (fn) {
        case 'sin': res = isRad ? Math.sin(num) : Math.sin((num * Math.PI) / 180); break;
        case 'cos': res = isRad ? Math.cos(num) : Math.cos((num * Math.PI) / 180); break;
        case 'tan': res = isRad ? Math.tan(num) : Math.tan((num * Math.PI) / 180); break;
        case 'sqrt': res = Math.sqrt(num); break;
        case 'sqr': res = num * num; break;
        case 'cube': res = num * num * num; break;
        case 'log': res = Math.log10(num); break;
        case 'ln': res = Math.log(num); break;
        case 'exp': res = Math.exp(num); break;
        case 'inv': res = 1 / num; break;
        case 'abs': res = Math.abs(num); break;
        case 'pi': res = Math.PI; break;
        case 'e': res = Math.E; break;
        case 'fact':
          let f = 1;
          for (let i = 2; i <= num; i++) f *= i;
          res = f;
          break;
        default: return;
      }
      if (isNaN(res) || !isFinite(res)) throw new Error();
      setDisplay(Number(res.toFixed(8)).toString());
    } catch {
      setDisplay('Error');
    }
  };

  const toggleSign = () => {
    if (display !== '0' && display !== 'Error') {
      setDisplay(display.startsWith('-') ? display.slice(1) : '-' + display);
    }
  };

  const handleEval = () => {
    try {
      if (!history) return;
      let expr = history + ' ' + display;
      expr = expr.replace(/×/g, '*').replace(/÷/g, '/');
      const res = Function('"use strict"; return (' + expr + ')')();
      if (isNaN(res) || !isFinite(res)) throw new Error();
      setDisplay(Number(res.toFixed(8)).toString());
      setHistory('');
    } catch {
      setDisplay('Error');
      setHistory('');
    }
  };

  return (
    <div className="gate-calc-overlay" onClick={onClose}>
      <div className="gate-calc-modal" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="gate-calc-header">
          <div className="gc-title">Scientific Calculator</div>
          <div className="gc-actions">
            <button className="gc-help-btn">Help</button>
            <button className="gc-window-btn">−</button>
            <button className="gc-window-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="gate-calc-body">
          <div className="gate-calc-screens">
            <div className="gc-screen-top">{history}</div>
            <div className="gc-screen-bottom">{display}</div>
          </div>

          <div className="gate-calc-keypad">
            {/* ROW 1 */}
            <button className="gc-btn">mod</button>
            <div className="gc-btn span-col-5" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
              <div className="gc-radio-group">
                <label className="gc-radio">
                  <input type="radio" checked={!isRad} onChange={() => setIsRad(false)} /> Deg
                </label>
                <label className="gc-radio">
                  <input type="radio" checked={isRad} onChange={() => setIsRad(true)} /> Rad
                </label>
              </div>
            </div>
            <button className="gc-btn">MC</button>
            <button className="gc-btn">MR</button>
            <button className="gc-btn">MS</button>
            <button className="gc-btn">M+</button>
            <button className="gc-btn">M-</button>

            {/* ROW 2 */}
            <button className="gc-btn">sinh</button>
            <button className="gc-btn">cosh</button>
            <button className="gc-btn">tanh</button>
            <button className="gc-btn">Exp</button>
            <button className="gc-btn" onClick={() => handleNum('(')}>(</button>
            <button className="gc-btn" onClick={() => handleNum(')')}>)</button>
            <button className="gc-btn red span-col-2" onClick={handleBackspace}>←</button>
            <button className="gc-btn red" onClick={handleClear}>C</button>
            <button className="gc-btn red" onClick={toggleSign}>+/-</button>
            <button className="gc-btn" onClick={() => handleFunc('sqrt')}>√</button>

            {/* ROW 3 */}
            <button className="gc-btn">sinh<sup>-1</sup></button>
            <button className="gc-btn">cosh<sup>-1</sup></button>
            <button className="gc-btn">tanh<sup>-1</sup></button>
            <button className="gc-btn">log<sub>2</sub>x</button>
            <button className="gc-btn" onClick={() => handleFunc('ln')}>ln</button>
            <button className="gc-btn" onClick={() => handleFunc('log')}>log</button>
            <button className="gc-btn" onClick={() => handleNum('7')}>7</button>
            <button className="gc-btn" onClick={() => handleNum('8')}>8</button>
            <button className="gc-btn" onClick={() => handleNum('9')}>9</button>
            <button className="gc-btn" onClick={() => handleOp('/')}>/</button>
            <button className="gc-btn">%</button>

            {/* ROW 4 */}
            <button className="gc-btn" onClick={() => handleFunc('pi')}>π</button>
            <button className="gc-btn" onClick={() => handleFunc('e')}>e</button>
            <button className="gc-btn" onClick={() => handleFunc('fact')}>n!</button>
            <button className="gc-btn">log<sub>y</sub>x</button>
            <button className="gc-btn" onClick={() => handleFunc('exp')}>e<sup>x</sup></button>
            <button className="gc-btn">10<sup>x</sup></button>
            <button className="gc-btn" onClick={() => handleNum('4')}>4</button>
            <button className="gc-btn" onClick={() => handleNum('5')}>5</button>
            <button className="gc-btn" onClick={() => handleNum('6')}>6</button>
            <button className="gc-btn" onClick={() => handleOp('*')}>*</button>
            <button className="gc-btn" onClick={() => handleFunc('inv')}>1/x</button>

            {/* ROW 5 */}
            <button className="gc-btn" onClick={() => handleFunc('sin')}>sin</button>
            <button className="gc-btn" onClick={() => handleFunc('cos')}>cos</button>
            <button className="gc-btn" onClick={() => handleFunc('tan')}>tan</button>
            <button className="gc-btn">x<sup>y</sup></button>
            <button className="gc-btn" onClick={() => handleFunc('cube')}>x<sup>3</sup></button>
            <button className="gc-btn" onClick={() => handleFunc('sqr')}>x<sup>2</sup></button>
            <button className="gc-btn" onClick={() => handleNum('1')}>1</button>
            <button className="gc-btn" onClick={() => handleNum('2')}>2</button>
            <button className="gc-btn" onClick={() => handleNum('3')}>3</button>
            <button className="gc-btn" onClick={() => handleOp('-')}>-</button>
            <button className="gc-btn green span-row-2" onClick={handleEval}>=</button>

            {/* ROW 6 */}
            <button className="gc-btn">sin<sup>-1</sup></button>
            <button className="gc-btn">cos<sup>-1</sup></button>
            <button className="gc-btn">tan<sup>-1</sup></button>
            <button className="gc-btn"><sup>y</sup>√x</button>
            <button className="gc-btn"><sup>3</sup>√x</button>
            <button className="gc-btn" onClick={() => handleFunc('abs')}>|x|</button>
            <button className="gc-btn span-col-2" onClick={() => handleNum('0')}>0</button>
            <button className="gc-btn" onClick={() => handleNum('.')}>.</button>
            <button className="gc-btn" onClick={() => handleOp('+')}>+</button>
          </div>
        </div>
      </div>
    </div>
  );
}
