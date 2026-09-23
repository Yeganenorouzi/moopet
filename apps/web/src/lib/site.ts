/**
 * ثابت‌های سراسری سایت.
 * ⚠️ `url` باید با `site` در astro.config.mjs یکی باشد.
 */
export const SITE = {
  url: 'https://moopet.ir',
  name: 'موپت',
  nameEn: 'Moopet',
  lang: 'fa-IR',
  dir: 'rtl' as const,
  locale: 'fa_IR',

  title: 'موپت | دامپزشکی، پت شاپ و خدمات حیوانات خانگی در تهران',
  description:
    'موپت بانک اطلاعات خدمات حیوانات خانگی است. دامپزشکی، پت شاپ، آرایشگاه سگ و گربه و پانسیون حیوانات در تهران را با آدرس، تلفن، ساعت کاری و نظرات کاربران پیدا کنید.',

  /** شهر فاز اول */
  defaultCity: 'tehran',
  defaultCityFa: 'تهران',

  /**
   * راه‌های ارتباط.
   * ⚠️ تلفن عمداً وجود ندارد — شماره‌ای که جواب ندهد بدتر از نبودنش است.
   */
  email: 'hello@moopet.ir',
  telegram: 'moopet',
} as const;

export const telegramUrl = `https://t.me/${SITE.telegram}`;
export const mailtoUrl = `mailto:${SITE.email}`;

/**
 * ساخت URL مطلق و نرمال‌شده برای canonical.
 * همیشه اسلش پایانی دارد تا با trailingSlash: 'always' سازگار بماند.
 */
export function absoluteUrl(pathname: string): string {
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return new URL(path, SITE.url).href;
}

/**
 * الگوی عنوان صفحه.
 * چون اسلاگ‌ها انگلیسی‌اند، تطابق کلمه‌ی کلیدی فارسی باید اینجا اتفاق بیفتد.
 * مرجع: docs/seo/00-taxonomy-and-urls.md §۲
 */
export function pageTitle(title?: string): string {
  if (!title) return SITE.title;
  return `${title} | ${SITE.name}`;
}
