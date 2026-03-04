import type { Lead } from '../../types/lead';
import { getStatusLabel, getStatusColor, getWebsiteStatusBadge } from '../../types/lead';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';

interface LeadListProps {
  leads: Lead[];
  selectedLeadId: string | null;
  onSelectLead: (id: string) => void;
}

export default function LeadList({ leads, selectedLeadId, onSelectLead }: LeadListProps) {
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
      <div className="hidden lg:block overflow-auto max-h-[calc(100vh-16rem)]">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Business
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Neighborhood
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Website
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Score
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Next Follow-up
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
                  <div className="font-medium text-gray-900">{lead.name}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{lead.category}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{lead.neighborhood}</td>
                <td className="px-4 py-3">
                  <Badge className={getWebsiteStatusBadge(lead.website_status).color}>
                    {getWebsiteStatusBadge(lead.website_status).label}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge className={getStatusColor(lead.status)}>
                    {getStatusLabel(lead.status)}
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
                <td className="px-4 py-3 text-sm text-gray-600">
                  {lead.next_follow_up_at ? (
                    <span
                      className={
                        new Date(lead.next_follow_up_at) <= new Date()
                          ? 'text-orange-600 font-medium'
                          : ''
                      }
                    >
                      {format(new Date(lead.next_follow_up_at), 'MMM d, yyyy')}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden divide-y divide-gray-200 max-h-[calc(100vh-16rem)] overflow-auto">
        {leads.map((lead) => (
          <div
            key={lead.id}
            onClick={() => onSelectLead(lead.id)}
            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
              selectedLeadId === lead.id ? 'bg-blue-50' : ''
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-gray-900">{lead.name}</h4>
              <Badge className={getStatusColor(lead.status)} variant="secondary">
                {getStatusLabel(lead.status)}
              </Badge>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <div>{lead.category} • {lead.neighborhood}</div>
              <div className="flex gap-2 items-center">
                <Badge className={getWebsiteStatusBadge(lead.website_status).color}>
                  {getWebsiteStatusBadge(lead.website_status).label}
                </Badge>
                <span>Score: {lead.score}</span>
              </div>
              {lead.next_follow_up_at && (
                <div
                  className={
                    new Date(lead.next_follow_up_at) <= new Date()
                      ? 'text-orange-600 font-medium'
                      : ''
                  }
                >
                  Follow-up: {format(new Date(lead.next_follow_up_at), 'MMM d, yyyy')}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
