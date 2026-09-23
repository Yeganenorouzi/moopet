/**
 * نگاشت داده‌ی OSM به مدل Listing موپت.
 *
 * هر مرکز بر اساس فاصله‌ی هاورساین به نزدیک‌ترین محله نسبت داده می‌شود.
 * اگر از همه‌ی محله‌ها دورتر از MAX_KM باشد، محله نمی‌گیرد و فقط در
 * صفحه‌ی شهر دیده می‌شود — بهتر از نسبت دادن اشتباه.
 *
 * خروجی: apps/web/src/data/listings.json
 */
import { readFileSync, writeFileSync } from 'node:fs';

const MAX_KM = 2.2;

const tax = JSON.parse(readFileSync('apps/web/src/data/taxonomy.json', 'utf8'));
const osm = JSON.parse(readFileSync('scripts/out/osm-tehran.json', 'utf8'));

const hoods = tax.neighborhoods.filter((n) => n.lat && n.lng);

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** اسلاگ پایدار از نام فارسی + شناسه‌ی OSM */
function slugify(name, osmId) {
  const id = osmId.split('/')[1];
  const base = name
    .replace(/[‌‏]/g, '-')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  // نام فارسی در اسلاگ نمی‌آید (تصمیم فاز ۰: اسلاگ انگلیسی)،
  // پس از شناسه‌ی OSM به عنوان کلید پایدار استفاده می‌کنیم.
  return `${base ? 'c' : 'c'}-${id}`;
}

/** دسته‌های OSM که در تاکسونومی ما معادل ندارند حذف می‌شوند */
const CATEGORY_MAP = {
  vet: 'vet',
  'pet-shop': 'pet-shop',
  'pet-grooming': 'pet-grooming',
  'pet-boarding': 'pet-boarding',
  shelter: null, // «خانه‌ی موقت» فعلاً دسته‌ی ما نیست
};

const listings = [];
let unassigned = 0;

for (const r of osm.rows) {
  const category = CATEGORY_MAP[r.category];
  if (!category || !r.name) continue;

  let hood = null;
  let best = Infinity;
  for (const h of hoods) {
    const d = haversineKm({ lat: r.lat, lng: r.lng }, { lat: h.lat, lng: h.lng });
    if (d < best) {
      best = d;
      hood = h;
    }
  }
  if (best > MAX_KM) {
    hood = null;
    unassigned++;
  }

  const addressParts = [r.street, r.housenumber].filter(Boolean).join(' ');

  listings.push({
    id: r.osmId,
    slug: slugify(r.name, r.osmId),
    name: r.name.trim(),
    category,
    services: [],
    city: 'tehran',
    neighborhood: hood?.slug ?? null,
    // آدرس واقعی اگر OSM داشت؛ وگرنه فقط محله — هیچ آدرسی از خود درنمی‌آوریم
    address: addressParts || (hood ? `${hood.fa}، تهران` : 'تهران'),
    phone: r.phone?.replace(/\s+/g, ' ').trim() ?? null,
    is24h: /24\/7/.test(r.openingHours ?? ''),
    openingHours: r.openingHours ?? null,
    website: r.website ?? null,
    lat: r.lat,
    lng: r.lng,
    source: 'osm',
  });
}

// ── آمار ──
const byCat = {};
const byHood = {};
for (const l of listings) {
  byCat[l.category] = (byCat[l.category] ?? 0) + 1;
  if (l.neighborhood) byHood[l.neighborhood] = (byHood[l.neighborhood] ?? 0) + 1;
}

console.log('کل مراکز:', listings.length);
console.log('بر اساس دسته:', byCat);
console.log('بدون محله (فقط صفحه‌ی شهر):', unassigned);
console.log('دارای تلفن:', listings.filter((l) => l.phone).length);
console.log('شبانه‌روزی:', listings.filter((l) => l.is24h).length);

const MIN = tax.config.minListingsForPage;
const eligible = Object.entries(byHood)
  .filter(([, c]) => c >= MIN)
  .sort((a, b) => b[1] - a[1]);

console.log(`\n── محله‌هایی که به آستانه‌ی ${MIN} رسیدند ──`);
for (const [slug, c] of eligible) {
  const h = tax.neighborhoods.find((n) => n.slug === slug);
  console.log(`  ${String(c).padStart(3)} × ${h.fa}`);
}
console.log(`\n${eligible.length} محله صفحه‌ی ایندکس‌شدنی می‌گیرند.`);

writeFileSync(
  'apps/web/src/data/listings.json',
  JSON.stringify(
    {
      source: 'OpenStreetMap',
      license: 'ODbL',
      attribution: '© مشارکت‌کنندگان OpenStreetMap',
      attributionUrl: 'https://www.openstreetmap.org/copyright',
      importedAt: new Date().toISOString(),
      listings,
    },
    null,
    2,
  ),
);
console.log('→ apps/web/src/data/listings.json');
