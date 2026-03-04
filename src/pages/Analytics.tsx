import { useLeads } from '@/hooks/useLeadQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import AppLayout from '@/components/layout/AppLayout';
import { getStatusLabel, type LeadOutreachStatus } from '@/types/lead';

export default function Analytics() {
  const { data: leads = [] } = useLeads();

  // Calculate funnel data
  const funnelData = [
    { stage: 'Not Contacted', count: leads.filter((l) => l.outreachStatus === 'not_contacted').length },
    { stage: 'Contacted', count: leads.filter((l) => l.outreachStatus === 'contacted').length },
    {
      stage: 'Follow-up',
      count: leads.filter((l) => l.outreachStatus === 'follow_up').length
    },
    {
      stage: 'Interested',
      count: leads.filter((l) => l.outreachStatus === 'interested').length
    },
    { stage: 'Rejected', count: leads.filter((l) => l.outreachStatus === 'rejected').length }
  ];

  // Calculate category breakdown for interested leads
  const categoryInterested: Record<string, number> = {};
  leads
    .filter((l) => l.outreachStatus === 'interested')
    .forEach((lead) => {
      if (lead.category) {
        categoryInterested[lead.category] = (categoryInterested[lead.category] || 0) + 1;
      }
    });

  const categoryData = Object.entries(categoryInterested).map(([category, count]) => ({
    category,
    count
  }));

  // Calculate follow-ups needed (leads in follow_up status)
  const followUpsNeeded = leads.filter((l) => l.outreachStatus === 'follow_up').length;

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-gray-900">{leads.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Follow-ups Needed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-orange-600">{followUpsNeeded}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Deals Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-red-600">
                {leads.filter((l) => l.outreachStatus === 'rejected').length}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Pipeline Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {categoryData.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Interested Leads by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count">
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Interested Leads by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No interested leads recorded yet
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                'not_contacted',
                'contacted',
                'follow_up',
                'interested',
                'rejected'
              ].map((status) => {
                const count = leads.filter((l) => l.outreachStatus === status).length;
                return (
                  <div key={status} className="border rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">
                      {getStatusLabel(status as LeadOutreachStatus)}
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}