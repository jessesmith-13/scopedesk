// API layer for leads
// Handles all Supabase interactions for leads
// Returns domain types to the UI

import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import type { Database } from '@/types/supabase';
import type { Lead, CreateLeadInput, UpdateLeadInput } from '@/types/lead';
import { 
  mapLeadFromDB,
  mapLeadsFromDB,
  mapLeadToInsert, 
  mapLeadToUpdate 
} from './mapper';

type LeadRow = Database['public']['Tables']['leads']['Row'];

export interface LeadFilters {
  q?: string;
  outreach_status?: string;
  website_status?: string;
  min_score?: number;
  max_score?: number;
  category?: string;
  neighborhood?: string;
  sort?: 'score_desc' | 'score_asc' | 'newest' | 'oldest';
  limit?: number;
  offset?: number;
}

/**
 * Get all leads with optional filters
 */
export async function getLeads(filters: LeadFilters = {}): Promise<Lead[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  }

  let query = supabase
    .from('leads')
    .select('*');

  // Apply filters
  if (filters.q) {
    query = query.or(`business_name.ilike.%${filters.q}%,address_line1.ilike.%${filters.q}%`);
  }

  if (filters.outreach_status) {
    query = query.eq('outreach_status', filters.outreach_status);
  }

  if (filters.website_status) {
    query = query.eq('website_status', filters.website_status);
  }

  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  if (filters.neighborhood) {
    query = query.eq('neighborhood', filters.neighborhood);
  }

  if (filters.min_score !== undefined) {
    query = query.gte('score', filters.min_score);
  }

  if (filters.max_score !== undefined) {
    query = query.lte('score', filters.max_score);
  }

  // Sorting
  switch (filters.sort) {
    case 'score_desc':
      query = query.order('score', { ascending: false });
      break;
    case 'score_asc':
      query = query.order('score', { ascending: true });
      break;
    case 'oldest':
      query = query.order('created_at', { ascending: true });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  // Pagination
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return mapLeadsFromDB(data as LeadRow[]);
}

/**
 * Get a single lead by ID
 */
export async function getLeadById(id: string): Promise<Lead> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return mapLeadFromDB(data as LeadRow);
}

/**
 * Create a new lead
 */
export async function createLead(input: CreateLeadInput, userId: string): Promise<Lead> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const insertData = mapLeadToInsert(input, userId);

  // Cast to 'never' to work around Supabase's broken type inference with placeholder credentials
  const { data, error } = await supabase
    .from('leads')
    .insert(insertData as never)
    .select()
    .single();

  if (error) throw error;
  return mapLeadFromDB(data as LeadRow);
}

/**
 * Update an existing lead
 */
export async function updateLead(id: string, input: UpdateLeadInput): Promise<Lead> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const updateData = mapLeadToUpdate(input);

  // Cast to 'never' to work around Supabase's broken type inference with placeholder credentials
  const { data, error } = await supabase
    .from('leads')
    .update(updateData as never)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapLeadFromDB(data as LeadRow);
}

/**
 * Delete a lead
 */
export async function deleteLead(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Bulk update multiple leads
 */
export async function bulkUpdateLeads(ids: string[], input: UpdateLeadInput): Promise<Lead[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const updateData = mapLeadToUpdate(input);

  // Cast to 'never' to work around Supabase's broken type inference with placeholder credentials
  const { data, error } = await supabase
    .from('leads')
    .update(updateData as never)
    .in('id', ids)
    .select();

  if (error) throw error;
  return mapLeadsFromDB(data as LeadRow[]);
}

/**
 * Get lead statistics
 */
export async function getLeadStats() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  // Get counts by status
  const { data, error } = await supabase
    .from('leads')
    .select('outreach_status, website_status, score');

  if (error) throw error;

  // Type the data properly since Supabase inference breaks with placeholder credentials
  type LeadStatsRow = {
    outreach_status: string;
    website_status: string;
    score: number;
  };

  const typedData = data as LeadStatsRow[];

  const stats = {
    total: typedData.length,
    by_status: {} as Record<string, number>,
    by_website_status: {} as Record<string, number>,
    avg_score: 0,
  };

  let totalScore = 0;

  typedData.forEach((lead) => {
    stats.by_status[lead.outreach_status] = (stats.by_status[lead.outreach_status] || 0) + 1;
    stats.by_website_status[lead.website_status] = (stats.by_website_status[lead.website_status] || 0) + 1;
    totalScore += lead.score;
  });

  stats.avg_score = typedData.length > 0 ? Math.round(totalScore / typedData.length) : 0;

  return stats;
}