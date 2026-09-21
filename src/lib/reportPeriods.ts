export type ReportPeriod =
  | { kind: 'month' }
  | { kind: 'last90' }
  | { kind: 'year' }
  | { kind: 'custom'; startIso: string; endIso: string };

export interface DateRange {
  startIso: string;
  endIso: string;
}

/** End is always "now" (inclusive of today) for the fixed periods; custom uses the given end. */
export function getPeriodRange(period: ReportPeriod): DateRange {
  const now = new Date();
  const endIso = now.toISOString();

  switch (period.kind) {
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startIso: start.toISOString(), endIso };
    }
    case 'last90': {
      const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return { startIso: start.toISOString(), endIso };
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { startIso: start.toISOString(), endIso };
    }
    case 'custom':
      return { startIso: period.startIso, endIso: period.endIso };
  }
}

export function formatPeriodLabel(period: ReportPeriod): string {
  const now = new Date();
  switch (period.kind) {
    case 'month':
      return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    case 'last90':
      return 'Last 90 Days';
    case 'year':
      return String(now.getFullYear());
    case 'custom':
      return `${period.startIso.slice(0, 10)} – ${period.endIso.slice(0, 10)}`;
  }
}
