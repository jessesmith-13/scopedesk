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
  
  currentPage: number;
  setCurrentPage: (page: number) => void;
  
  itemsPerPage: number;
  setItemsPerPage: (items: number) => void;
  
  sortColumn: string | null;
  setSortColumn: (column: string | null) => void;
  
  sortDirection: 'asc' | 'desc';
  setSortDirection: (direction: 'asc' | 'desc') => void;
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
  
  currentPage: 1,
  setCurrentPage: (page) => set({ currentPage: page }),
  
  itemsPerPage: 10,
  setItemsPerPage: (items) => set({ itemsPerPage: items }),
  
  sortColumn: null,
  setSortColumn: (column) => set({ sortColumn: column }),
  
  sortDirection: 'desc',
  setSortDirection: (direction) => set({ sortDirection: direction }),
}));
