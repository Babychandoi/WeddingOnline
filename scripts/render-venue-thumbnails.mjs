// Renders a still of every venue theme into apps/web/public/venues/<id>.webp (640×400),
// used by the venue cards and pickers. Needs the web app running and Google Chrome.
//
//   BASE_URL=http://127.0.0.1:3000 node scripts/render-venue-thumbnails.mjs [venue-id ...]
//
// Each still is a capture of /khong-gian/<id>?capture=1 (no overlay, camera not rotating).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const ROOT = process.cwd();
const BASE = (process.env.BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const OUT_DIR = path.join(ROOT, 'apps', 'web', 'public', 'venues');
const CHROME =
  process.env.CHROME_PATH ||
  [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].find((p) => fs.existsSync(p));
const PORT = 9341;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const { VENUE_THEMES } = createRequire(import.meta.url)(path.join(ROOT, 'packages/shared/dist/index.js'));
const only = process.argv.slice(2);
const venues = VENUE_THEMES.filter((v) => only.length === 0 || only.includes(v.id));

if (!CHROME) {
  console.error('Google Chrome not found; set CHROME_PATH.');
  process.exit(1);
}
fs.mkdirSync(OUT_DIR, { recursive: true });

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'dco-thumbs-'));
const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--hide-scrollbars',
    // RENDER_GPU=1 draws on the machine's graphics card (much faster with the photoreal
    // pipeline); the default software renderer works anywhere, including CI
    ...(process.env.RENDER_GPU === '1'
      ? ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=default']
      : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']),
    'about:blank',
  ],
  { stdio: 'ignore' }
);

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const waiters = [];
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    } else if (msg.method) {
      for (const w of waiters.splice(0)) (w.method === msg.method ? w.resolve(msg) : waiters.push(w));
    }
  };
  return {
    ready: new Promise((r) => (ws.onopen = r)),
    send: (method, params = {}) =>
      new Promise((resolve, reject) => {
        const msgId = ++id;
        pending.set(msgId, { resolve, reject });
        ws.send(JSON.stringify({ id: msgId, method, params }));
      }),
    once: (method) => new Promise((resolve) => waiters.push({ method, resolve })),
    close: () => ws.close(),
  };
}

try {
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break;
    } catch {}
    await sleep(250);
  }
  const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
  const page = connect(target.webSocketDebuggerUrl);
  await page.ready;
  await page.send('Page.enable');
  await page.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });

  let done = 0;
  for (const venue of venues) {
    const loaded = page.once('Page.loadEventFired');
    await page.send('Page.navigate', { url: `${BASE}/khong-gian/${venue.id}?capture=1` });
    await loaded;
    // Wait until the lighting is final (photographed environment loaded) and a few more frames
    // have been drawn after it — on a software renderer one frame can take many seconds
    const evaluate = async (expression) => (await page.send('Runtime.evaluate', { expression, returnByValue: true })).result.value;
    const deadline = Date.now() + 120_000;
    let readyAt = null;
    let settled = false;
    while (Date.now() < deadline) {
      const state = await evaluate('({ env: Boolean(window.__venueEnvReady), frames: window.__venueFrames || 0 })');
      if (state?.env && readyAt === null) readyAt = state.frames;
      if (readyAt !== null && state.frames >= readyAt + 4) {
        settled = true;
        break;
      }
      await sleep(250);
    }
    if (!settled) process.stdout.write(`\n  ! ${venue.id}: scene not settled after 120 s, capturing anyway\n`);
    // Streamed models (stage cake, gate crest) get a moment more
    await sleep(1200);
    const { data } = await page.send('Page.captureScreenshot', {
      format: 'webp',
      quality: 80,
      clip: { x: 0, y: 0, width: 1280, height: 800, scale: 0.5 },
    });
    fs.writeFileSync(path.join(OUT_DIR, `${venue.id}.webp`), Buffer.from(data, 'base64'));
    done += 1;
    process.stdout.write(`\r${done}/${venues.length} ${venue.id}                    `);
  }
  process.stdout.write('\n');
  page.close();
} catch (err) {
  console.error('\nrender failed:', err.message);
  process.exitCode = 1;
} finally {
  chrome.kill();
}
