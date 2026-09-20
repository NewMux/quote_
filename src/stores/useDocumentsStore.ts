import { create } from 'zustand';
import { listDocuments, type DocumentListFilter } from '../db/repositories/documents.repo';
import type { DocumentListItem } from '../types/models';

interface DocumentsState {
  documents: DocumentListItem[];
  filter: DocumentListFilter;
  isLoading: boolean;
  setFilter: (filter: DocumentListFilter) => Promise<void>;
  load: () => Promise<void>;
}

export const useDocumentsStore = create<DocumentsState>((set, get) => ({
  documents: [],
  filter: {},
  isLoading: false,
  setFilter: async (filter) => {
    set({ filter });
    await get().load();
  },
  load: async () => {
    set({ isLoading: true });
    const documents = await listDocuments(get().filter);
    set({ documents, isLoading: false });
  },
}));
