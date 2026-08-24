import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { httpClient } from './httpClient';
import { useAuthStore } from '../store/authStore';

const REFRESH_TOKEN_KEY = 'sprintdesk_refresh_token';

describe('httpClient auth interceptor', () => {
  let mockHttpClient: MockAdapter;
  let mockGlobalAxios: MockAdapter;

  beforeEach(() => {
    // httpClient's request/response interceptors are under test; the token
    // refresh call inside httpClient.ts uses the plain `axios` import
    // (not the `httpClient` instance, to avoid re-triggering itself), so
    // both need their own mock adapter.
    mockHttpClient = new MockAdapter(httpClient);
    mockGlobalAxios = new MockAdapter(axios);

    localStorage.clear();
    useAuthStore.setState({
      user: null,
      accessToken: 'expired-access-token',
      isAuthenticated: true,
      isInitializing: false,
    });
    localStorage.setItem(REFRESH_TOKEN_KEY, 'valid-refresh-token');
  });

  afterEach(() => {
    mockHttpClient.restore();
    mockGlobalAxios.restore();
  });

  it('attaches the Bearer token from the auth store to every request', async () => {
    mockHttpClient.onGet('/tasks').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer expired-access-token');
      return [200, { ok: true }];
    });

    const response = await httpClient.get('/tasks');
    expect(response.status).toBe(200);
  });

  it('on a 401, silently refreshes the token and retries the original request once', async () => {
    let attempt = 0;
    mockHttpClient.onGet('/protected').reply(() => {
      attempt += 1;
      if (attempt === 1) {
        return [401, { message: 'Unauthorized' }];
      }
      return [200, { data: 'secret payload' }];
    });

    mockGlobalAxios.onPost('https://dummyjson.com/auth/refresh').reply(200, {
      accessToken: 'brand-new-access-token',
      refreshToken: 'brand-new-refresh-token',
    });

    const response = await httpClient.get('/protected');

    expect(attempt).toBe(2); // original call + one retry
    expect(response.status).toBe(200);
    expect(response.data).toEqual({ data: 'secret payload' });
    expect(useAuthStore.getState().accessToken).toBe('brand-new-access-token');
  });

  it('retries the request with the newly refreshed token in the Authorization header', async () => {
    let secondCallHeaders: Record<string, unknown> | undefined;
    let attempt = 0;

    mockHttpClient.onGet('/protected').reply((config) => {
      attempt += 1;
      if (attempt === 1) return [401];
      secondCallHeaders = config.headers as Record<string, unknown>;
      return [200, {}];
    });

    mockGlobalAxios.onPost('https://dummyjson.com/auth/refresh').reply(200, {
      accessToken: 'refreshed-token-xyz',
      refreshToken: 'refreshed-refresh-token',
    });

    await httpClient.get('/protected');

    expect(secondCallHeaders?.Authorization).toBe('Bearer refreshed-token-xyz');
  });

  it('logs the user out if the refresh call itself fails (invalid/expired refresh token)', async () => {
    mockHttpClient.onGet('/protected').reply(401);
    mockGlobalAxios.onPost('https://dummyjson.com/auth/refresh').reply(403, { message: 'Invalid refresh token' });

    await expect(httpClient.get('/protected')).rejects.toBeTruthy();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('does not attempt a second refresh for a request that has already been retried', async () => {
    // Every response is 401, forever — simulates a refresh token that
    // "succeeds" but the API still rejects the retried request.
    mockHttpClient.onGet('/always-401').reply(401);
    mockGlobalAxios.onPost('https://dummyjson.com/auth/refresh').reply(200, {
      accessToken: 'new-token',
      refreshToken: 'new-refresh-token',
    });

    await expect(httpClient.get('/always-401')).rejects.toBeTruthy();
    // Exactly one refresh call should have been made, not an infinite loop
    expect(mockGlobalAxios.history.post?.length).toBe(1);
  });
});
