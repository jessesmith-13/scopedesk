import type { ProposalSection } from '@/types/proposal'
import { formatCurrency } from '@/types/proposal'

interface ProposalPreviewPanelProps {
  title: string
  businessName: string
  sections: ProposalSection[]
  subtotalCents: number
  taxCents: number
  totalCents: number
  paymentTerms: string
  estimatedTimeline: string
  depositRequired: boolean
  depositPercent: number
}

export default function ProposalPreviewPanel({
  title,
  businessName,
  sections,
  subtotalCents,
  taxCents,
  totalCents,
  paymentTerms,
  estimatedTimeline,
  depositRequired,
  depositPercent,
}: ProposalPreviewPanelProps) {
  return (
    <div className="min-h-full bg-white p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-gray-200 pb-6">
          <div className="text-sm text-gray-500 mb-2">PROPOSAL</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {title || 'Untitled Proposal'}
          </h1>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div>
              <span className="font-medium">Prepared for:</span> {businessName}
            </div>
            <div>
              <span className="font-medium">Date:</span>{' '}
              {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section) => (
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
                            {item.description || 'Item'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 text-center">
                            {item.quantity}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 text-right">
                            {formatCurrency(item.rateCents)}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-gray-900 text-right">
                            {formatCurrency(item.totalCents)}
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
        {sections.some((s) => s.items.length > 0) && (
          <div className="border-t border-gray-200 pt-6 space-y-3">
            <div className="flex items-center justify-between text-base">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">
                {formatCurrency(subtotalCents)}
              </span>
            </div>
            {taxCents > 0 && (
              <div className="flex items-center justify-between text-base">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">{formatCurrency(taxCents)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-2xl font-bold pt-3 border-t border-gray-200">
              <span>Total</span>
              <span>{formatCurrency(totalCents)}</span>
            </div>
          </div>
        )}

        {/* Terms & Details */}
        <div className="border-t border-gray-200 pt-6 space-y-4 text-sm">
          {paymentTerms && (
            <div>
              <div className="font-semibold text-gray-900 mb-1">
                Payment Terms
              </div>
              <p className="text-gray-700">{paymentTerms}</p>
            </div>
          )}

          {estimatedTimeline && (
            <div>
              <div className="font-semibold text-gray-900 mb-1">
                Estimated Timeline
              </div>
              <p className="text-gray-700">{estimatedTimeline}</p>
            </div>
          )}

          {depositRequired && (
            <div>
              <div className="font-semibold text-gray-900 mb-1">Deposit</div>
              <p className="text-gray-700">
                {depositPercent}% deposit required to begin work (
                {formatCurrency(
                  Math.round((totalCents * depositPercent) / 100)
                )}
                )
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6">
          <p className="text-xs text-gray-500 text-center">
            This proposal is valid for 30 days from the date above unless
            otherwise specified.
          </p>
        </div>
      </div>
    </div>
  )
}
