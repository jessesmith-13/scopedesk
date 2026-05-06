import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProposals,
  getProposalById,
  createProposal,
  updateProposal,
  deleteProposal,
} from '@/api/proposals/proposals.api'
import type {
  CreateProposalInput,
  UpdateProposalInput,
  Proposal,
} from '@/types/proposal'

// Query keys
export const proposalKeys = {
  all: ['proposals'] as const,
  lists: () => [...proposalKeys.all, 'list'] as const,
  list: (dealId?: string) => [...proposalKeys.lists(), dealId] as const,
  details: () => [...proposalKeys.all, 'detail'] as const,
  detail: (id: string) => [...proposalKeys.details(), id] as const,
}

// Hooks
export function useProposals(dealId?: string) {
  return useQuery({
    queryKey: proposalKeys.list(dealId),
    queryFn: () => getProposals(dealId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useProposal(id: string) {
  return useQuery({
    queryKey: proposalKeys.detail(id),
    queryFn: () => getProposalById(id),
    enabled: !!id,
  })
}

export function useCreateProposal() {
  const queryClient = useQueryClient()

  return useMutation<Proposal, Error, CreateProposalInput>({
    mutationFn: createProposal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.lists() })
    },
  })
}

export function useUpdateProposal() {
  const queryClient = useQueryClient()

  return useMutation<
    Proposal,
    Error,
    { id: string; updates: UpdateProposalInput }
  >({
    mutationFn: ({ id, updates }) => updateProposal(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.all })
    },
  })
}

export function useDeleteProposal() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: deleteProposal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.lists() })
    },
  })
}
