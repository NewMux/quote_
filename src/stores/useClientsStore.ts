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
  load: () => Promise<void>;
  create: (input: ClientInput) => Promise<Client>;
  update: (id: string, input: ClientInput) => Promise<void>;
  archive: (id: string, archived: boolean) => Promise<void>;
}

export const useClientsStore = create<ClientsState>((set, get) => ({
  clients: [],
  isLoading: false,
  load: async () => {
    set({ isLoading: true });
    const clients = await listClients();
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
