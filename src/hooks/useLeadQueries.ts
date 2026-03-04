import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  type LeadFilters
} from '@/api/leads/leads.api';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import type { Lead, CreateLeadInput, UpdateLeadInput, LeadOutreachStatus } from '@/types/lead';

// Mock data fallback
const mockLeads: Lead[] = [];

async function getLeadsMock(): Promise<Lead[]> {
  return Promise.resolve(mockLeads);
}

// Query keys
export const leadKeys = {
  all: ['leads'] as const,
  lists: () => [...leadKeys.all, 'list'] as const,
  list: (filters: LeadFilters) => [...leadKeys.lists(), filters] as const,
  details: () => [...leadKeys.all, 'detail'] as const,
  detail: (id: string) => [...leadKeys.details(), id] as const,
};

// Hooks
export function useLeads(filters: LeadFilters = {}) {
  const configured = isSupabaseConfigured();
  
  return useQuery({
    queryKey: leadKeys.list(filters),
    queryFn: () => configured ? getLeads(filters) : getLeadsMock(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: leadKeys.detail(id),
    queryFn: () => getLeadById(id),
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ input, userId }: { input: CreateLeadInput; userId: string }) =>
      createLead(input, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateLeadInput }) =>
      updateLead(id, updates),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    },
  });
}

// Business logic mutations
export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ leadId, status }: { leadId: string; status: LeadOutreachStatus }) =>
      updateLead(leadId, { outreachStatus: status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(variables.leadId) });
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    },
  });
}