import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useCreateDeal } from '@/hooks/useDealQueries';
import { getCurrentUserId } from '@/lib/supabaseClient';
import type { Lead } from '@/types/lead';
import type { DealStage, CreateDealInput } from '@/types/deal';
import { toast } from 'sonner';

interface ConvertToDealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
}

const stageConfig = {
  contacted: { label: 'Contacted', probability: 20 },
  meeting_scheduled: { label: 'Meeting Scheduled', probability: 40 },
  proposal_sent: { label: 'Proposal Sent', probability: 60 },
  negotiation: { label: 'Negotiation', probability: 80 },
};

export default function ConvertToDealModal({ open, onOpenChange, lead }: ConvertToDealModalProps) {
  const createDealMutation = useCreateDeal();
  const [formData, setFormData] = useState({
    estimatedValue: '',
    stage: 'meeting_scheduled' as DealStage,
    expectedCloseDate: '',
    serviceType: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const userId = await getCurrentUserId();

      const dealInput: CreateDealInput = {
        leadId: lead.id,
        stage: formData.stage,
        dealValue: parseFloat(formData.estimatedValue),
        probability: stageConfig[formData.stage as keyof typeof stageConfig].probability,
        expectedCloseDate: formData.expectedCloseDate,
        serviceType: formData.serviceType,
        title: `${lead.businessName} - ${formData.serviceType}`,
      };

      createDealMutation.mutate(
        { input: dealInput, userId },
        {
          onSuccess: () => {
            toast.success('Lead converted to deal! View in CRM Pipeline.');
            onOpenChange(false);
            setFormData({
              estimatedValue: '',
              stage: 'meeting_scheduled',
              expectedCloseDate: '',
              serviceType: '',
            });
          },
          onError: () => {
            toast.error('Failed to convert lead');
          },
        }
      );
    } catch {
      toast.error('Failed to get user information');
    }
  };

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
              onChange={(e) => setFormData(prev => ({ ...prev, estimatedValue: e.target.value }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, expectedCloseDate: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage">Initial Stage *</Label>
            <Select
              value={formData.stage}
              onValueChange={(v) => setFormData(prev => ({ ...prev, stage: v as DealStage }))}
            >
              <SelectTrigger id="stage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="meeting_scheduled">Meeting Scheduled</SelectItem>
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
              onChange={(e) => setFormData(prev => ({ ...prev, serviceType: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add to Pipeline</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}