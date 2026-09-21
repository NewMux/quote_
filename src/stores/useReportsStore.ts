import { create } from 'zustand';
import {
  getPaidTotalsByPeriod,
  getRevenueByMonth,
  getStatusBreakdown,
  type ReportGranularity,
  type StatusBreakdown,
} from '../db/repositories/reports.repo';
import { getPeriodRange, type ReportPeriod } from '../lib/reportPeriods';
import type { ChartPoint } from '../types/models';

const ZERO_BREAKDOWN: StatusBreakdown = {
  paidCount: 0,
  paidMinor: 0,
  unpaidCount: 0,
  unpaidMinor: 0,
  overdueCount: 0,
  overdueMinor: 0,
  draftCount: 0,
  draftMinor: 0,
};

interface ReportsState {
  breakdown: StatusBreakdown;
  revenueByMonth: ChartPoint[];
  paidByPeriod: ChartPoint[];
  granularity: ReportGranularity;
  period: ReportPeriod;
  isLoading: boolean;
  load: () => Promise<void>;
  setGranularity: (granularity: ReportGranularity) => Promise<void>;
  setPeriod: (period: ReportPeriod) => Promise<void>;
}

export const useReportsStore = create<ReportsState>((set, get) => ({
  breakdown: ZERO_BREAKDOWN,
  revenueByMonth: [],
  paidByPeriod: [],
  granularity: 'month',
  period: { kind: 'month' },
  isLoading: false,
  load: async () => {
    set({ isLoading: true });
    const [breakdown, revenueByMonth, paidByPeriod] = await Promise.all([
      getStatusBreakdown(undefined, getPeriodRange(get().period)),
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
  setPeriod: async (period) => {
    set({ period, isLoading: true });
    const breakdown = await getStatusBreakdown(undefined, getPeriodRange(period));
    set({ breakdown, isLoading: false });
  },
}));
