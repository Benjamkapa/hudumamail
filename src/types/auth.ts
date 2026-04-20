export const Role = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  CLIENT_ADMIN: 'CLIENT_ADMIN',
  CLIENT_USER: 'CLIENT_USER',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string;
  tenantName?: string;
  createdAt?: string;
};

export type ProfileResponse = AuthUser;

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

