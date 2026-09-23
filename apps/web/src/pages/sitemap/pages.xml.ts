import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { urlSet, type SitemapEntry } from '../../lib/sitemap';
import { categories, url } from '../../lib/taxonomy';

export const prerender = true;

/** صفحات ثابت، دسته‌ها و مقالات — همه ایندکس‌شونده */
export const GET: APIRoute = async () => {
  const posts = await getCollection('blog', ({ data }) => !data.draft);

  const entries: SitemapEntry[] = [
    { path: '/', changefreq: 'daily', priority: 1.0 },
    { path: '/about/', changefreq: 'monthly', priority: 0.4 },
    { path: '/contact/', changefreq: 'monthly', priority: 0.4 },
    { path: '/blog/', changefreq: 'weekly', priority: 0.6 },

    ...categories.map((c) => ({
      path: url.category(c.slug),
      changefreq: 'weekly' as const,
      priority: c.priority <= 2 ? 0.9 : 0.7,
    })),

    ...posts.map((p) => ({
      path: url.blogPost(p.id),
      lastmod: p.data.updatedAt ?? p.data.publishedAt,
      changefreq: 'monthly' as const,
      priority: 0.6,
    })),
  ];

  return urlSet(entries);
};
