// Giao diện: vẽ state ra DOM/canvas, nhận thao tác của người chơi. Không chứa luật chơi.
import {
  FIELD, ZONE_R, startLesson, current, cameraOf, project, unproject, toCamera, focal, clipProject,
  answer, next, isFinished, passed, toMinimap, HORIZON,
} from './logic.js';

const $ = (id) => document.getElementById(id);
const field = $('field');
const minimap = $('minimap');
const ROLE_NAME = { handler: 'Handler', cutter: 'Cutter' };
const C = {
  mate: '#F5A300', opp: '#FFFFFF', ink: '#111111', accent: '#FFC93C', wrong: '#E5484D',
  grass: '#2E8B3E', stripe: '#34984A', endzone: '#25733A', rough: '#1F5A2A', line: 'rgba(255,255,255,.92)',
};

let state = null;
let screen = 'start';
let view = { w: 360, h: 480 };
let drawn = { players: 0, onScreen: 0, offScreen: 0 };
let pulse = 0;

// ---------------------------------------------------------------- màn hình

function show(name) {
  screen = name;
  for (const s of ['start', 'play', 'result']) $(`screen-${s}`).hidden = s !== name;
  window.scrollTo(0, 0);
}

function begin(role) {
  state = startLesson(role);
  $('role-label').textContent = ROLE_NAME[role];
  show('play');
  renderScenario();
}

function renderScenario() {
  const scn = current(state);
  $('progress').textContent = `${state.index + 1}/${state.total}`;
  $('score').textContent = state.score;
  $('scn-title').textContent = scn.title;
  $('prompt').textContent = scn.prompt;
  $('feedback').textContent = '';
  $('feedback').className = '';
  for (const id of ['minimap', 'legend', 'explain', 'next']) $(id).hidden = true;
  $('hint').hidden = false;
  $('hint').textContent = '👆 Chạm vào mặt cỏ chỗ bạn sẽ chạy tới';
  $('next').firstChild.textContent = state.index === state.total - 1 ? 'Xem kết quả ' : 'Tiếp ';
  drawField();
}

function showResult() {
  const ok = passed(state);
  $('result-role').textContent = `Bài ${ROLE_NAME[state.role]} · vertical stack`;
  $('final-score').textContent = `${state.score}/${state.total}`;
  $('verdict').textContent = ok ? 'Qua bài! 🐝' : 'Chưa qua — thử lại nhé';
  $('verdict').className = ok ? 'win' : '';
  $('verdict-sub').textContent = ok
    ? 'Bạn đọc sân tốt rồi. Ra sân tập thử nhé!'
    : `Cần đúng ít nhất 4/${state.total}. Xem lại sơ đồ đáp án rồi chơi lại.`;
  show('result');
  if (ok) confetti();
}

// ---------------------------------------------------------------- chạm sân

function onTap(ev) {
  if (!state || state.answered) return;
  const rect = field.getBoundingClientRect();
  const sx = ((ev.clientX - rect.left) / rect.width) * view.w;
  const sy = ((ev.clientY - rect.top) / rect.height) * view.h;
  const point = unproject(cameraOf(current(state)), sx, sy, view);
  ripple(ev.clientX - rect.left, ev.clientY - rect.top);
  if (!point) {
    $('hint').textContent = '👇 Chạm thấp hơn — vào mặt cỏ nhé';
    return;
  }
  state = answer(state, point);
  const fb = $('feedback');
  if (state.correct) {
    fb.textContent = 'Đúng! +1';
    fb.className = 'ok';
    floatText('+1', ev.clientX - rect.left, ev.clientY - rect.top);
    const sc = $('score');
    sc.textContent = state.score;
    sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump');
  } else {
    fb.textContent = 'Chưa đúng';
    fb.className = 'no';
    field.classList.remove('shake'); void field.offsetWidth; field.classList.add('shake');
  }
  $('hint').hidden = true;
  $('explain').textContent = current(state).explain;
  for (const id of ['minimap', 'legend', 'explain', 'next']) $(id).hidden = false;
  startPulse();
  drawMinimap();
}

function onNext() {
  if (!state || !state.answered) return;
  if (isFinished(state)) return showResult();
  state = next(state);
  renderScenario();
}

// ---------------------------------------------------------------- vẽ sân góc nhìn thứ nhất

function setupCanvas(cv, w, h) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  cv.width = Math.round(w * dpr);
  cv.height = Math.round(h * dpr);
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function poly(ctx, pts, fill, stroke, lw = 1) {
  if (pts.length < 3) return;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.sx, p.sy) : ctx.moveTo(p.sx, p.sy)));
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}

const rect = (x0, y0, x1, y1) => [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
const circle = (c, r, n = 40) => Array.from({ length: n }, (_, i) => ({ x: c.x + r * Math.cos((i / n) * 2 * Math.PI), y: c.y + r * Math.sin((i / n) * 2 * Math.PI) }));

function line(ctx, cam, a, b, color, width) {
  const za = toCamera(cam, a).z;
  const zb = toCamera(cam, b).z;
  const near = 0.31; // nhích hơn NEAR một chút để điểm vừa cắt vẫn chiếu được
  if (za < near && zb < near) return;
  const cut = (p, q, zp, zq) => { const t = (near - zp) / (zq - zp); return { x: p.x + t * (q.x - p.x), y: p.y + t * (q.y - p.y) }; };
  if (za < near) a = cut(a, b, za, zb);
  if (zb < near) b = cut(b, a, zb, za);
  const pa = project(cam, a, view);
  const pb = project(cam, b, view);
  ctx.beginPath();
  ctx.moveTo(pa.sx, pa.sy);
  ctx.lineTo(pb.sx, pb.sy);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function drawField() {
  if (!state) return;
  const w = field.clientWidth || 360;
  view = { w, h: w };
  const ctx = setupCanvas(field, view.w, view.h);
  const scn = current(state);
  const cam = cameraOf(scn);
  const f = focal(cam, view);
  const hy = view.h * HORIZON;

  // trời: xanh đậm như logo CLB, sáng dần về đường chân trời
  const sky = ctx.createLinearGradient(0, 0, 0, hy);
  sky.addColorStop(0, '#050A1F');
  sky.addColorStop(1, '#1560E0');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, view.w, hy + 1);
  ctx.fillStyle = '#0A2A6E';
  ctx.beginPath();
  ctx.moveTo(0, hy);
  for (let x = 0; x <= view.w; x += 24) ctx.lineTo(x, hy - 6 - 5 * Math.abs(Math.sin(x * 0.05 + scn.me.heading)));
  ctx.lineTo(view.w, hy);
  ctx.fill();

  // cỏ ngoài sân
  const rough = ctx.createLinearGradient(0, hy, 0, view.h);
  rough.addColorStop(0, '#174A22');
  rough.addColorStop(1, C.rough);
  ctx.fillStyle = rough;
  ctx.fillRect(0, hy, view.w, view.h - hy);

  // sân, vệt cắt cỏ mỗi 8m (giúp cảm nhận khoảng cách), endzone
  poly(ctx, clipProject(cam, rect(0, 0, FIELD.length, FIELD.width), view), C.grass);
  for (let x = FIELD.endzone; x < FIELD.length - FIELD.endzone; x += 16) {
    poly(ctx, clipProject(cam, rect(x, 0, Math.min(x + 8, FIELD.length - FIELD.endzone), FIELD.width), view), C.stripe);
  }
  poly(ctx, clipProject(cam, rect(0, 0, FIELD.endzone, FIELD.width), view), C.endzone);
  poly(ctx, clipProject(cam, rect(FIELD.length - FIELD.endzone, 0, FIELD.length, FIELD.width), view), C.endzone);
  const L = FIELD.length;
  const W = FIELD.width;
  const E = FIELD.endzone;
  for (const [a, b] of [[[0, 0], [L, 0]], [[0, W], [L, W]], [[0, 0], [0, W]], [[L, 0], [L, W]], [[E, 0], [E, W]], [[L - E, 0], [L - E, W]]]) {
    line(ctx, cam, { x: a[0], y: a[1] }, { x: b[0], y: b[1] }, C.line, 2);
  }

  // vạch mốc khoảng cách tính từ chân bạn: giúp ước lượng "chạy bao xa"
  ctx.font = '600 11px Oswald, sans-serif';
  ctx.textAlign = 'center';
  for (const d of [5, 10, 15]) {
    const arc = [];
    for (let a = -0.75; a <= 0.75001; a += 0.05) arc.push(project(cam, { x: cam.x + d * Math.cos(cam.heading + a), y: cam.y + d * Math.sin(cam.heading + a) }, view));
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(255,255,255,.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    arc.filter(Boolean).forEach((p, i) => (i ? ctx.lineTo(p.sx, p.sy) : ctx.moveTo(p.sx, p.sy)));
    ctx.stroke();
    ctx.setLineDash([]);
    const mid = project(cam, { x: cam.x + d * Math.cos(cam.heading), y: cam.y + d * Math.sin(cam.heading) }, view);
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    ctx.fillText(`${d}m`, mid.sx, mid.sy - 3);
  }

  // đáp án (sau khi chạm): vùng đúng + chỗ đã chạm
  if (state.answered) {
    const glow = 0.35 + 0.25 * Math.sin(pulse * 10);
    poly(ctx, clipProject(cam, circle(scn.zone, ZONE_R), view), `rgba(245,163,0,${glow})`, C.accent, 3);
    const t = state.tap && project(cam, state.tap, view);
    if (t) { // dấu ✕ cỡ cố định tại chỗ đã chạm
      ctx.lineCap = 'round';
      for (const [color, lw] of [[C.ink, 7], [state.correct ? '#FFFFFF' : C.wrong, 4]]) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(t.sx - 8, t.sy - 8); ctx.lineTo(t.sx + 8, t.sy + 8);
        ctx.moveTo(t.sx + 8, t.sy - 8); ctx.lineTo(t.sx - 8, t.sy + 8);
        ctx.stroke();
      }
      ctx.lineCap = 'butt';
    }
  }

  // cầu thủ: vẽ từ xa tới gần
  const people = [
    ...scn.teammates.map((p, i) => ({ p, kind: 'mate', holder: i === 0 })),
    ...scn.opponents.map((p) => ({ p, kind: 'opp' })),
  ].map((o) => ({ ...o, cam: toCamera(cam, o.p) }));
  const onScreen = [];
  const offScreen = [];
  for (const o of people) {
    const s = project(cam, o.p, view);
    if (s && s.sx > -10 && s.sx < view.w + 10) onScreen.push({ ...o, s });
    else offScreen.push(o);
  }
  onScreen.sort((a, b) => b.s.z - a.s.z);
  let discDrawn = false;
  for (const o of onScreen) {
    drawPerson(ctx, cam, o, f);
    if (o.holder) { drawDisc(ctx, cam, o, f); discDrawn = true; }
  }
  const holderOff = offScreen.find((o) => o.holder);
  drawOffscreen(ctx, offScreen, holderOff);

  drawn = { players: onScreen.length + offScreen.length + (discDrawn || holderOff ? 1 : 0), onScreen: onScreen.length, offScreen: offScreen.length };
}

function drawPerson(ctx, cam, o, f) {
  const { s } = o;
  const k = f / s.z; // pixel trên mỗi mét ở khoảng cách này
  const head = project(cam, o.p, view, 1.62);
  const shoulder = project(cam, o.p, view, 1.42);
  const bw = Math.max(3, 0.5 * k);
  const hr = Math.max(1.6, 0.13 * k);
  // bóng dưới chân
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.beginPath();
  ctx.ellipse(s.sx, s.sy, bw * 0.75, Math.max(1, bw * 0.18), 0, 0, Math.PI * 2);
  ctx.fill();
  const fill = o.kind === 'mate' ? C.mate : C.opp;
  const edge = o.kind === 'mate' ? C.ink : '#1B2A55';
  ctx.lineWidth = Math.max(1, Math.min(3, k * 0.05));
  ctx.strokeStyle = edge;
  // chân
  ctx.fillStyle = edge;
  ctx.fillRect(s.sx - bw * 0.32, s.sy - 0.85 * k, bw * 0.22, 0.85 * k);
  ctx.fillRect(s.sx + bw * 0.1, s.sy - 0.85 * k, bw * 0.22, 0.85 * k);
  // thân áo
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(s.sx - bw / 2, shoulder.sy, bw, s.sy - 0.8 * k - shoulder.sy, Math.min(6, bw * 0.3));
  ctx.fill();
  ctx.stroke();
  // đầu
  ctx.fillStyle = '#F2C79B';
  ctx.beginPath();
  ctx.arc(s.sx, head.sy, hr, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (o.kind === 'mate' && bw > 14) { // sọc ong trên áo đồng đội
    ctx.fillStyle = C.ink;
    const top = shoulder.sy + (s.sy - 0.8 * k - shoulder.sy) * 0.45;
    ctx.fillRect(s.sx - bw / 2 + 1, top, bw - 2, Math.max(1, 0.08 * k));
  }
}

function drawDisc(ctx, cam, o, f) {
  const k = f / o.s.z;
  const hand = project(cam, o.p, view, 1.05);
  const x = o.s.sx + 0.34 * k;
  const r = Math.max(4, 0.16 * k);
  ctx.fillStyle = 'rgba(255,201,60,.55)';
  ctx.beginPath();
  ctx.ellipse(x, hand.sy, r * 1.9, r * 1.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(x, hand.sy, r * 1.3, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

/** Người ngoài khung nhìn: chấm màu ở mép trái/phải, kèm số người — để biết sau lưng có ai. */
function drawOffscreen(ctx, list, holderOff) {
  const sides = { left: [], right: [] };
  for (const o of list) (o.cam.u < 0 ? sides.left : sides.right).push(o);
  if (holderOff) (holderOff.cam.u < 0 ? sides.left : sides.right).push({ kind: 'disc' });
  ctx.font = '600 11px Oswald, sans-serif';
  for (const [side, items] of Object.entries(sides)) {
    if (!items.length) continue;
    const x = side === 'left' ? 12 : view.w - 12;
    const dir = side === 'left' ? -1 : 1;
    const bottom = view.h - 18;
    items.sort((a, b) => (a.kind > b.kind ? 1 : -1));
    items.forEach((o, i) => {
      const y = bottom - i * 15;
      ctx.beginPath();
      ctx.moveTo(x + dir * 7, y);
      ctx.lineTo(x - dir * 1, y - 6);
      ctx.lineTo(x - dir * 1, y + 6);
      ctx.closePath();
      ctx.fillStyle = 'rgba(17,17,17,.75)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x - dir * 2, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = o.kind === 'mate' ? C.mate : '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = o.kind === 'disc' ? 2.5 : 1.5;
      ctx.strokeStyle = o.kind === 'disc' ? C.accent : C.ink;
      ctx.stroke();
    });
    const label = `${items.length} ngoài tầm mắt`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = side === 'left' ? 'left' : 'right';
    ctx.fillText(label, side === 'left' ? 4 : view.w - 4, bottom - items.length * 15 - 2);
  }
}

function startPulse() {
  const t0 = performance.now();
  const tick = (t) => {
    pulse = (t - t0) / 1000;
    drawField();
    if (pulse < 1.2 && state && state.answered) requestAnimationFrame(tick);
    else { pulse = 0.08; drawField(); }
  };
  requestAnimationFrame(tick);
}

// ---------------------------------------------------------------- sơ đồ nhìn từ trên (F5)

function drawMinimap() {
  const w = minimap.clientWidth || 340;
  const h = (w * FIELD.width) / FIELD.length;
  const ctx = setupCanvas(minimap, w, h);
  const scn = current(state);
  const m = (p) => toMinimap(p, w, h);
  const sc = w / FIELD.length; // pixel trên mỗi mét
  ctx.fillStyle = C.grass;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = C.endzone;
  ctx.fillRect(0, 0, FIELD.endzone * sc, h);
  ctx.fillRect(w - FIELD.endzone * sc, 0, FIELD.endzone * sc, h);
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0.75, 0.75, w - 1.5, h - 1.5);
  for (const x of [FIELD.endzone, FIELD.length - FIELD.endzone]) {
    ctx.beginPath(); ctx.moveTo(x * sc, 0); ctx.lineTo(x * sc, h); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  ctx.font = '600 10px Oswald, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('TẤN CÔNG →', w - 6, 12);

  // tầm nhìn của bạn
  const me = m(scn.me);
  const reach = 22 * sc;
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  ctx.beginPath();
  ctx.moveTo(me.mx, me.my);
  ctx.arc(me.mx, me.my, reach, scn.me.heading - 0.61, scn.me.heading + 0.61);
  ctx.closePath();
  ctx.fill();

  // vùng đúng
  const z = m(scn.zone);
  ctx.fillStyle = 'rgba(245,163,0,.45)';
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(z.mx, z.my, ZONE_R * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // cầu thủ
  const dot = (p, fill, stroke, r) => { const q = m(p); ctx.beginPath(); ctx.arc(q.mx, q.my, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = stroke; ctx.stroke(); };
  scn.opponents.forEach((p) => dot(p, '#FFFFFF', '#1B2A55', 3.5));
  scn.teammates.forEach((p) => dot(p, C.mate, C.ink, 4));
  const d = m(scn.disc);
  ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = C.accent; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(d.mx + 5, d.my - 4, 4, 2.4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // mũi tên: bạn → vùng đúng
  arrow(ctx, me.mx, me.my, z.mx, z.my, C.accent);
  dot(scn.me, C.accent, '#FFFFFF', 5.5);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 10px Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BẠN', me.mx, me.my + 15 > h - 2 ? me.my - 9 : me.my + 15);

  // chỗ bạn đã chạm
  if (state.tap) {
    const t = m(state.tap);
    ctx.strokeStyle = state.correct ? '#FFFFFF' : C.wrong;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(t.mx - 4, t.my - 4); ctx.lineTo(t.mx + 4, t.my + 4);
    ctx.moveTo(t.mx + 4, t.my - 4); ctx.lineTo(t.mx - 4, t.my + 4);
    ctx.stroke();
  }
}

function arrow(ctx, x0, y0, x1, y1, color) {
  const a = Math.atan2(y1 - y0, x1 - x0);
  const len = Math.hypot(x1 - x0, y1 - y0) - 6;
  const ex = x0 + Math.cos(a) * len;
  const ey = y0 + Math.sin(a) * len;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(ex, ey); ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(ex + Math.cos(a) * 4, ey + Math.sin(a) * 4);
  ctx.lineTo(ex - Math.cos(a - 0.5) * 9, ey - Math.sin(a - 0.5) * 9);
  ctx.lineTo(ex - Math.cos(a + 0.5) * 9, ey - Math.sin(a + 0.5) * 9);
  ctx.closePath();
  ctx.fill();
}

// ---------------------------------------------------------------- juice

function ripple(x, y) {
  const r = document.createElement('span');
  r.className = 'ripple';
  r.style.left = `${x}px`;
  r.style.top = `${y}px`;
  $('stage').append(r);
  setTimeout(() => r.remove(), 400);
}

function floatText(text, x, y) {
  const el = document.createElement('span');
  el.className = 'float';
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y - 30}px`;
  $('stage').append(el);
  setTimeout(() => el.remove(), 850);
}

function confetti() {
  for (let i = 0; i < 26; i++) {
    const c = document.createElement('span');
    c.className = 'confetti';
    c.textContent = i % 3 ? '🐝' : '🥏';
    c.style.left = `${Math.random() * 100}vw`;
    c.style.animationDuration = `${1.6 + Math.random() * 1.6}s`;
    c.style.animationDelay = `${Math.random() * 0.6}s`;
    document.body.append(c);
    setTimeout(() => c.remove(), 4000);
  }
}

function press(btn) {
  btn.classList.remove('pressed'); void btn.offsetWidth; btn.classList.add('pressed');
  setTimeout(() => btn.classList.remove('pressed'), 120);
}

// ---------------------------------------------------------------- nối sự kiện

$('role-handler').addEventListener('click', (e) => { press(e.currentTarget); begin('handler'); });
$('role-cutter').addEventListener('click', (e) => { press(e.currentTarget); begin('cutter'); });
$('next').addEventListener('click', (e) => { press(e.currentTarget); onNext(); });
$('retry').addEventListener('click', (e) => { press(e.currentTarget); state = null; show('start'); });
field.addEventListener('click', onTap);
window.addEventListener('resize', () => { if (screen === 'play') { drawField(); if (state?.answered) drawMinimap(); } });

// Hợp đồng với bot test. Đừng xoá.
window.__game = {
  state: () => {
    if (!state) return { screen, role: null, index: 0, score: 0, answered: false };
    const scn = current(state);
    const cam = cameraOf(scn);
    const z = project(cam, scn.zone, view);
    const rectEl = field.getBoundingClientRect();
    const k = rectEl.width / view.w;
    return {
      ...state,
      screen,
      camera: { x: cam.x, y: cam.y, heading: cam.heading },
      scenario: { id: scn.id, prompt: scn.prompt, explain: scn.explain },
      zoneScreen: z ? { x: z.sx * k, y: z.sy * k } : null,
      horizonY: view.h * HORIZON * k,
      drawn,
    };
  },
};
