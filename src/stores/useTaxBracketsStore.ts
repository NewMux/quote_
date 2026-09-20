import { create } from 'zustand';
import {
  createTaxBracket,
  listTaxBrackets,
  setDefaultTaxBracket,
  setTaxBracketArchived,
  updateTaxBracket,
  type TaxBracketInput,
} from '../db/repositories/taxBrackets.repo';
import type { TaxBracket } from '../types/models';

interface TaxBracketsState {
  taxBrackets: TaxBracket[];
  isLoading: boolean;
  load: () => Promise<void>;
  create: (input: TaxBracketInput) => Promise<TaxBracket>;
  update: (id: string, input: TaxBracketInput) => Promise<void>;
  setDefault: (id: string) => Promise<void>;
  archive: (id: string, archived: boolean) => Promise<void>;
}

export const useTaxBracketsStore = create<TaxBracketsState>((set, get) => ({
  taxBrackets: [],
  isLoading: false,
  load: async () => {
    set({ isLoading: true });
    const taxBrackets = await listTaxBrackets();
    set({ taxBrackets, isLoading: false });
  },
  create: async (input) => {
    const bracket = await createTaxBracket(input);
    await get().load();
    return bracket;
  },
  update: async (id, input) => {
    await updateTaxBracket(id, input);
    await get().load();
  },
  setDefault: async (id) => {
    await setDefaultTaxBracket(id);
    await get().load();
  },
  archive: async (id, archived) => {
    await setTaxBracketArchived(id, archived);
    await get().load();
  },
}));
