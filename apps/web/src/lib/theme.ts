/**
 * رنگ اختصاصی هر دسته.
 *
 * چرا: وقتی ۱۵ کارت همه سبز برند باشند، صفحه یکنواخت و «خالی» دیده
 * می‌شود. تنوع رنگی کنترل‌شده باعث می‌شود چشم بتواند دسته‌ها را از هم
 * تفکیک کند و صفحه غنی‌تر به نظر برسد.
 *
 * همه با OKLCH و روشنایی یکسان (۹۴٪ پس‌زمینه / ۴۲٪ متن) تعریف شده‌اند تا
 * کنتراست در همه‌ی دسته‌ها یکسان بماند و هیچ‌کدام «داد نزند».
 */

export interface CategoryTheme {
  /** پس‌زمینه‌ی روشن کارت */
  bg: string;
  /** رنگ آیکون و متن — کنتراست AA روی bg */
  fg: string;
  /** نسخه‌ی پررنگ برای حالت hover */
  solid: string;
}

const HUE: Record<string, number> = {
  vet: 163,               // خزه‌ای (رنگ برند)
  'vet-24h': 25,          // نارنجی-قرمز — اورژانس
  'pet-shop': 265,        // بنفش
  'pet-grooming': 330,    // صورتی
  'pet-boarding': 220,    // آبی
  'dog-training': 95,     // سبز زیتونی
  'vet-pharmacy': 185,    // فیروزه‌ای
  'pet-transport': 240,   // نیلی
  'pet-photography': 300, // ارغوانی
  vaccination: 145,       // سبز
  'pet-surgery': 200,     // آبی روشن
  'pet-dentistry': 175,   // سبزآبی
  'pet-imaging': 250,     // بنفش-آبی
  'vet-lab': 130,         // سبز چمنی
  microchip: 210,         // فولادی
};

export function categoryTheme(slug: string): CategoryTheme {
  const h = HUE[slug] ?? 163;
  return {
    bg: `oklch(94.5% 0.042 ${h})`,
    fg: `oklch(42% 0.105 ${h})`,
    solid: `oklch(55% 0.125 ${h})`,
  };
}

/** استایل inline آماده برای استفاده در قالب */
export function categoryStyle(slug: string): string {
  const t = categoryTheme(slug);
  return `--cat-bg:${t.bg};--cat-fg:${t.fg};--cat-solid:${t.solid}`;
}
