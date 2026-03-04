// Domain types for Deal entity (UI-facing, camelCase)
// Maps from Database types defined in supabase.ts

export type DealStage = 'contacted' | 'meeting_scheduled' | 'proposal_sent' | 'negotiation' | 'won' | 'lost';

export interface Deal {
  id: string;
  userId: string;
  leadId: string;
  primaryContactId: string | null;
  stage: DealStage;
  dealValue: number | null;
  probability: number;
  expectedCloseDate: string | null;
  serviceType: string | null;
  title: string | null;
  nextFollowUpAt: string | null;
  lostReason: string | null;
  wonAt: string | null;
  lostAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Extended deal with related entities (for detailed views)
export interface DealWithRelations extends Deal {
  lead?: {
    businessName: string;
    category: string | null;
    neighborhood: string | null;
  };
  contact?: {
    fullName: string;
    email: string | null;
    phone: string | null;
  };
}

// For creating new deals
export interface CreateDealInput {
  leadId: string;
  primaryContactId?: string | null;
  stage?: DealStage;
  dealValue?: number | null;
  probability?: number;
  expectedCloseDate?: string | null;
  serviceType?: string | null;
  title?: string | null;
  nextFollowUpAt?: string | null;
}

// For updating existing deals
export interface UpdateDealInput {
  leadId?: string;
  primaryContactId?: string | null;
  stage?: DealStage;
  dealValue?: number | null;
  probability?: number;
  expectedCloseDate?: string | null;
  serviceType?: string | null;
  title?: string | null;
  nextFollowUpAt?: string | null;
  lostReason?: string | null;
  wonAt?: string | null;
  lostAt?: string | null;
}

// Helper function to get stage label
export function getStageLabel(stage: DealStage): string {
  const labels: Record<DealStage, string> = {
    contacted: 'Contacted',
    meeting_scheduled: 'Meeting Scheduled',
    proposal_sent: 'Proposal Sent',
    negotiation: 'Negotiation',
    won: 'Won',
    lost: 'Lost'
  };
  return labels[stage];
}

// Helper function to get stage color
export function getStageColor(stage: DealStage): string {
  const colors: Record<DealStage, string> = {
    contacted: 'bg-blue-100 text-blue-800',
    meeting_scheduled: 'bg-purple-100 text-purple-800',
    proposal_sent: 'bg-yellow-100 text-yellow-800',
    negotiation: 'bg-orange-100 text-orange-800',
    won: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800'
  };
  return colors[stage];
}
