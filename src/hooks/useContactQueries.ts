import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
} from '@/api/contacts/contacts.api'
import type { CreateContactInput, UpdateContactInput } from '@/types/contact'

export const contactKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactKeys.all, 'list'] as const,
  list: (leadId?: string) => [...contactKeys.lists(), { leadId }] as const,
  details: () => [...contactKeys.all, 'detail'] as const,
  detail: (id: string) => [...contactKeys.details(), id] as const,
}

export function useContacts(leadId?: string) {
  return useQuery({
    queryKey: contactKeys.list(leadId),
    queryFn: () => getContacts(leadId),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}

export function useContact(id: string) {
  return useQuery({
    queryKey: contactKeys.detail(id),
    queryFn: () => getContactById(id),
    enabled: !!id,
  })
}

export function useCreateContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateContactInput) => createContact(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() })
    },
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string
      updates: UpdateContactInput
    }) => updateContact(id, updates),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: contactKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() })
    },
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() })
    },
  })
}
