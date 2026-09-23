import type { APIRoute } from 'astro';
import { urlSet, type SitemapEntry } from '../../lib/sitemap';
import { categories, cities, zones, neighborhoods, neighborhoodsInZone, url } from '../../lib/taxonomy';
import { getListings, shouldIndex } from '../../lib/listings';

export const prerender = true;

/**
 * ⚠️ قانون بنیادی: فقط صفحاتی که واقعاً ایندکس می‌شوند اینجا می‌آیند.
 *
 * دقیقاً همان شرط `shouldIndex` که در صفحات استفاده شده اینجا هم اجرا
 * می‌شود، پس sitemap و meta robots هرگز از هم واگرا نمی‌شوند.
 * فرستادن صفحه‌ی noindex در sitemap به گوگل سیگنال متناقض می‌دهد و در
 * Search Console هشدار «Submitted URL marked noindex» می‌گیرد.
 */
export const GET: APIRoute = async () => {
  const entries: SitemapEntry[] = [];

  for (const c of categories) {
    for (const city of cities) {
      const cityListings = await getListings({ category: c.slug, city: city.slug });
      if (shouldIndex(cityListings)) {
        entries.push({ path: url.categoryCity(c.slug, city.slug), changefreq: 'weekly', priority: 0.8 });
      }

      for (const z of zones.filter((z) => z.city === city.slug)) {
        const l = await getListings({
          category: c.slug,
          city: city.slug,
          area: z.slug,
          areaNeighborhoods: neighborhoodsInZone(z.slug).map((n) => n.slug),
        });
        if (shouldIndex(l)) {
          entries.push({ path: url.categoryZone(c.slug, city.slug, z.slug), changefreq: 'weekly', priority: 0.7 });
        }
      }

      for (const n of neighborhoods) {
        const l = await getListings({ category: c.slug, city: city.slug, area: n.slug });
        if (shouldIndex(l)) {
          entries.push({ path: url.categoryHood(c.slug, city.slug, n.slug), changefreq: 'weekly', priority: 0.6 });
        }
      }
    }
  }

  return urlSet(entries);
};
