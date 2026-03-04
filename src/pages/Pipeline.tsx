import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Search, LayoutGrid, List, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useDeals, useMoveDealStage, useCreateDeal } from '@/hooks/useDealQueries';
import { useLeads } from '@/hooks/useLeadQueries';
import { useDealUIStore } from '@/stores/dealUIStore';
import type { DealWithRelations, DealStage } from '@/types/deal';
import { toast } from 'sonner';

const stageConfig: Record<DealStage, { label: string; color: string; probability: number }> = {
  contacted: { label: 'Contacted', color: 'bg-blue-100 text-blue-700', probability: 20 },
  meeting_scheduled: { label: 'Meeting Scheduled', color: 'bg-purple-100 text-purple-700', probability: 40 },
  proposal_sent: { label: 'Proposal Sent', color: 'bg-yellow-100 text-yellow-700', probability: 60 },
  negotiation: { label: 'Negotiation', color: 'bg-orange-100 text-orange-700', probability: 80 },
  won: { label: 'Won', color: 'bg-green-100 text-green-700', probability: 100 },
  lost: { label: 'Lost', color: 'bg-red-100 text-red-700', probability: 0 },
};

interface DealCardProps {
  deal: DealWithRelations;
}

function DealCard({ deal }: DealCardProps) {
  const [{ isDragging }, drag] = useDrag<
    { id: string; stage: DealStage },
    unknown,
    { isDragging: boolean }
  >(() => ({
    type: 'deal',
    item: { id: deal.id, stage: deal.stage },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const daysInStage = Math.floor(
    (new Date().getTime() - new Date(deal.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div
      ref={drag as unknown as React.LegacyRef<HTMLDivElement>}
      className={`bg-white border border-gray-200 rounded-lg p-4 cursor-move hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-sm text-gray-900 mb-1">{deal.lead?.businessName || deal.title || 'Untitled'}</h3>
          <p className="text-xs text-gray-500">{deal.contact?.fullName || 'No contact'}</p>
        </div>

        {deal.lead?.category && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {deal.lead.category}
            </Badge>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-green-600">${(deal.dealValue || 0).toLocaleString()}</span>
          <span className="text-xs text-gray-500">{deal.probability}% likely</span>
        </div>

        <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-100">
          <div>Last activity: {format(new Date(deal.updatedAt), 'MMM d')}</div>
          {deal.nextFollowUpAt && (
            <div className="text-orange-600 font-medium">
              Follow-up: {format(new Date(deal.nextFollowUpAt), 'MMM d')}
            </div>
          )}
          <div className="text-gray-400">{daysInStage}d in stage</div>
        </div>
      </div>
    </div>
  );
}

interface PipelineColumnProps {
  stage: DealStage;
  deals: DealWithRelations[];
  onDrop: (dealId: string, newStage: DealStage) => void;
}

function PipelineColumn({ stage, deals, onDrop }: PipelineColumnProps) {
  const [{ isOver }, drop] = useDrop<
    { id: string; stage: DealStage },
    unknown,
    { isOver: boolean }
  >(() => ({
    accept: 'deal',
    drop: (item: { id: string; stage: DealStage }) => {
      if (item.stage !== stage) {
        onDrop(item.id, stage);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const config = stageConfig[stage];
  const totalValue = deals.reduce((sum: number, deal: DealWithRelations) => sum + (deal.dealValue || 0), 0);
  const avgDays = deals.length > 0
    ? Math.floor(
        deals.reduce((sum: number, deal: DealWithRelations) => {
          return sum + Math.floor(
            (new Date().getTime() - new Date(deal.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
          );
        }, 0) / deals.length
      )
    : 0;

  return (
    <div className="flex-shrink-0 w-80">
      <div className="bg-gray-50 rounded-lg p-4 h-full min-h-[600px]">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm text-gray-900">{config.label}</h3>
            <Badge className={config.color}>{deals.length}</Badge>
          </div>
          <p className="text-xs text-gray-500">
            {deals.length} deals · ${totalValue.toLocaleString()}
            {avgDays > 0 && ` · Avg age: ${avgDays}d`}
          </p>
        </div>

        <div
          ref={drop as unknown as React.LegacyRef<HTMLDivElement>}
          className={`space-y-3 min-h-[200px] ${isOver ? 'bg-blue-50 rounded-lg p-2' : ''}`}
        >
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      </div>
    </div>
  );
}

function NewDealModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: leads = [] } = useLeads();
  const createDealMutation = useCreateDeal();
  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    estimatedValue: '',
    stage: 'meeting_scheduled' as DealStage,
    expectedCloseDate: '',
    serviceType: '',
    leadId: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const userId = 'mock-user-id'; // TODO: Get from auth context
    
    createDealMutation.mutate({
      input: {
        leadId: formData.leadId,
        stage: formData.stage,
        dealValue: parseFloat(formData.estimatedValue),
        probability: stageConfig[formData.stage].probability,
        expectedCloseDate: formData.expectedCloseDate,
        serviceType: formData.serviceType,
        title: `${formData.businessName} - ${formData.serviceType}`,
      },
      userId,
    }, {
      onSuccess: () => {
        toast.success('Deal added to pipeline!');
        onOpenChange(false);
        setFormData({
          businessName: '',
          contactName: '',
          estimatedValue: '',
          stage: 'meeting_scheduled',
          expectedCloseDate: '',
          serviceType: '',
          leadId: '',
        });
      },
      onError: () => {
        toast.error('Failed to create deal');
      },
    });
  };

  const handleLeadSelect = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setFormData(prev => ({
        ...prev,
        leadId,
        businessName: lead.businessName,
        contactName: '',
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Deal to Pipeline</DialogTitle>
          <DialogDescription>
            Create a new revenue opportunity. Link to an existing lead or create manually.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lead">Link to Existing Lead (Optional)</Label>
            <Select value={formData.leadId} onValueChange={handleLeadSelect}>
              <SelectTrigger id="lead">
                <SelectValue placeholder="Select a lead or create manually" />
              </SelectTrigger>
              <SelectContent>
                {leads
                  .filter(l => ['interested', 'follow_up'].includes(l.outreachStatus))
                  .map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.businessName} - {lead.category || 'No category'}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                required
                value={formData.businessName}
                onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name *</Label>
              <Input
                id="contactName"
                required
                value={formData.contactName}
                onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stage">Initial Stage *</Label>
              <Select value={formData.stage} onValueChange={(v) => setFormData(prev => ({ ...prev, stage: v as DealStage }))}>
                <SelectTrigger id="stage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
                placeholder="e.g., Website Redesign, SEO"
                value={formData.serviceType}
                onChange={(e) => setFormData(prev => ({ ...prev, serviceType: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Deal</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Pipeline() {
  // Server state from React Query
  const { data: deals = [] } = useDeals();
  const moveDealStageMutation = useMoveDealStage();
  
  // UI state from Zustand
  const { viewMode, setViewMode, searchQuery, setSearchQuery, newDealModalOpen, setNewDealModalOpen } = useDealUIStore();

  const handleDrop = (dealId: string, newStage: DealStage) => {
    moveDealStageMutation.mutate(
      { id: dealId, stage: newStage },
      {
        onSuccess: () => {
          // Show contextual toast based on stage
          if (newStage === 'won') {
            toast.success('Deal won! 🎉 Ready to generate invoice?');
          } else if (newStage === 'lost') {
            toast.info('Deal marked as lost. Add a reason in deal details.');
          } else if (newStage === 'proposal_sent') {
            toast.info('Moved to Proposal Sent. Link a proposal?');
          } else {
            toast.success('Deal stage updated!');
          }
        },
      }
    );
  };

  const filteredDeals = deals.filter((deal: DealWithRelations) => {
    const businessName = deal.lead?.businessName || deal.title || '';
    const contactName = deal.contact?.fullName || '';
    return businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           contactName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const dealsByStage: Record<DealStage, DealWithRelations[]> = {
    contacted: filteredDeals.filter((d: DealWithRelations) => d.stage === 'contacted'),
    meeting_scheduled: filteredDeals.filter((d: DealWithRelations) => d.stage === 'meeting_scheduled'),
    proposal_sent: filteredDeals.filter((d: DealWithRelations) => d.stage === 'proposal_sent'),
    negotiation: filteredDeals.filter((d: DealWithRelations) => d.stage === 'negotiation'),
    won: filteredDeals.filter((d: DealWithRelations) => d.stage === 'won'),
    lost: filteredDeals.filter((d: DealWithRelations) => d.stage === 'lost'),
  };

  const activeDeals = deals.filter((d: DealWithRelations) => !['won', 'lost'].includes(d.stage));
  const totalPipelineValue = activeDeals.reduce((sum: number, deal: DealWithRelations) => sum + (deal.dealValue || 0), 0);
  const weightedPipelineValue = activeDeals.reduce((sum: number, deal: DealWithRelations) => sum + ((deal.dealValue || 0) * deal.probability / 100), 0);
  const wonDeals = deals.filter((d: DealWithRelations) => d.stage === 'won');
  const wonThisMonth = wonDeals
    .filter((d: DealWithRelations) => d.wonAt && new Date(d.wonAt).getMonth() === 2)
    .reduce((sum: number, d: DealWithRelations) => sum + (d.dealValue || 0), 0);
  const lostDeals = deals.filter((d: DealWithRelations) => d.stage === 'lost');
  const winRate = wonDeals.length + lostDeals.length > 0
    ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100)
    : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Description */}
        <p className="text-sm text-gray-600">
          Track revenue-qualified opportunities and move deals through your sales process.
        </p>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-500">This Month</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              ${wonThisMonth.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400 mt-1">Closed revenue</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Active Deals</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{activeDeals.length}</div>
            <div className="text-xs text-gray-400 mt-1">In pipeline</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Pipeline Value</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              ${totalPipelineValue.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              ${Math.round(weightedPipelineValue).toLocaleString()} weighted
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Win Rate</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{winRate}%</div>
            <div className="text-xs text-gray-400 mt-1">
              {wonDeals.length}W / {lostDeals.length}L
            </div>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search deals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex border border-gray-200 rounded-lg">
              <Button
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            <Button size="sm" onClick={() => setNewDealModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Deal
            </Button>
          </div>
        </div>

        {/* Pipeline View */}
        {viewMode === 'kanban' ? (
          <DndProvider backend={HTML5Backend}>
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                {(Object.keys(stageConfig) as DealStage[]).map((stage) => (
                  <PipelineColumn
                    key={stage}
                    stage={stage}
                    deals={dealsByStage[stage]}
                    onDrop={handleDrop}
                  />
                ))}
              </div>
            </div>
          </DndProvider>
        ) : (
          <Card className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Business</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Stage</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Value</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Probability</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Close Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDeals.map((deal: DealWithRelations) => (
                    <tr key={deal.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900">{deal.lead?.businessName || deal.title || 'Untitled'}</div>
                        <div className="text-xs text-gray-500">{deal.serviceType || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{deal.contact?.fullName || 'No contact'}</td>
                      <td className="px-4 py-3 text-sm">
                        <Badge className={stageConfig[deal.stage].color}>
                          {stageConfig[deal.stage].label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">
                        ${(deal.dealValue || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{deal.probability}%</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {deal.expectedCloseDate ? format(new Date(deal.expectedCloseDate), 'MMM d, yyyy') : 'No date'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <NewDealModal open={newDealModalOpen} onOpenChange={setNewDealModalOpen} />
    </AppLayout>
  );
}