import { create } from 'zustand';

interface LeadUIState {
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;
  
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  
  websiteFilter: string;
  setWebsiteFilter: (filter: string) => void;
  
  sortBy: string;
  setSortBy: (sort: string) => void;
  
  activeStatsFilter: string | null;
  setActiveStatsFilter: (filter: string | null) => void;
  
  importModalOpen: boolean;
  setImportModalOpen: (open: boolean) => void;
  
  addLeadModalOpen: boolean;
  setAddLeadModalOpen: (open: boolean) => void;
}

export const useLeadUIStore = create<LeadUIState>((set) => ({
  selectedLeadId: null,
  setSelectedLeadId: (id) => set({ selectedLeadId: id }),
  
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  statusFilter: 'all',
  setStatusFilter: (status) => set({ statusFilter: status }),
  
  categoryFilter: 'All Categories',
  setCategoryFilter: (category) => set({ categoryFilter: category }),
  
  websiteFilter: 'all',
  setWebsiteFilter: (filter) => set({ websiteFilter: filter }),
  
  sortBy: 'score',
  setSortBy: (sort) => set({ sortBy: sort }),
  
  activeStatsFilter: null,
  setActiveStatsFilter: (filter) => set({ activeStatsFilter: filter }),
  
  importModalOpen: false,
  setImportModalOpen: (open) => set({ importModalOpen: open }),
  
  addLeadModalOpen: false,
  setAddLeadModalOpen: (open) => set({ addLeadModalOpen: open }),
}));
