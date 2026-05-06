import { useState } from 'react'
import { X, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUpdateProposal } from '@/hooks/useProposalQueries'
import type { Proposal } from '@/types/proposal'
import { toast } from 'sonner'

interface SendProposalModalProps {
  isOpen: boolean
  onClose: () => void
  proposal: Proposal
}

export default function SendProposalModal({
  isOpen,
  onClose,
  proposal,
}: SendProposalModalProps) {
  const [email, setEmail] = useState(proposal.sentTo ?? '')
  const [message, setMessage] = useState('')

  const updateMutation = useUpdateProposal()

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      toast.error('Please enter an email address')
      return
    }

    updateMutation.mutate(
      {
        id: proposal.id,
        updates: {
          status: 'sent',
          sentTo: email.trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success('Proposal sent successfully')
          onClose()
        },
        onError: () => {
          toast.error('Failed to send proposal')
        },
      }
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Send Proposal</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSend} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="client@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add a personal message to accompany the proposal..."
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              This will mark the proposal as "Sent" and record the recipient
              email. The proposal will be ready to share with your client.
            </p>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <Button type="button" onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={updateMutation.isPending}>
            <Send className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? 'Sending...' : 'Send Proposal'}
          </Button>
        </div>
      </div>
    </div>
  )
}
