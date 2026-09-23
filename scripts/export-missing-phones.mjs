/**
 * خروجی اکسل از مراکزی که شماره تلفن ندارند.
 *
 * فایل برای پر کردن دستی ساخته می‌شود و با scripts/import-phones.mjs
 * دوباره وارد پروژه می‌شود.
 *
 * ⚠️ ستون «شناسه» را دست نزنید — کلید تطبیق هنگام واردات است.
 *
 * اجرا: node scripts/export-missing-phones.mjs
 */
import ExcelJS from 'exceljs';
import { readFileSync, mkdirSync } from 'node:fs';

const tax = JSON.parse(readFileSync('apps/web/src/data/taxonomy.json', 'utf8'));
const data = JSON.parse(readFileSync('apps/web/src/data/listings.json', 'utf8'));

const catFa = Object.fromEntries(tax.categories.map((c) => [c.slug, c.fa]));
const hoodFa = Object.fromEntries(tax.neighborhoods.map((n) => [n.slug, n.fa]));

const missing = data.listings.filter((l) => !l.phone);

/**
 * ترتیب اولویت — مهم‌ترین‌ها اول، تا اگر وقت محدود بود بالاترین
 * ارزش زودتر پر شود:
 *   ۱. دامپزشکی شبانه‌روزی — کاربر اورژانسی بدون شماره کاری نمی‌تواند بکند
 *   ۲. دامپزشکی عادی
 *   ۳. بقیه
 * و در هر گروه، محله‌های پرتقاضا اول.
 */
const hoodCount = {};
for (const l of data.listings) {
  if (l.neighborhood) hoodCount[l.neighborhood] = (hoodCount[l.neighborhood] ?? 0) + 1;
}

const rank = (l) =>
  l.is24h && l.category === 'vet' ? 0 : l.category === 'vet' ? 1 : 2;

missing.sort((a, b) => {
  if (rank(a) !== rank(b)) return rank(a) - rank(b);
  const ca = hoodCount[a.neighborhood] ?? 0;
  const cb = hoodCount[b.neighborhood] ?? 0;
  if (ca !== cb) return cb - ca;
  return (a.neighborhood ?? '').localeCompare(b.neighborhood ?? '');
});

const wb = new ExcelJS.Workbook();
wb.creator = 'moopet';
wb.created = new Date();

const ws = wb.addWorksheet('شماره‌های خالی', {
  views: [{ rightToLeft: true, state: 'frozen', ySplit: 1 }],
});

ws.columns = [
  { header: 'اولویت', key: 'pri', width: 10 },
  { header: 'نام مرکز', key: 'name', width: 42 },
  { header: 'دسته', key: 'cat', width: 16 },
  { header: 'محله', key: 'hood', width: 16 },
  { header: 'آدرس', key: 'addr', width: 34 },
  { header: '☎ شماره تلفن', key: 'phone', width: 20 },
  { header: 'یادداشت', key: 'note', width: 24 },
  { header: 'روی نقشه', key: 'map', width: 14 },
  { header: 'شناسه (دست نزنید)', key: 'id', width: 22 },
];

const PRI = ['۱ اورژانس', '۲ دامپزشکی', '۳ سایر'];

for (const l of missing) {
  const row = ws.addRow({
    pri: PRI[rank(l)],
    name: l.name,
    cat: catFa[l.category] ?? l.category,
    hood: l.neighborhood ? hoodFa[l.neighborhood] : '—',
    addr: l.address,
    phone: '',
    note: '',
    map: l.lat ? 'باز کردن' : '',
    id: l.id,
  });

  if (l.lat && l.lng) {
    row.getCell('map').value = {
      text: 'باز کردن',
      hyperlink: `https://www.openstreetmap.org/?mlat=${l.lat}&mlon=${l.lng}#map=18/${l.lat}/${l.lng}`,
    };
    row.getCell('map').font = { color: { argb: 'FF1155CC' }, underline: true };
  }

  // ستون شماره — خانه‌ای که باید پر شود، بصری متمایز
  const p = row.getCell('phone');
  p.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF4E5' } };
  p.border = {
    top: { style: 'thin', color: { argb: 'FFE0A860' } },
    left: { style: 'thin', color: { argb: 'FFE0A860' } },
    bottom: { style: 'thin', color: { argb: 'FFE0A860' } },
    right: { style: 'thin', color: { argb: 'FFE0A860' } },
  };
  // متن، نه عدد — وگرنه اکسل صفر ابتدایی را حذف می‌کند
  p.numFmt = '@';
  p.alignment = { horizontal: 'left' };

  if (rank(l) === 0) {
    row.getCell('pri').font = { bold: true, color: { argb: 'FFB03A00' } };
  }

  row.getCell('id').font = { size: 8, color: { argb: 'FF999999' } };
}

// سربرگ
const head = ws.getRow(1);
head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2A6B5C' } };
head.height = 26;
head.alignment = { vertical: 'middle' };

ws.autoFilter = { from: 'A1', to: 'I1' };

// ───── برگه‌ی راهنما ─────
const guide = wb.addWorksheet('راهنما', { views: [{ rightToLeft: true }] });
guide.columns = [{ width: 4 }, { width: 100 }];
const lines = [
  '',
  'راهنمای پر کردن',
  '',
  '۱. فقط ستون «☎ شماره تلفن» را پر کنید (خانه‌های نارنجی).',
  '۲. ستون «شناسه» را دست نزنید — کلید تطبیق هنگام واردات است.',
  '۳. شماره را فقط با رقم بنویسید: 02144556677 یا 09121234567',
  '   نیازی به +98 یا فاصله نیست؛ سایت خودش فرمت نمایشی را می‌سازد.',
  '۴. اگر شماره پیدا نشد یا خاموش بود، خالی بگذارید و در «یادداشت» بنویسید.',
  '',
  '⚠️ شماره‌ی نادرست از نبودن شماره بدتر است.',
  '   فقط شماره‌ای را وارد کنید که خودتان تست کرده‌اید.',
  '',
  'اولویت‌ها:',
  '   ۱ اورژانس   — دامپزشکی شبانه‌روزی. کاربر نیمه‌شب بدون شماره کاری نمی‌تواند بکند.',
  '   ۲ دامپزشکی  — بیشترین حجم جست‌وجو.',
  '   ۳ سایر      — پت شاپ، آرایشگاه و بقیه.',
  '',
  'بعد از پر کردن، فایل را ذخیره کنید و اجرا کنید:',
  '   node scripts/import-phones.mjs',
];
lines.forEach((t, i) => {
  const r = guide.addRow(['', t]);
  if (i === 1) r.getCell(2).font = { bold: true, size: 14 };
  if (t.startsWith('⚠️')) r.getCell(2).font = { bold: true, color: { argb: 'FFB03A00' } };
});

mkdirSync('scripts/out', { recursive: true });
const out = 'scripts/out/moopet-missing-phones.xlsx';
await wb.xlsx.writeFile(out);

const byPri = {};
for (const l of missing) byPri[PRI[rank(l)]] = (byPri[PRI[rank(l)]] ?? 0) + 1;

console.log(`${missing.length} مرکز بدون شماره`);
console.log(byPri);
console.log('→', out);
