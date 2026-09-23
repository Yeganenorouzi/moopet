/**
 * تاریخ شمسی با Intl بومی مرورگر/نود — بدون هیچ کتابخانه‌ی اضافه.
 * `fa-IR` به صورت پیش‌فرض تقویم هجری شمسی را می‌دهد.
 */
const dateFmt = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export function faDate(d: Date): string {
  return dateFmt.format(d);
}

/** عدد با رقم‌های فارسی و جداکننده‌ی هزارگان */
const numFmt = new Intl.NumberFormat('fa-IR');

export function faNum(n: number): string {
  return numFmt.format(n);
}

/**
 * سال جاری شمسی با رقم فارسی — برای فوتر.
 * سایت فارسی سال میلادی با رقم لاتین نشان نمی‌دهد.
 */
export function shamsiYear(): string {
  return new Intl.DateTimeFormat('fa-IR', { year: 'numeric' }).format(new Date());
}

/** تخمین زمان مطالعه بر پایه‌ی ~۲۰۰ کلمه در دقیقه برای متن فارسی */
export function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}
