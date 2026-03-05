import type { Lead } from '../../types/lead';
import { getStatusLabel, getStatusColor, getWebsiteStatusBadge } from '../../types/lead';
import { Badge } from '../ui/badge';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { normalizeCategory } from '@/utils/categoryNormalizer';

interface LeadListProps {
  leads: Lead[];
  selectedLeadId: string | null;
  onSelectLead: (id: string) => void;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (column: string) => void;
}

export default function LeadList({ 
  leads, 
  selectedLeadId, 
  onSelectLead,
  sortColumn,
  sortDirection,
  onSort
}: LeadListProps) {
  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-gray-700" />
    ) : (
      <ChevronDown className="w-4 h-4 text-gray-700" />
    );
  };

  if (leads.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-500">No leads found. Try adjusting your filters or import new leads.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Desktop Table View */}
      <div className="overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onSort('business')}
              >
                <div className="flex items-center gap-2">
                  <span>Business</span>
                  {getSortIcon('business')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onSort('category')}
              >
                <div className="flex items-center gap-2">
                  <span>Category</span>
                  {getSortIcon('category')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onSort('neighborhood')}
              >
                <div className="flex items-center gap-2">
                  <span>Neighborhood</span>
                  {getSortIcon('neighborhood')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onSort('website')}
              >
                <div className="flex items-center gap-2">
                  <span>Website</span>
                  {getSortIcon('website')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onSort('status')}
              >
                <div className="flex items-center gap-2">
                  <span>Status</span>
                  {getSortIcon('status')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onSort('score')}
              >
                <div className="flex items-center gap-2">
                  <span>Score</span>
                  {getSortIcon('score')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {leads.map((lead) => (
              <tr
                key={lead.id}
                onClick={() => onSelectLead(lead.id)}
                className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedLeadId === lead.id ? 'bg-blue-50' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{lead.businessName}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{normalizeCategory(lead.category)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{lead.neighborhood || '—'}</td>
                <td className="px-4 py-3">
                  <Badge className={getWebsiteStatusBadge(lead.websiteStatus).color}>
                    {getWebsiteStatusBadge(lead.websiteStatus).label}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge className={getStatusColor(lead.outreachStatus)}>
                    {getStatusLabel(lead.outreachStatus)}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-12 h-2 rounded-full bg-gray-200 overflow-hidden`}>
                      <div
                        className={`h-full ${
                          lead.score >= 60
                            ? 'bg-red-500'
                            : lead.score >= 40
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${lead.score}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{lead.score}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
