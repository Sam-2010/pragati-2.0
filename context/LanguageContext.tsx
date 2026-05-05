"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations, TranslationKeys } from '@/lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKeys) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize language from localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('pragati_language') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'mr')) {
      setLanguageState(savedLang);
    }
    setIsHydrated(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('pragati_language', lang);
    // Force HTML lang attribute update for SEO/Accessibility
    document.documentElement.lang = lang;
  };

  const t = (key: TranslationKeys): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  // Prevent hydration mismatch by only rendering after mount
  // or providing a consistent initial state
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div style={{ visibility: isHydrated ? 'visible' : 'hidden' }}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
