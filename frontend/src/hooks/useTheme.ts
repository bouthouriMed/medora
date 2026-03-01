import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setTheme, setLanguage } from '../store/slices/settingsSlice';
import i18n from '../i18n';

export function useTheme() {
  const dispatch = useAppDispatch();
  const { theme, language } = useAppSelector((state) => state.settings);

  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    i18n.changeLanguage(language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const { theme } = (window as any).__store?.getState?.()?.settings || { theme: 'light' };
      if (theme === 'system') {
        document.documentElement.classList.toggle('dark', mediaQuery.matches);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return { theme, language, setTheme: (t: any) => dispatch(setTheme(t)), setLanguage: (l: any) => dispatch(setLanguage(l)) };
}
