// Domain types for Deal entity (UI-facing, camelCase)
// Maps from Database types defined in supabase.ts

export type DealStage =
  | 'qualified'
  | 'meeting_scheduled'
  | 'proposal_sent'
  | 'negotiation'
  | 'won'
  | 'lost'

export interface Deal {
  id: string
  userId: string
  leadId: string | null
  businessName: string
  primaryContactId: string | null
  stage: DealStage
  amountCents: number | null
  probability: number
  expectedCloseDate: string | null
  nextStep: string | null
  nextStepAt: string | null
  lastActivityAt: string
  position: number
  serviceType: string | null
  title: string | null
  lostReason: string | null
  wonAt: string | null
  lostAt: string | null
  createdAt: string
  updatedAt: string
}

// Extended deal with related entities (for detailed views)
export interface DealWithRelations extends Deal {
  lead?: {
    businessName: string
    category: string | null
    neighborhood: string | null
  }
  contact?: {
    fullName: string
    email: string | null
    phone: string | null
    role: string | null
  }
}

// For creating new deals
export interface CreateDealInput {
  leadId?: string | null
  businessName: string
  primaryContactId?: string | null
  stage?: DealStage
  amountCents?: number | null
  probability?: number
  expectedCloseDate?: string | null
  nextStep?: string | null
  nextStepAt?: string | null
  serviceType?: string | null
  title?: string | null
}

// For updating existing deals
export interface UpdateDealInput {
  leadId?: string | null
  businessName?: string
  primaryContactId?: string | null
  stage?: DealStage
  amountCents?: number | null
  probability?: number
  expectedCloseDate?: string | null
  nextStep?: string | null
  nextStepAt?: string | null
  serviceType?: string | null
  title?: string | null
  lostReason?: string | null
  wonAt?: string | null
  lostAt?: string | null
}

// Activity type for deal timeline
export type ActivityType =
  | 'call'
  | 'email'
  | 'note'
  | 'meeting'
  | 'task'
  | 'stage_change'

export interface Activity {
  id: string
  userId: string
  dealId: string | null
  leadId: string | null
  contactId: string | null
  type: ActivityType
  subject: string | null
  body: string | null
  meta: Record<string, unknown> | null
  createdAt: string
}

// Document type for proposals, SOWs, invoices, contracts
export type DocumentType = 'proposal' | 'invoice' | 'sow' | 'contract'
export type DocumentStatus = 'draft' | 'sent' | 'signed' | 'paid'

export interface DealDocument {
  id: string
  userId: string
  dealId: string
  type: DocumentType
  status: DocumentStatus
  payloadJson: Record<string, unknown> | null
  fileUrl: string | null
  createdAt: string
  updatedAt: string
}

// Helper function to get stage label
export function getStageLabel(stage: DealStage): string {
  const labels: Record<DealStage, string> = {
    qualified: 'Qualified',
    meeting_scheduled: 'Meeting Scheduled',
    proposal_sent: 'Proposal Sent',
    negotiation: 'Negotiation',
    won: 'Won',
    lost: 'Lost',
  }
  return labels[stage]
}

// Helper function to get stage color
export function getStageColor(stage: DealStage): string {
  const colors: Record<DealStage, string> = {
    qualified: 'bg-sky-100 text-sky-800',
    meeting_scheduled: 'bg-blue-100 text-blue-800',
    proposal_sent: 'bg-purple-100 text-purple-800',
    negotiation: 'bg-yellow-100 text-yellow-800',
    won: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800',
  }
  return colors[stage]
}

// Helper function to get default probability by stage
// Returns integer 0-100 (not decimal 0.0-1.0)
export function getStageProbability(stage: DealStage): number {
  const probabilities: Record<DealStage, number> = {
    qualified: 20,
    meeting_scheduled: 35,
    proposal_sent: 60,
    negotiation: 75,
    won: 100,
    lost: 0,
  }
  return probabilities[stage]
}
