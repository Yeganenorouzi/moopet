/**
 * پیدا کردن المان‌هایی که از عرض viewport بیرون می‌زنند.
 * با DevTools Protocol کار می‌کند تا نیازی به playwright نباشد.
 *
 * استفاده:  node scripts/find-overflow.mjs <url> [width]
 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const URL_ = process.argv[2] ?? 'http://localhost:4321/';
const WIDTH = Number(process.argv[3] ?? 390);
const PORT = 9333;
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  `--remote-debugging-port=${PORT}`,
  `--window-size=${WIDTH},1200`,
  '--no-first-run',
  '--user-data-dir=' + process.env.TEMP + '\\moopet-cdp',
  URL_,
]);

let ws;
try {
  // صبر تا بالا آمدن دیباگر
  let targets;
  for (let i = 0; i < 40; i++) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
      if (targets.some((t) => t.type === 'page' && t.webSocketDebuggerUrl)) break;
    } catch {}
    await sleep(500);
  }

  const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!page) throw new Error('هیچ page target پیدا نشد');

  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });

  let id = 0;
  const send = (method, params) =>
    new Promise((res) => {
      const myId = ++id;
      const onMsg = (e) => {
        const m = JSON.parse(e.data);
        if (m.id === myId) {
          ws.removeEventListener('message', onMsg);
          res(m.result);
        }
      };
      ws.addEventListener('message', onMsg);
      ws.send(JSON.stringify({ id: myId, method, params }));
    });

  await sleep(2500); // اجازه‌ی لود فونت و اجرای اسکریپت‌ها

  const expr = `(() => {
    const vw = document.documentElement.clientWidth;
    const docW = document.documentElement.scrollWidth;
    const out = [];
    document.querySelectorAll('*').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      // در RTL سرریز معمولاً به سمت چپ (منفی) یا راست بیش از vw است
      if (r.right > vw + 1 || r.left < -1) {
        out.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.getAttribute('class')||'').slice(0,90),
          left: Math.round(r.left),
          right: Math.round(r.right),
          width: Math.round(r.width),
        });
      }
    });
    return JSON.stringify({ vw, docW, overflowing: out.slice(0, 25) }, null, 1);
  })()`;

  const { result } = await send('Runtime.evaluate', {
    expression: expr,
    returnByValue: true,
  });

  const data = JSON.parse(result.value);
  console.log(`viewport: ${data.vw}px   document.scrollWidth: ${data.docW}px`);
  console.log(
    data.docW > data.vw
      ? `⚠️ سرریز افقی: ${data.docW - data.vw}px\n`
      : '✓ بدون سرریز افقی\n',
  );
  for (const o of data.overflowing) {
    console.log(
      `${o.tag.padEnd(8)} L:${String(o.left).padStart(6)} R:${String(o.right).padStart(6)} W:${String(o.width).padStart(5)}  ${o.cls}`,
    );
  }
} finally {
  ws?.close();
  chrome.kill();
}
