import { create } from 'zustand';
import {
  createItem,
  listItems,
  setItemArchived,
  updateItem,
  type ItemInput,
} from '../db/repositories/itemCatalog.repo';
import type { ItemCatalogEntry } from '../types/models';

interface ItemCatalogState {
  items: ItemCatalogEntry[];
  isLoading: boolean;
  load: () => Promise<void>;
  create: (input: ItemInput) => Promise<ItemCatalogEntry>;
  update: (id: string, input: ItemInput) => Promise<void>;
  archive: (id: string, archived: boolean) => Promise<void>;
}

export const useItemCatalogStore = create<ItemCatalogState>((set, get) => ({
  items: [],
  isLoading: false,
  load: async () => {
    set({ isLoading: true });
    const items = await listItems();
    set({ items, isLoading: false });
  },
  create: async (input) => {
    const item = await createItem(input);
    await get().load();
    return item;
  },
  update: async (id, input) => {
    await updateItem(id, input);
    await get().load();
  },
  archive: async (id, archived) => {
    await setItemArchived(id, archived);
    await get().load();
  },
}));
