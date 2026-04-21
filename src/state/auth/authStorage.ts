import type { AuthUser } from '../../types/auth';

const ACCESS_TOKEN_KEY = 'bulke.accessToken';
const REFRESH_TOKEN_KEY = 'bulke.refreshToken';
const USER_KEY = 'bulke.user';

export function readStoredAuth(): { accessToken: string | null; refreshToken: string | null; user: AuthUser | null } {
  try {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const userRaw = localStorage.getItem(USER_KEY);
    const user = userRaw ? (JSON.parse(userRaw) as AuthUser) : null;
    return { accessToken, refreshToken, user };
  } catch {
    return { accessToken: null, refreshToken: null, user: null };
  }
}

export function writeStoredAuth(args: { accessToken: string; refreshToken?: string | null; user: AuthUser }) {
  localStorage.setItem(ACCESS_TOKEN_KEY, args.accessToken);
  if (args.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, args.refreshToken);
  }
  localStorage.setItem(USER_KEY, JSON.stringify(args.user));
}

export function clearStoredAuth() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

