import type { Database } from '@/types/supabase'
import type {
  Contact,
  CreateContactInput,
  UpdateContactInput,
  PreferredMethod,
} from '@/types/contact'

type ContactRow = Database['public']['Tables']['contacts']['Row']

export function mapContactFromDB(row: ContactRow): Contact {
  return {
    id: row.id,
    userId: row.user_id,
    leadId: row.lead_id,
    fullName: row.full_name,
    role: row.role,
    email: row.email,
    phone: row.phone,
    preferredMethod: row.preferred_method as PreferredMethod | null,
    isPrimary: row.is_primary,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapContactsFromDB(rows: ContactRow[]): Contact[] {
  return rows.map(mapContactFromDB)
}

export function mapContactToInsert(
  input: CreateContactInput
): Omit<
  ContactRow,
  'id' | 'user_id' | 'deal_id' | 'created_at' | 'updated_at'
> {
  return {
    lead_id: input.leadId ?? null,
    full_name: input.fullName,
    role: input.role ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    preferred_method: input.preferredMethod ?? null,
    is_primary: input.isPrimary ?? false,
    notes: input.notes ?? null,
  }
}

export function mapContactToUpdate(
  input: UpdateContactInput
): Partial<ContactRow> {
  const update: Partial<ContactRow> = {}
  if (input.leadId !== undefined) update.lead_id = input.leadId
  if (input.fullName !== undefined) update.full_name = input.fullName
  if (input.role !== undefined) update.role = input.role
  if (input.email !== undefined) update.email = input.email
  if (input.phone !== undefined) update.phone = input.phone
  if (input.preferredMethod !== undefined)
    update.preferred_method = input.preferredMethod
  if (input.isPrimary !== undefined) update.is_primary = input.isPrimary
  if (input.notes !== undefined) update.notes = input.notes
  return update
}
