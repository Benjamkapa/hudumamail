
import { http } from './http';

export interface Campaign {
  id: string;
  tenantId: string;
  domainId: string;
  senderId: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
  scheduledAt?: string;
  sentAt?: string;
  totalCount: number;
  sentCount: number;
  audienceTags?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaign {


  name: string;
  subject: string;
  previewText?: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  contentHtml: string;
  sendMode: 'draft' | 'schedule' | 'now';
  scheduledAt?: string;
  contactsIds: string[];
}

export interface Campaign {
  id: string;
  tenantId: string;
  domainId: string;
  senderId: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
  scheduledAt?: string;
  sentAt?: string;
  totalCount: number;
  sentCount: number;
  audienceTags?: any;
  createdAt: string;
  updatedAt: string;
}

export async function createCampaign(data: CreateCampaign): Promise<Campaign> {
  const { data: result } = await http.post<Campaign>('/campaigns', data);
  return result;
}

export async function listCampaigns(): Promise<Campaign[]> {
  const { data: result } = await http.get<Campaign[]>('/campaigns');
  return result;
}


export async function getCampaign(id: string): Promise<Campaign> {
  const { data: result } = await http.get<Campaign>(`/campaigns/${id}`);
  return result;
}

