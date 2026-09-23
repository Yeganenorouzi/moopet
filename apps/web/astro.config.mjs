// @ts-check
import { defineConfig } from 'astro/config';

import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  /**
   * ⚠️ حیاتی برای سئو — بدون این، canonical و sitemap کار نمی‌کنند.
   * اگر دامنه چیز دیگری است همین‌جا و در src/lib/site.ts عوض شود.
   */
  site: 'https://moopet.ir',

  /**
   * همه‌ی صفحات به صورت پیش‌فرض استاتیک (SSG).
   * صفحات داینامیک (search/panel/auth) با `export const prerender = false` انتخاب می‌شوند.
   * مرجع: docs/seo/00-taxonomy-and-urls.md §۶
   */
  output: 'static',

  /**
   * ⚠️ باید با نقشه‌ی URL یکی باشد: /vet/tehran/saadat-abad/
   * ناسازگاری اسلش پایانی = دو URL برای یک محتوا = duplicate content.
   */
  trailingSlash: 'always',

  build: {
    // خروجی: /vet/tehran/saadat-abad/index.html
    format: 'directory',
  },

  adapter: node({
    mode: 'standalone',
  }),

  /**
   * @astrojs/sitemap عمداً استفاده نمی‌شود.
   * آن افزونه هر صفحه‌ی تولیدشده را وارد sitemap می‌کرد، از جمله صفحاتی
   * که به دلیل نداشتن مرکز کافی noindex هستند — یعنی سیگنال متناقض به گوگل.
   * به جایش سایت‌مپ دستی در src/pages/sitemap/ ساخته می‌شود که از همان
   * شرط shouldIndex استفاده می‌کند و هرگز واگرا نمی‌شود.
   */
  integrations: [],

  vite: {
    plugins: [tailwindcss()],
  },
});
