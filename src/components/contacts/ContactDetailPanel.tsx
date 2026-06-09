import {
  X,
  Mail,
  Phone,
  Building2,
  Star,
  User,
  MessageSquare,
  Smartphone,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Contact } from '@/types/contact'
import type { Lead } from '@/types/lead'

interface ContactDetailPanelProps {
  contact: Contact
  leads: Lead[]
  onClose: () => void
  onEdit: (contact: Contact) => void
  onEmail?: (email: string) => void
}

const METHOD_ICONS: Record<string, React.ReactNode> = {
  email: <Mail className="w-3.5 h-3.5" />,
  phone: <Phone className="w-3.5 h-3.5" />,
  sms: <Smartphone className="w-3.5 h-3.5" />,
  in_person: <Users className="w-3.5 h-3.5" />,
}

const METHOD_LABELS: Record<string, string> = {
  email: 'Email',
  phone: 'Phone',
  sms: 'SMS',
  in_person: 'In Person',
}

export function ContactDetailPanel({
  contact,
  leads,
  onClose,
  onEdit,
  onEmail,
}: ContactDetailPanelProps) {
  const linkedLead = leads.find((l) => l.id === contact.leadId)

  const initials = contact.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between p-6 border-b border-gray-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-indigo-700 font-semibold text-sm">
              {initials}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {contact.fullName}
              </h2>
              {contact.isPrimary && (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  Primary
                </Badge>
              )}
            </div>
            {contact.role && (
              <p className="text-sm text-gray-500">{contact.role}</p>
            )}
            {linkedLead && (
              <div className="flex items-center gap-1.5 mt-1">
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {linkedLead.businessName}
                </span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-6 py-4 border-b border-gray-100">
        <Button size="sm" variant="outline" onClick={() => onEdit(contact)}>
          Edit
        </Button>
        {contact.email && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEmail?.(contact.email!)}
            className="gap-1.5"
          >
            <Mail className="w-3.5 h-3.5" />
            Email
          </Button>
        )}
        {contact.phone && (
          <Button size="sm" variant="outline" asChild>
            <a href={`tel:${contact.phone}`} className="gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              Call
            </a>
          </Button>
        )}
      </div>

      {/* Contact Info */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Contact Details */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Contact Info
          </h3>
          <dl className="space-y-3">
            {contact.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <dt className="sr-only">Email</dt>
                  <dd>
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      {contact.email}
                    </a>
                  </dd>
                </div>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <dt className="sr-only">Phone</dt>
                  <dd>
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-sm text-gray-700 hover:underline"
                    >
                      {contact.phone}
                    </a>
                  </dd>
                </div>
              </div>
            )}
            {contact.preferredMethod && (
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <dt className="text-xs text-gray-400">Preferred Method</dt>
                  <dd className="flex items-center gap-1.5 text-sm text-gray-700">
                    {METHOD_ICONS[contact.preferredMethod]}
                    {METHOD_LABELS[contact.preferredMethod] ??
                      contact.preferredMethod}
                  </dd>
                </div>
              </div>
            )}
            {contact.role && (
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <dt className="text-xs text-gray-400">Role</dt>
                  <dd className="text-sm text-gray-700">{contact.role}</dd>
                </div>
              </div>
            )}
            {linkedLead && (
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <dt className="text-xs text-gray-400">Business</dt>
                  <dd className="text-sm text-gray-700">
                    {linkedLead.businessName}
                  </dd>
                </div>
              </div>
            )}
          </dl>
        </section>

        {contact.notes && (
          <>
            <Separator />
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Notes
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {contact.notes}
              </p>
            </section>
          </>
        )}

        <Separator />

        {/* Metadata */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Record Info
          </h3>
          <dl className="space-y-2 text-xs text-gray-500">
            <div className="flex justify-between">
              <dt>Created</dt>
              <dd>{new Date(contact.createdAt).toLocaleDateString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Last Updated</dt>
              <dd>{new Date(contact.updatedAt).toLocaleDateString()}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  )
}
