/**
 * لایه‌ی داده‌ی دیدگاه کاربران.
 *
 * ⚠️ عمداً خالی است و نظر نمونه ندارد.
 *
 * نظر جعلی سه مشکل دارد:
 *  ۱. گوگل برای AggregateRating جعلی پنالتی دستی می‌دهد
 *  ۲. کاربری که بر اساس نظر الکی به مرکزی مراجعه کند دیگر برنمی‌گردد
 *  ۳. صاحب کسب‌وکار می‌تواند شکایت کند
 *
 * فاز ۵: به API نست‌جی‌اس وصل می‌شود؛ هر نظر پیش از انتشار تأیید می‌شود.
 */

export interface Review {
  id: string;
  listingId: string;
  /** نام نمایشی کاربر */
  author: string;
  /** ۱ تا ۵ */
  rating: number;
  body: string;
  createdAt: Date;
  /** فقط نظرهای تأییدشده منتشر می‌شوند */
  approved: boolean;
  /** کاربر واقعاً مراجعه کرده — نشان اعتماد */
  verified?: boolean;
}

export async function getReviews(_listingId: string): Promise<Review[]> {
  // TODO فاز ۵ — GET /api/listings/:id/reviews
  return [];
}

/** آخرین نظرهای کل سایت — برای صفحه‌ی اصلی */
export async function getRecentReviews(_limit = 6): Promise<Review[]> {
  // TODO فاز ۵ — GET /api/reviews?recent
  return [];
}

export function ratingSummary(reviews: Review[]) {
  const ok = reviews.filter((r) => r.approved);
  if (ok.length === 0) return null;

  const total = ok.reduce((s, r) => s + r.rating, 0);
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: ok.filter((r) => Math.round(r.rating) === star).length,
  }));

  return {
    value: Math.round((total / ok.length) * 10) / 10,
    count: ok.length,
    dist,
  };
}
