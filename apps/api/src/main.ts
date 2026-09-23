import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  /**
   * حذف هدر X-Powered-By.
   * همان هدری که با آن بک‌اند رقبا را شناسایی کردیم — افشای غیرضروری اطلاعات.
   */
  app.getHttpAdapter().getInstance().disable('x-powered-by');

  /**
   * پیشوند /api برای همه‌ی روت‌ها تا با مسیرهای سئویی سایت تداخل نکند.
   * مرجع: docs/seo/00-taxonomy-and-urls.md §۶
   */
  app.setGlobalPrefix('api');

  /**
   * CORS برای توسعه‌ی لوکال — Astro روی 4321 به API روی 3000 درخواست می‌زند.
   * در پروداکشن با دامنه‌ی واقعی جایگزین می‌شود.
   */
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? [
      'http://localhost:4321',
      'http://127.0.0.1:4321',
    ],
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`🐾 moopet API → http://localhost:${port}/api`);
}
await bootstrap();
