import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * انیمیشن‌های موپت — با پنج قانونی که در فاز ۰ تعیین شد.
 * مرجع: docs/seo/00-taxonomy-and-urls.md و گفت‌وگوی معماری
 *
 * ۱. حالت اولیه با gsap.set() ست می‌شود، نه در CSS.
 *    → بدون جاوااسکریپت، محتوا کاملاً دیده می‌شود و گوگل آن را می‌خواند.
 * ۲. المان LCP (تیتر و متن هیرو) هرگز انیمیت نمی‌شود.
 * ۳. فقط transform و opacity — هیچ‌وقت top/height/width (جلوگیری از CLS).
 * ۴. ScrollTrigger بدون pin استفاده می‌شود تا چیدمان جابه‌جا نشود.
 * ۵. روی موبایل و با prefers-reduced-motion خاموش است.
 */

const SELECTOR = '[data-anim]';

export function initAnimations(): void {
  const targets = document.querySelectorAll<HTMLElement>(SELECTOR);
  if (targets.length === 0) return;

  const mm = gsap.matchMedia();

  /**
   * فقط دسکتاپ + کاربری که انیمیشن را رد نکرده.
   * Core Web Vitals موبایل معیار اصلی رتبه‌بندی گوگل است، پس روی
   * موبایل هیچ کار اضافه‌ای انجام نمی‌دهیم.
   */
  mm.add(
    '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
    () => {
      targets.forEach((el) => {
        const kind = el.dataset.anim || 'up';
        const delay = Number(el.dataset.animDelay ?? 0);

        // فرزندان مستقیم پشت سر هم می‌آیند؛ وگرنه خود المان
        const stagger = el.dataset.animStagger;
        const items: Element[] = stagger
          ? Array.from(el.children)
          : [el];

        const from: gsap.TweenVars =
          kind === 'scale'
            ? { opacity: 0, scale: 0.96 }
            : kind === 'start'
              ? { opacity: 0, x: 24 } // در RTL یعنی از سمت راست
              : { opacity: 0, y: 24 };

        // ── قانون ۱: حالت اولیه اینجا ست می‌شود، نه در CSS ──
        gsap.set(items, from);

        gsap.to(items, {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.55,
          delay,
          ease: 'power2.out',
          /**
           * `amount` کل زمان پخش را ثابت نگه می‌دارد، نه زمان هر آیتم.
           * با `each` یک شبکه‌ی ۱۵تایی ۰.۷۵ ثانیه فقط صبر می‌کرد تا آخرین
           * کارت ظاهر شود — حس کندی می‌داد. حالا چه ۳ آیتم باشد چه ۳۰،
           * کل پخش حداکثر همین مقدار طول می‌کشد.
           */
          stagger: stagger ? { amount: Math.min(Number(stagger), 0.45) } : 0,
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
        });
      });

      /**
       * فونت فارسی با swap لود می‌شود و وقتی جایگزین شد ارتفاع‌ها عوض
       * می‌شوند. بدون refresh، ScrollTrigger موقعیت‌های قدیمی را نگه
       * می‌دارد و بعضی بخش‌ها هرگز trigger نمی‌شوند (یعنی نامرئی می‌مانند).
       */
      document.fonts?.ready.then(() => ScrollTrigger.refresh());

      // هنگام خروج از این breakpoint، GSAP خودش همه‌چیز را برمی‌گرداند
      return () => {
        gsap.set(
          Array.from(targets).flatMap((el) =>
            el.dataset.animStagger ? Array.from(el.children) : [el],
          ),
          { clearProps: 'all' },
        );
      };
    },
  );
}

/**
 * نوار پیشرفت مطالعه — فقط در صفحات محتوایی (بلاگ).
 * از scaleX استفاده می‌کند نه width، تا لایه‌ی compositor درگیر شود و
 * هیچ layout reflow رخ ندهد.
 */
export function initReadingProgress(bar: HTMLElement): void {
  gsap.set(bar, { scaleX: 0, transformOrigin: 'right center' });

  gsap.to(bar, {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.3,
    },
  });
}
