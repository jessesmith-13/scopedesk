import type { Database } from '@/types/supabase'
import type {
  Contact,
  CreateContactInput,
  UpdateContactInput,
} from '@/types/contact'
import { api } from '@/api/client'
import {
  mapContactFromDB,
  mapContactsFromDB,
  mapContactToInsert,
  mapContactToUpdate,
} from './mapper'

type ContactRow = Database['public']['Tables']['contacts']['Row']

export async function getContacts(leadId?: string): Promise<Contact[]> {
  const query = leadId ? { lead_id: leadId } : undefined
  const result = await api<{ data: ContactRow[] }>('/contacts', { query })
  if (!result?.data) return []
  return mapContactsFromDB(result.data)
}

export async function getContactById(id: string): Promise<Contact> {
  const result = await api<{ data: ContactRow }>(`/contacts/${id}`)
  return mapContactFromDB(result.data)
}

export async function createContact(
  input: CreateContactInput
): Promise<Contact> {
  const body = mapContactToInsert(input)
  const result = await api<{ data: ContactRow }>('/contacts', {
    method: 'POST',
    body,
  })
  return mapContactFromDB(result.data)
}

export async function updateContact(
  id: string,
  input: UpdateContactInput
): Promise<Contact> {
  const body = mapContactToUpdate(input)
  const result = await api<{ data: ContactRow }>(`/contacts/${id}`, {
    method: 'PUT',
    body,
  })
  return mapContactFromDB(result.data)
}

export async function deleteContact(id: string): Promise<void> {
  await api<void>(`/contacts/${id}`, { method: 'DELETE' })
}
