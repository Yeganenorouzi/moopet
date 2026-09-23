/**
 * واردات شماره‌های پرشده از اکسل به listings.json.
 *
 * اجرا: node scripts/import-phones.mjs [مسیر فایل]
 * پیش‌فرض: scripts/out/moopet-missing-phones.xlsx
 *
 * ⚠️ هیچ شماره‌ای بدون اعتبارسنجی وارد نمی‌شود. شماره‌ی بدفرمت رد
 * می‌شود و گزارش داده می‌شود، چون شماره‌ی نادرست از نبودن شماره بدتر است.
 */
import ExcelJS from 'exceljs';
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = process.argv[2] ?? 'scripts/out/moopet-missing-phones.xlsx';
const LISTINGS = 'apps/web/src/data/listings.json';

function normalizePhone(raw) {
  if (raw === null || raw === undefined) return null;
  let s = String(raw).replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  s = s.split(/[;,/|]/)[0].replace(/\D/g, '');
  if (!s) return null;
  if (s.startsWith('0098')) s = s.slice(4);
  else if (s.startsWith('98') && !s.startsWith('980')) s = s.slice(2);
  if (!s.startsWith('0')) s = '0' + s;
  return s.length >= 6 ? s : null;
}

function phoneKind(n) {
  if (/^09\d{9}$/.test(n)) return 'mobile';
  if (/^0\d{2}\d{8}$/.test(n)) return 'landline';
  if (/^0\d{2}\d{4,7}$/.test(n)) return 'short';
  return 'unknown';
}

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(FILE);
const ws = wb.getWorksheet('شماره‌های خالی') ?? wb.worksheets[0];

// نگاشت عنوان ستون → شماره، تا اگر کاربر ستون‌ها را جابه‌جا کرد هم کار کند
const headers = {};
ws.getRow(1).eachCell((cell, col) => {
  headers[String(cell.value).trim()] = col;
});
const colId = headers['شناسه (دست نزنید)'];
const colPhone = headers['☎ شماره تلفن'];
const colName = headers['نام مرکز'];

if (!colId || !colPhone) {
  console.error('✗ ستون «شناسه» یا «شماره تلفن» پیدا نشد. فایل درست است؟');
  process.exit(1);
}

const data = JSON.parse(readFileSync(LISTINGS, 'utf8'));
const byId = new Map(data.listings.map((l) => [l.id, l]));

const applied = [];
const rejected = [];
const unknownId = [];

ws.eachRow((row, i) => {
  if (i === 1) return;

  const id = String(row.getCell(colId).value ?? '').trim();
  const rawCell = row.getCell(colPhone).value;
  const raw = typeof rawCell === 'object' && rawCell !== null
    ? (rawCell.text ?? rawCell.result ?? '')
    : rawCell;

  if (!id || raw === null || raw === undefined || String(raw).trim() === '') return;

  const listing = byId.get(id);
  if (!listing) {
    unknownId.push(id);
    return;
  }

  const n = normalizePhone(raw);
  const name = String(row.getCell(colName).value ?? listing.name);

  if (!n) {
    rejected.push({ name, raw, why: 'رقم معتبری ندارد' });
    return;
  }

  const kind = phoneKind(n);
  if (kind === 'unknown') {
    rejected.push({ name, raw, why: `فرمت نامعتبر (${n})` });
    return;
  }

  listing.phone = n;
  listing.source = listing.source === 'osm' ? 'osm+manual' : 'manual';
  applied.push({ name, n, kind });
});

// ───── گزارش ─────
console.log(`✅ اعمال شد: ${applied.length}`);
for (const a of applied.slice(0, 40)) {
  console.log(`   ${a.n.padEnd(13)} ${a.kind.padEnd(9)} ${a.name.slice(0, 40)}`);
}
if (applied.length > 40) console.log(`   … و ${applied.length - 40} مورد دیگر`);

if (rejected.length) {
  console.log(`\n⚠️ رد شد: ${rejected.length}  (وارد نشدند — اصلاح کنید و دوباره اجرا کنید)`);
  for (const r of rejected) console.log(`   «${r.raw}» — ${r.why} — ${r.name.slice(0, 35)}`);
}

if (unknownId.length) {
  console.log(`\n⚠️ شناسه‌ی ناشناس: ${unknownId.length} (ستون شناسه تغییر کرده؟)`);
}

if (applied.length === 0) {
  console.log('\nهیچ تغییری ذخیره نشد.');
  process.exit(0);
}

data.importedAt = new Date().toISOString();
writeFileSync(LISTINGS, JSON.stringify(data, null, 2) + '\n');

const total = data.listings.length;
const withPhone = data.listings.filter((l) => l.phone).length;
console.log(`\n→ ${LISTINGS}`);
console.log(`دارای شماره: ${withPhone}/${total}  (قبلاً ${withPhone - applied.length})`);
console.log('\nحالا اجرا کنید:  npm run build');
