import { http } from './http';

export type UserSummary = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  tenantId: string;
  createdAt: string;
  lastLoginAt: string | null;
  tenant?: { companyName: string } | null;
};

export async function listUsers(accessToken: string): Promise<UserSummary[]> {
  const { data } = await http.get<UserSummary[]>('/users', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

export async function createUser(
  accessToken: string,
  args: { name: string; email: string; role?: 'CLIENT_USER' | 'CLIENT_ADMIN'; tenantId?: string }
): Promise<{ user: UserSummary; tempPassword: string }>
{
  const { data } = await http.post('/users', args, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}
