import React, { createContext, useContext } from 'react';
import { FONT } from '../theme';

// The App Store screenshots come in two languages: English and Arabic (right to left). A shot is
// drawn in Arabic by wrapping it in <LangProvider lang="ar">. Every string the screens draw goes
// through useT(), which throws on an Arabic string that has no entry, so a screenshot can't ship
// with English left in it by accident. The Arabic matches the app's own wording (src/lib/i18n/ar.ts).

export type Lang = 'en' | 'ar';

const Ctx = createContext<Lang>('en');
export const LangProvider: React.FC<{ lang: Lang; children: React.ReactNode }> = ({ lang, children }) => <Ctx.Provider value={lang}>{children}</Ctx.Provider>;
export const useLang = (): Lang => useContext(Ctx);

export const FONT_AR = '"IBM Plex Sans Arabic", Inter, system-ui, sans-serif';
export const BRAND_FONT_AR = '"IBM Plex Sans Arabic", Inter, system-ui, sans-serif';

export const fontFor = (lang: Lang) => (lang === 'ar' ? FONT_AR : FONT);
export const dirFor = (lang: Lang): 'ltr' | 'rtl' => (lang === 'ar' ? 'rtl' : 'ltr');
/** Arabic letters join, so letter-spacing must be zero. */
export const tracking = (lang: Lang, em: string) => (lang === 'ar' ? '0' : em);

const AR: Record<string, string> = {
  // Tabs and titles
  Summary: 'الملخص',
  Documents: 'المستندات',
  Clients: 'العملاء',
  Settings: 'الإعدادات',
  // Segments
  Month: 'شهر',
  '90 Days': '90 يومًا',
  Year: 'سنة',
  Custom: 'مخصص',
  All: 'الكل',
  Estimates: 'عروض الأسعار',
  Invoices: 'الفواتير',
  // Summary
  Outstanding: 'المستحق',
  Paid: 'مدفوع',
  Unpaid: 'غير مدفوع',
  Overdue: 'متأخر',
  Drafts: 'المسودات',
  'Needs Attention': 'تحتاج إلى انتباه',
  'Overdue invoices, oldest due date first.': 'الفواتير المتأخرة، الأقدم استحقاقًا أولًا.',
  Payments: 'المدفوعات',
  'Paid This Month': 'المدفوع هذا الشهر',
  'Last 6 Months': 'آخر 6 أشهر',
  // Documents / detail
  'Search Documents': 'بحث في المستندات',
  'Search Clients': 'بحث في العملاء',
  Draft: 'مسودة',
  Issued: 'صادر',
  'Partially Paid': 'مدفوع جزئيًا',
  'Balance Due': 'الرصيد المستحق',
  'Log Payment': 'تسجيل دفعة',
  'Record a payment you received for this invoice.': 'سجّل دفعة استلمتها مقابل هذه الفاتورة.',
  'Share PDF': 'مشاركة ملف PDF',
  Client: 'العميل',
  'Payment Due': 'الدفع مستحق في',
  // Sign sheet
  'Your Signature': 'توقيعك',
  'Sign above with your finger.': 'وقّع بإصبعك في الأعلى.',
  Clear: 'مسح',
  // Headlines
  'Bill it.': 'أصدرها.',
  'Send it.': 'أرسلها.',
  '*Get paid.*': '*واقبض أموالك.*',
  'Estimates and invoices for people who’d rather be doing the work.': 'عروض أسعار وفواتير لمن يفضّل أن ينشغل بعمله.',
  'Every estimate': 'كل عروض الأسعار',
  'and invoice,': 'والفواتير في',
  '*one list.*': '*قائمة واحدة.*',
  'Search, filter and see where each one stands at a glance.': 'ابحث وصنّف وتعرّف على حالة كل مستند بنظرة.',
  'Always one tap': 'دائمًا على بُعد',
  'from *paid.*': 'نقرة من *الدفع.*',
  'Issue it, log a payment or send a reminder. The big button knows what’s next.': 'أصدر الفاتورة أو سجّل دفعة أو أرسل تذكيرًا. الزر الكبير يعرف الخطوة التالية.',
  'Signed on': 'وقّع',
  'the *spot.*': '*في الموقع.*',
  'Draw your signature on the phone. It prints on the PDF.': 'ارسم توقيعك على الهاتف ليظهر في ملف PDF.',
  'Every invoice': 'كل فاتورة',
  'has a *pay link.*': 'فيها *رابط دفع.*',
  'A QR code and a Pay button on the PDF take clients straight to your payment page.': 'رمز QR وزر دفع في ملف PDF يوصلان عميلك مباشرة إلى صفحة الدفع.',
  'Everyone you': 'كل عملائك',
  'bill, *A to Z.*': '*مرتبون أبجديًا.*',
  'Add clients straight from your contacts.': 'أضف عملاءك مباشرة من جهات الاتصال.',
  'And so much': 'وهناك',
  '*more.*': '*الكثير غيرها.*',
  'Everything you need to get paid.': 'كل ما تحتاجه لتحصيل أموالك.',
  'Recurring invoices': 'فواتير متكررة',
  'Drafts ready on your schedule': 'مسودات جاهزة في مواعيدك',
  Reminders: 'تذكيرات',
  'For overdue invoices': 'للفواتير المتأخرة',
  'Your logo': 'شعارك',
  'On every PDF': 'على كل ملف PDF',
  'Light & Dark': 'فاتح وداكن',
  'Follows your iPhone': 'يتبع إعدادات iPhone',
  'Turn into invoices in a tap': 'حوّلها إلى فواتير بنقرة',
  'Secure cloud sync': 'مزامنة سحابية آمنة',
  'Your data, on every device': 'بياناتك على كل جهاز',
  'Bill it. Send it. Get paid.': 'أصدرها. أرسلها. واقبض أموالك.',
};

/** Translates a string for the current language; English passes through. */
export function useT(): (s: string) => string {
  const lang = useLang();
  return (s) => {
    if (lang === 'en') return s;
    const ar = AR[s];
    if (ar === undefined) throw new Error(`No Arabic for "${s}"`);
    return ar;
  };
}

// ---------------------------------------------------------------------------------------------
// Sample data. The Arabic shots show a small business in the Gulf: Arabic client names, dates with
// the day first, and amounts in dirhams, the way the app formats AED (the code, then the number,
// in Western digits).

const MONTHS_AR: Record<string, string> = {
  Jan: 'يناير', Feb: 'فبراير', Mar: 'مارس', Apr: 'أبريل', May: 'مايو', Jun: 'يونيو',
  Jul: 'يوليو', Aug: 'أغسطس', Sep: 'سبتمبر', Oct: 'أكتوبر', Nov: 'نوفمبر', Dec: 'ديسمبر',
};

const NAMES_AR: Record<string, string> = {
  'Harbor Coffee Co.': 'مقهى الميناء',
  'Marlow & Finch': 'استوديو مارلو',
  'Juniper Bakery': 'مخبز الريحان',
  'Saffron & Salt': 'زعفران وملح',
  'Lumen Fitness': 'لومن للياقة',
  'Orchard & Pine': 'بستان الصنوبر',
  'Tidewater Studio': 'استوديو المد',
  'Brightside Dental': 'عيادة الابتسامة',
  'Atlas Print Co.': 'مطبعة أطلس',
  'Birchwood Cabinets': 'خزائن الأرز',
};

export function useLocal() {
  const lang = useLang();
  const t = useT();
  return {
    lang,
    t,
    /** "$4,290.00" → "AED 4,290.00" in Arabic. */
    money: (s: string) => (lang === 'ar' ? s.replace('$', 'AED ') : s),
    /** "Oct 14" / "Oct 14, 2026" → "14 أكتوبر" / "14 أكتوبر 2026" in Arabic. */
    date: (s: string) => {
      if (lang === 'en') return s;
      const m = s.match(/^(\w{3}) (\d+)(?:, (\d{4}))?$/);
      if (!m) throw new Error(`Unexpected date "${s}"`);
      return `${m[2]} ${MONTHS_AR[m[1]]}${m[3] ? ` ${m[3]}` : ''}`;
    },
    month: (s: string) => (lang === 'ar' ? MONTHS_AR[s] : s),
    name: (s: string) => {
      if (lang === 'en') return s;
      const ar = NAMES_AR[s];
      if (!ar) throw new Error(`No Arabic name for "${s}"`);
      return ar;
    },
    plural: (n: number, en: [string, string], ar: { one: string; two: string; few: string; many: string }) => {
      if (lang === 'en') return `${n} ${n === 1 ? en[0] : en[1]}`;
      return n === 1 ? ar.one : n === 2 ? ar.two : n >= 3 && n <= 10 ? `${n} ${ar.few}` : `${n} ${ar.many}`;
    },
  };
}
