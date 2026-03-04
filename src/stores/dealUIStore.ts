import { create } from 'zustand';

interface DealUIState {
  viewMode: 'kanban' | 'table';
  setViewMode: (mode: 'kanban' | 'table') => void;
  
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  newDealModalOpen: boolean;
  setNewDealModalOpen: (open: boolean) => void;
  
  selectedDealId: string | null;
  setSelectedDealId: (id: string | null) => void;
}

export const useDealUIStore = create<DealUIState>((set) => ({
  viewMode: 'kanban',
  setViewMode: (mode) => set({ viewMode: mode }),
  
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  newDealModalOpen: false,
  setNewDealModalOpen: (open) => set({ newDealModalOpen: open }),
  
  selectedDealId: null,
  setSelectedDealId: (id) => set({ selectedDealId: id }),
}));
