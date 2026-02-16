import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const THEME_STORAGE_KEY = 'ui_theme';

const tokensFor = (mode) => {
  const isDark = mode !== 'light';
  if (isDark) {
    return {
      mode: 'dark',
      bg: '#0a0a0a',
      bgAlt: '#111111',
      bgCard: '#151515',
      bgModal: '#141414',
      text: '#e0e0e0',
      textMuted: '#999',
      textDim: '#666',
      textDimmer: '#444',
      textDimmest: '#333',
      border: '#1a1a1a',
      borderLight: '#242424',
      accent: '#eab308',
      accentBg: 'rgba(234, 179, 8, 0.06)',
      accentBgStrong: 'rgba(234, 179, 8, 0.1)',
      weekendText: '#444',
      weekendDayName: '#383838',
      hoverBorder: '#555',
      hoverText: '#fff',
      inputPlaceholder: '#333',
    };
  }

  return {
    mode: 'light',
    bg: '#fafafa',
    bgAlt: '#f5f5f0',
    bgCard: '#f0f0f0',
    bgModal: '#ffffff',
    text: '#2a2a2a',
    textMuted: '#666',
    textDim: '#888',
    textDimmer: '#aaa',
    textDimmest: '#ccc',
    border: '#d0d0d0',
    borderLight: '#e0e0e0',
    accent: '#ca8a04',
    accentBg: 'rgba(202, 138, 4, 0.08)',
    accentBgStrong: 'rgba(202, 138, 4, 0.15)',
    weekendText: '#aaa',
    weekendDayName: '#bbb',
    hoverBorder: '#999',
    hoverText: '#000',
    inputPlaceholder: '#d5d5d5',
  };
};

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return 'dark';
  });

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  const value = useMemo(() => {
    const tokens = tokensFor(mode);
    return {
      mode,
      isDark: mode !== 'light',
      theme: tokens,
      setMode,
      toggle: () => setMode((m) => (m === 'light' ? 'dark' : 'light')),
    };
  }, [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
