'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

type Language = 'en' | 'hi';

interface TranslationContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;  // eslint-disable-line no-unused-vars
}

const TranslationContext = createContext<TranslationContextValue>({
  language: 'en',
  setLanguage: () => {},
});

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'en';
    const saved = localStorage.getItem('voteai-language') as Language | null;
    if (saved === 'en' || saved === 'hi') return saved;
    const browserLang = navigator.language.startsWith('hi') ? 'hi' : 'en';
    return browserLang;
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('voteai-language', lang);
    // Update html lang attribute for accessibility
    document.documentElement.lang = lang;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage: handleSetLanguage }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslationContext() {
  return useContext(TranslationContext);
}
