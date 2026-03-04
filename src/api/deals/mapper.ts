// Mapper functions to convert between Supabase DB types and domain Deal types

import type { Database } from '@/types/supabase';
import type { Deal, DealWithRelations, CreateDealInput, UpdateDealInput } from '@/types/deal';

type DealRow = Database['public']['Tables']['deals']['Row'];
type DealInsert = Database['public']['Tables']['deals']['Insert'];
type DealUpdate = Database['public']['Tables']['deals']['Update'];
type LeadRow = Database['public']['Tables']['leads']['Row'];
type ContactRow = Database['public']['Tables']['contacts']['Row'];

// Type for deal row with joined relations from Supabase query
type DealRowWithRelations = DealRow & {
  lead?: Pick<LeadRow, 'business_name' | 'category' | 'neighborhood'> | null;
  contact?: Pick<ContactRow, 'full_name' | 'email' | 'phone'> | null;
};

/**
 * Maps a Supabase deal row to domain Deal type
 */
export function mapDealFromDB(row: DealRow): Deal {
  return {
    id: row.id,
    userId: row.user_id,
    leadId: row.lead_id,
    primaryContactId: row.primary_contact_id,
    stage: row.stage,
    dealValue: row.deal_value,
    probability: row.probability,
    expectedCloseDate: row.expected_close_date,
    serviceType: row.service_type,
    title: row.title,
    nextFollowUpAt: row.next_follow_up_at,
    lostReason: row.lost_reason,
    wonAt: row.won_at,
    lostAt: row.lost_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Maps a Supabase deal row with relations to domain DealWithRelations type
 */
export function mapDealWithRelationsFromDB(row: DealRowWithRelations): DealWithRelations {
  const deal = mapDealFromDB(row);
  
  return {
    ...deal,
    lead: row.lead ? {
      businessName: row.lead.business_name,
      category: row.lead.category,
      neighborhood: row.lead.neighborhood,
    } : undefined,
    contact: row.contact ? {
      fullName: row.contact.full_name,
      email: row.contact.email,
      phone: row.contact.phone,
    } : undefined,
  };
}

/**
 * Maps multiple Supabase deal rows to domain Deal types
 */
export function mapDealsFromDB(rows: DealRow[]): Deal[] {
  return rows.map(mapDealFromDB);
}

/**
 * Maps multiple Supabase deal rows with relations to domain DealWithRelations types
 */
export function mapDealsWithRelationsFromDB(rows: DealRowWithRelations[]): DealWithRelations[] {
  return rows.map(mapDealWithRelationsFromDB);
}

/**
 * Maps domain CreateDealInput to Supabase Insert type
 */
export function mapDealToInsert(input: CreateDealInput, userId: string): DealInsert {
  return {
    user_id: userId,
    lead_id: input.leadId,
    primary_contact_id: input.primaryContactId,
    stage: input.stage ?? 'contacted',
    deal_value: input.dealValue,
    probability: input.probability ?? 50,
    expected_close_date: input.expectedCloseDate,
    service_type: input.serviceType,
    title: input.title,
    next_follow_up_at: input.nextFollowUpAt,
  };
}

/**
 * Maps domain UpdateDealInput to Supabase Update type
 */
export function mapDealToUpdate(input: UpdateDealInput): DealUpdate {
  const update: DealUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (input.leadId !== undefined) update.lead_id = input.leadId;
  if (input.primaryContactId !== undefined) update.primary_contact_id = input.primaryContactId;
  if (input.stage !== undefined) update.stage = input.stage;
  if (input.dealValue !== undefined) update.deal_value = input.dealValue;
  if (input.probability !== undefined) update.probability = input.probability;
  if (input.expectedCloseDate !== undefined) update.expected_close_date = input.expectedCloseDate;
  if (input.serviceType !== undefined) update.service_type = input.serviceType;
  if (input.title !== undefined) update.title = input.title;
  if (input.nextFollowUpAt !== undefined) update.next_follow_up_at = input.nextFollowUpAt;
  if (input.lostReason !== undefined) update.lost_reason = input.lostReason;
  if (input.wonAt !== undefined) update.won_at = input.wonAt;
  if (input.lostAt !== undefined) update.lost_at = input.lostAt;

  return update;
}