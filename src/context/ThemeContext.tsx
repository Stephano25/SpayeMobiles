// src/context/ThemeContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../config/colors';

type ThemeType = 'light' | 'dark' | 'system';

const lightTheme = {
  background: '#f8fafc',
  card: '#ffffff',
  text: '#0f172a',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  primary: '#6366f1',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
};

const darkTheme = {
  background: '#0d0d1a',
  card: '#1a1a2e',
  text: '#ffffff',
  textSecondary: '#94a3b8',
  border: '#2d2d44',
  primary: '#818cf8',
  success: '#34d399',
  error: '#f87171',
  warning: '#fbbf24',
};

interface ThemeContextType {
  theme: ThemeType;
  isDark: boolean;
  colors: typeof lightTheme;
  setTheme: (t: ThemeType) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const system = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('light');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    if (theme === 'system') {
      setIsDark(system === 'dark');
    }
  }, [system, theme]);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('theme');
      const t = (saved as ThemeType) || 'light';
      setThemeState(t);
      setIsDark(t === 'system' ? system === 'dark' : t === 'dark');
    } catch {
      setThemeState('light');
      setIsDark(false);
    }
  };

  const setTheme = async (newTheme: ThemeType) => {
    await AsyncStorage.setItem('theme', newTheme);
    setThemeState(newTheme);
    setIsDark(newTheme === 'system' ? system === 'dark' : newTheme === 'dark');
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        colors: isDark ? darkTheme : lightTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};