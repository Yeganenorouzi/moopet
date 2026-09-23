/**
 * تبدیل OKLCH به hex.
 *
 * چرا لازم است: پالت سایت در CSS با oklch() تعریف شده، ولی librsvg
 * (رندرر SVG داخل sharp) این تابع را نمی‌شناسد و رنگ را سیاه می‌کند.
 * با این مبدل، اسکریپت‌های تولید تصویر از همان اعداد پالت استفاده
 * می‌کنند و رنگ‌ها با سایت یکی می‌مانند.
 *
 * @param {number} L روشنایی ۰ تا ۱
 * @param {number} C کروما
 * @param {number} H زاویه‌ی رنگ (درجه)
 */
export function oklch(L, C, H) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  // OKLab → LMS
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.089484177 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  // LMS → sRGB خطی
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];

  const toHex = (v) => {
    // گاما sRGB
    const g = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
    const n = Math.round(Math.max(0, Math.min(1, g)) * 255);
    return n.toString(16).padStart(2, '0');
  };

  return `#${lin.map(toHex).join('')}`;
}
