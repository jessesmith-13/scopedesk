import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDeals,
  getDealById,
  createDeal,
  updateDeal,
  moveDealStage,
  deleteDeal,
  type DealFilters
} from '@/api/deals/deals.api';
import type { CreateDealInput, UpdateDealInput, DealStage, Deal } from '@/types/deal';

// Query keys
export const dealKeys = {
  all: ['deals'] as const,
  lists: () => [...dealKeys.all, 'list'] as const,
  list: (filters: DealFilters) => [...dealKeys.lists(), filters] as const,
  details: () => [...dealKeys.all, 'detail'] as const,
  detail: (id: string) => [...dealKeys.details(), id] as const,
};

// Hooks
export function useDeals(filters: DealFilters = {}) {
  return useQuery({
    queryKey: dealKeys.list(filters),
    queryFn: () => getDeals(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: dealKeys.detail(id),
    queryFn: () => getDealById(id),
    enabled: !!id,
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  
  return useMutation<
    Deal,
    Error,
    { input: CreateDealInput; userId: string }
  >({
    mutationFn: ({ input, userId }) =>
      createDeal(input, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateDealInput }) =>
      updateDeal(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
    },
  });
}

export function useMoveDealStage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: DealStage }) =>
      moveDealStage(id, stage),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
    },
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
    },
  });
}