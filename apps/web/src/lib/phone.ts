/**
 * نرمال‌سازی و اعتبارسنجی شماره تلفن ایرانی.
 *
 * داده‌ی OSM را مشارکت‌کنندگان مختلف وارد کرده‌اند و فرمت‌ها بهم‌ریخته است:
 *   +98 21 22293899   ·   09210797107   ·   +982148015000   ·   021-7709 3792
 *
 * روی صفحه‌ی اورژانس، شماره‌ی بدفرمت یعنی تماس ناموفق ساعت ۲ بامداد.
 * پس همه به یک شکل قابل شماره‌گیری تبدیل می‌شوند.
 */

/** فقط رقم، با تبدیل پیش‌شماره‌ی بین‌المللی به صفر */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;

  // ارقام فارسی/عربی به لاتین
  let s = String(raw)
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

  /**
   * ⚠️ OSM گاهی چند شماره را در یک فیلد می‌گذارد:
   *   "+982126206842;+982126206834;+989120193619"
   * بدون این تقسیم، همه بهم می‌چسبیدند و یک عدد ۴۷ رقمی بی‌معنی می‌ساختند.
   */
  s = s.split(/[;,/|]|\s+یا\s+/)[0];

  s = s.replace(/\D/g, '');

  if (s.startsWith('0098')) {
    s = s.slice(4);
  } else if (s.startsWith('98') && !s.startsWith('980')) {
    /**
     * شرط طول قبلاً `> 10` بود و شماره‌های خدماتی کوتاه را خراب می‌کرد:
     * «+98 21 2151» تبدیل می‌شد به «098212151» به جای «0212151».
     * پیش‌شماره‌ی ۹۸ باید صرف‌نظر از طول حذف شود؛ هیچ پیش‌شماره‌ی
     * داخلی ایران با ۹۸ شروع نمی‌شود، پس ابهامی نیست.
     */
    s = s.slice(2);
  }

  if (!s.startsWith('0')) s = '0' + s;

  return s.length >= 6 ? s : null;
}

export type PhoneKind = 'mobile' | 'landline' | 'short' | 'unknown';

export function phoneKind(n: string): PhoneKind {
  if (/^09\d{9}$/.test(n)) return 'mobile';       // ۰۹xx xxx xxxx
  if (/^0\d{2}\d{8}$/.test(n)) return 'landline'; // ۰۲۱ + ۸ رقم
  // شماره‌های خدماتی کوتاه تهران مثل ۰۲۱-۵۴۷۱۲ معتبرند
  if (/^021\d{4,7}$/.test(n)) return 'short';
  return 'unknown';
}

/**
 * فرمت نمایشی خوانا.
 * ⚠️ خروجی همیشه با ارقام لاتین است و باید dir="ltr" نمایش داده شود.
 */
export function formatPhone(n: string): string {
  switch (phoneKind(n)) {
    case 'mobile':
      return `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}`;
    case 'landline':
      return `${n.slice(0, 3)} ${n.slice(3, 7)} ${n.slice(7)}`;
    case 'short':
      return `${n.slice(0, 3)} ${n.slice(3)}`;
    default:
      return n;
  }
}

/** برای href="tel:" — بدون فاصله */
export function telHref(n: string): string {
  return `tel:${n}`;
}
