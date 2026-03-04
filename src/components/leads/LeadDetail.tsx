import { Copy, ExternalLink, MapPin, Phone, Globe, Calendar as CalendarIcon, Info, TrendingUp } from 'lucide-react';
import { useUpdateLead } from '@/hooks/useLeadQueries';
import { useDeals } from '@/hooks/useDealQueries';
import { addDays } from 'date-fns';
import { useState } from 'react';
import { toast } from 'sonner';
import type { Lead, LeadOutreachStatus } from '@/types/lead';
import { getStatusLabel, getStatusColor } from '@/types/lead';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import ConvertToDealModal from './ConvertToDealModal';

interface LeadDetailProps {
  lead: Lead;
}

export default function LeadDetail({ lead }: LeadDetailProps) {
  // Mutations from React Query
  const updateLeadMutation = useUpdateLead();
  
  // Get deals to check if this lead has a deal
  const { data: deals = [] } = useDeals();
  const existingDeal = deals.find(deal => deal.leadId === lead.id);
  
  const [noteText, setNoteText] = useState('');
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(undefined);
  const [convertModalOpen, setConvertModalOpen] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleAddNote = () => {
    if (!noteText.trim()) {
      toast.error('Please add a note');
      return;
    }
    
    // Update lead notes by appending to existing notes
    const updatedNotes = lead.notes ? `${lead.notes}\n\n[${new Date().toLocaleString()}]\n${noteText}` : `[${new Date().toLocaleString()}]\n${noteText}`;
    
    updateLeadMutation.mutate(
      { id: lead.id, updates: { notes: updatedNotes } },
      {
        onSuccess: () => {
          setNoteText('');
          toast.success('Note added');
        },
      }
    );
  };

  const handleSetFollowUp = (days?: number) => {
    const date = days ? addDays(new Date(), days) : followUpDate;
    if (!date) {
      toast.error('Please select a date');
      return;
    }
    updateLeadMutation.mutate(
      { id: lead.id, updates: { /* nextFollowUpAt will be added once DB supports it */ } },
      {
        onSuccess: () => {
          toast.success('Follow-up scheduled');
        },
      }
    );
  };

  const handleStatusChange = (status: LeadOutreachStatus) => {
    updateLeadMutation.mutate(
      { id: lead.id, updates: { outreachStatus: status } },
      {
        onSuccess: () => {
          toast.success('Status updated');
        },
      }
    );
  };

  // Format address for display
  const fullAddress = [lead.addressLine1, lead.addressLine2, lead.city, lead.state, lead.postalCode]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-auto max-h-[calc(100vh-10rem)]">
      <div className="p-6 space-y-6">
        {/* Business Info */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{lead.businessName}</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline">{lead.category}</Badge>
              <Badge className={getStatusColor(lead.outreachStatus)}>
                {getStatusLabel(lead.outreachStatus)}
              </Badge>
            </div>

            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{fullAddress}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => copyToClipboard(fullAddress, 'Address')}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>

            {lead.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{lead.phone}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(lead.phone!, 'Phone')}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            )}

            {lead.websiteUrl ? (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4" />
                <a
                  href={lead.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {lead.websiteUrl}
                </a>
                <a
                  href={lead.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Open
                  </Button>
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Globe className="w-4 h-4" />
                <span>No website</span>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{lead.neighborhood}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                Score: <span className="font-semibold text-gray-900">{lead.score}</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="inline-flex">
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        <strong>Scoring:</strong><br />
                        +30 if no website<br />
                        +15 if needs quote form<br />
                        +10 if not mobile-friendly<br />
                        +10 if no clear CTA<br />
                        +10 if no booking system<br />
                        -10 if rejected/do not contact
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Outreach Workflow */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Outreach Workflow</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="status-select">Status</Label>
                <Select
                  value={lead.outreachStatus}
                  onValueChange={(value) => handleStatusChange(value as LeadOutreachStatus)}
                >
                  <SelectTrigger id="status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_contacted">Not Contacted</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                    <SelectItem value="interested">Interested</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Set Follow-up
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3 border-b">
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => handleSetFollowUp(1)}>
                        Tomorrow
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleSetFollowUp(3)}>
                        3 Days
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleSetFollowUp(7)}>
                        1 Week
                      </Button>
                    </div>
                  </div>
                  <Calendar
                    mode="single"
                    selected={followUpDate}
                    onSelect={setFollowUpDate}
                  />
                  <div className="p-3 border-t">
                    <Button size="sm" className="w-full" onClick={() => handleSetFollowUp()}>
                      Confirm
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('interested')}
              >
                Mark Interested
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('rejected')}
              >
                Mark Rejected
              </Button>
            </div>

            {!existingDeal && lead.outreachStatus === 'interested' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-sm text-blue-900">Ready to Convert?</span>
                    </div>
                    <p className="text-xs text-blue-700">
                      This lead is interested! Add to CRM Pipeline to track deal value and close date.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setConvertModalOpen(true)}
                    className="flex-shrink-0"
                  >
                    Convert to Deal
                  </Button>
                </div>
              </div>
            )}

            {existingDeal && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-900">
                    ✓ In CRM Pipeline - <span className="font-medium">${existingDeal.dealValue?.toLocaleString() ?? '0'}</span> deal
                  </span>
                </div>
              </div>
            )}

            {/* TODO: Add nextFollowUpAt field to Lead type once DB schema is updated */}
            {/* {lead.nextFollowUpAt && (
              <div className="text-sm text-gray-600">
                Next follow-up:{' '}
                <span className="font-medium">
                  {format(new Date(lead.nextFollowUpAt), 'MMMM d, yyyy')}
                </span>
              </div>
            )} */}
          </div>
        </div>

        <Separator />

        {/* Notes */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Notes</h3>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Textarea
                placeholder="Add note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddNote} size="sm" variant="outline">
                Add Note
              </Button>
            </div>

            {lead.notes && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{lead.notes}</pre>
              </div>
            )}
            {!lead.notes && (
              <p className="text-sm text-gray-500 italic">No notes yet</p>
            )}
          </div>
        </div>

        {/* Convert Modal */}
        <ConvertToDealModal
          open={convertModalOpen}
          onOpenChange={setConvertModalOpen}
          lead={lead}
        />
      </div>
    </div>
  );
}