// API layer for proposals
// Handles all edge function interactions for proposals
// Returns domain types to the UI

import type { Database } from '@/types/supabase'
import type {
  Proposal,
  CreateProposalInput,
  UpdateProposalInput,
} from '@/types/proposal'
import { api } from '@/api/client'
import { mapProposalFromDB } from './mapper'

type ProposalRow = Database['public']['Tables']['proposals']['Row']

/**
 * Get all proposals with optional deal filter
 */
export async function getProposals(dealId?: string): Promise<Proposal[]> {
  const query = dealId ? { deal_id: dealId } : undefined
  const data = await api<ProposalRow[]>('/proposals', { query })
  return data.map(mapProposalFromDB)
}

/**
 * Get a single proposal by ID
 */
export async function getProposalById(id: string): Promise<Proposal> {
  const data = await api<ProposalRow>(`/proposals/${id}`)
  return mapProposalFromDB(data)
}

/**
 * Create a new proposal
 */
export async function createProposal(
  input: CreateProposalInput
): Promise<Proposal> {
  const body = {
    deal_id: input.dealId,
    title: input.title,
    status: input.status,
    currency: input.currency,
    subtotal: input.subtotalCents / 100,
    tax: input.taxCents / 100,
    total: input.totalCents / 100,
    content: input.content,
    expires_at: input.expiresAt,
  }

  const data = await api<ProposalRow>('/proposals', {
    method: 'POST',
    body,
  })

  return mapProposalFromDB(data)
}

/**
 * Update an existing proposal
 */
export async function updateProposal(
  id: string,
  updates: UpdateProposalInput
): Promise<Proposal> {
  const body: Record<string, unknown> = {}

  if (updates.title !== undefined) body.title = updates.title
  if (updates.status !== undefined) body.status = updates.status
  if (updates.content !== undefined) body.content = updates.content
  if (updates.subtotalCents !== undefined)
    body.subtotal = updates.subtotalCents / 100
  if (updates.taxCents !== undefined) body.tax = updates.taxCents / 100
  if (updates.totalCents !== undefined) body.total = updates.totalCents / 100
  if (updates.sentTo !== undefined) body.sent_to = updates.sentTo
  if (updates.expiresAt !== undefined) body.expires_at = updates.expiresAt

  const data = await api<ProposalRow>(`/proposals/${id}`, {
    method: 'PATCH',
    body,
  })

  return mapProposalFromDB(data)
}

/**
 * Delete a proposal
 */
export async function deleteProposal(id: string): Promise<void> {
  await api<{ success: boolean }>(`/proposals/${id}`, {
    method: 'DELETE',
  })
}
