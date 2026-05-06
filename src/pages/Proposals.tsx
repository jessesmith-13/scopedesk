import { useState, useMemo } from 'react'
import { Plus, Eye, Trash2 } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useProposals, useDeleteProposal } from '@/hooks/useProposalQueries'
import {
  getProposalStatusLabel,
  getProposalStatusColor,
  formatCurrency,
} from '@/types/proposal'
import type { Proposal } from '@/types/proposal'
import ProposalBuilder from '@/components/proposals/ProposalBuilder'
import { toast } from 'sonner'
import { useNavigate } from 'react-router'

type TabFilter = 'all' | 'draft' | 'sent' | 'signed'

export default function Proposals() {
  const navigate = useNavigate()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const { data: proposals, isLoading, error } = useProposals()
  const deleteMutation = useDeleteProposal()

  // Filter proposals by tab
  const filteredProposals = useMemo(() => {
    if (!proposals) return []

    if (activeTab === 'all') return proposals
    if (activeTab === 'draft')
      return proposals.filter((p) => p.status === 'draft')
    if (activeTab === 'sent') {
      return proposals.filter(
        (p) => p.status === 'sent' || p.status === 'viewed'
      )
    }
    if (activeTab === 'signed')
      return proposals.filter((p) => p.status === 'signed')

    return proposals
  }, [proposals, activeTab])

  // Count by status
  const counts = useMemo(() => {
    if (!proposals) return { all: 0, draft: 0, sent: 0, signed: 0 }

    return {
      all: proposals.length,
      draft: proposals.filter((p) => p.status === 'draft').length,
      sent: proposals.filter(
        (p) => p.status === 'sent' || p.status === 'viewed'
      ).length,
      signed: proposals.filter((p) => p.status === 'signed').length,
    }
  }, [proposals])

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this proposal?')) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          toast.success('Proposal deleted')
        },
        onError: () => {
          toast.error('Failed to delete proposal')
        },
      })
    }
  }

  const handleView = (id: string) => {
    navigate(`/proposals/${id}`)
  }

  if (error) {
    console.error('Proposals fetch error:', error)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Proposals</h1>
            <p className="text-sm text-gray-600 mt-1">
              Create and manage professional proposals & SOWs for your clients
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Proposal
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All
              {counts.all > 0 && (
                <span className="ml-2 py-0.5 px-2 rounded-full bg-gray-100 text-gray-600 text-xs">
                  {counts.all}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('draft')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'draft'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Drafts
              {counts.draft > 0 && (
                <span className="ml-2 py-0.5 px-2 rounded-full bg-gray-100 text-gray-600 text-xs">
                  {counts.draft}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sent'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sent
              {counts.sent > 0 && (
                <span className="ml-2 py-0.5 px-2 rounded-full bg-gray-100 text-gray-600 text-xs">
                  {counts.sent}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('signed')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'signed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Signed
              {counts.signed > 0 && (
                <span className="ml-2 py-0.5 px-2 rounded-full bg-gray-100 text-gray-600 text-xs">
                  {counts.signed}
                </span>
              )}
            </button>
          </nav>
        </div>

        <Card>
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              Loading proposals...
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600 mb-2">Error loading proposals</p>
              <p className="text-sm text-gray-500">{String(error)}</p>
            </div>
          ) : !filteredProposals || filteredProposals.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 mb-4">
                {activeTab === 'all'
                  ? 'No proposals yet'
                  : `No ${activeTab} proposals`}
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create your first proposal
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Business
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sent To
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProposals.map((proposal) => (
                    <ProposalRow
                      key={proposal.id}
                      proposal={proposal}
                      onView={handleView}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {showCreateModal && (
        <ProposalBuilder
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </AppLayout>
  )
}

interface ProposalRowProps {
  proposal: Proposal
  onView: (id: string) => void
  onDelete: (id: string) => void
}

function ProposalRow({ proposal, onView, onDelete }: ProposalRowProps) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="py-3 px-4">
        <button
          onClick={() => onView(proposal.id)}
          className="font-medium text-gray-900 hover:text-blue-600"
        >
          {proposal.title}
        </button>
      </td>
      <td className="py-3 px-4 text-sm text-gray-600">
        {proposal.businessName ?? proposal.dealTitle ?? '—'}
      </td>
      <td className="py-3 px-4">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${getProposalStatusColor(proposal.status)}`}
        >
          {getProposalStatusLabel(proposal.status)}
        </span>
      </td>
      <td className="py-3 px-4 text-right font-medium text-gray-900">
        {formatCurrency(proposal.totalCents, proposal.currency)}
      </td>
      <td className="py-3 px-4 text-sm text-gray-600">
        {proposal.sentTo ?? '—'}
      </td>
      <td className="py-3 px-4 text-sm text-gray-600">
        {new Date(proposal.createdAt).toLocaleDateString()}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onView(proposal.id)}
            className="p-1 text-gray-400 hover:text-blue-600"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(proposal.id)}
            className="p-1 text-gray-400 hover:text-red-600"
            title="Delete"
            disabled={proposal.status === 'signed'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}
