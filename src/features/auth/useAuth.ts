import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { authService } from '../../api/authService';
import { getStoredRefreshToken, useAuthStore } from '../../store/authStore';
import { httpClient } from '../../api/httpClient';
import type { LoginCredentials, RefreshResponse } from '../../types/auth';

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data) => {
      const { accessToken, refreshToken, ...user } = data;
      setSession(user, accessToken, refreshToken);
    },
  });
}

export function useLogout() {
  const clearSession = useAuthStore((s) => s.clearSession);
  return () => clearSession();
}

// On app boot: if a refresh token exists, silently exchange it for a fresh
// access token + user before rendering protected routes. This is what makes
// "persist session after refresh" work.
export function useBootstrapSession() {
  const finishInitializing = useAuthStore((s) => s.finishInitializing);
  const setSession = useAuthStore((s) => s.setSession);
  const isInitializing = useAuthStore((s) => s.isInitializing);

  const query = useQuery({
    queryKey: ['auth', 'bootstrap'],
    queryFn: async () => {
      const refreshToken = getStoredRefreshToken();
      if (!refreshToken) return null;

      const { data } = await httpClient.post<RefreshResponse>('/auth/refresh', {
        refreshToken,
        expiresInMins: 30,
      });
      useAuthStore.getState().setAccessToken(data.accessToken);

      const user = await authService.getCurrentUser();
      return { user, tokens: data };
    },
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (query.isSuccess) {
      if (query.data) {
        setSession(query.data.user, query.data.tokens.accessToken, query.data.tokens.refreshToken);
      }
      finishInitializing();
    }
    if (query.isError) {
      useAuthStore.getState().clearSession();
      finishInitializing();
    }
  }, [query.isSuccess, query.isError, query.data, setSession, finishInitializing]);

  return { isInitializing };
}
