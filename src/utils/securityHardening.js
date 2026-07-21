/**
 * Robust Security Hardening for MechPrep Client
 * Combines window geometry detection, console evaluation getters, 
 * anti-debugger loops, and DOM destruction to prevent DevTools bypasses.
 */

if (import.meta.env.PROD) {
  const blockAccess = () => {
    // Completely wipe the DOM
    document.documentElement.innerHTML = `
      <head>
        <title>Security Alert</title>
        <style>
          body {
            background-color: #0f172a;
            color: #ef4444;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            text-align: center;
            padding: 20px;
          }
          h1 { font-size: 2.2rem; margin-bottom: 12px; letter-spacing: -0.5px; }
          p { color: #94a3b8; font-size: 1.1rem; max-width: 500px; line-height: 1.6; }
        </style>
      </head>
      <body>
        <h1>Security Alert</h1>
        <p>Developer tools detection active. Access to MechPrep OA is restricted while Web DevTools is open. Please close DevTools and reload the page.</p>
      </body>
    `;
    // Prevent further code execution by crashing the context
    throw new Error("DevTools detected. Execution halted.");
  };

  // 1. Geometry-based detection (Docked DevTools check)
  const checkGeometry = () => {
    // Mobile browsers often have large outer vs inner height discrepancies due to address bars/toolbars
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     ('ontouchstart' in window) || 
                     (navigator.maxTouchPoints > 0);
                     
    if (isMobile) return;

    const threshold = 160;
    const isDockedHorizontal = window.outerWidth - window.innerWidth > threshold;
    const isDockedVertical = window.outerHeight - window.innerHeight > threshold;

    if (isDockedHorizontal || isDockedVertical) {
      blockAccess();
    }
  };

  // 2. Logging inspection detection (Undocked/Floating DevTools check)
  // Store the raw log reference before we noop console methods
  const rawLog = console.log;
  const rawClear = console.clear;

  const checkConsoleInspection = () => {
    const detectObj = new Image();
    Object.defineProperty(detectObj, 'id', {
      get: function () {
        // Triggered when DevTools reads logged arguments to render them
        blockAccess();
      }
    });

    // Send object to native logger privately
    rawLog(detectObj);
    rawClear();
  };

  // Run initial checks and set loops
  window.addEventListener('resize', checkGeometry);
  setInterval(checkGeometry, 1000);
  setInterval(checkConsoleInspection, 1000);

  // 3. Keystroke protection
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.key === 'i' || e.key === 'j' || e.key === 'c')) {
      e.preventDefault();
      return false;
    }
    if (e.metaKey && e.altKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.key === 'i' || e.key === 'j' || e.key === 'c')) {
      e.preventDefault();
      return false;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u')) {
      e.preventDefault();
      return false;
    }
  });

  // 4. Mute standard console outputs for user scripts
  const noop = () => {};
  console.log = noop;
  console.info = noop;
  console.warn = noop;
  console.error = noop;
  console.debug = noop;
}
