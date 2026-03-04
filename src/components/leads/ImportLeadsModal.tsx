import { useState } from 'react';
import {
  fetchBusinesses,
  formatAddress,
  getBusinessCategory,
  getWebsiteStatus,
} from '@/api/overpass/overpass.api';
import { getCurrentUserId } from '@/lib/supabaseClient';
import { useCreateLead } from '@/hooks/useLeadQueries';
import { toast } from 'sonner';
import type { Lead, CreateLeadInput } from '@/types/lead';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

// Predefined city coordinates
const CITY_COORDINATES: Record<string, { lat: number; lng: number; address: string }> = {
  'seattle': { lat: 47.6062, lng: -122.3321, address: 'Seattle, WA' },
  'portland': { lat: 45.5152, lng: -122.6784, address: 'Portland, OR' },
  'san-francisco': { lat: 37.7749, lng: -122.4194, address: 'San Francisco, CA' },
  'los-angeles': { lat: 34.0522, lng: -118.2437, address: 'Los Angeles, CA' },
  'new-york': { lat: 40.7128, lng: -74.0060, address: 'New York, NY' },
  'chicago': { lat: 41.8781, lng: -87.6298, address: 'Chicago, IL' },
  'austin': { lat: 30.2672, lng: -97.7431, address: 'Austin, TX' },
  'denver': { lat: 39.7392, lng: -104.9903, address: 'Denver, CO' },
  'miami': { lat: 25.7617, lng: -80.1918, address: 'Miami, FL' },
  'boston': { lat: 42.3601, lng: -71.0589, address: 'Boston, MA' },
};

interface ImportLeadsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImportLeadsModal({ open, onOpenChange }: ImportLeadsModalProps) {
  const createLeadMutation = useCreateLead();
  const [previewLeads, setPreviewLeads] = useState<Lead[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [radius, setRadius] = useState(5);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterNoWebsite, setFilterNoWebsite] = useState(true);

  const handlePreview = async () => {
    if (!location) {
      toast.error('Please select a location first');
      return;
    }

    setLoading(true);
    
    try {
      const userId = await getCurrentUserId();
      
      // Fetch from Overpass API
      const response = await fetchBusinesses({
        lat: location.lat,
        lng: location.lng,
        radiusMiles: radius,
        categories: selectedCategory === 'all' ? [] : [selectedCategory],
      });

      // Convert Overpass nodes to Lead objects
      let leads: Lead[] = response.elements
        .filter((node) => node.tags.name) // Must have a name
        .map((node) => {
          const websiteStatus = getWebsiteStatus(node);
          const category = getBusinessCategory(node);
          const addressStr = formatAddress(node);

          return {
            id: `osm-${node.id}`,
            userId,
            businessName: node.tags.name!,
            category,
            subCategory: null,
            neighborhood: node.tags['addr:city'] || node.tags['addr:neighbourhood'] || null,
            addressLine1: addressStr,
            addressLine2: null,
            city: node.tags['addr:city'] || 'Seattle',
            state: node.tags['addr:state'] || 'WA',
            postalCode: node.tags['addr:postcode'] || null,
            country: 'US',
            lat: node.lat,
            lng: node.lon,
            phone: node.tags.phone || node.tags['contact:phone'] || null,
            websiteUrl: node.tags.website || node.tags['contact:website'] || null,
            websiteStatus: websiteStatus === 'none' ? 'no_website' : websiteStatus === 'has' ? 'has_website' : 'unknown',
            outreachStatus: 'not_contacted' as const,
            score: websiteStatus === 'none' ? 30 : websiteStatus === 'unknown' ? 10 : 0,
            scoreReason: null,
            source: 'overpass',
            sourcePlaceId: `osm-${node.id}`,
            notes: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        });

      // Filter by website status if enabled
      if (filterNoWebsite) {
        leads = leads.filter((lead) => lead.websiteStatus === 'no_website' || lead.websiteStatus === 'unknown');
      }

      setPreviewLeads(leads);
      setSelectedIds(new Set(leads.map((l) => l.id)));
      
      if (leads.length === 0) {
        toast.info('No businesses found. Try increasing the radius or changing filters.');
      } else {
        toast.success(`Found ${leads.length} businesses`);
      }
    } catch (error) {
      console.error('Error fetching from Overpass:', error);
      toast.error('Failed to fetch businesses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    const selectedLeads = previewLeads.filter((lead) => selectedIds.has(lead.id));
    
    try {
      const userId = await getCurrentUserId();
      
      for (const lead of selectedLeads) {
        const leadInput: CreateLeadInput = {
          businessName: lead.businessName,
          category: lead.category,
          subCategory: lead.subCategory,
          neighborhood: lead.neighborhood,
          addressLine1: lead.addressLine1,
          addressLine2: lead.addressLine2,
          city: lead.city,
          state: lead.state,
          postalCode: lead.postalCode,
          country: lead.country,
          lat: lead.lat,
          lng: lead.lng,
          phone: lead.phone,
          websiteUrl: lead.websiteUrl,
          websiteStatus: lead.websiteStatus,
          outreachStatus: lead.outreachStatus,
          score: lead.score,
          scoreReason: lead.scoreReason,
          source: lead.source,
          sourcePlaceId: lead.sourcePlaceId,
          notes: lead.notes
        };
        
        createLeadMutation.mutate({ input: leadInput, userId });
      }
      
      toast.success(`Imported ${selectedLeads.length} leads`);
      setPreviewLeads([]);
      setSelectedIds(new Set());
      onOpenChange(false);
    } catch {
      toast.error('Failed to import leads');
    }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Import Leads</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overpass">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overpass">Overpass Import</TabsTrigger>
            <TabsTrigger value="csv">CSV Import</TabsTrigger>
          </TabsList>

          <TabsContent value="overpass" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Center Location</Label>
                <Select value={location?.address || 'seattle'} onValueChange={(value) => {
                  const coord = CITY_COORDINATES[value];
                  if (coord) {
                    setLocation(coord);
                  }
                }}>
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CITY_COORDINATES).map(([key, coord]) => (
                      <SelectItem key={key} value={key}>
                        {coord.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="radius">Radius (miles)</Label>
                <Input 
                  id="radius" 
                  type="number" 
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  placeholder="5" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="import-category">Categories</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="import-category">
                  <SelectValue placeholder="Select categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="restaurants">Restaurants</SelectItem>
                  <SelectItem value="salons">Salons & Spas</SelectItem>
                  <SelectItem value="contractors">Contractors</SelectItem>
                  <SelectItem value="dental">Dental</SelectItem>
                  <SelectItem value="fitness">Fitness</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Website Filter</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="filter-no-website" 
                    checked={filterNoWebsite}
                    onCheckedChange={(checked) => setFilterNoWebsite(checked as boolean)}
                  />
                  <label htmlFor="filter-no-website" className="text-sm cursor-pointer">
                    Only businesses without websites
                  </label>
                </div>
              </div>
            </div>

            <Button onClick={handlePreview} disabled={loading} className="w-full">
              {loading ? 'Searching...' : 'Preview Results'}
            </Button>

            {previewLeads.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h3 className="font-semibold">
                    Preview ({selectedIds.size} of {previewLeads.length} selected)
                  </h3>
                  <Button onClick={handleImport} size="sm" className="w-full sm:w-auto">
                    Import Selected
                  </Button>
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="p-3 text-left w-12">
                            <Checkbox
                              checked={selectedIds.size === previewLeads.length}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedIds(new Set(previewLeads.map((l) => l.id)));
                                } else {
                                  setSelectedIds(new Set());
                                }
                              }}
                            />
                          </th>
                          <th className="p-3 text-left font-medium">Name</th>
                          <th className="p-3 text-left font-medium w-32">Category</th>
                          <th className="p-3 text-left font-medium">Address</th>
                          <th className="p-3 text-left font-medium w-24">Website</th>
                          <th className="p-3 text-left font-medium w-32">Phone</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {previewLeads.map((lead) => (
                          <tr key={lead.id} className="hover:bg-gray-50">
                            <td className="p-3">
                              <Checkbox
                                checked={selectedIds.has(lead.id)}
                                onCheckedChange={() => toggleSelection(lead.id)}
                              />
                            </td>
                            <td className="p-3 font-medium">{lead.businessName}</td>
                            <td className="p-3 text-gray-600">{lead.category}</td>
                            <td className="p-3 text-gray-600">
                              {lead.addressLine1}, {lead.city}, {lead.state}
                            </td>
                            <td className="p-3">
                              {lead.websiteStatus === 'no_website' ? (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  No
                                </Badge>
                              ) : lead.websiteStatus === 'has_website' ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Yes
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-50 text-gray-600">Unknown</Badge>
                              )}
                            </td>
                            <td className="p-3 text-gray-600">{lead.phone || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <Checkbox
                      checked={selectedIds.size === previewLeads.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedIds(new Set(previewLeads.map((l) => l.id)));
                        } else {
                          setSelectedIds(new Set());
                        }
                      }}
                    />
                    <span className="text-sm font-medium ml-3">Select All</span>
                  </div>
                  {previewLeads.map((lead) => (
                    <div key={lead.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedIds.has(lead.id)}
                          onCheckedChange={() => toggleSelection(lead.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base">{lead.businessName}</h4>
                          <p className="text-sm text-gray-600 mt-1">{lead.category}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm pl-8">
                        <div>
                          <span className="text-gray-500">Address:</span>
                          <p className="text-gray-900 mt-0.5">
                            {lead.addressLine1}<br />
                            {lead.city}, {lead.state}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Website:</span>
                          {lead.websiteStatus === 'no_website' ? (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              No
                            </Badge>
                          ) : lead.websiteStatus === 'has_website' ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-600">Unknown</Badge>
                          )}
                        </div>
                        
                        {lead.phone && (
                          <div>
                            <span className="text-gray-500">Phone:</span>
                            <p className="text-gray-900 mt-0.5">{lead.phone}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="csv" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv-upload">Upload CSV File</Label>
              <Input id="csv-upload" type="file" accept=".csv" />
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium mb-2 text-sm">CSV Format Requirements</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Columns: name, category, address, phone, website, notes</li>
                <li>• First row should be headers</li>
                <li>• Use comma as delimiter</li>
              </ul>
            </div>

            <Button className="w-full" disabled>
              Upload & Preview
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}