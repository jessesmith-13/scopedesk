import { useState } from 'react';
import {
  fetchBusinesses,
  formatAddress,
  getBusinessCategory,
  getWebsiteStatus,
} from '@/api/overpass/overpass.api';
import { searchNearbyBusinesses } from '@/api/places';
import { getCurrentUserId } from '@/lib/supabaseClient';
import { useBulkCreateLeads } from '@/hooks/useLeadQueries';
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
import { Switch } from '@/components/ui/switch';
import LocationAutocompleteInput from './LocationAutocompleteInput';
import { normalizeCategory } from '@/utils/categoryNormalizer';
import { CATEGORY_GROUPS } from '@/config/categories';

interface ImportLeadsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImportLeadsModal({ open, onOpenChange }: ImportLeadsModalProps) {
  const bulkCreateMutation = useBulkCreateLeads();
  const [previewLeads, setPreviewLeads] = useState<Lead[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRequestInProgress, setIsRequestInProgress] = useState(false);
  
  // Form state
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [radius, setRadius] = useState(5);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterNoWebsite, setFilterNoWebsite] = useState(true);
  const [useGooglePlaces, setUseGooglePlaces] = useState(false);
  const [excludeLargeBusinesses, setExcludeLargeBusinesses] = useState(true);
  const [maxReviewCount, setMaxReviewCount] = useState(1000);

  // Stats from last search
  const [lastSearchStats, setLastSearchStats] = useState<{
    scanned: number;
    excluded: number;
    returned: number;
  } | null>(null);

  const handlePreview = async () => {
    if (!location) {
      toast.error('Please select a location first');
      return;
    }
    
    // CRITICAL: Prevent any duplicate calls
    if (isRequestInProgress) {
      console.warn('Request already in progress, ignoring duplicate call');
      return;
    }
    
    setIsRequestInProgress(true);
    setLoading(true);
    setNextPageToken(undefined);
    setCurrentPage(1);
    
    try {
      const userId = await getCurrentUserId();
      let leads: Lead[] = [];
      
      if (useGooglePlaces) {
        // Fetch directly from Google Places API via edge function
        toast.info('Fetching businesses from Google Places (page 1)...');
        
        // Convert miles to meters for Google API
        const radiusMeters = radius * 1609.34;
        
        const result = await searchNearbyBusinesses(
          { lat: location.lat, lng: location.lng },
          radiusMeters,
          filterNoWebsite,
          excludeLargeBusinesses,
          maxReviewCount,
          'distance',
          undefined,
          selectedCategory
        );

        // Store stats
        setLastSearchStats({
          scanned: result.scannedCount,
          excluded: (result.excludedByReviewsCount || 0) + (result.excludedByBlocklistCount || 0) + (result.excludedByTypeCount || 0),
          returned: result.returnedCount,
        });

        // Store next page token for "Load More" button
        setNextPageToken(result.nextPageToken);

        leads = result.businesses.map((business, index) => ({
          id: `google-${business.placeId || index}`,
          userId,
          businessName: business.name,
          category: normalizeCategory(business.types[0] || 'business'),
          subCategory: null,
          neighborhood: null,
          addressLine1: business.address,
          addressLine2: null,
          city: location.address.split(',')[0] || 'Seattle',
          state: 'WA',
          postalCode: null,
          country: 'US',
          lat: business.location.lat,
          lng: business.location.lng,
          phone: business.phone || null,
          websiteUrl: business.website || null,
          websiteStatus: business.website ? 'has_website' : 'no_website',
          outreachStatus: 'not_contacted' as const,
          rating: business.rating || null,
          reviewCount: business.reviewCount || null,
          score: business.website ? 0 : 30,
          scoreReason: null,
          source: 'google_places',
          sourcePlaceId: business.placeId,
          notes: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

      } else {
        // Fetch from Overpass API (OpenStreetMap)
        toast.info('Fetching businesses from OpenStreetMap...');
        
        const response = await fetchBusinesses({
          lat: location.lat,
          lng: location.lng,
          radiusMiles: radius,
          categories: selectedCategory === 'all' ? [] : [selectedCategory],
        });

        leads = response.elements
          .filter((node) => node.tags.name)
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
              rating: null,
              reviewCount: null,
              score: websiteStatus === 'none' ? 30 : websiteStatus === 'unknown' ? 10 : 0,
              scoreReason: null,
              source: 'overpass',
              sourcePlaceId: `osm-${node.id}`,
              notes: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
          });
      }
      
      // Filter by website status ONLY for Overpass results (Google Places handles this server-side)
      let filteredLeads = leads;
      if (!useGooglePlaces && filterNoWebsite) {
        filteredLeads = leads.filter(lead => lead.websiteStatus === 'no_website' || lead.websiteStatus === 'unknown');
      }
      
      setPreviewLeads(filteredLeads);
      setSelectedIds(new Set(filteredLeads.map(l => l.id)));
      
      toast.success(`Found ${filteredLeads.length} businesses${filterNoWebsite ? ' without websites' : ''}`);
    } catch (error) {
      console.error('Error fetching businesses:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch businesses');
    } finally {
      setLoading(false);
      setIsRequestInProgress(false);
    }
  };
  
  const handleLoadMore = async () => {
    if (!nextPageToken || !location || loadingMore || isRequestInProgress) {
      console.warn('Cannot load more:', { nextPageToken, location, loadingMore, isRequestInProgress });
      return;
    }
    
    setIsRequestInProgress(true);
    setLoadingMore(true);
    
    try {
      const userId = await getCurrentUserId();
      
      toast.info(`Fetching page ${currentPage + 1}...`);
      
      // Convert miles to meters for Google API
      const radiusMeters = radius * 1609.34;
      
      const result = await searchNearbyBusinesses(
        { lat: location.lat, lng: location.lng },
        radiusMeters,
        filterNoWebsite,
        excludeLargeBusinesses,
        maxReviewCount,
        'distance',
        undefined,
        selectedCategory,
        nextPageToken
      );

      // Update stats (add to existing)
      if (lastSearchStats) {
        setLastSearchStats({
          scanned: lastSearchStats.scanned + result.scannedCount,
          excluded: lastSearchStats.excluded + (result.excludedByReviewsCount || 0) + (result.excludedByBlocklistCount || 0) + (result.excludedByTypeCount || 0),
          returned: lastSearchStats.returned + result.returnedCount,
        });
      }

      // Update next page token
      setNextPageToken(result.nextPageToken);
      setCurrentPage(prev => prev + 1);

      const newLeads: Lead[] = result.businesses.map((business, index) => ({
        id: `google-${business.placeId || index}-p${currentPage + 1}`,
        userId,
        businessName: business.name,
        category: normalizeCategory(business.types[0] || 'business'),
        subCategory: null,
        neighborhood: null,
        addressLine1: business.address,
        addressLine2: null,
        city: location.address.split(',')[0] || 'Seattle',
        state: 'WA',
        postalCode: null,
        country: 'US',
        lat: business.location.lat,
        lng: business.location.lng,
        phone: business.phone || null,
        websiteUrl: business.website || null,
        websiteStatus: business.website ? 'has_website' : 'no_website',
        outreachStatus: 'not_contacted' as const,
        rating: business.rating || null,
        reviewCount: business.reviewCount || null,
        score: business.website ? 0 : 30,
        scoreReason: null,
        source: 'google_places',
        sourcePlaceId: business.placeId,
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      // No client-side filtering needed - Google Places edge function handles it
      // Append new leads to existing ones
      setPreviewLeads(prev => [...prev, ...newLeads]);
      
      // Auto-select the new leads
      setSelectedIds(prev => {
        const updated = new Set(prev);
        newLeads.forEach(lead => updated.add(lead.id));
        return updated;
      });
        
      toast.success(`Loaded ${newLeads.length} more businesses`);
      
    } catch (error) {
      console.error('Error loading more businesses:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load more businesses');
    } finally {
      setLoadingMore(false);
      setIsRequestInProgress(false);
    }
  };

  const handleImport = async () => {
    const selectedLeads = previewLeads.filter((lead) => selectedIds.has(lead.id));
    
    try {
      const leadInputs: CreateLeadInput[] = selectedLeads.map((lead) => ({
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
        rating: lead.rating,
        reviewCount: lead.reviewCount,
        score: lead.score,
        scoreReason: lead.scoreReason,
        source: lead.source,
        sourcePlaceId: lead.sourcePlaceId,
        notes: lead.notes
      }));
        
      const result = await bulkCreateMutation.mutateAsync(leadInputs);
      
      if (result.inserted) {
        toast.success(`Imported ${result.inserted} leads`);
      }
      
      setPreviewLeads([]);
      setSelectedIds(new Set());
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to import leads:', error);
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
      <DialogContent className="!max-w-[95vw] w-[95vw] max-h-[90vh] overflow-auto sm:!max-w-[1600px]" aria-describedby={undefined}>
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">Import Leads</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overpass" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="overpass">Overpass Import</TabsTrigger>
            <TabsTrigger value="csv">CSV Import</TabsTrigger>
          </TabsList>

          <TabsContent value="overpass" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium text-gray-700">Center Location</Label>
                <LocationAutocompleteInput
                  id="location"
                  value={location}
                  onChange={setLocation}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="radius" className="text-sm font-medium text-gray-700">Radius (miles)</Label>
                <Input 
                  id="radius" 
                  type="number" 
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  placeholder="5"
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="import-category" className="text-sm font-medium text-gray-700">Categories</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="import-category" className="w-full">
                  <SelectValue placeholder="Select categories" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_GROUPS.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Data Source</Label>
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">Use Google Places API</span>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                        Recommended
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      More comprehensive business data with ratings, reviews, and accurate contact info
                    </p>
                  </div>
                  <Switch
                    checked={useGooglePlaces}
                    onCheckedChange={setUseGooglePlaces}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <Checkbox 
                id="filter-no-website" 
                checked={filterNoWebsite}
                onCheckedChange={(checked) => setFilterNoWebsite(checked === true)}
              />
              <Label htmlFor="filter-no-website" className="text-sm font-medium text-gray-700 cursor-pointer">
                Only show businesses without websites
              </Label>
            </div>

            {useGooglePlaces && (
              <>
                <div className="flex items-center space-x-2 pt-1">
                  <Checkbox 
                    id="exclude-large" 
                    checked={excludeLargeBusinesses}
                    onCheckedChange={(checked) => setExcludeLargeBusinesses(checked === true)}
                  />
                  <Label htmlFor="exclude-large" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Exclude big chains / famous places
                  </Label>
                </div>

                {excludeLargeBusinesses && (
                  <div className="ml-6 space-y-1">
                    <Label htmlFor="max-reviews" className="text-sm text-gray-600">
                      Max reviews (smaller = more local)
                    </Label>
                    <Select 
                      value={maxReviewCount.toString()} 
                      onValueChange={(value) => setMaxReviewCount(parseInt(value))}
                    >
                      <SelectTrigger id="max-reviews" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="200">200 reviews (very small)</SelectItem>
                        <SelectItem value="500">500 reviews (small)</SelectItem>
                        <SelectItem value="1000">1000 reviews (medium)</SelectItem>
                        <SelectItem value="2000">2000 reviews (larger)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            <Button onClick={handlePreview} disabled={loading || isRequestInProgress} className="w-full h-11 text-base">
              {loading ? 'Searching...' : 'Preview Results'}
            </Button>

            {previewLeads.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2">
                  <div>
                    <h3 className="text-base font-semibold">
                      Preview ({selectedIds.size} of {previewLeads.length} selected)
                    </h3>
                    {useGooglePlaces && lastSearchStats && (
                      <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                        <p>
                          Scanned {lastSearchStats.scanned}, excluded {lastSearchStats.excluded}, returned {lastSearchStats.returned}
                        </p>
                        {nextPageToken && currentPage < 3 && (
                          <p className="text-xs text-gray-500">Page {currentPage} (more available)</p>
                        )}
                      </div>
                    )}
                    {useGooglePlaces && !lastSearchStats && nextPageToken && (
                      <p className="text-sm text-gray-600 mt-1">
                        Showing page {currentPage}{nextPageToken && currentPage < 3 ? ' (more available)' : ''}
                      </p>
                    )}
                  </div>
                  <Button onClick={handleImport} size="default" className="w-full sm:w-auto">
                    Import Selected
                  </Button>
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block border rounded-lg overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="p-4 text-left w-12">
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
                          <th className="p-4 text-left font-medium text-gray-700">Name</th>
                          <th className="p-4 text-left font-medium text-gray-700 w-32">Category</th>
                          <th className="p-4 text-left font-medium text-gray-700 max-w-xs">Address</th>
                          <th className="p-4 text-left font-medium text-gray-700 w-28">Website</th>
                          <th className="p-4 text-left font-medium text-gray-700 w-48 whitespace-nowrap">Phone</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {previewLeads.map((lead) => (
                          <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4">
                              <Checkbox
                                checked={selectedIds.has(lead.id)}
                                onCheckedChange={() => toggleSelection(lead.id)}
                              />
                            </td>
                            <td className="p-4 font-medium text-gray-900">{lead.businessName}</td>
                            <td className="p-4 text-gray-600">{normalizeCategory(lead.category)}</td>
                            <td className="p-4 text-gray-600 max-w-xs truncate">
                              {lead.addressLine1}, {lead.city}, {lead.state}
                            </td>
                            <td className="p-4">
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
                            <td className="p-4 text-gray-600 whitespace-nowrap">{lead.phone || '—'}</td>
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
                          <p className="text-sm text-gray-600 mt-1">{normalizeCategory(lead.category)}</p>
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
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                              No Website
                            </Badge>
                          ) : lead.websiteStatus === 'has_website' ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                              Has Website
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-600 text-xs">Unknown</Badge>
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
                
                {/* Load More Button - Only show for Google Places with pagination */}
                {useGooglePlaces && nextPageToken && currentPage < 3 && (
                  <div className="flex justify-center pt-6">
                    <Button
                      onClick={handleLoadMore}
                      disabled={loadingMore || isRequestInProgress}
                      variant="outline"
                      className="min-w-[200px]"
                    >
                      {loadingMore ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading Page {currentPage + 1}...
                        </>
                      ) : (
                        `Load More Results (Page ${currentPage + 1})`
                      )}
                    </Button>
                  </div>
                )}
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
