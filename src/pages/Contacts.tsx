import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Search,
  Plus,
  Star,
  Mail,
  Building2,
  Filter,
  Trash2,
  Edit,
  Eye,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ContactModal } from '@/components/contacts/ContactModal'
import { ContactDetailPanel } from '@/components/contacts/ContactDetailPanel'
import { useContacts, useDeleteContact } from '@/hooks/useContactQueries'
import { useLeads } from '@/hooks/useLeadQueries'
import type { Contact, PreferredMethod } from '@/types/contact'

const METHOD_LABELS: Record<PreferredMethod, string> = {
  email: 'Email',
  phone: 'Phone',
  sms: 'SMS',
  in_person: 'In Person',
}

type FilterOption =
  | 'all'
  | 'primary'
  | 'has_email'
  | 'has_phone'
  | PreferredMethod

export default function Contacts() {
  const { data: contacts = [], isLoading: contactsLoading } = useContacts()
  const { data: leads = [], isLoading: leadsLoading } = useLeads()
  const deleteContact = useDeleteContact()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterOption>('all')
  const [leadFilter, setLeadFilter] = useState<string>('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [detailContact, setDetailContact] = useState<Contact | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Build a lead lookup map for quick access
  const leadMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const lead of leads) map.set(lead.id, lead.businessName)
    return map
  }, [leads])

  // Stats
  const stats = useMemo(() => {
    const uniqueLeadIds = new Set(
      contacts.filter((c) => c.leadId).map((c) => c.leadId!)
    )
    const recently = contacts.filter((c) => {
      const d = new Date(c.createdAt)
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 7)
      return d >= cutoff
    })
    return {
      total: contacts.length,
      businesses: uniqueLeadIds.size,
      primary: contacts.filter((c) => c.isPrimary).length,
      recent: recently.length,
    }
  }, [contacts])

  // Filtered contacts
  const filtered = useMemo(() => {
    let result = contacts

    const q = search.trim().toLowerCase()
    if (q) {
      result = result.filter((c) => {
        const biz = c.leadId ? (leadMap.get(c.leadId) ?? '').toLowerCase() : ''
        return (
          c.fullName.toLowerCase().includes(q) ||
          (c.email ?? '').toLowerCase().includes(q) ||
          (c.phone ?? '').toLowerCase().includes(q) ||
          biz.includes(q)
        )
      })
    }

    if (leadFilter !== 'all') {
      result = result.filter((c) => c.leadId === leadFilter)
    }

    switch (filter) {
      case 'primary':
        result = result.filter((c) => c.isPrimary)
        break
      case 'has_email':
        result = result.filter((c) => !!c.email)
        break
      case 'has_phone':
        result = result.filter((c) => !!c.phone)
        break
      case 'email':
      case 'phone':
      case 'sms':
      case 'in_person':
        result = result.filter((c) => c.preferredMethod === filter)
        break
    }

    return result
  }, [contacts, search, filter, leadFilter, leadMap])

  function openAdd() {
    setEditingContact(null)
    setModalOpen(true)
  }

  function openEdit(contact: Contact) {
    setEditingContact(contact)
    setModalOpen(true)
  }

  async function handleDelete(id: string) {
    try {
      await deleteContact.mutateAsync(id)
      toast.success('Contact deleted')
      if (detailContact?.id === id) setDetailContact(null)
    } catch {
      toast.error('Failed to delete contact')
    } finally {
      setDeleteConfirmId(null)
    }
  }

  const isLoading = contactsLoading || leadsLoading

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              People at your leads and businesses
            </p>
          </div>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Contact
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Contacts', value: stats.total },
            { label: 'Businesses with Contacts', value: stats.businesses },
            { label: 'Primary Contacts', value: stats.primary },
            { label: 'Added This Week', value: stats.recent },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search by name, email, phone, or business..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <Select value={leadFilter} onValueChange={setLeadFilter}>
              <SelectTrigger className="w-44">
                <Building2 className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                <SelectValue placeholder="Business" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Businesses</SelectItem>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.businessName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filter}
              onValueChange={(v) => setFilter(v as FilterOption)}
            >
              <SelectTrigger className="w-40">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contacts</SelectItem>
                <SelectItem value="primary">Primary Only</SelectItem>
                <SelectItem value="has_email">Has Email</SelectItem>
                <SelectItem value="has_phone">Has Phone</SelectItem>
                <SelectItem value="email">Prefers Email</SelectItem>
                <SelectItem value="phone">Prefers Phone</SelectItem>
                <SelectItem value="sms">Prefers SMS</SelectItem>
                <SelectItem value="in_person">Prefers In Person</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-gray-400 text-sm">
              Loading contacts...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 text-sm">
                {contacts.length === 0
                  ? 'No contacts yet. Add your first contact to get started.'
                  : 'No contacts match your search or filters.'}
              </p>
              {contacts.length === 0 && (
                <Button
                  onClick={openAdd}
                  variant="outline"
                  className="mt-4 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Contact
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left font-medium text-gray-500 px-4 py-3">
                      Contact
                    </th>
                    <th className="text-left font-medium text-gray-500 px-4 py-3">
                      Business
                    </th>
                    <th className="text-left font-medium text-gray-500 px-4 py-3 hidden md:table-cell">
                      Role
                    </th>
                    <th className="text-left font-medium text-gray-500 px-4 py-3 hidden lg:table-cell">
                      Email
                    </th>
                    <th className="text-left font-medium text-gray-500 px-4 py-3 hidden lg:table-cell">
                      Phone
                    </th>
                    <th className="text-left font-medium text-gray-500 px-4 py-3 hidden xl:table-cell">
                      Preferred
                    </th>
                    <th className="text-left font-medium text-gray-500 px-4 py-3 hidden xl:table-cell">
                      Updated
                    </th>
                    <th className="text-right font-medium text-gray-500 px-4 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((contact) => {
                    const bizName = contact.leadId
                      ? leadMap.get(contact.leadId)
                      : null
                    const initials = contact.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)

                    return (
                      <tr
                        key={contact.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setDetailContact(contact)}
                      >
                        {/* Contact Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-indigo-700 text-xs font-semibold">
                                {initials}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-gray-900">
                                  {contact.fullName}
                                </span>
                                {contact.isPrimary && (
                                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Business */}
                        <td className="px-4 py-3">
                          {bizName ? (
                            <span className="text-gray-700 text-sm">
                              {bizName}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>

                        {/* Role */}
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-gray-600 text-sm">
                            {contact.role ?? '—'}
                          </span>
                        </td>

                        {/* Email */}
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {contact.email ? (
                            <a
                              href={`mailto:${contact.email}`}
                              className="text-indigo-600 hover:underline text-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {contact.email}
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>

                        {/* Phone */}
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {contact.phone ? (
                            <a
                              href={`tel:${contact.phone}`}
                              className="text-gray-700 hover:underline text-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {contact.phone}
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>

                        {/* Preferred Method */}
                        <td className="px-4 py-3 hidden xl:table-cell">
                          {contact.preferredMethod ? (
                            <Badge variant="secondary" className="text-xs">
                              {METHOD_LABELS[contact.preferredMethod]}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>

                        {/* Last Updated */}
                        <td className="px-4 py-3 hidden xl:table-cell">
                          <span className="text-gray-500 text-sm">
                            {new Date(contact.updatedAt).toLocaleDateString()}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              title="View"
                              onClick={() => setDetailContact(contact)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              title="Edit"
                              onClick={() => openEdit(contact)}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            {contact.email && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title="Send Email"
                                asChild
                              >
                                <a href={`mailto:${contact.email}`}>
                                  <Mail className="w-3.5 h-3.5" />
                                </a>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              title="Delete"
                              onClick={() => setDeleteConfirmId(contact.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Result count */}
        {!isLoading && contacts.length > 0 && (
          <p className="text-xs text-gray-400 text-center">
            Showing {filtered.length} of {contacts.length} contacts
          </p>
        )}
      </div>

      {/* Add/Edit Modal */}
      <ContactModal
        key={editingContact?.id ?? 'new'}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingContact(null)
        }}
        contact={editingContact}
        leads={leads}
      />

      {/* Detail Slide-Over */}
      {detailContact && (
        <Dialog
          open={!!detailContact}
          onOpenChange={(open) => !open && setDetailContact(null)}
        >
          <DialogContent className="max-w-md p-0 h-[90vh] overflow-hidden flex flex-col">
            <ContactDetailPanel
              contact={detailContact}
              leads={leads}
              onClose={() => setDetailContact(null)}
              onEdit={(contact) => {
                setDetailContact(null)
                openEdit(contact)
              }}
              onEmail={(email) => window.open(`mailto:${email}`, '_blank')}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirm Dialog */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <DialogContent className="max-w-sm">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Delete Contact?
            </h2>
            <p className="text-sm text-gray-500">
              This action cannot be undone. The contact will be permanently
              removed.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                disabled={deleteContact.isPending}
              >
                {deleteContact.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
