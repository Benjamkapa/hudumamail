import React from 'react';
import { loginApi, logoutApi, refreshApi, registerApi, getProfileApi, googleLoginApi } from '../../lib/api/authApi';
import { clearStoredAuth, readStoredAuth, writeStoredAuth } from './authStorage';
import type { AuthContextValue, AuthState } from './AuthContext';
import { AuthContext } from './AuthContext';

export function AuthProvider(props: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>(() => {
    const stored = readStoredAuth();
    if (stored.accessToken && stored.user) {
      return { status: 'authenticated', accessToken: stored.accessToken, user: stored.user };
    }
    return { status: 'loading', accessToken: null, user: null };
  });

  const refresh = React.useCallback(async () => {
    try {
      const res = await refreshApi();
      const stored = readStoredAuth();
      if (!stored.user) {
        setState({ status: 'anonymous', accessToken: null, user: null });
        return;
      }
      if (res.accessToken) {
        // Token refreshed successfully, keep existing user
        writeStoredAuth({ accessToken: res.accessToken, user: stored.user });
        setState({ status: 'authenticated', accessToken: res.accessToken, user: stored.user });
        return;
      }
    } catch {
      clearStoredAuth();
      setState({ status: 'anonymous', accessToken: null, user: null });
    }
  }, []);

  React.useEffect(() => {
    if (state.status !== 'loading') return;
    const stored = readStoredAuth();
    if (stored.accessToken && stored.user) {
      // User already loaded, just authenticate
      setState({ status: 'authenticated', accessToken: stored.accessToken, user: stored.user });
      return;
    }
    void refresh().finally(() => {
      setState((s) => (s.status === 'loading' ? { status: 'anonymous', accessToken: null, user: null } : s));
    });
  }, [refresh, state.status]);

  const login: AuthContextValue['login'] = React.useCallback(async ({ email, password }) => {
    const res = await loginApi({ email, password });
    const user = res.user || res;
    writeStoredAuth({ accessToken: res.accessToken, user });
    setState({ status: 'authenticated', accessToken: res.accessToken, user });
  }, []);

  const register: AuthContextValue['register'] = React.useCallback(async ({ companyName, name, email, password }) => {
    await registerApi({ companyName, name, email, password });
    // After register, user must login (backend doesn't auto-issue tokens)
  }, []);

  const logout: AuthContextValue['logout'] = React.useCallback(async () => {
    const stored = readStoredAuth();
    try {
      if (stored.accessToken) {
        await logoutApi();
      }
    } finally {
      clearStoredAuth();
      setState({ status: 'anonymous', accessToken: null, user: null });
    }
  }, []);

  const googleLogin: AuthContextValue['googleLogin'] = React.useCallback(async (code) => {
    const res = await googleLoginApi({ code });
    const profile = await getProfileApi(res.accessToken);
    const user = { ...res.user, ...profile };
    writeStoredAuth({ accessToken: res.accessToken, user });
    setState({ status: 'authenticated', accessToken: res.accessToken, user });
  }, []);

  const value: AuthContextValue = React.useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      refresh,
      googleLogin,
    }),
    [login, logout, refresh, register, googleLogin, state]
  );

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

