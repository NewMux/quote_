import { create } from 'zustand';
import {
  createClient,
  listClients,
  setClientArchived,
  updateClient,
  type ClientInput,
} from '../db/repositories/clients.repo';
import type { Client } from '../types/models';

interface ClientsState {
  clients: Client[];
  isLoading: boolean;
  search: string;
  sortBy: 'name' | 'recent';
  hasBalanceOnly: boolean;
  setSearch: (search: string) => void;
  setSortBy: (sortBy: 'name' | 'recent') => Promise<void>;
  setHasBalanceOnly: (hasBalanceOnly: boolean) => Promise<void>;
  load: () => Promise<void>;
  create: (input: ClientInput) => Promise<Client>;
  update: (id: string, input: ClientInput) => Promise<void>;
  archive: (id: string, archived: boolean) => Promise<void>;
}

export const useClientsStore = create<ClientsState>((set, get) => ({
  clients: [],
  isLoading: false,
  search: '',
  sortBy: 'name',
  hasBalanceOnly: false,
  setSearch: (search) => set({ search }),
  setSortBy: async (sortBy) => {
    set({ sortBy });
    await get().load();
  },
  setHasBalanceOnly: async (hasBalanceOnly) => {
    set({ hasBalanceOnly });
    await get().load();
  },
  load: async () => {
    set({ isLoading: true });
    const { search, sortBy, hasBalanceOnly } = get();
    const clients = await listClients({ search: search.trim() || undefined, sortBy, hasBalanceOnly });
    set({ clients, isLoading: false });
  },
  create: async (input) => {
    const client = await createClient(input);
    await get().load();
    return client;
  },
  update: async (id, input) => {
    await updateClient(id, input);
    await get().load();
  },
  archive: async (id, archived) => {
    await setClientArchived(id, archived);
    await get().load();
  },
}));
