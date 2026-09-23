/**
 * ژئوکد کردن محله‌های تهران با Nominatim و افزودن مختصات به taxonomy.json.
 *
 * چرا حدس نمی‌زنیم: نسبت دادن مرکز به محله‌ی اشتباه یعنی کاربر به آدرس
 * غلط فرستاده می‌شود — بدترین نوع خطا در یک دایرکتوری.
 *
 * ⚠️ Nominatim سقف ۱ درخواست در ثانیه دارد و User-Agent معتبر می‌خواهد.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const PATH = 'apps/web/src/data/taxonomy.json';
const tax = JSON.parse(readFileSync(PATH, 'utf8'));

const UA = 'moopet-directory/0.1 (one-off neighborhood geocoding; hello@moopet.ir)';

for (const n of tax.neighborhoods) {
  if (n.lat && n.lng) {
    console.log('⏭', n.fa, '(از قبل دارد)');
    continue;
  }

  const q = `${n.fa}، تهران، ایران`;
  const u = new URL('https://nominatim.openstreetmap.org/search');
  u.searchParams.set('q', q);
  u.searchParams.set('format', 'json');
  u.searchParams.set('limit', '1');
  u.searchParams.set('countrycodes', 'ir');

  try {
    const res = await fetch(u, { headers: { 'User-Agent': UA, 'Accept-Language': 'fa' } });
    const j = await res.json();

    if (j[0]) {
      n.lat = Number(Number(j[0].lat).toFixed(5));
      n.lng = Number(Number(j[0].lon).toFixed(5));
      console.log('✓', n.fa.padEnd(16), n.lat, n.lng);
    } else {
      console.log('✗', n.fa.padEnd(16), 'پیدا نشد');
    }
  } catch (e) {
    console.log('✗', n.fa, e.message);
  }

  await sleep(1100); // احترام به سقف نرخ Nominatim
}

writeFileSync(PATH, JSON.stringify(tax, null, 2) + '\n');
const done = tax.neighborhoods.filter((n) => n.lat).length;
console.log(`\n${done}/${tax.neighborhoods.length} محله مختصات گرفتند → ${PATH}`);
