import { MIN_LISTINGS_FOR_PAGE, neighborhoodsInZone } from './taxonomy';
import raw from '../data/listings.json';

/**
 * لایه‌ی داده‌ی مراکز.
 *
 * منبع فعلی: OpenStreetMap (مجوز ODbL) — وارد شده با scripts/import-osm.mjs
 * ⚠️ الزام مجوز: هر صفحه‌ای که این داده را نشان می‌دهد باید attribution
 *    داشته باشد. کامپوننت <Attribution /> این کار را می‌کند.
 *
 * فاز ۵: این فایل با فراخوانی API نست‌جی‌اس جایگزین می‌شود تا داده‌ی
 * ثبت‌شده توسط صاحبان کسب‌وکار هم اضافه شود.
 */

export interface Listing {
  id: string;
  slug: string;
  name: string;
  /** اسلاگ دسته‌ی اصلی (kind: business) */
  category: string;
  /** اسلاگ خدمات ارائه‌شده (kind: service) */
  services: string[];
  city: string;
  /** null یعنی به هیچ محله‌ای نزدیک نبود — فقط در صفحه‌ی شهر می‌آید */
  neighborhood: string | null;
  address: string;
  phone: string | null;
  is24h: boolean;
  openingHours?: string | null;
  website?: string | null;

  photo?: string;
  rating?: number;
  reviewCount?: number;
  openNow?: boolean;

  lat?: number;
  lng?: number;
  source?: string;
}

export const ATTRIBUTION = {
  source: raw.source,
  license: raw.license,
  text: raw.attribution,
  url: raw.attributionUrl,
};

const ALL = raw.listings as Listing[];

export interface ListingQuery {
  category: string;
  city: string;
  /** اسلاگ zone یا محله — خالی یعنی کل شهر */
  area?: string;
  /** وقتی area یک zone است، محله‌های زیرمجموعه‌اش */
  areaNeighborhoods?: string[];
}

export async function getListings(q: ListingQuery): Promise<Listing[]> {
  let rows = ALL.filter((l) => l.city === q.city && l.category === q.category);

  if (q.area) {
    const inZone = q.areaNeighborhoods;
    rows = inZone
      ? rows.filter((l) => l.neighborhood && inZone.includes(l.neighborhood))
      : rows.filter((l) => l.neighborhood === q.area);
  }

  // مراکزی که تلفن دارند مفیدترند — اول نمایش داده شوند
  return rows.sort((a, b) => {
    if (!!a.phone !== !!b.phone) return a.phone ? -1 : 1;
    if (a.is24h !== b.is24h) return a.is24h ? -1 : 1;
    return a.name.localeCompare(b.name, 'fa');
  });
}

/** شمارش سریع برای نمایش تعداد کنار لینک‌ها — بدون await */
export function countListings(category: string, city: string, area?: string): number {
  let rows = ALL.filter((l) => l.city === city && l.category === category);
  if (area) {
    const zoneHoods = neighborhoodsInZone(area).map((n) => n.slug);
    rows = zoneHoods.length
      ? rows.filter((l) => l.neighborhood && zoneHoods.includes(l.neighborhood))
      : rows.filter((l) => l.neighborhood === area);
  }
  return rows.length;
}

export function getListingBySlug(city: string, slug: string): Listing | undefined {
  return ALL.find((l) => l.city === city && l.slug === slug);
}

export function allListings(): Listing[] {
  return ALL;
}

/**
 * قانون طلایی ضد thin-content.
 * مرجع: docs/seo/00-taxonomy-and-urls.md §۵
 */
export function shouldIndex(listings: Listing[]): boolean {
  return listings.length >= MIN_LISTINGS_FOR_PAGE;
}

/**
 * میانگین امتیاز مجموعه — برای AggregateRating صفحه.
 * ⚠️ فقط مراکزی که واقعاً نظر دارند شمرده می‌شوند.
 * اسکیمای rating جعلی پنالتی دستی گوگل دارد.
 */
export function aggregateRating(
  listings: Listing[],
): { value: number; count: number } | null {
  const rated = listings.filter((l) => l.rating !== undefined && (l.reviewCount ?? 0) > 0);
  if (rated.length === 0) return null;

  const count = rated.reduce((s, l) => s + (l.reviewCount ?? 0), 0);
  const value = rated.reduce((s, l) => s + l.rating! * (l.reviewCount ?? 0), 0) / count;

  return { value: Math.round(value * 10) / 10, count };
}
