import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface PreferencesContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  font: string;
  setFont: (font: string) => void;
  language: string;
  setLanguage: (language: string) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const AVAILABLE_FONTS = [
  'Poppins',
  'Noto Sans',
  'Mukta',
  'Hind',
  'Rajdhani',
  'Teko',
  'Kalam',
  'Eczar',
  'Martel',
  'Yantramanav',
  'Baloo 2',
  'Khand',
  'Amita',
  'Martel Sans',
  'Pragati Narrow',
  'Sarala',
  'Palanquin',
  'Yatra One',
  'Khula',
  'Palanquin Dark',
  'Akshar',
  'Laila',
  'Glegoo',
  'Karma',
  'Rozha One',
  'Biryani',
  'Noto Serif Devanagari',
  'Arya',
  'Halant',
  'Sura',
  'Amiko',
  'Kadwa',
  'Jaldi',
  'Cambay',
  'Modak',
  'Kurale',
  'Gotu',
  'Vesper Libre',
  'Playpen Sans Deva',
  'Anek Devanagari',
  'Inknut Antiqua',
  'Bakbak One',
  'Sarpanch',
  'Sumana',
  'Matangi',
  'Tiro Devanagari Hindi',
  'Asar',
  'Ranga',
  'Sahitya',
  'IBM Plex Sans Devanagari',
  'Jaini',
  'Annapurna SIL',
  'Gajraj One',
  'Jaini Purva',
];

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [font, setFontState] = useState<string>('Poppins');
  const [language, setLanguageState] = useState<string>('en');

  useEffect(() => {
    // Load preferences from localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const savedFont = localStorage.getItem('font');
    const savedLanguage = localStorage.getItem('language');

    if (savedTheme) {
      setThemeState(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    }
    if (savedFont && AVAILABLE_FONTS.includes(savedFont)) {
      setFontState(savedFont);
    }
    if (savedLanguage) {
      setLanguageState(savedLanguage);
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const setFont = (newFont: string) => {
    setFontState(newFont);
    localStorage.setItem('font', newFont);
  };

  const setLanguage = (newLanguage: string) => {
    setLanguageState(newLanguage);
    localStorage.setItem('language', newLanguage);
    i18n.changeLanguage(newLanguage);
  };

  return (
    <PreferencesContext.Provider
      value={{ theme, setTheme, font, setFont, language, setLanguage }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return context;
}
