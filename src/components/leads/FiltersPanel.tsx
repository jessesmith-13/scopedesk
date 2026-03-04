import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import LocationAutocomplete from './LocationAutocomplete';

interface FiltersPanelProps {
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  websiteFilter: string;
  setWebsiteFilter: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
}

export default function FiltersPanel({
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  websiteFilter,
  setWebsiteFilter,
  sortBy,
  setSortBy
}: FiltersPanelProps) {
  const categories = [
    'All Categories',
    'Florist',
    'Cafe',
    'Hardware Store',
    'Fitness',
    'Dental',
    'Auto Service',
    'Bakery',
    'Recreation',
    'Pet Services',
    'Restaurant',
    'Retail',
    'Contractor'
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <h3 className="font-semibold text-sm text-gray-900">Filters</h3>

      <div className="space-y-2">
        <Label htmlFor="status-filter" className="text-sm">Status</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger id="status-filter">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="not_contacted">Not Contacted</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="follow_up_1">Follow-up 1</SelectItem>
            <SelectItem value="follow_up_2">Follow-up 2</SelectItem>
            <SelectItem value="interested">Interested</SelectItem>
            <SelectItem value="meeting_scheduled">Meeting Scheduled</SelectItem>
            <SelectItem value="won">Won</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="do_not_contact">Do Not Contact</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category-filter" className="text-sm">Category</Label>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger id="category-filter">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Website Status</Label>
        <RadioGroup value={websiteFilter} onValueChange={setWebsiteFilter}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="website-all" />
            <Label htmlFor="website-all" className="font-normal cursor-pointer">Any</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="none" id="website-none" />
            <Label htmlFor="website-none" className="font-normal cursor-pointer">No website</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="has" id="website-has" />
            <Label htmlFor="website-has" className="font-normal cursor-pointer">Has website</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="unknown" id="website-unknown" />
            <Label htmlFor="website-unknown" className="font-normal cursor-pointer">Unknown</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sort-by" className="text-sm">Sort By</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger id="sort-by">
            <SelectValue placeholder="Score (High to Low)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="score">Score (High to Low)</SelectItem>
            <SelectItem value="distance">Distance</SelectItem>
            <SelectItem value="last_contacted">Last Contacted</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="pt-2 border-t">
        <Label htmlFor="center-location" className="text-sm">Center Location</Label>
        <LocationAutocomplete
          id="center-location"
          defaultValue="Seattle, WA"
          className="mt-2"
          placeholder="City, State or ZIP"
          onLocationChange={(location) => {
            console.log('Location selected:', location);
            // TODO: Use location.lat and location.lng for filtering leads
          }}
        />
        <div className="mt-2">
          <Label htmlFor="radius" className="text-sm">Radius (miles)</Label>
          <Input
            id="radius"
            type="number"
            defaultValue="10"
            className="mt-2"
            placeholder="10"
          />
        </div>
      </div>
    </div>
  );
}
