import type { APIRoute } from 'astro';
import { SITE } from '../lib/site';

export const prerender = true;

/**
 * robots.txt پویا.
 * قانون: هر چه اینجا Disallow شود نباید در sitemap باشد و برعکس.
 * مرجع: docs/seo/00-taxonomy-and-urls.md §۶
 *
 * ⚠️ Disallow جلوی ایندکس را نمی‌گیرد، فقط جلوی خزش را می‌گیرد.
 * برای جلوگیری از ایندکس از meta robots=noindex استفاده می‌شود (Seo.astro).
 */
const body = `User-agent: *
Allow: /

# پنل و احراز هویت — محتوای کاربری، ارزش ایندکس ندارد
Disallow: /panel/
Disallow: /auth/

# نتایج جست‌وجو — تولید URL بی‌نهایت و محتوای تکراری
Disallow: /search
Disallow: /*?q=

# پارامترهای مرتب‌سازی و فیلتر
Disallow: /*?sort=
Disallow: /*?open=

# فایل‌های داخلی
Disallow: /_astro/
Disallow: /_image

Sitemap: ${SITE.url}/sitemap-index.xml
`;

export const GET: APIRoute = () =>
  new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
