import { useMemo } from 'react';
import { useLeads } from '@/hooks/useLeadQueries';
import { useLeadUIStore } from '@/stores/leadUIStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Download } from 'lucide-react';
import StatsBar from '@/components/layout/StatsBar';
import FiltersPanel from '@/components/leads/FiltersPanel';
import LeadList from '@/components/leads/LeadList';
import LeadDetail from '@/components/leads/LeadDetail';
import ImportLeadsModal from '@/components/leads/ImportLeadsModal';
import AddLeadModal from '@/components/leads/AddLeadModal';
import AppLayout from '@/components/layout/AppLayout';

export default function Dashboard() {
  // UI State from Zustand
  const {
    selectedLeadId,
    setSelectedLeadId,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    websiteFilter,
    setWebsiteFilter,
    sortBy,
    setSortBy,
    activeStatsFilter,
    setActiveStatsFilter,
    importModalOpen,
    setImportModalOpen,
    addLeadModalOpen,
    setAddLeadModalOpen,
  } = useLeadUIStore();

  // Server State from React Query
  const { data: leads = [] } = useLeads();

  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (lead) =>
          lead.businessName.toLowerCase().includes(query) ||
          (lead.category?.toLowerCase().includes(query) ?? false) ||
          (lead.neighborhood?.toLowerCase().includes(query) ?? false) ||
          (lead.addressLine1?.toLowerCase().includes(query) ?? false)
      );
    }

    // Stats filter (takes precedence over status filter)
    if (activeStatsFilter) {
      if (activeStatsFilter === 'follow_up_due') {
        // TODO: Add next_follow_up_at field to Lead type when implementing follow-ups
        result = result.filter((lead) => {
          // Temporary: filter leads with 'follow_up' status
          return lead.outreachStatus === 'follow_up';
        });
      } else if (activeStatsFilter === 'interested') {
        result = result.filter(
          (lead) => lead.outreachStatus === 'interested'
        );
      } else if (activeStatsFilter !== 'all') {
        result = result.filter((lead) => lead.outreachStatus === activeStatsFilter);
      }
    } else if (statusFilter !== 'all') {
      result = result.filter((lead) => lead.outreachStatus === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'All Categories') {
      result = result.filter((lead) => lead.category === categoryFilter);
    }

    // Website filter
    if (websiteFilter !== 'all') {
      result = result.filter((lead) => lead.websiteStatus === websiteFilter);
    }

    // Sort
    if (sortBy === 'score') {
      result.sort((a, b) => b.score - a.score);
    } else if (sortBy === 'last_contacted') {
      // TODO: Add lastContactedAt field to Lead type when implementing contact tracking
      result.sort((a, b) => {
        // Temporary: sort by updatedAt as a proxy
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [leads, searchQuery, statusFilter, categoryFilter, websiteFilter, sortBy, activeStatsFilter]);

  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => setImportModalOpen(true)} size="sm">
              <Download className="w-4 h-4 mr-2" />
              Import Leads
            </Button>
            <Button onClick={() => setAddLeadModalOpen(true)} variant="outline" size="sm">
              Add Lead
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <StatsBar
          leads={leads}
          onFilterByStatus={setActiveStatsFilter}
          activeFilter={activeStatsFilter}
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Filters */}
          <div className="lg:col-span-3">
            <FiltersPanel
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              websiteFilter={websiteFilter}
              setWebsiteFilter={setWebsiteFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />
          </div>

          {/* Lead List */}
          <div className="lg:col-span-5">
            <LeadList
              leads={filteredLeads}
              selectedLeadId={selectedLeadId}
              onSelectLead={setSelectedLeadId}
            />
          </div>

          {/* Lead Detail */}
          <div className="lg:col-span-4">
            {selectedLead ? (
              <LeadDetail lead={selectedLead} />
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <p className="text-gray-500">Select a lead to view details</p>
              </div>
            )}
          </div>
        </div>

        <ImportLeadsModal open={importModalOpen} onOpenChange={setImportModalOpen} />
        <AddLeadModal open={addLeadModalOpen} onOpenChange={setAddLeadModalOpen} />
      </div>
    </AppLayout>
  );
}