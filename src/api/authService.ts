import { httpClient } from './httpClient';
import type { LoginCredentials, LoginResponse, User } from '../types/auth';

// Everything DummyJSON-specific lives in this one file. If auth ever moves
// to a real backend, only this service needs to change — UI/hooks stay the same.
export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const { data } = await httpClient.post<LoginResponse>('/auth/login', {
      ...credentials,
      expiresInMins: credentials.expiresInMins ?? 1, // short-lived on purpose, to exercise refresh flow
    });
    return data;
  },

  getCurrentUser: async (): Promise<User> => {
    const { data } = await httpClient.get<User>('/auth/me');
    return data;
  },
};
