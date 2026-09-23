import type { APIRoute } from 'astro';
import { urlSet, type SitemapEntry } from '../../lib/sitemap';
import { allListings } from '../../lib/listings';
import { url } from '../../lib/taxonomy';

export const prerender = true;

/**
 * صفحات پروفایل مراکز.
 *
 * برخلاف صفحات دسته×مکان، اینجا آستانه‌ی thin-content اعمال نمی‌شود:
 * هر مرکز یک موجودیت یکتای دنیای واقعی است با نام، آدرس و مختصات خودش،
 * پس صفحه‌اش ذاتاً محتوای یکتا دارد.
 */
export const GET: APIRoute = () => {
  const entries: SitemapEntry[] = allListings().map((l) => ({
    path: url.clinic(l.city, l.slug),
    changefreq: 'monthly' as const,
    // مراکزی که تلفن دارند برای کاربر مفیدترند
    priority: l.phone ? 0.6 : 0.5,
  }));

  return urlSet(entries);
};
