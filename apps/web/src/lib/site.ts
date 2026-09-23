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
} as const;

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
