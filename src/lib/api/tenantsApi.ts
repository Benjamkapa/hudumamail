import { http } from './http';

export type TenantSummary = {
  id: string;
  companyName: string;
  plan: string;
  owner: string;
  ownerEmail: string;
  users: number;
  domains: number;
  monthlySends: number;
  mrr: number;
  region: string;
  status: 'active' | 'trial' | 'overdue' | 'suspended';
  risk: 'low' | 'medium' | 'high';
  renewedOn: string;
};

export async function listTenants(accessToken: string): Promise<TenantSummary[]> {
  const { data } = await http.get<TenantSummary[]>('/tenants', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

export async function createTenant(
  accessToken: string,
  args: { companyName: string; ownerEmail: string; planId: string; region: string }
): Promise<TenantSummary> {
  const { data } = await http.post('/tenants', args, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

export async function updateTenantStatus(
  accessToken: string,
  tenantId: string,
  status: 'active' | 'suspended'
): Promise<TenantSummary> {
  const { data } = await http.patch(`/tenants/${tenantId}/status`, { status }, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

