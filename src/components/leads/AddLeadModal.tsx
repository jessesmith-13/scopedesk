import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import type { WebsiteStatus, CreateLeadInput } from '@/types/lead';
import { useCreateLead } from '@/hooks/useLeadQueries';
import { getCurrentUserId } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface AddLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddLeadModal({ open, onOpenChange }: AddLeadModalProps) {
  const createLeadMutation = useCreateLead();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    address: '',
    neighborhood: '',
    phone: '',
    website_url: '',
    website_status: 'unknown' as WebsiteStatus
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category || !formData.address) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const userId = await getCurrentUserId();

      const leadInput: CreateLeadInput = {
        businessName: formData.name,
        category: formData.category,
        addressLine1: formData.address,
        neighborhood: formData.neighborhood || null,
        phone: formData.phone || null,
        websiteUrl: formData.website_url || null,
        websiteStatus: formData.website_status,
        lat: 47.6062, // Seattle default coordinates
        lng: -122.3321,
        city: 'Seattle',
        state: 'WA',
        country: 'US',
        score: 0,
      };

      createLeadMutation.mutate({ input: leadInput, userId }, {
        onSuccess: () => {
          toast.success('Lead added successfully');
          setFormData({
            name: '',
            category: '',
            address: '',
            neighborhood: '',
            phone: '',
            website_url: '',
            website_status: 'unknown'
          });
          onOpenChange(false);
        },
        onError: () => {
          toast.error('Failed to add lead');
        },
      });
    } catch {
      toast.error('Failed to get user information');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Business Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Pike Place Market Flowers"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Florist"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="1234 Main St, Seattle, WA 98101"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="neighborhood">Neighborhood</Label>
            <Input
              id="neighborhood"
              value={formData.neighborhood}
              onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
              placeholder="Capitol Hill"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(206) 555-0123"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website URL</Label>
            <Input
              id="website"
              type="url"
              value={formData.website_url}
              onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
              placeholder="https://example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website-status">Website Status</Label>
            <Select
              value={formData.website_status}
              onValueChange={(value) =>
                setFormData({ ...formData, website_status: value as WebsiteStatus })
              }
            >
              <SelectTrigger id="website-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_website">No Website</SelectItem>
                <SelectItem value="has_website">Has Website</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}