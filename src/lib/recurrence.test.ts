import { describeSchedule, formatScheduleDate, frequencyLabel, FREQUENCY_OPTIONS } from './recurrence';

describe('frequencyLabel', () => {
  it('maps every frequency to its display label', () => {
    expect(frequencyLabel('weekly')).toBe('Weekly');
    expect(frequencyLabel('monthly')).toBe('Monthly');
    expect(frequencyLabel('quarterly')).toBe('Quarterly');
    expect(frequencyLabel('yearly')).toBe('Yearly');
  });

  it('offers exactly the four frequencies the database accepts', () => {
    expect(FREQUENCY_OPTIONS.map((o) => o.value)).toEqual(['weekly', 'monthly', 'quarterly', 'yearly']);
  });
});

describe('formatScheduleDate', () => {
  it('formats a stored YYYY-MM-DD date without shifting the day', () => {
    expect(formatScheduleDate('2026-10-01')).toBe('Oct 1, 2026');
  });

  it('keeps month-end dates intact', () => {
    expect(formatScheduleDate('2026-02-28')).toBe('Feb 28, 2026');
  });
});

describe('describeSchedule', () => {
  it('describes the cadence and next run date', () => {
    expect(describeSchedule('monthly', '2026-09-30')).toBe('Repeats monthly · next Sep 30, 2026');
  });
});
