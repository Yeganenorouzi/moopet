import raw from '../data/taxonomy.json';

/**
 * منبع حقیقت تاکسونومی — از src/data/taxonomy.json خوانده می‌شود.
 * مستندات: docs/seo/00-taxonomy-and-urls.md
 */

export type CategoryKind = 'business' | 'service';

export interface Category {
  slug: string;
  fa: string;
  /** شکل جمع — برای H1 استفاده می‌شود: «دامپزشکی‌های سعادت آباد» */
  faPlural: string;
  kind: CategoryKind;
  /** ۱ = مهم‌ترین. ترتیب نمایش و اولویت محتوا */
  priority: number;
  opportunity: string | null;
}

export interface City {
  slug: string;
  fa: string;
  province: string;
  phase: number;
}

export interface Zone {
  slug: string;
  fa: string;
  city: string;
}

export interface Neighborhood {
  slug: string;
  fa: string;
  /** شکل بدون نیم‌فاصله — کاربران هر دو را تایپ می‌کنند */
  faAlt: string;
  zone: string;
  district: number;
}

export const categories: Category[] = raw.categories as Category[];
export const cities: City[] = raw.cities as City[];
export const zones: Zone[] = raw.zones as Zone[];
export const neighborhoods: Neighborhood[] = raw.neighborhoods as Neighborhood[];

/** حداقل تعداد مرکز برای ساخت صفحه — قانون ضد thin-content */
export const MIN_LISTINGS_FOR_PAGE = raw.config.minListingsForPage;

export const RESERVED_AREA_SLUGS: string[] = raw.config.reservedAreaSlugs;

// ---------------------------------------------------------------- helpers

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getZone(slug: string): Zone | undefined {
  return zones.find((z) => z.slug === slug);
}

export function getNeighborhood(slug: string): Neighborhood | undefined {
  return neighborhoods.find((n) => n.slug === slug);
}

export function neighborhoodsInZone(zoneSlug: string): Neighborhood[] {
  return neighborhoods.filter((n) => n.zone === zoneSlug);
}

/** دسته‌ها مرتب‌شده بر اساس اولویت سئویی */
export function categoriesByPriority(): Category[] {
  return [...categories].sort((a, b) => a.priority - b.priority);
}

/** دسته‌های اصلی صفحه‌ی اول — priority ۱ و ۲ */
export function primaryCategories(): Category[] {
  return categoriesByPriority().filter((c) => c.priority <= 2);
}

// ---------------------------------------------------------------- urls
// همه‌ی URLها با اسلش پایانی — باید با trailingSlash: 'always' یکی باشد.

export const url = {
  category: (c: string) => `/${c}/`,
  categoryCity: (c: string, city: string) => `/${c}/${city}/`,
  categoryZone: (c: string, city: string, zone: string) => `/${c}/${city}/${zone}/`,
  categoryHood: (c: string, city: string, hood: string) => `/${c}/${city}/${hood}/`,
  clinic: (city: string, slug: string) => `/clinic/${city}/${slug}/`,
  blogPost: (slug: string) => `/blog/${slug}/`,
};
