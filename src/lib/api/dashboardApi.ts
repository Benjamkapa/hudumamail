import { http } from './http';

export interface DashboardStats {
  emailsSent30d: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  complaintRate: number;
  unsubscribeRate: number;
  activeCampaigns: number;
  totalContacts: number;
  activeClients: number;
}

export interface DashboardOverview {
  stats: DashboardStats;
  volume: {
    months: string[];
    sent: number[];
  };
  contactHeatmap: number[];
  recentCampaigns: Array<{
    id: string;
    name: string;
    status: string;
    sent: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
    date: string;
  }>;
  activity: Array<{
    id: string;
    action: string;
    time: string;
    type: 'campaign' | 'contacts' | 'domain' | 'warning' | 'client' | 'stats';
  }>;
  platformClients?: Array<{
    name: string;
    contacts: number;
    sent30d: number;
    deliveryRate: number;
    bounceRate: number;
  }>;
}

export async function getStats(accessToken: string): Promise<DashboardStats> {
  const { data } = await http.get<DashboardStats>('/dashboard/stats', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

export async function getDashboardOverview(accessToken: string): Promise<DashboardOverview> {
  const { data } = await http.get<DashboardOverview>('/dashboard/overview', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}
