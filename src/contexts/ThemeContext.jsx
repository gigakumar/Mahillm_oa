import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mechprep-theme') || 'dark';
    }
    return 'dark';
  });

  // UI Mode: 'modern' (Linear / Bespoke) vs 'classic' (3D Bubble / Playful)
  const [uiMode, setUiMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mechprep-ui-mode') || 'modern';
    }
    return 'modern';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);

    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
      document.body.classList.add('light-mode');
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
      document.body.classList.remove('light-mode');
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
    }

    localStorage.setItem('mechprep-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-ui-mode', uiMode);
    document.body.setAttribute('data-ui-mode', uiMode);
    localStorage.setItem('mechprep-ui-mode', uiMode);
    window.dispatchEvent(new CustomEvent('ui-mode-changed', { detail: { uiMode } }));
  }, [uiMode]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  const toggleUiMode = () => setUiMode((m) => (m === 'modern' ? 'classic' : 'modern'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, uiMode, setUiMode, toggleUiMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
