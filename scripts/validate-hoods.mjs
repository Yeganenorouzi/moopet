/**
 * اصلاح مختصات نادرست + اعتبارسنجی سازگاری محله با منطقه.
 *
 * Nominatim گاهی برای نام‌های مشترک (خیابان انقلاب در شهرهای مختلف،
 * اشرفی اصفهانی به عنوان نام خیابان در چند نقطه) نتیجه‌ی غلط می‌دهد.
 * نسبت دادن مرکز به محله‌ی اشتباه یعنی فرستادن کاربر به آدرس غلط.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const PATH = 'apps/web/src/data/taxonomy.json';
const tax = JSON.parse(readFileSync(PATH, 'utf8'));

/** مختصات دستی برای مواردی که ژئوکدر اشتباه کرد یا پیدا نکرد */
const FIX = {
  'ashrafi-esfahani': [35.735, 51.31],  // بزرگراه اشرفی اصفهانی — غرب، نه شرق
  enghelab: [35.7006, 51.3914],         // میدان انقلاب — مرکز، نه شهرری
  'nazi-abad': [35.647, 51.386],        // ژئوکدر پیدا نکرد
};

for (const [slug, [lat, lng]] of Object.entries(FIX)) {
  const n = tax.neighborhoods.find((x) => x.slug === slug);
  if (n) {
    console.log(`اصلاح ${n.fa}: ${n.lat ?? '—'},${n.lng ?? '—'} → ${lat},${lng}`);
    n.lat = lat;
    n.lng = lng;
  }
}

// ── اعتبارسنجی: آیا مختصات با منطقه‌ی اعلام‌شده می‌خواند؟ ──
// مرکز تقریبی تهران
const C = { lat: 35.715, lng: 51.404 };

const expect = {
  north: (n) => n.lat > C.lat,
  south: (n) => n.lat < C.lat,
  east: (n) => n.lng > C.lng,
  west: (n) => n.lng < C.lng,
  center: (n) => Math.abs(n.lat - C.lat) < 0.06 && Math.abs(n.lng - C.lng) < 0.06,
};

console.log('\n── اعتبارسنجی منطقه ──');
let bad = 0;
for (const n of tax.neighborhoods) {
  if (!n.lat) {
    console.log(`⚠️  ${n.fa} مختصات ندارد`);
    bad++;
    continue;
  }
  const ok = expect[n.zone]?.(n);
  if (!ok) {
    console.log(`⚠️  ${n.fa.padEnd(16)} zone=${n.zone.padEnd(7)} ${n.lat},${n.lng}`);
    bad++;
  }
}
console.log(bad === 0 ? '✓ همه سازگارند' : `${bad} مورد نیاز به بررسی`);

writeFileSync(PATH, JSON.stringify(tax, null, 2) + '\n');
console.log(`\n→ ${PATH}`);
