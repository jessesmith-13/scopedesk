import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, Send, CheckCircle } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useProposal, useUpdateProposal } from '@/hooks/useProposalQueries'
import {
  getProposalStatusLabel,
  getProposalStatusColor,
  formatCurrency,
} from '@/types/proposal'
import SendProposalModal from '@/components/proposals/SendProposalModal'
import { toast } from 'sonner'

export default function ProposalPreview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showSendModal, setShowSendModal] = useState(false)

  const { data: proposal, isLoading } = useProposal(id!)
  const updateMutation = useUpdateProposal()

  const handleMarkSigned = () => {
    if (!proposal) return

    if (confirm('Mark this proposal as signed?')) {
      updateMutation.mutate(
        { id: proposal.id, updates: { status: 'signed' } },
        {
          onSuccess: () => {
            toast.success('Proposal marked as signed')
          },
          onError: () => {
            toast.error('Failed to update proposal')
          },
        }
      )
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading proposal...</p>
        </div>
      </AppLayout>
    )
  }

  if (!proposal) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Proposal not found</p>
          <Button onClick={() => navigate('/proposals')} variant="outline">
            Back to Proposals
          </Button>
        </div>
      </AppLayout>
    )
  }

  const canSend = proposal.status === 'draft' || proposal.status === 'viewed'
  const canMarkSigned =
    proposal.status === 'sent' || proposal.status === 'viewed'
  const metadata = proposal.content?.metadata

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/proposals')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Proposals
          </button>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${getProposalStatusColor(proposal.status)}`}
            >
              {getProposalStatusLabel(proposal.status)}
            </span>
            {canSend && (
              <Button onClick={() => setShowSendModal(true)}>
                <Send className="w-4 h-4 mr-2" />
                Send Proposal
              </Button>
            )}
            {canMarkSigned && (
              <Button onClick={handleMarkSigned} variant="outline">
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Signed
              </Button>
            )}
          </div>
        </div>

        <Card className="max-w-4xl mx-auto">
          <div className="p-12">
            {/* Header */}
            <div className="mb-8 border-b border-gray-200 pb-6">
              <div className="text-sm text-gray-500 mb-2">PROPOSAL</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                {proposal.title}
              </h1>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                {proposal.businessName && (
                  <div>
                    <span className="font-medium">Prepared for:</span>{' '}
                    {proposal.businessName}
                  </div>
                )}
                <div>
                  <span className="font-medium">Date:</span>{' '}
                  {new Date(proposal.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-8">
              {proposal.content?.sections.map((section) => (
                <div key={section.id}>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    {section.title}
                  </h2>
                  {section.description && (
                    <p className="text-gray-700 mb-4 whitespace-pre-wrap leading-relaxed">
                      {section.description}
                    </p>
                  )}

                  {section.items.length > 0 && (
                    <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-100">
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                              Qty
                            </th>
                            <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                              Rate
                            </th>
                            <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {section.items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm text-gray-900">
                                {item.description}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600 text-center">
                                {item.quantity}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600 text-right">
                                {formatCurrency(
                                  item.rateCents,
                                  proposal.currency
                                )}
                              </td>
                              <td className="py-3 px-4 text-sm font-medium text-gray-900 text-right">
                                {formatCurrency(
                                  item.totalCents,
                                  proposal.currency
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-8 pt-6 border-t border-gray-200 space-y-3">
              <div className="flex items-center justify-between text-base">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">
                  {formatCurrency(proposal.subtotalCents, proposal.currency)}
                </span>
              </div>
              {proposal.taxCents > 0 && (
                <div className="flex items-center justify-between text-base">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">
                    {formatCurrency(proposal.taxCents, proposal.currency)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-2xl font-bold pt-3 border-t border-gray-200">
                <span>Total</span>
                <span>
                  {formatCurrency(proposal.totalCents, proposal.currency)}
                </span>
              </div>
            </div>

            {/* Terms & Details */}
            {(metadata?.paymentTerms ||
              metadata?.estimatedTimeline ||
              metadata?.depositRequired) && (
              <div className="mt-8 pt-6 border-t border-gray-200 space-y-4 text-sm">
                {metadata.paymentTerms && (
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">
                      Payment Terms
                    </div>
                    <p className="text-gray-700">{metadata.paymentTerms}</p>
                  </div>
                )}

                {metadata.estimatedTimeline && (
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">
                      Estimated Timeline
                    </div>
                    <p className="text-gray-700">
                      {metadata.estimatedTimeline}
                    </p>
                  </div>
                )}

                {metadata.depositRequired && metadata.depositPercent && (
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">
                      Deposit
                    </div>
                    <p className="text-gray-700">
                      {metadata.depositPercent}% deposit required to begin work
                      (
                      {formatCurrency(
                        Math.round(
                          (proposal.totalCents * metadata.depositPercent) / 100
                        ),
                        proposal.currency
                      )}
                      )
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              {proposal.signedAt && (
                <div className="flex items-center gap-2 text-green-600 mb-4">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">
                    Signed on {new Date(proposal.signedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              <p className="text-xs text-gray-500 text-center">
                This proposal is valid for 30 days from the date above unless
                otherwise specified.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {showSendModal && proposal && (
        <SendProposalModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          proposal={proposal}
        />
      )}
    </AppLayout>
  )
}
