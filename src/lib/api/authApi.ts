import { http } from './http';
import type { LoginResponse, ProfileResponse, AuthUser } from '../../types/auth';

export async function loginApi(args: { email: string; password: string }) {
  const { data } = await http.post<LoginResponse>('/auth/login', args);
  return data;
}

export async function registerApi(args: { clientName: string; slug: string; name: string; email: string; password: string }) {
  const { data } = await http.post('/auth/register', args);
  return data;
}

export async function refreshApi(args: { refreshToken: string }) {
  const { data } = await http.post<{ accessToken: string }>('/auth/refresh', args);
  return data;
}

export async function logoutApi() {
  const { data } = await http.post('/auth/logout');
  return data;
}

export async function meApi() {
  const { data } = await http.get<{ user: AuthUser; client: any }>('/auth/me');
  return data;
}

export async function forgotPasswordApi(args: { email: string }) {
  const { data } = await http.post<{ message: string }>('/auth/forgot-password', args);
  return data;
}

export async function resetPasswordApi(args: { token: string; password: string }) {
  const { data } = await http.post<{ message: string }>('/auth/reset-password', args);
  return data;
}

export async function googleLoginApi(args: { code: string }) {
  const { data } = await http.post<LoginResponse>('/auth/google', args);
  return data;
}

export async function verifyEmailApi(args: { token: string }) {
  const { data } = await http.post<{ message: string }>('/auth/verify-email', { token: args.token });
  return data;
}

export async function getProfileApi(accessToken: string) {
  const { data } = await http.get<ProfileResponse>('/auth/profile', { 
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return data;
}
