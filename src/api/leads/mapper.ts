// Mapper functions to convert between Supabase DB types and domain Lead types

import type { Database } from '@/types/supabase';
import type { Lead, CreateLeadInput, UpdateLeadInput, ScoreReason } from '@/types/lead';

type LeadRow = Database['public']['Tables']['leads']['Row'];
type LeadInsert = Database['public']['Tables']['leads']['Insert'];
type LeadUpdate = Database['public']['Tables']['leads']['Update'];

/**
 * Maps a Supabase lead row to domain Lead type
 */
export function mapLeadFromDB(row: LeadRow): Lead {
  return {
    id: row.id,
    userId: row.user_id,
    businessName: row.business_name,
    category: row.category,
    subCategory: row.sub_category,
    neighborhood: row.neighborhood,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    country: row.country,
    lat: row.lat,
    lng: row.lng,
    phone: row.phone,
    websiteUrl: row.website_url,
    websiteStatus: row.website_status,
    outreachStatus: row.outreach_status,
    score: row.score,
    scoreReason: row.score_reason as ScoreReason | null,
    source: row.source,
    sourcePlaceId: row.source_place_id,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Maps multiple Supabase lead rows to domain Lead types
 */
export function mapLeadsFromDB(rows: LeadRow[]): Lead[] {
  return rows.map(mapLeadFromDB);
}

/**
 * Maps domain CreateLeadInput to Supabase Insert type
 */
export function mapLeadToInsert(input: CreateLeadInput, userId: string): LeadInsert {
  return {
    user_id: userId,
    business_name: input.businessName,
    category: input.category,
    sub_category: input.subCategory,
    neighborhood: input.neighborhood,
    address_line1: input.addressLine1,
    address_line2: input.addressLine2,
    city: input.city,
    state: input.state,
    postal_code: input.postalCode,
    country: input.country ?? 'US',
    lat: input.lat,
    lng: input.lng,
    phone: input.phone,
    website_url: input.websiteUrl,
    website_status: input.websiteStatus ?? 'unknown',
    outreach_status: input.outreachStatus ?? 'not_contacted',
    score: input.score ?? 0,
    score_reason: input.scoreReason,
    source: input.source,
    source_place_id: input.sourcePlaceId,
    notes: input.notes,
  };
}

/**
 * Maps domain UpdateLeadInput to Supabase Update type
 */
export function mapLeadToUpdate(input: UpdateLeadInput): LeadUpdate {
  const update: LeadUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (input.businessName !== undefined) update.business_name = input.businessName;
  if (input.category !== undefined) update.category = input.category;
  if (input.subCategory !== undefined) update.sub_category = input.subCategory;
  if (input.neighborhood !== undefined) update.neighborhood = input.neighborhood;
  if (input.addressLine1 !== undefined) update.address_line1 = input.addressLine1;
  if (input.addressLine2 !== undefined) update.address_line2 = input.addressLine2;
  if (input.city !== undefined) update.city = input.city;
  if (input.state !== undefined) update.state = input.state;
  if (input.postalCode !== undefined) update.postal_code = input.postalCode;
  if (input.country !== undefined) update.country = input.country;
  if (input.lat !== undefined) update.lat = input.lat;
  if (input.lng !== undefined) update.lng = input.lng;
  if (input.phone !== undefined) update.phone = input.phone;
  if (input.websiteUrl !== undefined) update.website_url = input.websiteUrl;
  if (input.websiteStatus !== undefined) update.website_status = input.websiteStatus;
  if (input.outreachStatus !== undefined) update.outreach_status = input.outreachStatus;
  if (input.score !== undefined) update.score = input.score;
  if (input.scoreReason !== undefined) update.score_reason = input.scoreReason;
  if (input.source !== undefined) update.source = input.source;
  if (input.sourcePlaceId !== undefined) update.source_place_id = input.sourcePlaceId;
  if (input.notes !== undefined) update.notes = input.notes;

  return update;
}