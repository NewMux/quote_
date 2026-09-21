import { db } from '../client';
import { getDisplayStatus } from '../../lib/statusMachine';
import type { ChartPoint, DocStatus, DocType } from '../../types/models';

export interface StatusBreakdown {
  paidCount: number;
  paidMinor: number;
  unpaidCount: number;
  unpaidMinor: number;
  overdueCount: number;
  overdueMinor: number;
  draftCount: number;
  draftMinor: number;
}

/** Pulls all non-void documents (optionally of one type, optionally within a created_at range)
 * and buckets them by display status (draft/unpaid/overdue/paid), reusing statusMachine's
 * overdue derivation rather than re-implementing the date comparison in SQL. Dataset sizes for
 * a local single-user app are small enough that aggregating in JS is simpler and safer than
 * duplicating that logic in SQL. */
export async function getStatusBreakdown(
  docType?: DocType,
  range?: { startIso: string; endIso: string }
): Promise<StatusBreakdown> {
  const conditions = ["status != 'void'"];
  const params: string[] = [];
  if (docType) {
    conditions.push('doc_type = ?');
    params.push(docType);
  }
  if (range) {
    conditions.push('created_at >= ? AND created_at <= ?');
    params.push(range.startIso, range.endIso);
  }

  const rows = await db.getAllAsync<{
    status: DocStatus;
    due_date: string | null;
    total_minor: number;
    amount_paid_minor: number;
  }>(
    `SELECT status, due_date, total_minor, amount_paid_minor FROM documents
     WHERE ${conditions.join(' AND ')}`,
    params
  );

  const result: StatusBreakdown = {
    paidCount: 0,
    paidMinor: 0,
    unpaidCount: 0,
    unpaidMinor: 0,
    overdueCount: 0,
    overdueMinor: 0,
    draftCount: 0,
    draftMinor: 0,
  };

  for (const row of rows) {
    const display = getDisplayStatus(row);
    const balanceMinor = row.total_minor - row.amount_paid_minor;
    if (display === 'paid') {
      result.paidCount++;
      result.paidMinor += row.total_minor;
    } else if (display === 'overdue') {
      result.overdueCount++;
      result.overdueMinor += balanceMinor;
    } else if (display === 'draft') {
      result.draftCount++;
      result.draftMinor += row.total_minor;
    } else {
      result.unpaidCount++;
      result.unpaidMinor += balanceMinor;
    }
  }

  return result;
}

/** Paid (settled) amount per calendar month, oldest to newest, for the revenue trend chart. */
export async function getRevenueByMonth(monthsBack = 6): Promise<ChartPoint[]> {
  const rows = await db.getAllAsync<{ ymonth: string; total: number }>(
    `SELECT substr(settled_date, 1, 7) AS ymonth, SUM(amount_minor) AS total
     FROM settlements GROUP BY ymonth`
  );
  const totalsByMonth = new Map(rows.map((r) => [r.ymonth, r.total]));

  const now = new Date();
  const points: ChartPoint[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ymonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    points.push({
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      value: totalsByMonth.get(ymonth) ?? 0,
    });
  }
  return points;
}

export type ReportGranularity = 'day' | 'week' | 'month' | 'year';

/** Paid (settled) totals bucketed by day/week/month/year, oldest to newest. */
export async function getPaidTotalsByPeriod(
  granularity: ReportGranularity,
  bucketsBack = 7
): Promise<ChartPoint[]> {
  const settlements = await db.getAllAsync<{ settled_date: string; amount_minor: number }>(
    'SELECT settled_date, amount_minor FROM settlements'
  );

  const now = new Date();
  const buckets: Array<{ label: string; start: Date; end: Date }> = [];

  for (let i = bucketsBack - 1; i >= 0; i--) {
    let start: Date;
    let end: Date;
    let label: string;
    if (granularity === 'day') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
      label = start.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (granularity === 'week') {
      const weekStartOffset = now.getDate() - now.getDay() - i * 7;
      start = new Date(now.getFullYear(), now.getMonth(), weekStartOffset);
      end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
      label = `${start.getMonth() + 1}/${start.getDate()}`;
    } else if (granularity === 'year') {
      start = new Date(now.getFullYear() - i, 0, 1);
      end = new Date(now.getFullYear() - i + 1, 0, 1);
      label = String(start.getFullYear());
    } else {
      start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      label = start.toLocaleDateString('en-US', { month: 'short' });
    }
    buckets.push({ label, start, end });
  }

  return buckets.map((bucket) => {
    const total = settlements
      .filter((s) => {
        const settledAt = new Date(s.settled_date);
        return settledAt >= bucket.start && settledAt < bucket.end;
      })
      .reduce((sum, s) => sum + s.amount_minor, 0);
    return { label: bucket.label, value: total };
  });
}
