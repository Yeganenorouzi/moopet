/**
 * اسکرین‌شات و بررسی سرریز افقی با ویوپورت دقیق.
 *
 * `--window-size` در حالت headless قابل اتکا نیست (کروم ابعاد را با احتساب
 * chrome پنجره تنظیم می‌کند). به جایش Emulation.setDeviceMetricsOverride
 * ویوپورت را دقیقاً همان چیزی می‌کند که می‌خواهیم.
 *
 * استفاده: node scripts/shot.mjs <url> <width> <out.png> [--full]
 */
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const URL_ = process.argv[2] ?? 'http://localhost:4321/';
const WIDTH = Number(process.argv[3] ?? 390);
const OUT = process.argv[4] ?? 'shot.png';
const FULL = process.argv.includes('--full');
const PORT = 9334;
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`,
  '--no-first-run',
  '--user-data-dir=' + process.env.TEMP + '\\moopet-cdp2',
  'about:blank',
]);

let ws;
try {
  let targets;
  for (let i = 0; i < 40; i++) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
      if (targets.some((t) => t.type === 'page' && t.webSocketDebuggerUrl)) break;
    } catch {}
    await sleep(500);
  }
  const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let id = 0;
  const send = (method, params = {}) =>
    new Promise((res) => {
      const myId = ++id;
      const onMsg = (e) => {
        const m = JSON.parse(e.data);
        if (m.id === myId) { ws.removeEventListener('message', onMsg); res(m.result); }
      };
      ws.addEventListener('message', onMsg);
      ws.send(JSON.stringify({ id: myId, method, params }));
    });

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: WIDTH,
    height: 900,
    deviceScaleFactor: 1,
    mobile: WIDTH < 700,
  });

  await send('Page.navigate', { url: URL_ });
  await sleep(3500);

  // اسکرول تا پایین تا ScrollTrigger همه‌ی بخش‌ها را فعال کند
  await send('Runtime.evaluate', {
    expression: `(async () => {
      // scroll-behavior: smooth در CSS باعث می‌شود بازگشت به بالا انیمیت شود
      // و اسکرین‌شات وسط راه گرفته شود — موقتاً خاموشش می‌کنیم.
      const prev = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      const h = document.body.scrollHeight;
      for (let y = 0; y < h; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 90)); }
      window.scrollTo(0, 0);
      await new Promise(r => setTimeout(r, 500));
      document.documentElement.style.scrollBehavior = prev;
    })()`,
    awaitPromise: true,
  });

  // بررسی سرریز
  const { result } = await send('Runtime.evaluate', {
    expression: `(() => {
      const vw = document.documentElement.clientWidth;
      const docW = document.documentElement.scrollWidth;
      const out = [];
      document.querySelectorAll('*').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width === 0) return;
        if (r.right > vw + 1 || r.left < -1) {
          out.push({ tag: el.tagName.toLowerCase(), cls: (el.getAttribute('class')||'').slice(0,80),
                     left: Math.round(r.left), right: Math.round(r.right) });
        }
      });
      return JSON.stringify({ vw, docW, n: out.length, sample: out.slice(0,12) });
    })()`,
    returnByValue: true,
  });

  const d = JSON.parse(result.value);
  console.log(`viewport ${d.vw}px | scrollWidth ${d.docW}px | ${d.docW > d.vw ? '⚠️ سرریز ' + (d.docW - d.vw) + 'px' : '✓ بدون سرریز'}`);
  for (const o of d.sample) console.log(`  ${o.tag.padEnd(7)} L:${String(o.left).padStart(5)} R:${String(o.right).padStart(5)}  ${o.cls}`);

  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: FULL,
    ...(FULL ? {} : {}),
  });
  writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
  console.log('→', OUT);
} finally {
  ws?.close();
  chrome.kill();
}
