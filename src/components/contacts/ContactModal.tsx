import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateContact, useUpdateContact } from '@/hooks/useContactQueries'
import type {
  Contact,
  CreateContactInput,
  PreferredMethod,
} from '@/types/contact'
import type { Lead } from '@/types/lead'

interface ContactModalProps {
  open: boolean
  onClose: () => void
  contact?: Contact | null
  leads: Lead[]
  defaultLeadId?: string
}

const PREFERRED_METHODS: { value: PreferredMethod; label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'sms', label: 'SMS' },
  { value: 'in_person', label: 'In Person' },
]

export function ContactModal({
  open,
  onClose,
  contact,
  leads,
  defaultLeadId,
}: ContactModalProps) {
  const isEditing = !!contact
  const createContact = useCreateContact()
  const updateContact = useUpdateContact()

  const [form, setForm] = useState<CreateContactInput>(() =>
    contact
      ? {
          fullName: contact.fullName,
          leadId: contact.leadId,
          role: contact.role,
          email: contact.email,
          phone: contact.phone,
          preferredMethod: contact.preferredMethod,
          isPrimary: contact.isPrimary,
          notes: contact.notes,
        }
      : {
          fullName: '',
          leadId: defaultLeadId ?? null,
          role: null,
          email: null,
          phone: null,
          preferredMethod: null,
          isPrimary: false,
          notes: null,
        }
  )

  function set<K extends keyof CreateContactInput>(
    key: K,
    value: CreateContactInput[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.fullName.trim()) {
      toast.error('Full name is required')
      return
    }

    try {
      if (isEditing && contact) {
        await updateContact.mutateAsync({ id: contact.id, updates: form })
        toast.success('Contact updated')
      } else {
        await createContact.mutateAsync(form)
        toast.success('Contact created')
      }
      onClose()
    } catch (err) {
      console.error('Error saving contact:', err)
      toast.error('Failed to save contact')
    }
  }

  const isPending = createContact.isPending || updateContact.isPending

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Contact' : 'Add Contact'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={(e) => set('fullName', e.target.value)}
              placeholder="Jane Smith"
              required
            />
          </div>

          {/* Linked Business */}
          <div className="space-y-1">
            <Label htmlFor="leadId">Linked Business</Label>
            <Select
              value={form.leadId ?? 'none'}
              onValueChange={(v) => set('leadId', v === 'none' ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a business..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— No business —</SelectItem>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.businessName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role / Title */}
          <div className="space-y-1">
            <Label htmlFor="role">Role / Title</Label>
            <Input
              id="role"
              value={form.role ?? ''}
              onChange={(e) => set('role', e.target.value || null)}
              placeholder="Owner, Manager, Marketing Director..."
            />
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email ?? ''}
                onChange={(e) => set('email', e.target.value || null)}
                placeholder="jane@business.com"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone ?? ''}
                onChange={(e) => set('phone', e.target.value || null)}
                placeholder="(206) 555-0100"
              />
            </div>
          </div>

          {/* Preferred Method */}
          <div className="space-y-1">
            <Label>Preferred Contact Method</Label>
            <Select
              value={form.preferredMethod ?? 'none'}
              onValueChange={(v) =>
                set(
                  'preferredMethod',
                  v === 'none' ? null : (v as PreferredMethod)
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select method..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Not specified —</SelectItem>
                {PREFERRED_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Primary Contact Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Primary Contact
              </p>
              <p className="text-xs text-gray-500">
                Mark as the main point of contact for this business
              </p>
            </div>
            <Switch
              checked={form.isPrimary ?? false}
              onCheckedChange={(v) => set('isPrimary', v)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value || null)}
              placeholder="Any additional notes about this contact..."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? 'Saving...'
                : isEditing
                  ? 'Save Changes'
                  : 'Create Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
