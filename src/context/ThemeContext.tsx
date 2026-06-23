import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { storage } from '../utils/storage';
import { COLORS } from '../config';
import { TranslationService } from '../services/TranslationService';

type ThemeType = 'light' | 'dark' | 'system';

const lightTheme = {
  background: COLORS.gray50,
  card: COLORS.white,
  text: COLORS.gray900,
  textSecondary: COLORS.gray600,
  border: COLORS.gray200,
};

const darkTheme = {
  background: COLORS.gray900,
  card: COLORS.gray800,
  text: COLORS.white,
  textSecondary: COLORS.gray400,
  border: COLORS.gray700,
};

interface ThemeContextType {
  theme: ThemeType;
  isDark: boolean;
  colors: typeof lightTheme;
  setTheme: (t: ThemeType) => Promise<void>;
  changeLanguage: (lang: string) => Promise<void>;
  currentLanguage: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const system = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('light');
  const [isDark, setIsDark] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<string>('fr');

  const translationService = TranslationService.getInstance();

  useEffect(() => {
    load();
    loadLanguage();
  }, []);

  useEffect(() => {
    if (theme === 'system') {
      setIsDark(system === 'dark');
    }
  }, [system, theme]);

  const load = async () => {
    const saved = await storage.getItem<ThemeType>('theme');
    const t = saved || 'light';
    setThemeState(t);
    if (t === 'system') setIsDark(system === 'dark');
    else setIsDark(t === 'dark');
  };

  const loadLanguage = async () => {
    const lang = await translationService.getLanguage();
    setCurrentLanguage(lang);
  };

  const setTheme = async (newTheme: ThemeType) => {
    await storage.setItem('theme', newTheme);
    setThemeState(newTheme);
    if (newTheme === 'system') setIsDark(system === 'dark');
    else setIsDark(newTheme === 'dark');
  };

  // 🔥 Fonction pour changer la langue
  const changeLanguage = async (lang: string) => {
    await translationService.setLanguage(lang);
    setCurrentLanguage(lang);
  };

  const colors = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        isDark, 
        colors, 
        setTheme, 
        changeLanguage,
        currentLanguage 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};