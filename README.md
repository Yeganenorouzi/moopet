# موپت — دایرکتوری خدمات حیوانات خانگی

دایرکتوری مراکز خدمات حیوانات خانگی تهران: دامپزشکی، پت شاپ، آرایشگاه،
پانسیون و ۱۱ دسته‌ی دیگر — به تفکیک محله.

پروژه از ابتدا حول **سئو** طراحی شده: صفحات دسته×مکان به صورت استاتیک
پیش‌رندر می‌شوند، هر صفحه canonical و عنوان یکتا دارد، و صفحاتی که داده‌ی
کافی ندارند خودکار `noindex` می‌شوند.

---

## استک

| لایه | تکنولوژی |
|---|---|
| فرانت | Astro 7 (SSG + node adapter) · Tailwind 4 · GSAP/ScrollTrigger |
| بک‌اند | NestJS 12 (در حال توسعه) |
| زبان | TypeScript |
| فونت | وزیرمتن (self-host) |

React عمداً استفاده نشده. خروجی صفحات HTML خالص است و تنها جاوااسکریپت
سایت GSAP برای انیمیشن است (۴۴KB gzip).

---

## راه‌اندازی

نیازمند **Node 22** (نسخه در `.node-version` پین شده).

```bash
npm install

npm run dev       # وب  → http://localhost:4321
npm run dev:api   # API → http://localhost:3000/api
npm run build     # خروجی پروداکشن
```

### روی ویندوز با cmd.exe

اگر Node دیگری (مثلاً لاراگون) در PATH غالب باشد، از لانچر استفاده کنید:

```cmd
dev.cmd        :: وب
dev.cmd api    :: API
```

در PowerShell و ترمینال VS Code، `fnm` خودکار نسخه را عوض می‌کند و
`npm run dev` کافی است.

---

## ساختار

```
apps/
  web/                  Astro — سایت عمومی
    src/
      data/             taxonomy.json · listings.json  ← منبع حقیقت
      lib/              taxonomy · listings · reviews · seo · theme
      components/seo/   Seo · JsonLd · Breadcrumbs
      components/ui/    کارت‌ها، فرم‌ها، ایلاستریشن
      pages/            روت‌ها + robots.txt + sitemap
  api/                  NestJS — API (فاز ۵)

docs/seo/               سند تاکسونومی و نقشه‌ی URL
scripts/                واردات داده و ابزار تصویر
```

---

## ساختار URL

```
/[category]/                          → /vet/
/[category]/tehran/                   → /vet/tehran/
/[category]/tehran/[zone]/            → /vet/tehran/west/
/[category]/tehran/[neighborhood]/    → /vet/tehran/saadat-abad/
```

اسلاگ‌ها انگلیسی‌اند و تطابق کلمه‌ی کلیدی فارسی در `<title>`، `H1` و
breadcrumb اتفاق می‌افتد. جزئیات در
[`docs/seo/00-taxonomy-and-urls.md`](docs/seo/00-taxonomy-and-urls.md).

### ⚠️ قانون ضد thin-content

صفحه‌ی دسته×محله فقط وقتی ایندکس می‌شود که حداقل ۳ مرکز داشته باشد
(`config.minListingsForPage`). بدون این قانون ۵۲۵ صفحه‌ی خالی تولید
می‌شد و کل دامنه در چشم گوگل بی‌کیفیت علامت می‌خورد.

سایت‌مپ از **همان شرط** استفاده می‌کند، پس هرگز صفحه‌ی `noindex` در
sitemap قرار نمی‌گیرد.

---

## داده

منبع پایه **OpenStreetMap** با مجوز **ODbL** است.

```bash
node scripts/fetch-osm.mjs      # واکشی خام از Overpass
node scripts/geocode-hoods.mjs  # مختصات محله‌ها (یک‌بار)
node scripts/validate-hoods.mjs # اعتبارسنجی محله ↔ منطقه
node scripts/import-osm.mjs     # نگاشت به مدل Listing
```

> **الزام مجوز:** هر صفحه‌ای که این داده را نمایش می‌دهد باید attribution
> داشته باشد. کامپوننت `<Attribution />` این کار را می‌کند — حذف آن نقض
> مجوز ODbL است.

### چه چیزی وارد پروژه نمی‌شود

داده از دایرکتوری‌های رقیب کپی نمی‌شود. دلیل فنی: دایرکتوری‌ها رکورد
جعلی (trap entry) می‌کارند تا کپی را ردیابی کنند، و سیستم Helpful Content
گوگل سایت‌های تجمیع‌کننده‌ی بدون ارزش افزوده را جریمه می‌کند.

نظر و امتیاز جعلی هم ساخته نمی‌شود — `AggregateRating` ساختگی پنالتی
دستی گوگل دارد.

---

## ابزار

```bash
node scripts/shot.mjs <url> <width> <out.png> [--full]
node scripts/find-overflow.mjs <url> [width]
node scripts/make-og.mjs
node scripts/make-covers.mjs
```

`shot.mjs` با DevTools Protocol ویوپورت را دقیق تنظیم می‌کند —
`--window-size` کروم در حالت headless قابل اتکا نیست.

---

## قوانین انیمیشن

GSAP طوری تنظیم شده که به سئو و Core Web Vitals ضربه نزند:

1. حالت اولیه با `gsap.set()` ست می‌شود، **نه در CSS** — بدون جاوااسکریپت
   محتوا کاملاً دیده می‌شود.
2. المان LCP (تیتر و تصویر هیرو) هرگز انیمیت نمی‌شود.
3. فقط `transform` و `opacity` — هیچ‌وقت `top`/`height` (جلوگیری از CLS).
4. `ScrollTrigger` بدون `pin` استفاده می‌شود.
5. زیر ۷۶۸px و با `prefers-reduced-motion` کاملاً خاموش است.
