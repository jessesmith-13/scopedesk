import { useState } from 'react'
import { X, Plus, Save, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCreateProposal } from '@/hooks/useProposalQueries'
import { useDeals } from '@/hooks/useDealQueries'
import type {
  ProposalSection,
  ProposalContent,
  SectionType,
} from '@/types/proposal'
import { toast } from 'sonner'
import { nanoid } from 'nanoid'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import ProposalPreviewPanel from './ProposalPreviewPanel'
import SectionEditor from './SectionEditor'

interface ProposalBuilderProps {
  isOpen: boolean
  onClose: () => void
  dealId?: string
}

const SECTION_TEMPLATES: Record<
  SectionType,
  { title: string; description: string }
> = {
  scope: {
    title: 'Project Scope',
    description:
      'Overview of the project objectives and what will be delivered.',
  },
  deliverables: {
    title: 'Deliverables',
    description:
      'Detailed list of what you will receive upon project completion.',
  },
  timeline: {
    title: 'Timeline',
    description: 'Estimated project duration and key milestones.',
  },
  pricing: {
    title: 'Pricing',
    description: 'Detailed breakdown of costs and services.',
  },
  'add-ons': {
    title: 'Optional Add-ons',
    description: 'Additional services available for this project.',
  },
  hosting: {
    title: 'Hosting & Maintenance',
    description: 'Ongoing support and hosting details.',
  },
  terms: {
    title: 'Terms & Conditions',
    description: 'Payment terms, refund policy, and legal agreements.',
  },
  custom: {
    title: 'Custom Section',
    description: '',
  },
}

function ProposalBuilderContent({
  isOpen,
  onClose,
  dealId,
}: ProposalBuilderProps) {
  const [selectedDealId, setSelectedDealId] = useState(dealId ?? '')
  const [title, setTitle] = useState('')
  const [sections, setSections] = useState<ProposalSection[]>([])
  const [taxPercent, setTaxPercent] = useState(0)
  const [expiresAt, setExpiresAt] = useState('')
  const [paymentTerms, setPaymentTerms] = useState(
    '50% upfront, 50% upon completion'
  )
  const [estimatedTimeline, setEstimatedTimeline] = useState('')
  const [depositRequired, setDepositRequired] = useState(true)
  const [depositPercent, setDepositPercent] = useState(50)

  const { data: deals } = useDeals()
  const createMutation = useCreateProposal()

  // Handle deal selection change
  const handleDealChange = (newDealId: string) => {
    setSelectedDealId(newDealId)

    // Auto-fill when deal is selected
    if (newDealId && deals) {
      const deal = deals.find((d) => d.id === newDealId)
      if (deal) {
        const businessName =
          deal.businessName || deal.lead?.businessName || 'Client'
        const serviceType = deal.serviceType || 'Service'

        // Only set if fields are empty
        if (!title) {
          setTitle(`${businessName} - ${serviceType} Proposal`)
        }

        if (sections.length === 0) {
          const starterSections: ProposalSection[] = [
            {
              id: nanoid(),
              type: 'scope',
              ...SECTION_TEMPLATES.scope,
              items: [],
            },
            {
              id: nanoid(),
              type: 'pricing',
              ...SECTION_TEMPLATES.pricing,
              items: deal.amountCents
                ? [
                    {
                      id: nanoid(),
                      description: serviceType,
                      quantity: 1,
                      rateCents: deal.amountCents,
                      totalCents: deal.amountCents,
                    },
                  ]
                : [],
            },
          ]
          setSections(starterSections)
        }
      }
    }
  }

  const addSection = (type: SectionType) => {
    const template = SECTION_TEMPLATES[type]
    setSections([
      ...sections,
      {
        id: nanoid(),
        type,
        title: template.title,
        description: template.description,
        items: [],
      },
    ])
  }

  const removeSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id))
  }

  const updateSection = (id: string, updates: Partial<ProposalSection>) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }

  const moveSection = (dragIndex: number, hoverIndex: number) => {
    const newSections = [...sections]
    const [removed] = newSections.splice(dragIndex, 1)
    newSections.splice(hoverIndex, 0, removed)
    setSections(newSections)
  }

  const calculateTotals = () => {
    const subtotalCents = sections.reduce(
      (sum, section) =>
        sum +
        section.items.reduce((itemSum, item) => itemSum + item.totalCents, 0),
      0
    )
    const taxCents = Math.round(subtotalCents * (taxPercent / 100))
    const totalCents = subtotalCents + taxCents
    return { subtotalCents, taxCents, totalCents }
  }

  const handleSaveDraft = () => {
    if (!selectedDealId) {
      toast.error('Please select a deal')
      return
    }
    handleSubmit('draft')
  }

  const handleCreate = () => {
    if (!selectedDealId) {
      toast.error('Please select a deal')
      return
    }
    handleSubmit('sent')
  }

  const handleSubmit = (status: 'draft' | 'sent') => {
    if (!title.trim()) {
      toast.error('Please enter a proposal title')
      return
    }

    const { subtotalCents, taxCents, totalCents } = calculateTotals()

    const content: ProposalContent = {
      sections,
      metadata: {
        paymentTerms,
        estimatedTimeline,
        depositRequired,
        depositPercent,
        notes: '',
      },
    }

    createMutation.mutate(
      {
        dealId: selectedDealId,
        title: title.trim(),
        status,
        content,
        subtotalCents,
        taxCents,
        totalCents,
        expiresAt: expiresAt || null,
      },
      {
        onSuccess: () => {
          toast.success(
            status === 'draft' ? 'Proposal saved as draft' : 'Proposal created'
          )
          onClose()
        },
        onError: () => {
          toast.error('Failed to create proposal')
        },
      }
    )
  }

  const { subtotalCents, taxCents, totalCents } = calculateTotals()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full h-[90vh] max-w-7xl mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">New Proposal</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Split Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Editor */}
          <div className="w-1/2 border-r border-gray-200 overflow-y-auto p-6 space-y-6">
            {/* Deal Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Deal *
              </label>
              <select
                value={selectedDealId}
                onChange={(e) => handleDealChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Choose a deal...</option>
                {deals?.map((deal) => (
                  <option key={deal.id} value={deal.id}>
                    {deal.businessName} - {deal.serviceType || 'Service'}
                  </option>
                ))}
              </select>
            </div>

            {/* Proposal Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proposal Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Client Name - Service Proposal"
                required
              />
            </div>

            {/* Sections */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900">
                  Proposal Sections
                </h3>
                <div className="relative group">
                  <Button type="button" size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Section
                  </Button>
                  <div className="absolute right-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    {(Object.keys(SECTION_TEMPLATES) as SectionType[]).map(
                      (type) => (
                        <button
                          key={type}
                          onClick={() => addSection(type)}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                        >
                          {SECTION_TEMPLATES[type].title}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {sections.map((section, index) => (
                  <SectionEditor
                    key={section.id}
                    section={section}
                    index={index}
                    onUpdate={(updates) => updateSection(section.id, updates)}
                    onRemove={() => removeSection(section.id)}
                    onMove={moveSection}
                  />
                ))}
              </div>
            </div>

            {/* Metadata */}
            <div className="border-t border-gray-200 pt-6 space-y-4">
              <h3 className="text-sm font-medium text-gray-900">
                Settings & Terms
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Tax %
                  </label>
                  <input
                    type="number"
                    value={taxPercent}
                    onChange={(e) =>
                      setTaxPercent(parseFloat(e.target.value) || 0)
                    }
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="50% upfront, 50% upon completion"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Estimated Timeline
                </label>
                <input
                  type="text"
                  value={estimatedTimeline}
                  onChange={(e) => setEstimatedTimeline(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="4-6 weeks"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={depositRequired}
                    onChange={(e) => setDepositRequired(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">
                    Deposit Required
                  </span>
                </label>
                {depositRequired && (
                  <input
                    type="number"
                    value={depositPercent}
                    onChange={(e) =>
                      setDepositPercent(parseInt(e.target.value) || 0)
                    }
                    min="0"
                    max="100"
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="%"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="w-1/2 bg-gray-50 overflow-y-auto">
            <ProposalPreviewPanel
              title={title}
              businessName={
                deals?.find((d) => d.id === selectedDealId)?.businessName ||
                'Client'
              }
              sections={sections}
              subtotalCents={subtotalCents}
              taxCents={taxCents}
              totalCents={totalCents}
              paymentTerms={paymentTerms}
              estimatedTimeline={estimatedTimeline}
              depositRequired={depositRequired}
              depositPercent={depositPercent}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Total:</span> $
            {(totalCents / 100).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveDraft}
              variant="outline"
              disabled={createMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={createMutation.isPending}
            >
              <Send className="w-4 h-4 mr-2" />
              {createMutation.isPending ? 'Creating...' : 'Create Proposal'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProposalBuilder(props: ProposalBuilderProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <ProposalBuilderContent {...props} />
    </DndProvider>
  )
}
