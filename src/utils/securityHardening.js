/**
 * Security Hardening for MechPrep Client
 * Prevents casual users from inspecting state, variables, and network configurations 
 * through DevTools, console, right-click, and shortcuts.
 * 
 * Note: While absolute security can only be enforced by Firebase Security Rules on the backend, 
 * this makes inspection in web dev tools significantly harder.
 */

if (import.meta.env.PROD) {
  // 1. Disable right-click context menu
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  // 2. Disable common DevTools shortcuts
  document.addEventListener('keydown', (e) => {
    // Disable F12
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }

    // Disable Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (Windows/Linux)
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.key === 'i' || e.key === 'j' || e.key === 'c')) {
      e.preventDefault();
      return false;
    }

    // Disable Cmd+Opt+I, Cmd+Opt+J, Cmd+Opt+C (Mac)
    if (e.metaKey && e.altKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.key === 'i' || e.key === 'j' || e.key === 'c')) {
      e.preventDefault();
      return false;
    }

    // Disable Ctrl+U / Cmd+U (View Source code)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u')) {
      e.preventDefault();
      return false;
    }
  });

  // 3. Disable all standard console logs to prevent reading in-memory objects
  const noop = () => {};
  console.log = noop;
  console.info = noop;
  console.warn = noop;
  console.error = noop;
  console.debug = noop;
  console.clear();

  // 4. Anti-Debugger Loop
  // If DevTools is opened, this trigger will continuously pause execution, halting usability
  setInterval(() => {
    (function debuggerCheck() {
      try {
        (function check(i) {
          if (('' + i / i).length !== 1 || i % 20 === 0) {
            (function() {}).constructor('debugger')();
          } else {
            debugger;
          }
          check(++i);
        })(0);
      } catch (err) {}
    })();
  }, 1000);
}
