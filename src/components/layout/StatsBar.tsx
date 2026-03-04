import type { Lead } from '@/types/lead';

interface StatsBarProps {
  leads: Lead[];
  onFilterByStatus: (status: string | null) => void;
  activeFilter: string | null;
}

export default function StatsBar({ leads, onFilterByStatus, activeFilter }: StatsBarProps) {
  const stats = {
    total: leads.length,
    not_contacted: leads.filter((l) => l.outreachStatus === 'not_contacted').length,
    contacted: leads.filter((l) => l.outreachStatus === 'contacted').length,
    follow_up_due: leads.filter((l) => l.outreachStatus === 'follow_up').length,
    interested: leads.filter((l) => l.outreachStatus === 'interested').length,
    rejected: leads.filter((l) => l.outreachStatus === 'rejected').length
  };

  const statItems = [
    { label: 'Total', value: stats.total, filter: null, color: 'bg-gray-100 text-gray-800 hover:bg-gray-200' },
    { label: 'Not Contacted', value: stats.not_contacted, filter: 'not_contacted', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
    { label: 'Contacted', value: stats.contacted, filter: 'contacted', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
    { label: 'Follow-up Due', value: stats.follow_up_due, filter: 'follow_up_due', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
    { label: 'Interested', value: stats.interested, filter: 'interested', color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
    { label: 'Rejected', value: stats.rejected, filter: 'rejected', color: 'bg-red-100 text-red-700 hover:bg-red-200' }
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {statItems.map((item) => (
        <button
          key={item.label}
          onClick={() => onFilterByStatus(item.filter)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeFilter === item.filter
              ? 'ring-2 ring-offset-1 ring-blue-500'
              : ''
          } ${item.color}`}
        >
          {item.label} <span className="font-bold ml-1">{item.value}</span>
        </button>
      ))}
    </div>
  );
}