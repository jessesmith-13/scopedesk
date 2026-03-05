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
import { getCategoryGroup } from '@/utils/categoryNormalizer';

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
    currentPage,
    setCurrentPage,
    itemsPerPage,
    sortColumn,
    setSortColumn,
    sortDirection,
    setSortDirection,
  } = useLeadUIStore();

  // Server State from React Query
  const { data: leads = [], isLoading, error } = useLeads();

  // Compute filtered leads - MUST be before conditional returns
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
      result = result.filter((lead) => getCategoryGroup(lead.category) === categoryFilter);
    }

    // Website filter
    if (websiteFilter !== 'all') {
      result = result.filter((lead) => lead.websiteStatus === websiteFilter);
    }

    // Sort
    if (sortColumn) {
      result.sort((a, b) => {
        let aVal: string | number;
        let bVal: string | number;
        
        switch (sortColumn) {
          case 'business':
            aVal = a.businessName.toLowerCase();
            bVal = b.businessName.toLowerCase();
            break;
          case 'category':
            aVal = (a.category || '').toLowerCase();
            bVal = (b.category || '').toLowerCase();
            break;
          case 'neighborhood':
            aVal = (a.neighborhood || '').toLowerCase();
            bVal = (b.neighborhood || '').toLowerCase();
            break;
          case 'website':
            aVal = a.websiteStatus;
            bVal = b.websiteStatus;
            break;
          case 'status':
            aVal = a.outreachStatus;
            bVal = b.outreachStatus;
            break;
          case 'score':
            aVal = a.score;
            bVal = b.score;
            break;
          default:
            return 0;
        }
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    } else if (sortBy === 'score') {
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
  }, [leads, searchQuery, statusFilter, categoryFilter, websiteFilter, sortBy, activeStatsFilter, sortColumn, sortDirection]);

  const selectedLead = useMemo(() => 
    leads.find((l) => l.id === selectedLeadId),
    [leads, selectedLeadId]
  );
  
  // Pagination calculations
  const totalPages = useMemo(() => 
    Math.ceil(filteredLeads.length / itemsPerPage),
    [filteredLeads.length, itemsPerPage]
  );
  
  const startIndex = useMemo(() => 
    (currentPage - 1) * itemsPerPage,
    [currentPage, itemsPerPage]
  );
  
  const endIndex = useMemo(() => 
    startIndex + itemsPerPage,
    [startIndex, itemsPerPage]
  );
  
  const paginatedLeads = useMemo(() => 
    filteredLeads.slice(startIndex, endIndex),
    [filteredLeads, startIndex, endIndex]
  );
  
  // Reset to page 1 when filters change
  const resetPage = () => setCurrentPage(1);
  
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Show error state if query failed
  if (error) {
    return (
      <AppLayout>
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Error Loading Leads</h2>
            <p className="text-gray-600 mb-4">
              {error instanceof Error ? error.message : 'Failed to fetch leads from database'}
            </p>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading leads...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header Actions & Stats Bar */}
        <div className="space-y-4">
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
          
          {/* Filters Panel - Horizontal */}
          <FiltersPanel
            statusFilter={statusFilter}
            setStatusFilter={(val: string) => { setStatusFilter(val); resetPage(); }}
            categoryFilter={categoryFilter}
            setCategoryFilter={(val: string) => { setCategoryFilter(val); resetPage(); }}
            websiteFilter={websiteFilter}
            setWebsiteFilter={(val: string) => { setWebsiteFilter(val); resetPage(); }}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />
        </div>

        {/* Lead Table */}
        <LeadList
          leads={paginatedLeads}
          selectedLeadId={selectedLeadId}
          onSelectLead={setSelectedLeadId}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
        
        {/* Pagination */}
        {filteredLeads.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">{Math.min(endIndex, filteredLeads.length)}</span> of{' '}
              <span className="font-medium">{filteredLeads.length}</span> leads
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="min-w-[2.5rem]"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Lead Detail - Bottom */}
        {selectedLead && (
          <div className="bg-white border border-gray-200 rounded-lg">
            <LeadDetail lead={selectedLead} />
          </div>
        )}

        <ImportLeadsModal open={importModalOpen} onOpenChange={setImportModalOpen} />
        <AddLeadModal open={addLeadModalOpen} onOpenChange={setAddLeadModalOpen} />
      </div>
    </AppLayout>
  );
}
