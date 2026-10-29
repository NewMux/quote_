import fs from 'fs';
import path from 'path';
import { ar } from './ar';
import { getLocale, setLocaleForTests, t, tp } from './index';
import { datePattern } from './dates';

const SRC_ROOTS = [path.resolve(__dirname, '../../../app'), path.resolve(__dirname, '../../../src')];
const LITERAL = String.raw`(?:'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)")`;
const T_CALL = new RegExp(String.raw`(?<![\w.])t\(\s*` + LITERAL, 'g');
const TP_CALL = new RegExp(String.raw`(?<![\w.])tp\(\s*[^,]+,\s*` + LITERAL + String.raw`\s*,\s*` + LITERAL, 'g');

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'i18n' ? [] : sourceFiles(full);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

function unescape(raw: string): string {
  return raw.replace(/\\n/g, '\n').replace(/\\(['"\\])/g, '$1');
}

function collectKeys() {
  const keys = new Set<string>();
  const pluralKeys = new Set<string>();
  for (const file of SRC_ROOTS.flatMap(sourceFiles)) {
    const text = fs.readFileSync(file, 'utf8');
    for (const m of text.matchAll(T_CALL)) keys.add(unescape(m[1] ?? m[2]));
    for (const m of text.matchAll(TP_CALL)) pluralKeys.add(unescape(m[3] ?? m[4]));
  }
  return { keys, pluralKeys };
}

const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();

afterEach(() => setLocaleForTests('en'));

describe('translation coverage', () => {
  const { keys, pluralKeys } = collectKeys();

  it('finds the strings the app wraps', () => {
    expect(keys.size).toBeGreaterThan(300);
  });

  it('has an Arabic entry for every t() string', () => {
    const missing = [...keys].filter((key) => !(key in ar));
    expect(missing).toEqual([]);
  });

  it('has an Arabic plural entry for every tp() string', () => {
    const missing = [...pluralKeys].filter((key) => typeof ar[key] !== 'object');
    expect(missing).toEqual([]);
  });

  it('has no Arabic entries the app no longer uses', () => {
    const unused = Object.keys(ar).filter((key) => !keys.has(key) && !pluralKeys.has(key));
    expect(unused).toEqual([]);
  });

  it('keeps every {placeholder} in each translation', () => {
    const broken = Object.entries(ar)
      .filter(([, value]) => typeof value === 'string')
      .filter(([key, value]) => placeholders(key).join() !== placeholders(value as string).join())
      .map(([key]) => key);
    expect(broken).toEqual([]);
  });

  it('gives every plural entry the forms Arabic needs', () => {
    for (const [key, value] of Object.entries(ar)) {
      if (typeof value !== 'object') continue;
      expect(Object.keys(value).sort()).toEqual(['few', 'many', 'one', 'other', 'two', 'zero']);
      for (const form of ['few', 'many', 'other'] as const) {
        expect(placeholders(value[form] ?? '')).toEqual(placeholders(key));
      }
    }
  });
});

describe('t', () => {
  it('returns the English text in English and fills placeholders', () => {
    expect(getLocale()).toBe('en');
    expect(t('Draft')).toBe('Draft');
    expect(t('Delete {number}?', { number: 'INV-1' })).toBe('Delete INV-1?');
  });

  it('translates in Arabic and falls back to English for unknown text', () => {
    setLocaleForTests('ar');
    expect(t('Draft')).toBe('مسودة');
    expect(t('Delete {number}?', { number: 'INV-1' })).toBe('حذف INV-1؟');
    expect(t('Text with no translation')).toBe('Text with no translation');
  });

  it('leaves an unknown placeholder untouched', () => {
    expect(t('Hello {name}')).toBe('Hello {name}');
  });
});

describe('tp', () => {
  it('uses the English singular and plural', () => {
    expect(tp(1, '{count} invoice', '{count} invoices')).toBe('1 invoice');
    expect(tp(3, '{count} invoice', '{count} invoices')).toBe('3 invoices');
  });

  it('picks the right Arabic form for each count', () => {
    setLocaleForTests('ar');
    const invoices = (n: number) => tp(n, '{count} invoice', '{count} invoices');
    expect(invoices(0)).toBe('لا فواتير');
    expect(invoices(1)).toBe('فاتورة واحدة');
    expect(invoices(2)).toBe('فاتورتان');
    expect(invoices(3)).toBe('3 فواتير');
    expect(invoices(11)).toBe('11 فاتورة');
    expect(invoices(100)).toBe('100 فاتورة');
  });
});

describe('localized labels', () => {
  // Modules read the device language when they load (it can't change while the app runs), so
  // these load fresh with the device set to Arabic.
  it('translates status, schedule and intro-offer text on an Arabic device', () => {
    jest.isolateModules(() => {
      jest.doMock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'ar' }] }));
      const { statusLabel } = jest.requireActual('../statusMachine');
      const { describeSchedule } = jest.requireActual('../recurrence');
      const { introOfferLabel } = jest.requireActual('../subscription');
      expect(statusLabel('overdue')).toBe('متأخر');
      expect(describeSchedule('monthly', '2026-09-01')).toBe('يتكرر شهريًا · التالي 1 سبتمبر 2026');
      expect(
        introOfferLabel({ price: 0.99, priceString: '$0.99', periodUnit: 'MONTH', periodNumberOfUnits: 1 })
      ).toBe('$0.99 لمدة شهر واحد');
    });
  });

  it('keeps English on an English device', () => {
    jest.isolateModules(() => {
      jest.doMock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));
      const { statusLabel } = jest.requireActual('../statusMachine');
      const { describeSchedule } = jest.requireActual('../recurrence');
      expect(statusLabel('overdue')).toBe('Overdue');
      expect(describeSchedule('monthly', '2026-09-01')).toBe('Repeats monthly · next Sep 1, 2026');
    });
  });

  it('puts the day before the month in Arabic dates only', () => {
    expect(datePattern('MMM d, yyyy')).toBe('MMM d, yyyy');
    setLocaleForTests('ar');
    expect(datePattern('MMM d, yyyy')).toBe('d MMM yyyy');
    expect(datePattern('MMM d')).toBe('d MMM');
  });
});
