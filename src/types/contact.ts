export type PreferredMethod = 'email' | 'phone' | 'sms' | 'in_person'

export interface Contact {
  id: string
  userId: string
  leadId: string | null
  fullName: string
  role: string | null
  email: string | null
  phone: string | null
  preferredMethod: PreferredMethod | null
  isPrimary: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
  // Enriched fields (joined from leads query)
  businessName?: string
}

export interface CreateContactInput {
  leadId?: string | null
  fullName: string
  role?: string | null
  email?: string | null
  phone?: string | null
  preferredMethod?: PreferredMethod | null
  isPrimary?: boolean
  notes?: string | null
}

export interface UpdateContactInput {
  leadId?: string | null
  fullName?: string
  role?: string | null
  email?: string | null
  phone?: string | null
  preferredMethod?: PreferredMethod | null
  isPrimary?: boolean
  notes?: string | null
}
