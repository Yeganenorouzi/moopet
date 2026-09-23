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

/**
 * نرمال‌سازی شماره — منطق آینه‌ی apps/web/src/lib/phone.ts
 * اینجا اعمال می‌شود تا داده از ریشه تمیز ذخیره شود، نه فقط در نمایش.
 */
function normalizePhone(raw) {
  if (!raw) return null;
  let s = String(raw).replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));

  // OSM گاهی چند شماره را با ; در یک فیلد می‌گذارد — اولی را بردار
  s = s.split(/[;,/|]/)[0].replace(/\D/g, '');

  if (s.startsWith('0098')) s = s.slice(4);
  else if (s.startsWith('98') && !s.startsWith('980')) s = s.slice(2);

  if (!s.startsWith('0')) s = '0' + s;
  return s.length >= 6 ? s : null;
}

function phoneKind(n) {
  if (/^09\d{9}$/.test(n)) return 'mobile';
  if (/^0\d{2}\d{8}$/.test(n)) return 'landline';
  if (/^021\d{4,7}$/.test(n)) return 'short';
  return 'unknown';
}

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
    phone: normalizePhone(r.phone),
    is24h: /24\/7/.test(r.openingHours ?? ''),
    openingHours: r.openingHours ?? null,
    website: r.website ?? null,
    lat: r.lat,
    lng: r.lng,
    source: 'osm',
  });
}

// ────────────────────────────────────────────────────────────────
// حذف تکراری‌ها
//
// OSM گاهی یک کسب‌وکار را دو بار دارد (یک بار node، یک بار way؛ یا دو
// مشارکت‌کننده‌ی مختلف). نتیجه‌اش هم برای کاربر بد است (یک کلینیک دو بار
// در لیست) هم برای سئو (دو صفحه با عنوان یکسان = کانیبالیزیشن).
//
// معیار: نام یکسان (نرمال‌شده) + فاصله‌ی کمتر از ۳۰۰ متر.
// رکوردی می‌ماند که داده‌ی بیشتری دارد.
// ────────────────────────────────────────────────────────────────
const normName = (s) =>
  s
    .replace(/[‌‏]/g, ' ')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const richness = (l) =>
  (l.phone ? 4 : 0) + (l.openingHours ? 2 : 0) + (l.website ? 1 : 0) +
  (l.address && l.address !== 'تهران' ? 1 : 0);

const kept = [];
let merged = 0;

for (const l of listings) {
  const twin = kept.find(
    (k) =>
      k.category === l.category &&
      normName(k.name) === normName(l.name) &&
      haversineKm({ lat: k.lat, lng: k.lng }, { lat: l.lat, lng: l.lng }) < 0.3,
  );

  if (!twin) {
    kept.push(l);
    continue;
  }

  merged++;
  // نگه داشتن غنی‌ترین نسخه، و پر کردن فیلدهای خالی از نسخه‌ی دیگر
  const [win, lose] = richness(l) > richness(twin) ? [l, twin] : [twin, l];
  win.phone ??= lose.phone;
  win.openingHours ??= lose.openingHours;
  win.website ??= lose.website;
  if (win.address === 'تهران' && lose.address !== 'تهران') win.address = lose.address;
  if (win !== twin) kept[kept.indexOf(twin)] = win;
}

console.log(`تکراری‌های ادغام‌شده: ${merged}`);
listings.length = 0;
listings.push(...kept);

// ── رفع ابهام عنوان ──
// اگر دو کسب‌وکارِ واقعاً متفاوت نام یکسانی در یک محله داشته باشند
// (مثلاً دو شعبه‌ی یک برند)، عنوان صفحه باید تفکیک‌پذیر بماند.
const seen = new Map();
for (const l of listings) {
  const key = `${l.category}|${l.neighborhood}|${normName(l.name)}`;
  const n = (seen.get(key) ?? 0) + 1;
  seen.set(key, n);
  if (n > 1) {
    // خیابان اگر داشت، وگرنه شماره‌ی شعبه
    l.branch = l.address && l.address !== 'تهران' ? l.address : `شعبه ${n}`;
  }
}
console.log('نیازمند رفع ابهام عنوان:', listings.filter((l) => l.branch).length);

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

// ── کیفیت شماره‌ها ──
const kinds = {};
for (const l of listings.filter((x) => x.phone)) {
  const k = phoneKind(l.phone);
  kinds[k] = (kinds[k] ?? 0) + 1;
}
console.log('نوع شماره:', kinds);

const odd = listings.filter((l) => l.phone && phoneKind(l.phone) === 'unknown');
if (odd.length) {
  console.log('\n⚠️ شماره‌های با فرمت ناشناخته (نیاز به بررسی دستی):');
  for (const l of odd) console.log(`   ${l.phone.padEnd(14)} ${l.name}`);
}

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
