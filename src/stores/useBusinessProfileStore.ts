import { create } from 'zustand';
import { getBusinessProfile, updateBusinessProfile } from '../db/repositories/businessProfile.repo';
import type { BusinessProfile } from '../types/models';

interface BusinessProfileState {
  profile: BusinessProfile | null;
  isLoading: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<Omit<BusinessProfile, 'id' | 'created_at' | 'updated_at'>>) => Promise<void>;
}

export const useBusinessProfileStore = create<BusinessProfileState>((set, get) => ({
  profile: null,
  isLoading: false,
  load: async () => {
    set({ isLoading: true });
    const profile = await getBusinessProfile();
    set({ profile, isLoading: false });
  },
  update: async (patch) => {
    await updateBusinessProfile(patch);
    await get().load();
  },
}));
