import type { APIRoute } from 'astro';
import { sitemapIndex } from '../lib/sitemap';

export const prerender = true;

/**
 * سایت‌مپ تفکیک‌شده — همان الگویی که آهن‌آنلاین استفاده می‌کند.
 * مزیت: lastmod هر بخش مستقل است و گوگل فقط بخش تغییرکرده را دوباره می‌خزد.
 */
export const GET: APIRoute = () =>
  sitemapIndex(['/sitemap/pages.xml', '/sitemap/places.xml']);
