import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setTheme, setLanguage } from '../store/slices/settingsSlice';
import { store } from '../store';
import i18n from '../i18n';

export function useTheme() {
  const dispatch = useAppDispatch();
  const { theme, language } = useAppSelector((state) => state.settings);

  const applyTheme = (themeValue: string) => {
    const root = document.documentElement;
    if (themeValue === 'dark' || (themeValue === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('medora-theme') || 'light';
    applyTheme(savedTheme);
  }, []);

  useEffect(() => {
    i18n.changeLanguage(language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const state = store.getState();
      const currentTheme = state.settings?.theme;
      if (currentTheme === 'system') {
        document.documentElement.classList.toggle('dark', mediaQuery.matches);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleSetTheme = (t: 'light' | 'dark' | 'system') => {
    dispatch(setTheme(t));
  };

  const handleSetLanguage = (l: 'en' | 'fr' | 'ar') => {
    dispatch(setLanguage(l));
  };

  return { theme, language, setTheme: handleSetTheme, setLanguage: handleSetLanguage };
}
