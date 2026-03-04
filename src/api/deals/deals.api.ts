// API layer for deals
// Handles all Supabase interactions for deals
// Returns domain types to the UI

import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import type { Database, DealStage } from '@/types/supabase';
import type { Deal, DealWithRelations, CreateDealInput, UpdateDealInput } from '@/types/deal';
import { 
  mapDealFromDB, 
  mapDealWithRelationsFromDB,
  mapDealsWithRelationsFromDB,
  mapDealToInsert, 
  mapDealToUpdate 
} from './mapper';

type DealRow = Database['public']['Tables']['deals']['Row'];

export interface DealFilters {
  stage?: DealStage;
  q?: string;
  min_value?: number;
  max_value?: number;
  sort?: 'expected_close_date' | 'value_desc' | 'value_asc' | 'followup_soon' | 'newest';
  limit?: number;
  offset?: number;
}

/**
 * Get all deals with optional filters
 */
export async function getDeals(filters: DealFilters = {}): Promise<DealWithRelations[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  let query = supabase
    .from('deals')
    .select(`
      *,
      lead:leads(business_name, category, neighborhood),
      contact:contacts(full_name, email, phone)
    `);

  // Apply filters
  if (filters.stage) {
    query = query.eq('stage', filters.stage);
  }

  if (filters.q) {
    query = query.or(`title.ilike.%${filters.q}%,service_type.ilike.%${filters.q}%`);
  }

  if (filters.min_value !== undefined) {
    query = query.gte('deal_value', filters.min_value);
  }

  if (filters.max_value !== undefined) {
    query = query.lte('deal_value', filters.max_value);
  }

  // Sorting
  switch (filters.sort) {
    case 'expected_close_date':
      query = query.order('expected_close_date', { ascending: true, nullsFirst: false });
      break;
    case 'value_desc':
      query = query.order('deal_value', { ascending: false, nullsFirst: false });
      break;
    case 'value_asc':
      query = query.order('deal_value', { ascending: true, nullsFirst: false });
      break;
    case 'followup_soon':
      query = query.order('next_follow_up_at', { ascending: true, nullsFirst: false });
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
  return mapDealsWithRelationsFromDB(data);
}

/**
 * Get a single deal by ID with relations
 */
export async function getDealById(id: string): Promise<DealWithRelations> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('deals')
    .select(`
      *,
      lead:leads(*),
      contact:contacts(*),
      activities(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return mapDealWithRelationsFromDB(data);
}

/**
 * Create a new deal
 */
export async function createDeal(input: CreateDealInput, userId: string): Promise<Deal> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const insertData = mapDealToInsert(input, userId);
  
  // Cast to 'never' to work around Supabase's broken type inference with placeholder credentials
  const { data, error } = await supabase
    .from('deals')
    .insert(insertData as never)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('No data returned');
  return mapDealFromDB(data as DealRow);
}

/**
 * Update an existing deal
 */
export async function updateDeal(id: string, input: UpdateDealInput): Promise<Deal> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const updateData = mapDealToUpdate(input);
  
  // Cast to 'never' to work around Supabase's broken type inference with placeholder credentials
  const { data, error } = await supabase
    .from('deals')
    .update(updateData as never)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('No data returned');
  return mapDealFromDB(data as DealRow);
}

/**
 * Move a deal to a different stage
 */
export async function moveDealStage(id: string, stage: DealStage): Promise<Deal> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const input: UpdateDealInput = {
    stage,
  };

  // Auto-set won_at or lost_at
  if (stage === 'won') {
    input.wonAt = new Date().toISOString();
  } else if (stage === 'lost') {
    input.lostAt = new Date().toISOString();
  }

  return updateDeal(id, input);
}

/**
 * Delete a deal
 */
export async function deleteDeal(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .from('deals')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Get deal statistics
 */
export async function getDealStats() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('deals')
    .select('stage, deal_value, probability, won_at, lost_at');

  if (error) throw error;

  // Type assertion for the selected fields
  type DealStatsRow = Pick<DealRow, 'stage' | 'deal_value' | 'probability' | 'won_at' | 'lost_at'>;
  const rows = data as DealStatsRow[];

  const activeDeals = rows.filter((d) => !['won', 'lost'].includes(d.stage));
  const totalPipelineValue = activeDeals.reduce((sum, d) => sum + (d.deal_value || 0), 0);
  const weightedPipelineValue = activeDeals.reduce((sum, d) => {
    return sum + ((d.deal_value || 0) * (d.probability / 100));
  }, 0);

  const wonDeals = rows.filter((d) => d.stage === 'won');
  const lostDeals = rows.filter((d) => d.stage === 'lost');
  const wonThisMonth = wonDeals.filter((d) => {
    if (!d.won_at) return false;
    const wonDate = new Date(d.won_at);
    const now = new Date();
    return wonDate.getMonth() === now.getMonth() && wonDate.getFullYear() === now.getFullYear();
  }).reduce((sum, d) => sum + (d.deal_value || 0), 0);

  const winRate = wonDeals.length + lostDeals.length > 0
    ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100)
    : 0;

  return {
    activeDealsCount: activeDeals.length,
    totalPipelineValue,
    weightedPipelineValue,
    wonThisMonth,
    winRate,
    wonCount: wonDeals.length,
    lostCount: lostDeals.length,
  };
}