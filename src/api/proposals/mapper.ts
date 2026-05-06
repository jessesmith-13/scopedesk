import type { Database } from '@/types/supabase'
import type {
  Proposal,
  CreateProposalInput,
  UpdateProposalInput,
  ProposalContent,
} from '@/types/proposal'

type ProposalRow = Database['public']['Tables']['proposals']['Row']
type ProposalInsert = Database['public']['Tables']['proposals']['Insert']
type ProposalUpdate = Database['public']['Tables']['proposals']['Update']

export function mapProposalFromDB(
  row: ProposalRow & {
    deal?: { title?: string; lead?: { business_name?: string } }
  }
): Proposal {
  return {
    id: row.id,
    userId: row.user_id,
    dealId: row.deal_id,
    status: row.status,
    title: row.title,
    currency: row.currency,
    subtotalCents: Math.round(row.subtotal * 100),
    taxCents: Math.round(row.tax * 100),
    totalCents: Math.round(row.total * 100),
    content: row.content as ProposalContent | null,
    pdfUrl: row.pdf_url ?? null,
    sentTo: row.sent_to ?? null,
    sentAt: row.sent_at ?? null,
    viewedAt: row.viewed_at ?? null,
    signedAt: row.signed_at ?? null,
    expiresAt: row.expires_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    dealTitle: row.deal?.title,
    businessName: row.deal?.lead?.business_name,
  }
}

export function mapProposalToInsert(
  input: CreateProposalInput,
  userId: string
): ProposalInsert {
  return {
    user_id: userId,
    deal_id: input.dealId,
    status: 'draft',
    title: input.title,
    currency: input.currency ?? 'USD',
    subtotal: input.subtotalCents / 100,
    tax: input.taxCents / 100,
    total: input.totalCents / 100,
    content:
      input.content as unknown as Database['public']['Tables']['proposals']['Insert']['content'],
    expires_at: input.expiresAt ?? null,
  }
}

export function mapProposalToUpdate(
  input: UpdateProposalInput
): ProposalUpdate {
  const update: ProposalUpdate = {
    updated_at: new Date().toISOString(),
  }

  if (input.title !== undefined) update.title = input.title
  if (input.status !== undefined) update.status = input.status
  if (input.content !== undefined) {
    update.content =
      input.content as unknown as Database['public']['Tables']['proposals']['Update']['content']
  }
  if (input.subtotalCents !== undefined)
    update.subtotal = input.subtotalCents / 100
  if (input.taxCents !== undefined) update.tax = input.taxCents / 100
  if (input.totalCents !== undefined) update.total = input.totalCents / 100
  if (input.sentTo !== undefined) update.sent_to = input.sentTo
  if (input.expiresAt !== undefined) update.expires_at = input.expiresAt

  return update
}
