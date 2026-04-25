import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useCreateDeal } from '@/hooks/useDealQueries'
import { useUpdateLead } from '@/hooks/useLeadQueries'
import { getCurrentUserId } from '@/lib/supabaseClient'
import type { Lead } from '@/types/lead'
import type { DealStage, CreateDealInput } from '@/types/deal'
import { getStageProbability } from '@/types/deal'
import { toast } from 'sonner'

interface ConvertToDealModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Lead
}

export default function ConvertToDealModal({
  open,
  onOpenChange,
  lead,
}: ConvertToDealModalProps) {
  const createDealMutation = useCreateDeal()
  const updateLeadMutation = useUpdateLead()
  const [formData, setFormData] = useState({
    estimatedValue: '',
    stage: 'qualified' as DealStage,
    expectedCloseDate: '',
    serviceType: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const userId = await getCurrentUserId()
      const amountInCents = Math.round(
        parseFloat(formData.estimatedValue) * 100
      )

      const dealInput: CreateDealInput = {
        leadId: lead.id,
        businessName: lead.businessName,
        stage: formData.stage,
        amountCents: amountInCents,
        probability: getStageProbability(formData.stage),
        expectedCloseDate: formData.expectedCloseDate,
        serviceType: formData.serviceType,
        title: lead.businessName, // Just use business name, service type shows separately
      }

      createDealMutation.mutate(
        { input: dealInput, userId },
        {
          onSuccess: () => {
            // Update lead status to "converted_to_deal"
            updateLeadMutation.mutate(
              { id: lead.id, updates: { outreachStatus: 'converted_to_deal' } },
              {
                onSuccess: () => {
                  toast.success('Lead converted to deal! View in CRM Pipeline.')
                  onOpenChange(false)
                  setFormData({
                    estimatedValue: '',
                    stage: 'qualified',
                    expectedCloseDate: '',
                    serviceType: '',
                  })
                },
                onError: () => {
                  toast.error('Deal created but failed to update lead status')
                },
              }
            )
          },
          onError: () => {
            toast.error('Failed to convert lead')
          },
        }
      )
    } catch {
      toast.error('Failed to get user information')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Convert "{lead.businessName}" to Deal</DialogTitle>
          <DialogDescription>
            Add this lead to your CRM Pipeline as a revenue opportunity.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="estimatedValue">Estimated Deal Value ($) *</Label>
            <Input
              id="estimatedValue"
              type="number"
              required
              min="0"
              step="100"
              value={formData.estimatedValue}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  estimatedValue: e.target.value,
                }))
              }
              placeholder="e.g., 3500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedCloseDate">Expected Close Date *</Label>
            <Input
              id="expectedCloseDate"
              type="date"
              required
              value={formData.expectedCloseDate}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  expectedCloseDate: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage">Initial Stage *</Label>
            <Select
              value={formData.stage}
              onValueChange={(v) =>
                setFormData((prev) => ({ ...prev, stage: v as DealStage }))
              }
            >
              <SelectTrigger id="stage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="meeting_scheduled">
                  Meeting Scheduled
                </SelectItem>
                <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                <SelectItem value="negotiation">Negotiation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceType">Service Type *</Label>
            <Input
              id="serviceType"
              required
              placeholder="e.g., Website Redesign, SEO, E-commerce"
              value={formData.serviceType}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  serviceType: e.target.value,
                }))
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add to Pipeline</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
