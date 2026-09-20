import { create } from 'zustand';
import {
  getPaidTotalsByPeriod,
  getRevenueByMonth,
  getStatusBreakdown,
  type ReportGranularity,
  type StatusBreakdown,
} from '../db/repositories/reports.repo';
import type { ChartPoint } from '../types/models';

interface ReportsState {
  breakdown: StatusBreakdown | null;
  revenueByMonth: ChartPoint[];
  paidByPeriod: ChartPoint[];
  granularity: ReportGranularity;
  isLoading: boolean;
  load: () => Promise<void>;
  setGranularity: (granularity: ReportGranularity) => Promise<void>;
}

export const useReportsStore = create<ReportsState>((set, get) => ({
  breakdown: null,
  revenueByMonth: [],
  paidByPeriod: [],
  granularity: 'month',
  isLoading: false,
  load: async () => {
    set({ isLoading: true });
    const [breakdown, revenueByMonth, paidByPeriod] = await Promise.all([
      getStatusBreakdown(),
      getRevenueByMonth(6),
      getPaidTotalsByPeriod(get().granularity),
    ]);
    set({ breakdown, revenueByMonth, paidByPeriod, isLoading: false });
  },
  setGranularity: async (granularity) => {
    set({ granularity });
    const paidByPeriod = await getPaidTotalsByPeriod(granularity);
    set({ paidByPeriod });
  },
}));
