/**
 * ساخت کاور مقالات بلاگ.
 *
 * چرا تولیدی و نه عکس استوک: عکس استوک مجوز می‌خواهد و معمولاً از CDN
 * خارجی لود می‌شود (ضربه به LCP و در ایران گاهی غیرقابل دسترس).
 * کاور هندسی برند‌محور سبک است، یکدست است و مجوز نمی‌خواهد.
 *
 * ⚠️ librsvg تابع oklch() را نمی‌شناسد، پس رنگ‌ها با scripts/oklch.mjs
 * به hex تبدیل می‌شوند تا با پالت سایت یکی بمانند.
 *
 * اجرا: node scripts/make-covers.mjs
 */
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';
import { oklch } from './oklch.mjs';

const font = readFileSync(
  'C:/project/moopet/apps/web/public/fonts/Vazirmatn-ExtraBold.woff2',
).toString('base64');

/** hue هر کاور با دسته‌ی مرتبطش هماهنگ است (مطابق src/lib/theme.ts) */
const covers = [
  { file: 'choosing-a-vet-in-tehran', title: 'انتخاب دامپزشک', hue: 163, icon: 'stethoscope' },
  { file: 'pet-emergency-signs', title: 'نشانه‌های اورژانسی', hue: 25, icon: 'alert' },
];

const icons = {
  stethoscope:
    'M18 4v9a6 6 0 0 1-12 0V4 M12 19a4 4 0 0 0 8 0v-3 M20 12a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z',
  alert: 'M12 3 2 20h20L12 3Z M12 9v5 M12 17.5v.01',
};

mkdirSync('C:/project/moopet/apps/web/public/blog', { recursive: true });

for (const c of covers) {
  const bg1 = oklch(0.96, 0.035, c.hue);
  const bg2 = oklch(0.9, 0.06, c.hue);
  const deco1 = oklch(0.84, 0.09, c.hue);
  const deco2 = oklch(0.86, 0.08, c.hue);
  const accent = oklch(0.71, 0.158, 42);
  const iconC = oklch(0.45, 0.11, c.hue);
  const dots = oklch(0.45, 0.09, c.hue);
  const titleC = oklch(0.32, 0.07, c.hue);
  const subC = oklch(0.45, 0.05, c.hue);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <style>
      @font-face { font-family:'Vazirmatn'; src:url(data:font/woff2;base64,${font}) format('woff2'); font-weight:800; }
      .t { font-family:'Vazirmatn'; font-weight:800; }
    </style>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>

  <circle cx="1040" cy="120" r="190" fill="${deco1}" opacity="0.5"/>
  <circle cx="150" cy="560" r="150" fill="${deco2}" opacity="0.45"/>
  <circle cx="980" cy="520" r="70" fill="${accent}" opacity="0.25"/>

  <g fill="${dots}" opacity="0.10">
    ${Array.from({ length: 10 }, (_, r) =>
      Array.from({ length: 20 }, (_, col) => `<circle cx="${40 + col * 60}" cy="${45 + r * 62}" r="3.5"/>`).join(''),
    ).join('')}
  </g>

  <g transform="translate(120 170) scale(7)" fill="none" stroke="${iconC}"
     stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">
    ${icons[c.icon].split(' M').map((s, i) => `<path d="${i === 0 ? s : 'M' + s}"/>`).join('')}
  </g>

  <text class="t" x="1100" y="360" font-size="82" text-anchor="start" direction="rtl"
        fill="${titleC}">${c.title}</text>

  <rect x="1020" y="410" width="80" height="7" rx="3.5" fill="${accent}"/>

  <text class="t" x="1100" y="500" font-size="34" text-anchor="start" direction="rtl"
        fill="${subC}">مجله موپت</text>
</svg>`;

  const out = `C:/project/moopet/apps/web/public/blog/${c.file}.png`;
  await sharp(Buffer.from(svg)).png({ quality: 88 }).toFile(out);
  console.log('✓', out);
}
