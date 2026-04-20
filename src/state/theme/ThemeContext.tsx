import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  mode: ThemeMode;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('appThemeMode') as ThemeMode) || 'dark';
  });

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('appThemeMode', newMode);
    // Trigger CSS class change for html element (for non-MUI elements if needed)
    document.documentElement.classList.toggle('dark', newMode === 'dark');
    document.documentElement.classList.toggle('light', newMode === 'light');
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  // Global event listener for landing page toggle
  useEffect(() => {
    const handleToggleTheme = () => toggleMode();
    window.addEventListener('toggle-theme', handleToggleTheme);
    return () => window.addEventListener('toggle-theme', handleToggleTheme);
  }, [toggleMode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeMode must be used within ThemeProvider');
  return context;
};
