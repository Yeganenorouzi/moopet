import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';

const font = readFileSync(
  'C:/project/moopet/apps/web/public/fonts/Vazirmatn-ExtraBold.woff2',
).toString('base64');

// 1200x630 — ابعاد استاندارد Open Graph
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <style>
      @font-face {
        font-family: 'Vazirmatn';
        src: url(data:font/woff2;base64,${font}) format('woff2');
        font-weight: 800;
      }
      .t { font-family: 'Vazirmatn'; font-weight: 800; fill: #ffffff; }
      .s { font-family: 'Vazirmatn'; font-weight: 800; fill: #a9d6c7; }
    </style>
    <radialGradient id="g" cx="78%" cy="18%" r="85%">
      <stop offset="0%" stop-color="#357a68"/>
      <stop offset="100%" stop-color="#1e5246"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#g)"/>

  <!-- نقطه‌چین ظریف -->
  <g fill="#ffffff" opacity="0.07">
    ${Array.from({ length: 12 }, (_, r) =>
      Array.from({ length: 24 }, (_, c) =>
        `<circle cx="${28 + c * 50}" cy="${30 + r * 52}" r="3"/>`
      ).join('')
    ).join('')}
  </g>

  <!-- پنجه -->
  <g fill="#f0a868" transform="translate(980 96) scale(3.4)">
    <ellipse cx="8" cy="7.5" rx="2.1" ry="2.8"/>
    <ellipse cx="16" cy="7.5" rx="2.1" ry="2.8"/>
    <ellipse cx="4.3" cy="13" rx="1.9" ry="2.4"/>
    <ellipse cx="19.7" cy="13" rx="1.9" ry="2.4"/>
    <path d="M12 12.2c2.9 0 5.3 2.3 5.3 4.7 0 1.9-1.4 3-3.3 3-.9 0-1.4-.3-2-.3s-1.1.3-2 .3c-1.9 0-3.3-1.1-3.3-3 0-2.4 2.4-4.7 5.3-4.7Z"/>
  </g>

  <text class="t" x="1104" y="300" font-size="74" text-anchor="start" direction="rtl">خدمات حیوانات خانگی</text>
  <text class="t" x="1104" y="396" font-size="74" text-anchor="start" direction="rtl">نزدیک خانه‌تان</text>

  <text class="s" x="1104" y="486" font-size="38" text-anchor="start" direction="rtl">دامپزشکی · پت شاپ · آرایشگاه · پانسیون</text>

  <rect x="1024" y="524" width="80" height="6" rx="3" fill="#f0a868"/>
  <text class="t" x="1104" y="590" font-size="40" text-anchor="start" direction="rtl">موپت</text>
</svg>`;

const out = 'C:/project/moopet/apps/web/public/og-default.png';
await sharp(Buffer.from(svg)).png({ quality: 90 }).toFile(out);
console.log('ساخته شد:', out);
