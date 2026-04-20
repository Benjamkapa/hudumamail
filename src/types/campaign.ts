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

export type CampaignStatus = Campaign['status'];

