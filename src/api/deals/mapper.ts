// Mapper functions to convert between Supabase DB types and domain Deal types

import type { Database } from '@/types/supabase'
import type {
  Deal,
  DealWithRelations,
  CreateDealInput,
  UpdateDealInput,
} from '@/types/deal'
import { getStageProbability } from '@/types/deal'

type DealRow = Database['public']['Tables']['deals']['Row']
type DealInsert = Database['public']['Tables']['deals']['Insert']
type DealUpdate = Database['public']['Tables']['deals']['Update']
type LeadRow = Database['public']['Tables']['leads']['Row']
type ContactRow = Database['public']['Tables']['contacts']['Row']

// Type for deal row with joined relations from Supabase query
type DealRowWithRelations = DealRow & {
  lead?: Pick<LeadRow, 'business_name' | 'category' | 'neighborhood'> | null
  contact?: Pick<ContactRow, 'full_name' | 'email' | 'phone' | 'role'> | null
}

/**
 * Maps a Supabase deal row to domain Deal type
 */
export function mapDealFromDB(row: DealRow): Deal {
  return {
    id: row.id,
    userId: row.user_id,
    leadId: row.lead_id,
    businessName: row.title ?? 'Unnamed Deal', // Use title as business name since DB doesn't have business_name
    primaryContactId: row.primary_contact_id ?? null,
    stage: row.stage,
    amountCents: row.deal_value ? Math.round(row.deal_value * 100) : null, // Convert dollars to cents
    probability: row.probability,
    expectedCloseDate: row.expected_close_date ?? null,
    nextStep: null, // Not in DB schema
    nextStepAt: row.next_follow_up_at ?? null,
    lastActivityAt: row.updated_at, // Use updated_at as fallback
    position: 0, // Not in DB schema
    serviceType: row.service_type ?? null,
    title: row.title ?? null,
    lostReason: row.lost_reason ?? null,
    wonAt: row.won_at ?? null,
    lostAt: row.lost_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Maps a Supabase deal row with relations to domain DealWithRelations type
 */
export function mapDealWithRelationsFromDB(
  row: DealRowWithRelations
): DealWithRelations {
  const deal = mapDealFromDB(row)

  return {
    ...deal,
    lead: row.lead
      ? {
          businessName: row.lead.business_name,
          category: row.lead.category ?? null,
          neighborhood: row.lead.neighborhood ?? null,
        }
      : undefined,
    contact: row.contact
      ? {
          fullName: row.contact.full_name,
          email: row.contact.email ?? null,
          phone: row.contact.phone ?? null,
          role: row.contact.role ?? null,
        }
      : undefined,
  }
}

/**
 * Maps multiple Supabase deal rows to domain Deal types
 */
export function mapDealsFromDB(rows: DealRow[]): Deal[] {
  return rows.map(mapDealFromDB)
}

/**
 * Maps multiple Supabase deal rows with relations to domain DealWithRelations types
 */
export function mapDealsWithRelationsFromDB(
  rows: DealRowWithRelations[]
): DealWithRelations[] {
  return rows.map(mapDealWithRelationsFromDB)
}

/**
 * Maps domain CreateDealInput to Supabase Insert type
 */
export function mapDealToInsert(
  input: CreateDealInput,
  userId: string
): DealInsert {
  const stage = input.stage ?? 'qualified'
  const probability = input.probability ?? getStageProbability(stage)

  // Use leadId if provided and not empty, otherwise use userId as fallback
  const leadId =
    input.leadId && input.leadId.trim() !== '' ? input.leadId : userId

  return {
    user_id: userId,
    lead_id: leadId,
    primary_contact_id: input.primaryContactId ?? null,
    stage: stage,
    deal_value: input.amountCents ? input.amountCents / 100 : null, // Convert cents to dollars
    probability,
    expected_close_date: input.expectedCloseDate ?? null,
    next_follow_up_at: input.nextStepAt ?? null,
    service_type: input.serviceType ?? null,
    title: input.title ?? null,
  }
}

/**
 * Maps domain UpdateDealInput to Supabase Update type
 */
export function mapDealToUpdate(input: UpdateDealInput): DealUpdate {
  const update: DealUpdate = {
    updated_at: new Date().toISOString(),
  }

  if (input.leadId !== undefined) update.lead_id = input.leadId ?? ''
  if (input.primaryContactId !== undefined)
    update.primary_contact_id = input.primaryContactId ?? null
  if (input.stage !== undefined) {
    update.stage = input.stage
    // Auto-update probability based on stage if not explicitly set
    if (input.probability === undefined) {
      update.probability = getStageProbability(input.stage)
    }
  }
  if (input.amountCents !== undefined)
    update.deal_value = input.amountCents ? input.amountCents / 100 : null // Convert cents to dollars
  if (input.probability !== undefined) update.probability = input.probability
  if (input.expectedCloseDate !== undefined)
    update.expected_close_date = input.expectedCloseDate ?? null
  if (input.nextStepAt !== undefined)
    update.next_follow_up_at = input.nextStepAt ?? null
  if (input.serviceType !== undefined)
    update.service_type = input.serviceType ?? null
  if (input.title !== undefined) update.title = input.title ?? null
  if (input.lostReason !== undefined)
    update.lost_reason = input.lostReason ?? null
  if (input.wonAt !== undefined) update.won_at = input.wonAt ?? null
  if (input.lostAt !== undefined) update.lost_at = input.lostAt ?? null

  return update
}
