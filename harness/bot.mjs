#!/usr/bin/env node
// Harness Automation Test — bot tự mở game trong Chrome, tự chơi như người, chụp ảnh từng bước,
// rồi viết báo cáo. Đây là "mắt" của harness: AI không tự nhìn được game, bot nhìn thay.
//
//   node harness/bot.mjs            → chơi, ghi reports/latest/report.html
//   node harness/bot.mjs --quiet    → chỉ in kết quả (verify.sh dùng)
//
// Không cần cài gì thêm: điều khiển Chrome qua DevTools Protocol bằng WebSocket có sẵn của Node 22.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from './serve.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'reports', 'latest');
const QUIET = process.argv.includes('--quiet');
const MAX_LEVELS = 5;
const log = (...a) => { if (!QUIET) console.log(...a); };

function findChrome() {
  const candidates = [
    process.env.CHROME,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  ].filter(Boolean);
  const found = candidates.find((p) => existsSync(p));
  if (!found) throw new Error('Không tìm thấy Chrome. Cài Google Chrome hoặc đặt biến CHROME=/đường/dẫn/chrome');
  return found;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launchChrome() {
  const profile = await mkdtemp(path.join(tmpdir(), 'mini-harness-'));
  const proc = spawn(findChrome(), [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--window-size=480,820', 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise((resolve, reject) => {
    let buf = '';
    const timer = setTimeout(() => reject(new Error('Chrome không khởi động được')), 15000);
    proc.stderr.on('data', (d) => {
      buf += d;
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) { clearTimeout(timer); resolve(m[1]); }
    });
  });
  return { proc, profile, wsUrl };
}

/** Kết nối CDP tối giản: send(method, params) và nghe sự kiện. */
async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    } else if (msg.method) listeners.forEach((fn) => fn(msg));
  };
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const msgId = ++id;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params, sessionId }));
    });
  return { send, on: (fn) => listeners.push(fn), close: () => ws.close() };
}

async function run() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const server = await startServer(0);
  const url = `http://127.0.0.1:${server.address().port}/`;
  const chrome = await launchChrome();
  const cdp = await connect(chrome.wsUrl);

  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  const page = (m, p) => cdp.send(m, p, sessionId);

  const errors = [];
  cdp.on((msg) => {
    if (msg.sessionId !== sessionId) return;
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '));
  });
  await page('Runtime.enable');
  await page('Page.enable');
  await page('Emulation.setDeviceMetricsOverride', { width: 480, height: 820, deviceScaleFactor: 1, mobile: true });

  const evaluate = async (expression) => {
    const r = await page('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    return r.result.value;
  };
  const shots = [];
  const shot = async (label) => {
    const { data } = await page('Page.captureScreenshot', { format: 'png' });
    const file = `${String(shots.length + 1).padStart(2, '0')}.png`;
    await writeFile(path.join(OUT, file), Buffer.from(data, 'base64'));
    shots.push({ file, label });
  };
  const checks = [];
  const check = (name, ok, detail = '') => { checks.push({ name, ok, detail }); log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`); };

  try {
    await page('Page.navigate', { url });
    let ready = false;
    for (let i = 0; i < 50 && !ready; i++) { await sleep(100); ready = await evaluate('!!window.__game').catch(() => false); }
    check('Game mở được và có window.__game', ready);
    if (!ready) throw new Error('stop');
    await shot('Mở game');

    for (let level = 1; level <= MAX_LEVELS; level++) {
      const name = await evaluate(`document.getElementById('level-name')?.textContent ?? 'level ${level}'`);
      const total = (await evaluate('window.__game.cars()')).length;
      check(`${name}: có xe trong bãi`, total > 0, `${total} xe`);
      let taps = 0;
      for (; taps < 40; taps++) {
        const cars = await evaluate('window.__game.cars()');
        if (cars.length === 0) break;
        // Chạm thử từng xe như người chơi, xe nào đi được thì đi.
        let moved = false;
        for (const id of cars) {
          const before = cars.length;
          await evaluate(`document.querySelector('[data-car="${id}"]').click()`);
          await sleep(450);
          const after = (await evaluate('window.__game.cars()')).length;
          if (after < before) { moved = true; await shot(`${name}: chạm xe ${id} → ra bãi`); break; }
        }
        if (!moved) break;
      }
      const left = (await evaluate('window.__game.cars()')).length;
      check(`${name}: đưa hết xe ra bãi`, left === 0, left ? `còn ${left} xe không đi được` : '');
      const shown = await evaluate(`(() => { const el = document.getElementById('complete'); return !!el && !el.hidden; })()`);
      check(`${name}: hiện màn "Hoàn thành!"`, shown);
      await shot(`${name}: kết thúc`);
      const hasNext = await evaluate(`!!document.getElementById('next')`);
      if (!shown || !hasNext) break;
      await evaluate(`document.getElementById('next').click()`);
      await sleep(400);
    }
    check('Không có lỗi JavaScript trên trang', errors.length === 0, errors.slice(0, 2).join(' | '));
  } catch (e) {
    if (e.message !== 'stop') check('Bot chạy hết kịch bản', false, e.message);
  } finally {
    cdp.close();
    chrome.proc.kill();
    server.close();
    await rm(chrome.profile, { recursive: true, force: true }).catch(() => {});
  }

  const passed = checks.every((c) => c.ok);
  await writeFile(path.join(OUT, 'report.json'), JSON.stringify({ passed, checks, shots, at: new Date().toISOString() }, null, 2));
  await writeFile(path.join(OUT, 'report.html'), reportHtml(passed, checks, shots));
  console.log(passed ? '🟢 Automation test: ĐẠT' : '🔴 Automation test: CHƯA ĐẠT');
  if (!QUIET) console.log(`Báo cáo: ${path.join(OUT, 'report.html')}`);
  return passed;
}

function reportHtml(passed, checks, shots) {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  return `<!doctype html><meta charset="utf-8"><title>Báo cáo automation test</title>
<style>body{font:16px system-ui;margin:24px;background:#F6F1E7;color:#1D1B26}h1{margin:0 0 4px}.ok{color:#0F7A70}.no{color:#B23A2A}
ul{padding-left:20px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-top:16px}
figure{margin:0;background:#fff;border-radius:12px;padding:8px}img{width:100%;border-radius:8px}figcaption{font-size:13px;margin-top:6px}</style>
<h1 class="${passed ? 'ok' : 'no'}">${passed ? '🟢 ĐẠT' : '🔴 CHƯA ĐẠT'}</h1><p>${new Date().toLocaleString('vi-VN')}</p>
<ul>${checks.map((c) => `<li class="${c.ok ? 'ok' : 'no'}">${c.ok ? '✓' : '✗'} ${esc(c.name)}${c.detail ? ` — ${esc(c.detail)}` : ''}</li>`).join('')}</ul>
<div class="grid">${shots.map((s) => `<figure><img src="${s.file}"><figcaption>${esc(s.label)}</figcaption></figure>`).join('')}</div>`;
}

process.exit((await run()) ? 0 : 1);
