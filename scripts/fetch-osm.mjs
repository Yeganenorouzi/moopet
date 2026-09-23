/**
 * واکشی مراکز خدمات حیوانات از OpenStreetMap برای تهران.
 *
 * چرا OSM: داده‌ی باز با مجوز ODbL — استفاده‌ی تجاری آزاد است، فقط
 * attribution لازم دارد. برخلاف کپی از دایرکتوری رقیب، این داده قانونی
 * است، trap entry ندارد، و می‌توانیم رویش ارزش افزوده بسازیم.
 *
 * ⚠️ الزام مجوز: در صفحه‌ای که این داده نمایش داده می‌شود باید نوشته شود
 *    «© مشارکت‌کنندگان OpenStreetMap» با لینک به openstreetmap.org/copyright
 *
 * خروجی: scripts/out/osm-tehran.json
 */
import { writeFileSync, mkdirSync } from 'node:fs';

// محدوده‌ی تهران: جنوب، غرب، شمال، شرق
const BBOX = '35.55,51.10,35.85,51.61';

const query = `
[out:json][timeout:90];
(
  node["amenity"="veterinary"](${BBOX});
  way["amenity"="veterinary"](${BBOX});
  node["shop"="pet"](${BBOX});
  way["shop"="pet"](${BBOX});
  node["shop"="pet_grooming"](${BBOX});
  way["shop"="pet_grooming"](${BBOX});
  node["amenity"="animal_boarding"](${BBOX});
  node["amenity"="animal_shelter"](${BBOX});
);
out center tags;
`;

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

let data = null;
for (const ep of ENDPOINTS) {
  try {
    console.log('تلاش:', ep);
    const res = await fetch(ep, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // Overpass بدون User-Agent معتبر گاهی 406 می‌دهد
        'User-Agent': 'moopet-directory/0.1 (data import; contact hello@moopet.ir)',
      },
      body: new URLSearchParams({ data: query }),
    });
    console.log('  HTTP', res.status);
    if (!res.ok) {
      console.log('  ', (await res.text()).slice(0, 200));
      continue;
    }
    data = await res.json();
    break;
  } catch (e) {
    console.log('  خطا:', e.message);
  }
}

if (!data) {
  console.error('هیچ endpointی پاسخ نداد.');
  process.exit(1);
}

const els = data.elements ?? [];
console.log('\nکل عناصر:', els.length);

const kindOf = (t = {}) =>
  t.amenity === 'veterinary'
    ? 'vet'
    : t.shop === 'pet'
      ? 'pet-shop'
      : t.shop === 'pet_grooming'
        ? 'pet-grooming'
        : t.amenity === 'animal_boarding'
          ? 'pet-boarding'
          : t.amenity === 'animal_shelter'
            ? 'shelter'
            : 'other';

const rows = els.map((e) => {
  const t = e.tags ?? {};
  return {
    osmId: `${e.type}/${e.id}`,
    category: kindOf(t),
    name: t.name ?? t['name:fa'] ?? null,
    nameEn: t['name:en'] ?? null,
    phone: t.phone ?? t['contact:phone'] ?? null,
    website: t.website ?? t['contact:website'] ?? null,
    street: t['addr:street'] ?? null,
    housenumber: t['addr:housenumber'] ?? null,
    city: t['addr:city'] ?? null,
    openingHours: t.opening_hours ?? null,
    lat: e.lat ?? e.center?.lat ?? null,
    lng: e.lon ?? e.center?.lon ?? null,
  };
});

// آمار کیفیت داده — تعیین می‌کند چقدر کار دستی لازم است
const stat = (f) => rows.filter((r) => r[f]).length;
const byCat = {};
for (const r of rows) byCat[r.category] = (byCat[r.category] ?? 0) + 1;

console.log('بر اساس دسته:', byCat);
console.log('دارای نام   :', stat('name'));
console.log('دارای تلفن  :', stat('phone'));
console.log('دارای آدرس  :', stat('street'));
console.log('دارای ساعت  :', stat('openingHours'));
console.log('دارای مختصات:', stat('lat'));

// فقط رکوردهای قابل استفاده: نام + مختصات حداقل لازم است
const usable = rows.filter((r) => r.name && r.lat);
console.log('\n✅ قابل استفاده (نام + مختصات):', usable.length);

mkdirSync('scripts/out', { recursive: true });
writeFileSync(
  'scripts/out/osm-tehran.json',
  JSON.stringify({ fetchedAt: new Date().toISOString(), bbox: BBOX, rows: usable }, null, 2),
);
console.log('→ scripts/out/osm-tehran.json');

console.log('\nنمونه:');
for (const r of usable.slice(0, 8)) {
  console.log(` ${r.category.padEnd(13)} ${(r.name ?? '').slice(0, 34).padEnd(36)} ${r.phone ?? '—'}`);
}
