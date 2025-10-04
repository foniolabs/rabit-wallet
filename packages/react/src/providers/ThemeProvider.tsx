import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { Theme, ThemeMode } from '../types';
import { lightTheme, darkTheme } from '../themes';
import { getStorageItem, setStorageItem } from '../utils/storage';

interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

interface ThemeProviderProps {
  theme?: Theme;
  children: ReactNode;
}

export function ThemeProvider({ theme = lightTheme, children }: ThemeProviderProps) {
  const [mode, setModeState] = React.useState<ThemeMode>(() => {
    const saved = getStorageItem('rabit-theme-mode');
    if (saved) return saved as ThemeMode;
    
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    setStorageItem('rabit-theme-mode', newMode);
  };

  const currentTheme = mode === 'dark' ? darkTheme : theme;

  useEffect(() => {
    const root = document.documentElement;
    
    // Set CSS custom properties
    Object.entries(currentTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--rabit-${key}`, value);
    });
    
    root.style.setProperty('--rabit-border-radius', currentTheme.borderRadius);
    root.style.setProperty('--rabit-font-family', currentTheme.fontFamily);
    root.style.setProperty('--rabit-shadow', currentTheme.shadow || '0 4px 6px -1px rgb(0 0 0 / 0.1)');
    
    // Set data attribute for theme-based styling
    root.setAttribute('data-rabit-theme', mode);
  }, [currentTheme, mode]);

  const value: ThemeContextType = {
    theme: currentTheme,
    mode,
    setMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
