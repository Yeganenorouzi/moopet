# وضعیت پروژه

> آخرین به‌روزرسانی: ۱ مهر ۱۴۰۵ (2026-09-23)

## عددها

```
۷۳۹  صفحه‌ی تولیدشده
۲۵۱  صفحه‌ی ایندکس‌شونده   (بقیه عمداً noindex — داده‌ی کافی ندارند)
۲۵۱  URL در sitemap        (صفر واگرایی با noindex)
۷۳۹  عنوان یکتا            (صفر تکرار)
۱۹۲  مرکز واقعی از OpenStreetMap
 ۸۳  مرکز دارای شماره تلفن
```

---

## فازها

| # | فاز | وضعیت |
|---|---|---|
| ۰ | تاکسونومی و نقشه‌ی URL | ✅ |
| ۱ | زیرساخت (Astro + NestJS + CI) | ✅ |
| ۲ | داده | ⚠️ نیمه — JSON است، دیتابیس نیست |
| ۳ | لایه‌ی سئو | ✅ |
| ۴ | صفحات دسته×مکان | ✅ |
| ۵ | پروفایل مرکز | ✅ صفحه هست، بک‌اند نیست |
| ۶ | Core Web Vitals + انیمیشن | ✅ |
| ۷ | بلاگ | ⚠️ ۲ مقاله |

---

## مسدودکننده‌ها

### ۱. دیتابیس — منتظر BIOS

Docker Desktop به WSL2 نیاز دارد و WSL2 به VT-x. روی سیستم قبلی
(Lenovo ThinkCentre) مجازی‌سازی در BIOS خاموش بود:

```
VirtualizationFirmwareEnabled : False
```

**روی سیستم جدید اول این را چک کنید:**

```powershell
(Get-CimInstance Win32_ComputerSystem).HypervisorPresent
(Get-CimInstance Win32_Processor).VirtualizationFirmwareEnabled
```

اگر `False` بود: ریستارت → BIOS (در لنوو `F1`، در بیشتر مادربردها
`Del` یا `F2`) → `Intel Virtualization Technology` → Enabled → F10 →
**خاموش و روشن کامل** (نه فقط ریستارت).

بعد از فعال شدن:
```powershell
winget install Docker.DockerDesktop
docker run -d --name moopet-db -p 5432:5432 `
  -e POSTGRES_PASSWORD=... postgis/postgis:16-3.4
```

تا آن زمان `getListings()` از `apps/web/src/data/listings.json`
می‌خواند و همه‌چیز کار می‌کند — فقط فرم ثبت کسب‌وکار و ثبت دیدگاه
جایی برای ذخیره ندارند.

### ۲. دامنه — resolve نمی‌شود

```
nslookup moopet.ir  →  Non-existent domain
```

یعنی یا ثبت نشده یا nameserver ندارد. باید در [nic.ir](https://nic.ir)
بررسی و nameserver (مثلاً کلودفلر) تعریف شود.

**تا آن زمان ایمیل `hello@moopet.ir` هم قابل ساخت نیست** چون به رکورد
MX نیاز دارد.

`moopet.ir` در دو جا هاردکد شده و اگر دامنه عوض شد هر دو باید تغییر کنند:
- `apps/web/astro.config.mjs` → `site`
- `apps/web/src/lib/site.ts` → `SITE.url`

### ۳. ۱۰۹ مرکز بدون شماره

مهم‌ترین کار غیرفنی. چرخه‌ی اکسل آماده است:

```bash
node scripts/export-missing-phones.mjs   # ساخت فایل
# پر کردن ستون نارنجی
node scripts/import-phones.mjs           # برگشت به پروژه
npm run build
```

**اولویت اول: ۲ مرکز اورژانس** («بیمارستان دامپزشکی ترنج» و
«پلی‌کلینیک دامپزشکی پت‌سفر»). این دو روی `/vet-24h/tehran/` هستند و
بدون شماره، دکمه‌ی تماس ندارند.

---

## کارهای انجام‌نشده

- `/panel/review/` — فرم ثبت دیدگاه؛ الان از چند جا لینک شده و ۴۰۴ می‌دهد
- فرم‌های تماس و ثبت کسب‌وکار به بک‌اند وصل نیستند (`action="/api/..."`)
- `openNow` در `Listing` هست ولی هیچ‌وقت مقدار نمی‌گیرد — باید از
  `openingHours` محاسبه شود
- مقالات بیشتر برای بلاگ
- هاست و انتشار

---

## تصمیم‌هایی که نباید برگردانده شوند

اینها بعد از بررسی گرفته شده‌اند؛ پیش از تغییر، دلیلشان را بخوانید:

1. **اسلاگ‌ها بعد از انتشار ثابت می‌مانند.** تغییرشان یعنی از دست دادن
   رتبه‌ی گوگل برای همه‌ی صفحات آن دسته.

2. **آستانه‌ی `minListingsForPage: 3`.** صفحه‌ی دسته×محله با کمتر از ۳
   مرکز noindex می‌شود. بدون این، ۵۲۵ صفحه‌ی خالی تولید می‌شد و کل
   دامنه در چشم گوگل بی‌کیفیت علامت می‌خورد.

3. **سایت‌مپ دستی، نه `@astrojs/sitemap`.** آن افزونه هر صفحه‌ی
   تولیدشده را وارد sitemap می‌کرد، از جمله noindexها — سیگنال متناقض
   به گوگل. سایت‌مپ ما از همان شرط `shouldIndex` استفاده می‌کند.

4. **داده از دایرکتوری رقبا کپی نمی‌شود.** دایرکتوری‌ها رکورد جعلی
   (trap entry) می‌کارند تا کپی را ردیابی کنند، و سیستم Helpful Content
   گوگل تجمیع‌کننده‌های بدون ارزش افزوده را جریمه می‌کند.

5. **نظر و امتیاز جعلی ساخته نمی‌شود.** `AggregateRating` ساختگی
   پنالتی دستی گوگل دارد.

6. **حالت اولیه‌ی انیمیشن در CSS نیست.** اگر `opacity: 0` در CSS باشد و
   جاوااسکریپت لود نشود، گوگل صفحه‌ی خالی ایندکس می‌کند. با
   `gsap.set()` ست می‌شود.

7. **`<Attribution />` حذف نشود.** الزام حقوقی مجوز ODbL داده‌ی
   OpenStreetMap است.

---

## بررسی سلامت

CI روی هر push این سه قانون را چک می‌کند. برای اجرای محلی:

```bash
npm run build
cd apps/web/dist/client

# sitemap باید دقیقاً با صفحات ایندکس‌شونده برابر باشد
grep -rL 'content="noindex' --include=index.html . | wc -l
cat sitemap/*.xml | grep -o '<loc>' | wc -l

# هر صفحه canonical و عنوان یکتا
find . -name index.html | wc -l
grep -rho '<title>[^<]*</title>' --include=index.html . | sort -u | wc -l
```
