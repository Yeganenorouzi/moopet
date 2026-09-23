/**
 * تبدیل فرمت opening_hours استاندارد OSM به فارسی خوانا + اسکیمای گوگل.
 * مرجع فرمت: https://wiki.openstreetmap.org/wiki/Key:opening_hours
 *
 * پارسر کامل آن گرامر پیچیده است؛ اینجا فقط الگوهای رایج پوشش داده
 * می‌شوند و هر چیز ناشناخته خام برگردانده می‌شود — بهتر از نمایش غلط.
 */

const DAY_FA: Record<string, string> = {
  Mo: 'دوشنبه',
  Tu: 'سه‌شنبه',
  We: 'چهارشنبه',
  Th: 'پنجشنبه',
  Fr: 'جمعه',
  Sa: 'شنبه',
  Su: 'یکشنبه',
};

/** نام روز در schema.org */
const DAY_SCHEMA: Record<string, string> = {
  Mo: 'Monday',
  Tu: 'Tuesday',
  We: 'Wednesday',
  Th: 'Thursday',
  Fr: 'Friday',
  Sa: 'Saturday',
  Su: 'Sunday',
};

const ORDER = ['Sa', 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr'];

export interface HoursRule {
  days: string[];
  from: string;
  to: string;
}

function expandDays(spec: string): string[] {
  const out: string[] = [];
  for (const part of spec.split(',')) {
    const m = part.trim().match(/^([A-Za-z]{2})-([A-Za-z]{2})$/);
    if (m) {
      const all = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
      let i = all.indexOf(m[1]);
      const end = all.indexOf(m[2]);
      if (i === -1 || end === -1) continue;
      for (let n = 0; n < 7; n++) {
        out.push(all[i]);
        if (i === end) break;
        i = (i + 1) % 7;
      }
    } else if (DAY_FA[part.trim()]) {
      out.push(part.trim());
    }
  }
  return out;
}

export function parseHours(raw: string | null | undefined): HoursRule[] | null {
  if (!raw) return null;
  if (/24\/7/.test(raw)) return [{ days: ORDER, from: '00:00', to: '24:00' }];

  const rules: HoursRule[] = [];
  for (const chunk of raw.split(';')) {
    const m = chunk.trim().match(/^([A-Za-z,\-]+)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
    if (!m) continue;
    const days = expandDays(m[1]);
    if (days.length) rules.push({ days, from: m[2], to: m[3] });
  }
  return rules.length ? rules : null;
}

export function isAlways(raw: string | null | undefined): boolean {
  return /24\/7/.test(raw ?? '');
}

/** خروجی فارسی برای نمایش — روزها به ترتیب هفته‌ی ایرانی (شنبه اول) */
export function formatHoursFa(raw: string | null | undefined): string[] | null {
  const rules = parseHours(raw);
  if (!rules) return null;
  if (isAlways(raw)) return ['همه‌ی روزها، ۲۴ ساعته'];

  return rules.map((r) => {
    const sorted = [...r.days].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
    const names = sorted.map((d) => DAY_FA[d]).filter(Boolean);
    const label =
      names.length >= 6 ? 'همه‌ی روزها' : names.length ? names.join('، ') : '—';
    return `${label}: ${toFaDigits(r.from)} تا ${toFaDigits(r.to)}`;
  });
}

function toFaDigits(s: string): string {
  return s.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

/** OpeningHoursSpecification برای JSON-LD */
export function hoursSchema(raw: string | null | undefined) {
  const rules = parseHours(raw);
  if (!rules) return undefined;

  return rules.map((r) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: r.days.map((d) => DAY_SCHEMA[d]).filter(Boolean),
    opens: r.from,
    closes: r.to === '24:00' ? '23:59' : r.to,
  }));
}
