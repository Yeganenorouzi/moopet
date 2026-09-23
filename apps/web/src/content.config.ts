import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * مجله موپت — محتوای topical authority.
 * مقاله‌ها فایل Markdown‌اند و در زمان build به HTML استاتیک تبدیل می‌شوند.
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    /** اسلاگ دسته‌ی مرتبط — برای لینک‌سازی داخلی به صفحات دایرکتوری */
    relatedCategory: z.string().optional(),
    cover: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
