
import React from 'react';
import type { AuthUser } from '../../types/auth';

export type AuthState = {
  status: 'loading' | 'authenticated' | 'anonymous';
  accessToken: string | null;
  user: AuthUser | null;
};

export type AuthContextValue = AuthState & {
  login: (args: { email: string; password: string }) => Promise<void>;
  register: (args: { companyName: string; name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  googleLogin: (code: string) => Promise<void>;
};

export const AuthContext = React.createContext<AuthContextValue | null>(null);

