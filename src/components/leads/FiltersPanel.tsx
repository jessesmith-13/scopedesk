import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { CATEGORY_GROUPS } from '@/config/categories';

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
}: FiltersPanelProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="status-filter" className="text-xs text-gray-600 mb-1 block">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="status-filter" className="h-9">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="not_contacted">Not Contacted</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="follow_up">Follow Up</SelectItem>
              <SelectItem value="interested">Interested</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="category-filter" className="text-xs text-gray-600 mb-1 block">Category</Label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger id="category-filter" className="h-9">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_GROUPS.map((cat) => (
                <SelectItem key={cat.value} value={cat.label}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="website-filter" className="text-xs text-gray-600 mb-1 block">Website</Label>
          <Select value={websiteFilter} onValueChange={setWebsiteFilter}>
            <SelectTrigger id="website-filter" className="h-9">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any</SelectItem>
              <SelectItem value="no_website">No Website</SelectItem>
              <SelectItem value="has_website">Has Website</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
