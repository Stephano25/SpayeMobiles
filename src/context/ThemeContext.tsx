import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { storage } from '../utils/storage';
import { COLORS } from '../config';
import { TranslationService, languageEvents } from '../services/TranslationService';

type ThemeType = 'light' | 'dark' | 'system';

const lightTheme = {
  background: COLORS.gray50,
  card: COLORS.white,
  text: COLORS.gray900,
  textSecondary: COLORS.gray600,
  border: COLORS.gray200,
};

const darkTheme = {
  background: '#0d0d1a',
  card: '#1a1a2e',
  text: COLORS.white,
  textSecondary: COLORS.gray400,
  border: '#2d2d44',
};

interface ThemeContextType {
  theme: ThemeType;
  isDark: boolean;
  colors: typeof lightTheme;
  setTheme: (t: ThemeType) => Promise<void>;
  currentLanguage: string;
  changeLanguage: (lang: string) => Promise<void>;
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
  const [currentLanguage, setCurrentLanguage] = useState('fr');

  const service = TranslationService.getInstance();

  useEffect(() => {
    load();
    service.init().then(() => {
      setCurrentLanguage(service.getLanguage());
    });
    const unsub = languageEvents.subscribe((lang) => {
      setCurrentLanguage(lang);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (theme === 'system') setIsDark(system === 'dark');
  }, [system, theme]);

  const load = async () => {
    const saved = await storage.getItem<ThemeType>('theme');
    const t = saved || 'light';
    setThemeState(t);
    setIsDark(t === 'system' ? system === 'dark' : t === 'dark');
  };

  const setTheme = async (newTheme: ThemeType) => {
    await storage.setItem('theme', newTheme);
    setThemeState(newTheme);
    setIsDark(newTheme === 'system' ? system === 'dark' : newTheme === 'dark');
  };

  const changeLanguage = async (lang: string) => {
    await service.setLanguage(lang);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        colors: isDark ? darkTheme : lightTheme,
        setTheme,
        currentLanguage,
        changeLanguage,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};