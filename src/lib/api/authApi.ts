import { http } from './http';
import type { LoginResponse, ProfileResponse } from '../../types/auth';

export async function loginApi(args: { email: string; password: string }) {
  const { data } = await http.post<LoginResponse>('/auth/login', args);
  return data;
}

export async function registerApi(args: { companyName: string; name: string; email: string; password: string }) {
  const { data } = await http.post('/auth/register', args);
  return data as unknown;
}

export async function refreshApi() {
  const { data } = await http.post<{ accessToken: string }>('/auth/refresh', {}, {
    withCredentials: true
  });
  return data;
}

export async function logoutApi() {
  const { data } = await http.post('/auth/logout', {}, {
    withCredentials: true
  });
  return data as unknown;
}

export async function meApi() {
  const { data } = await http.get('/health', {
    withCredentials: true
  });
  return data;
}

export async function forgotPasswordApi(args: { email: string }) {
  const { data } = await http.post<{ message: string; resetToken?: string; expiresIn?: string }>('/auth/forgot-password', args);
  return data;
}

export async function resetPasswordApi(args: { token: string; password: string }) {
  const { data } = await http.post<{ message: string }>('/auth/reset-password', args);
  return data;
}

export async function getProfileApi(accessToken: string) {
  const { data } = await http.get<ProfileResponse>('/auth/profile', { 
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return data;
}

export async function googleLoginApi(args: { code: string }) {
  const { data } = await http.post<LoginResponse>('/auth/google', args);
  return data;
}
