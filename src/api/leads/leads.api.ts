// API layer for leads
// Handles all edge function interactions for leads
// Returns domain types to the UI

import type { Database } from '@/types/supabase';
import type { Lead, CreateLeadInput, UpdateLeadInput } from '@/types/lead';
import { api } from '@/api/client';
import { 
  mapLeadFromDB,
  mapLeadsFromDB,
  mapLeadToInsert, 
  mapLeadToUpdate,
  mapLeadsToInsert
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
export async function getLeads(): Promise<Lead[]> {
  // TODO: Add filter support to edge function if needed
  const result = await api<{ data: LeadRow[] }>('/leads');
  return mapLeadsFromDB(result.data);
}

/**
 * Get a single lead by ID
 */
export async function getLeadById(id: string): Promise<Lead> {
  const result = await api<{ data: LeadRow }>(`/leads/${id}`);
  return mapLeadFromDB(result.data);
}

/**
 * Create a new lead
 */
export async function createLead(input: CreateLeadInput, userId: string): Promise<Lead> {
  const insertData = mapLeadToInsert(input, userId);
  
  const result = await api<{ data: LeadRow }>('/leads', {
    method: 'POST',
    body: insertData,
  });
  
  return mapLeadFromDB(result.data);
}

/**
 * Update an existing lead
 */
export async function updateLead(id: string, input: UpdateLeadInput): Promise<Lead> {
  const updateData = mapLeadToUpdate(input);
  
  const result = await api<{ data: LeadRow }>(`/leads/${id}`, {
    method: 'PUT',
    body: updateData,
  });
  
  return mapLeadFromDB(result.data);
}

/**
 * Delete a lead
 */
export async function deleteLead(id: string): Promise<void> {
  await api<void>(`/leads/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Bulk create multiple leads with automatic deduplication
 */
export async function bulkCreateLeads(inputs: CreateLeadInput[]): Promise<{
  leads: Lead[];
  inserted: number;
  skipped: number;
  total: number;
}> {
  const leadsData = mapLeadsToInsert(inputs);
  
  const result = await api<{ 
    data: LeadRow[];
    inserted: number;
    skipped_duplicates: number;
    total: number;
  }>('/leads', {
    method: 'POST',
    body: { leads: leadsData },
  });
  
  return {
    leads: mapLeadsFromDB(result.data),
    inserted: result.inserted,
    skipped: result.skipped_duplicates,
    total: result.total,
  };
}

/**
 * Bulk update multiple leads
 */
export async function bulkUpdateLeads(): Promise<Lead[]> {
  // TODO: Implement bulk update endpoint in edge function
  throw new Error('Bulk update not yet implemented in edge function');
}

/**
 * Get lead statistics
 */
export async function getLeadStats() {
  // TODO: Implement stats endpoint in edge function
  throw new Error('Lead stats not yet implemented in edge function');
}