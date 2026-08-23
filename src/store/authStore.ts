import { create } from 'zustand';
import type { User } from '../types/auth';

// Access token intentionally lives ONLY in memory (never persisted) — this
// avoids exposing it to XSS-based localStorage scraping. Refresh token is
// persisted (simulated) so the session can survive a page reload.
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean; // true while we validate session on app boot
  setSession: (user: User, accessToken: string, refreshToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
  finishInitializing: () => void;
}

const REFRESH_TOKEN_KEY = 'sprintdesk_refresh_token';

export const getStoredRefreshToken = (): string | null =>
  localStorage.getItem(REFRESH_TOKEN_KEY);

const setStoredRefreshToken = (token: string) =>
  localStorage.setItem(REFRESH_TOKEN_KEY, token);

const clearStoredRefreshToken = () =>
  localStorage.removeItem(REFRESH_TOKEN_KEY);

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isInitializing: true,

  setSession: (user, accessToken, refreshToken) => {
    setStoredRefreshToken(refreshToken);
    set({ user, accessToken, isAuthenticated: true });
  },

  setAccessToken: (accessToken) => set({ accessToken }),

  clearSession: () => {
    clearStoredRefreshToken();
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  finishInitializing: () => set({ isInitializing: false }),
}));
