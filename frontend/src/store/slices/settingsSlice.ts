import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type Theme = 'light' | 'dark' | 'system';
type Language = 'en' | 'fr' | 'ar';

interface SettingsState {
  theme: Theme;
  language: Language;
}

const initialState: SettingsState = {
  theme: (localStorage.getItem('medora-theme') as Theme) || 'light',
  language: (localStorage.getItem('medora-language') as Language) || 'en',
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
      localStorage.setItem('medora-theme', action.payload);
    },
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.language = action.payload;
      localStorage.setItem('medora-language', action.payload);
    },
  },
});

export const { setTheme, setLanguage } = settingsSlice.actions;
export default settingsSlice.reducer;
