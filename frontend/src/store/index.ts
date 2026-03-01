import { configureStore } from '@reduxjs/toolkit';
import { api } from '../api/index.js';
import authReducer from './slices/authSlice.js';
import settingsReducer from './slices/settingsSlice.js';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
