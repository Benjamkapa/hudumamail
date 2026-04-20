import type { AuthUser } from '../../types/auth';

const ACCESS_TOKEN_KEY = 'bulke.accessToken';
const USER_KEY = 'bulke.user';

export function readStoredAuth(): { accessToken: string | null; user: AuthUser | null } {
  try {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const userRaw = localStorage.getItem(USER_KEY);
    const user = userRaw ? (JSON.parse(userRaw) as AuthUser) : null;
    return { accessToken, user };
  } catch {
    return { accessToken: null, user: null };
  }
}

export function writeStoredAuth(args: { accessToken: string; user: AuthUser }) {
  localStorage.setItem(ACCESS_TOKEN_KEY, args.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(args.user));
}

export function clearStoredAuth() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

