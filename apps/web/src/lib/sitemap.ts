import { absoluteUrl } from './site';

export interface SitemapEntry {
  path: string;
  lastmod?: Date;
  changefreq?: 'daily' | 'weekly' | 'monthly';
  priority?: number;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!,
  );
}

export function urlSet(entries: SitemapEntry[]): Response {
  const urls = entries
    .map((e) => {
      const parts = [`<loc>${escapeXml(absoluteUrl(e.path))}</loc>`];
      if (e.lastmod) parts.push(`<lastmod>${e.lastmod.toISOString()}</lastmod>`);
      if (e.changefreq) parts.push(`<changefreq>${e.changefreq}</changefreq>`);
      if (e.priority !== undefined) parts.push(`<priority>${e.priority}</priority>`);
      return `<url>${parts.join('')}</url>`;
    })
    .join('');

  return xml(
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
  );
}

export function sitemapIndex(paths: string[]): Response {
  const now = new Date().toISOString();
  const items = paths
    .map(
      (p) =>
        `<sitemap><loc>${escapeXml(new URL(p, absoluteUrl('/')).href)}</loc><lastmod>${now}</lastmod></sitemap>`,
    )
    .join('');

  return xml(
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</sitemapindex>`,
  );
}

function xml(body: string): Response {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>${body}`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
