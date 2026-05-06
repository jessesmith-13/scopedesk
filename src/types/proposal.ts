export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'signed' | 'expired'

export interface Proposal {
  id: string
  userId: string
  dealId: string
  status: ProposalStatus
  title: string
  currency: string
  subtotalCents: number
  taxCents: number
  totalCents: number
  content: ProposalContent | null
  pdfUrl: string | null
  sentTo: string | null
  sentAt: string | null
  viewedAt: string | null
  signedAt: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
  // Populated from joins
  dealTitle?: string
  businessName?: string
}

export type SectionType =
  | 'scope'
  | 'deliverables'
  | 'timeline'
  | 'pricing'
  | 'add-ons'
  | 'hosting'
  | 'terms'
  | 'custom'

export interface ProposalContent {
  sections: ProposalSection[]
  metadata?: {
    paymentTerms?: string
    estimatedTimeline?: string
    depositRequired?: boolean
    depositPercent?: number
    notes?: string
  }
}

export interface ProposalSection {
  id: string
  type: SectionType
  title: string
  description: string
  items: ProposalLineItem[]
}

export interface ProposalLineItem {
  id: string
  description: string
  quantity: number
  rateCents: number
  totalCents: number
}

export interface CreateProposalInput {
  dealId: string
  title: string
  status?: ProposalStatus
  currency?: string
  content: ProposalContent
  subtotalCents: number
  taxCents: number
  totalCents: number
  expiresAt?: string | null
}

export interface UpdateProposalInput {
  title?: string
  status?: ProposalStatus
  content?: ProposalContent
  subtotalCents?: number
  taxCents?: number
  totalCents?: number
  sentTo?: string | null
  expiresAt?: string | null
}

export function getProposalStatusLabel(status: ProposalStatus): string {
  const labels: Record<ProposalStatus, string> = {
    draft: 'Draft',
    sent: 'Sent',
    viewed: 'Viewed',
    signed: 'Signed',
    expired: 'Expired',
  }
  return labels[status]
}

export function getProposalStatusColor(status: ProposalStatus): string {
  const colors: Record<ProposalStatus, string> = {
    draft: 'bg-slate-100 text-slate-700 border border-slate-200',
    sent: 'bg-blue-100 text-blue-700 border border-blue-200',
    viewed: 'bg-purple-100 text-purple-700 border border-purple-200',
    signed: 'bg-green-100 text-green-700 border border-green-200',
    expired: 'bg-red-100 text-red-700 border border-red-200',
  }
  return colors[status]
}

export function formatCurrency(cents: number, currency = 'USD'): string {
  const amount = cents / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}
