import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const THEME_STORAGE_KEY = 'ui_theme';

const tokensFor = (mode) => {
  const isDark = mode !== 'light';
  if (isDark) {
    return {
      mode: 'dark',
      bg: '#262626',
      bgAlt: '#2b2b2b',
      bgCard: '#303030',
      bgModal: '#2e2e2e',
      text: '#f5f5f5',
      textMuted: '#c1c1c1',
      textDim: '#9a9a9a',
      textDimmer: '#737373',
      textDimmest: '#595959',
      border: '#3a3a3a',
      borderLight: '#444444',
      accent: '#6366f1',
      accentText: '#ffffff',
      accentBg: 'rgba(99, 102, 241, 0.10)',
      accentBgStrong: 'rgba(99, 102, 241, 0.16)',
      weekendText: '#8f8f8f',
      weekendDayName: '#7a7a7a',
      hoverBorder: '#6a6a6a',
      hoverText: '#ffffff',
      inputPlaceholder: '#5a5a5a',
    };
  }

  return {
    mode: 'light',
    bg: '#f3f4f6',
    bgAlt: '#eef0f3',
    bgCard: '#f8fafc',
    bgModal: '#ffffff',
    text: '#1f2937',
    textMuted: '#4b5563',
    textDim: '#6b7280',
    textDimmer: '#9ca3af',
    textDimmest: '#cbd5e1',
    border: '#d1d5db',
    borderLight: '#e5e7eb',
    accent: '#6366f1',
    accentText: '#ffffff',
    accentBg: 'rgba(99, 102, 241, 0.10)',
    accentBgStrong: 'rgba(99, 102, 241, 0.16)',
    weekendText: '#9aa2ae',
    weekendDayName: '#a7b0bd',
    hoverBorder: '#94a3b8',
    hoverText: '#111827',
    inputPlaceholder: '#cbd5e1',
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
