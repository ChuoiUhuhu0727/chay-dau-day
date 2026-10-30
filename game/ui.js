// Giao diện: vẽ state ra DOM/canvas, nhận thao tác của người chơi. Không chứa luật chơi.
import {
  FIELD, ZONE_R, startLesson, current, cameraOf, project, unproject, toCamera, focal, clipProject,
  answer, next, isFinished, passed, toMinimap, HORIZON, goalInfo, markerPose, GOAL,
  INTRO, EYE, introPose, runPose, runDuration, discArc,
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
let drawn = { players: 0, onScreen: 0, offScreen: 0, goal: false };
const now = () => performance.now() / 1000;
let clock = 0; // giây, chạy liên tục khi đang ở màn chơi (F8, F9)
let answeredAt = 0;
let loopId = 0;
let markerScreen = null;
// F9 · pha bóng: 'intro' (vào pha) → 'decide' (chờ chạm) → 'run' (bạn chạy tới chỗ đã chạm) → 'done'
let phase = 'intro';
let phaseStart = 0;
let run = null;
let live = null; // vị trí đang vẽ ở khung hình gần nhất (cho bot đọc)
const HINT_TAP = '👆 Chạm vào mặt cỏ chỗ bạn sẽ chạy tới';
const beeImg = new Image();
beeImg.src = './assets/bee.svg';

// ---------------------------------------------------------------- màn hình

function show(name) {
  screen = name;
  for (const s of ['start', 'play', 'result']) $(`screen-${s}`).hidden = s !== name;
  window.scrollTo(0, 0);
  if (name === 'play') startLoop();
  else stopLoop();
}

// Vòng vẽ liên tục: người kèm chuyển động, vùng đúng nhấp nháy. Chỉ chạy ở màn chơi cho đỡ tốn pin.
function startLoop() {
  if (loopId) return;
  const tick = () => {
    clock = now();
    drawField();
    loopId = requestAnimationFrame(tick);
  };
  loopId = requestAnimationFrame(tick);
}

function stopLoop() {
  cancelAnimationFrame(loopId);
  loopId = 0;
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
  $('hint').textContent = '⏳ Đang vào pha bóng…';
  $('next').firstChild.textContent = state.index === state.total - 1 ? 'Xem kết quả ' : 'Tiếp ';
  phase = 'intro';
  phaseStart = clock = now();
  run = null;
  drawField();
}

/** La bàn endzone (F7) theo camera đang vẽ — chỉ ghi DOM khi số đổi. */
function updateGoal(cam) {
  const g = goalInfo(cam);
  const deg = Math.round((g.bearing * 180) / Math.PI);
  const arrow = $('goal-arrow');
  if (arrow.dataset.deg !== String(deg)) {
    arrow.dataset.deg = deg;
    arrow.style.transform = `rotate(${deg}deg)`;
  }
  if ($('goal-dist').textContent !== String(g.distance)) $('goal-dist').textContent = g.distance;
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
  ripple(ev.clientX - rect.left, ev.clientY - rect.top);
  if (phase !== 'decide') return; // đang vào pha bóng: chưa tính
  const point = unproject(cameraOf(current(state)), sx, sy, view);
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
  answeredAt = clock;
  drawMinimap();
  // F9: bạn chạy tới chỗ vừa chạm; đĩa bay tới bạn (đúng) hoặc tới vùng đúng (sai)
  const scn = current(state);
  const d = Math.hypot(point.x - scn.me.x, point.y - scn.me.y);
  run = { to: point, start: clock, dur: runDuration(d), discTo: state.correct ? point : { x: scn.zone.x, y: scn.zone.y }, caught: false };
  phase = 'run';
}

/** Góc ngắn nhất để quay từ a sang b (radian, trong (−π, π]). */
function angleDiff(a, b) {
  const d = b - a;
  return Math.atan2(Math.sin(d), Math.cos(d));
}

/** Gọi khi đĩa tới nơi lúc chạy xong. */
function finishRun() {
  phase = 'done';
  if (state.correct && !run.caught) {
    run.caught = true;
    const fb = $('feedback');
    fb.textContent = 'Đúng! +1 · Bắt được đĩa!';
    fb.classList.remove('ok'); void fb.offsetWidth; fb.classList.add('ok');
  }
}

/**
 * Vị trí mọi thứ ở khung hình hiện tại (F9). Chấm điểm KHÔNG dùng hàm này — chỉ để vẽ.
 * Trả về camera đang vẽ, đồng đội, đối thủ, đĩa (kèm độ cao) và cờ "đang chạy" để nhún camera.
 */
function snapshot(scn) {
  const base = cameraOf(scn);
  let cam = base;
  let mates = scn.teammates;
  let opps = scn.opponents;
  let disc = { ...scn.disc, h: 1.05, held: true };
  let moving = false;
  let shift = { x: 0, y: 0 }; // người kèm bạn đuổi theo khi bạn chạy

  if (phase === 'intro') {
    const p = introPose(scn, clock - phaseStart);
    cam = { ...base, x: p.cam.x, y: p.cam.y };
    mates = p.mates;
    opps = p.opps;
    disc = { ...p.disc, h: discArc(p.discU), held: p.u >= 1 };
    moving = p.u < 1;
    if (p.u >= 1) { phase = 'decide'; $('hint').textContent = HINT_TAP; }
  } else {
    // cả sân vẫn sống khi bạn đang nghĩ: đồng đội nhún, nhích; người cầm đĩa xoay người giả động tác
    mates = scn.teammates.map((p, i) => i === 0
      ? { x: p.x + 0.35 * Math.sin(clock * 3.1), y: p.y + 0.25 * Math.sin(clock * 1.7) }
      : { x: p.x + 0.3 * Math.sin(clock * 1.9 + i * 1.3), y: p.y + 0.35 * Math.cos(clock * 1.4 + i * 2.1) });
    disc = { ...mates[0], h: 1.05, held: true };
  }

  if (run && (phase === 'run' || phase === 'done')) {
    const u = Math.min(1, (clock - run.start) / run.dur);
    const at = runPose(scn.me, run.to, u);
    // nửa đầu: ngoái nửa vòng theo hướng chạy; nửa sau: quay mặt về người cầm đĩa để bắt (như cutter thật)
    const holder0 = scn.teammates[0];
    const hRun = scn.me.heading + angleDiff(scn.me.heading, Math.atan2(run.to.y - scn.me.y, run.to.x - scn.me.x)) * 0.5;
    const hEnd = Math.atan2(holder0.y - run.to.y, holder0.x - run.to.x);
    const heading = u < 0.5
      ? scn.me.heading + angleDiff(scn.me.heading, hRun) * (u / 0.5)
      : hRun + angleDiff(hRun, hEnd) * ((u - 0.5) / 0.5);
    cam = { ...base, x: at.x, y: at.y, heading };
    moving = u < 1;
    const lag = runPose(scn.me, run.to, Math.max(0, u - 0.12));
    shift = { x: lag.x - scn.me.x, y: lag.y - scn.me.y };
    // đĩa: rời tay người cầm đĩa ngay khi bạn bắt đầu chạy, tới nơi cùng lúc bạn tới
    const holder = mates[0];
    if (u < 1) disc = { ...runPose(holder, run.discTo, u), h: discArc(u), held: false };
    else disc = state.correct ? { ...run.discTo, h: 1.05, held: false, mine: true } : { ...run.discTo, h: 0.04, held: false };
    if (u >= 1 && phase === 'run') finishRun();
  }
  if (moving) cam = { ...cam, h: EYE + 0.045 * Math.sin(clock * 2 * Math.PI * 2.6) }; // nhún theo bước chạy
  return { cam, mates, opps, disc, shift };
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
  const snap = snapshot(scn);
  const cam = snap.cam;
  live = { camera: { x: cam.x, y: cam.y, heading: cam.heading }, mates: snap.mates.map((p) => ({ x: p.x, y: p.y })), disc: snap.disc };
  updateGoal(cam);
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
  for (let x = 0; x <= view.w; x += 24) ctx.lineTo(x, hy - 6 - 5 * Math.abs(Math.sin(x * 0.05 + cam.heading * 6)));
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
  const goalSeen = drawGoal(ctx, cam, f);

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
    const since = clock - answeredAt;
    const glow = since < 1.2 ? 0.35 + 0.25 * Math.sin(since * 10) : 0.4;
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

  // cầu thủ: vẽ từ xa tới gần. Người kèm bạn chuyển động mạnh (F8), người kèm khác lắc nhẹ tại chỗ.
  let lunge = 0;
  const people = [
    ...snap.mates.map((p, i) => ({ p, kind: 'mate', holder: i === 0 })),
    ...snap.opps.map((p, i) => {
      if (i === scn.myMarker) {
        const pose = markerPose({ x: p.x + snap.shift.x, y: p.y + snap.shift.y }, { x: cam.x, y: cam.y }, clock);
        lunge = pose.lunge;
        return { p: pose, kind: 'mine', arms: pose.arms };
      }
      const sway = 0.15 * Math.sin(clock * 2.4 + i * 1.7);
      return { p: { x: p.x, y: p.y + sway }, kind: 'opp', arms: 0.35 + 0.25 * Math.sin(clock * 3 + i) };
    }),
  ].map((o) => ({ ...o, cam: toCamera(cam, o.p) }));
  const onScreen = [];
  const offScreen = [];
  for (const o of people) {
    const s = project(cam, o.p, view);
    if (s && s.sx > -10 && s.sx < view.w + 10) onScreen.push({ ...o, s });
    else offScreen.push(o);
  }
  // đĩa đang bay (F9) được xếp lớp theo khoảng cách như một vật trên sân
  const d = snap.disc;
  const ds = !d.held && !d.mine ? project(cam, d, view) : null;
  if (ds && ds.sx > -10 && ds.sx < view.w + 10) onScreen.push({ kind: 'disc', p: d, s: ds });
  onScreen.sort((a, b) => b.s.z - a.s.z);
  let discDrawn = !!ds || !!d.mine;
  for (const o of onScreen) {
    if (o.kind === 'disc') { drawFlyingDisc(ctx, cam, o, f); continue; }
    drawPerson(ctx, cam, o, f);
    if (o.holder && d.held) { drawDisc(ctx, cam, o, f); discDrawn = true; }
  }
  if (d.mine) drawCaughtDisc(ctx);
  const holderOff = d.held ? offScreen.find((o) => o.holder) : null;
  drawOffscreen(ctx, offScreen, holderOff);

  // áp lực: người kèm lao sát (hoặc đứng sau lưng) → viền đỏ chớp
  const mine = onScreen.find((o) => o.kind === 'mine');
  markerScreen = mine ? { sx: mine.s.sx, sy: mine.s.sy } : null;
  const behind = scn.markedBehind && !mine && offScreen.some((o) => o.kind === 'mine');
  field.classList.toggle('pressure', mine ? lunge > 0.7 : behind && Math.sin(clock * 6) > 0.4);
  if (behind) warnBehind(ctx);

  drawn = {
    players: onScreen.length + offScreen.length + (discDrawn || holderOff ? 1 : 0),
    onScreen: onScreen.length, offScreen: offScreen.length, goal: goalSeen,
  };
}

/** Đĩa đang bay: bóng mờ trên cỏ + đĩa trắng ở độ cao h. */
function drawFlyingDisc(ctx, cam, o, f) {
  const k = f / o.s.z;
  const up = project(cam, o.p, view, o.p.h);
  const r = Math.max(4, 0.16 * k);
  ctx.fillStyle = 'rgba(0,0,0,.25)';
  ctx.beginPath(); ctx.ellipse(o.s.sx, o.s.sy, r * 1.2, r * 0.35, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,201,60,.6)';
  ctx.beginPath(); ctx.ellipse(up.sx, up.sy, r * 2, r * 1.1, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(up.sx, up.sy, r * 1.3, r * 0.5, Math.sin(clock * 20) * 0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

/** Bắt được đĩa: đĩa nằm trong tay bạn ở mép dưới khung. */
function drawCaughtDisc(ctx) {
  const x = view.w * 0.62;
  const y = view.h - 26;
  ctx.fillStyle = 'rgba(255,201,60,.55)';
  ctx.beginPath(); ctx.ellipse(x, y, 62, 26, -0.12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(x, y, 48, 18, -0.12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = C.mate;
  ctx.beginPath(); ctx.ellipse(x, y, 32, 11, -0.12, 0, Math.PI * 2); ctx.stroke();
}

function warnBehind(ctx) {
  const text = '⚠ Người kèm sau lưng!';
  ctx.font = '600 13px Oswald, sans-serif';
  const w = ctx.measureText(text).width + 20;
  const x = view.w - w - 10;
  ctx.globalAlpha = 0.7 + 0.3 * Math.sin(clock * 6);
  ctx.fillStyle = C.wrong;
  ctx.beginPath(); ctx.roundRect(x, 10, w, 26, 13); ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, 23);
  ctx.textBaseline = 'alphabetic';
  ctx.globalAlpha = 1;
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
  const fill = { mate: C.mate, opp: C.opp, mine: C.wrong }[o.kind];
  const edge = o.kind === 'opp' ? '#1B2A55' : C.ink;
  ctx.lineWidth = Math.max(1, Math.min(3, k * 0.05));
  ctx.strokeStyle = edge;
  if (o.arms !== undefined) { // tay giang ra phòng thủ: 0 = buông chéo xuống, 1 = giang cao
    const arm = 0.72 * k;
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(2, 0.11 * k);
    for (const side of [-1, 1]) {
      const a = (0.25 + 1.45 * (side < 0 ? o.arms : 1 - o.arms * 0.6)) ; // hai tay lệch nhịp
      ctx.beginPath();
      ctx.moveTo(s.sx + side * bw * 0.45, shoulder.sy + 0.06 * k);
      ctx.lineTo(s.sx + side * (bw * 0.45 + Math.sin(a) * arm), shoulder.sy + 0.06 * k + Math.cos(a) * arm);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
    ctx.lineWidth = Math.max(1, Math.min(3, k * 0.05));
  }
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
  if (o.kind === 'mine') { // nhãn trên đầu người kèm bạn
    const y = Math.max(16, head.sy - hr - 14);
    ctx.font = '600 12px Oswald, sans-serif';
    const w = ctx.measureText('KÈM BẠN').width + 14;
    ctx.fillStyle = C.wrong;
    ctx.beginPath(); ctx.roundRect(s.sx - w / 2, y - 10, w, 20, 10); ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('KÈM BẠN', s.sx, y);
    ctx.textBaseline = 'alphabetic';
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
      const blink = o.kind === 'mine' ? 1 + 0.5 * Math.max(0, Math.sin(clock * 6)) : 1;
      ctx.arc(x - dir * 2, y, 5 * blink, 0, Math.PI * 2);
      ctx.fillStyle = { mate: C.mate, mine: C.wrong }[o.kind] ?? '#FFFFFF';
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

// ---------------------------------------------------------------- endzone đích (F7)

/** Tô endzone đích vàng, sơn chữ ENDZONE trên cỏ, cắm cờ 4 góc, dựng cổng "GHI ĐIỂM". Trả về true nếu thấy cổng. */
function drawGoal(ctx, cam, f) {
  const x0 = GOAL.line;
  const x1 = FIELD.length;
  const W = FIELD.width;
  poly(ctx, clipProject(cam, rect(x0, 0, x1, W), view), 'rgba(245,163,0,.30)');

  // chữ ENDZONE sơn trên cỏ: biến hình chữ nhật chữ thành tứ giác phối cảnh (xấp xỉ affine)
  const tl = project(cam, { x: x0 + 7, y: 6 }, view);
  const tr = project(cam, { x: x0 + 7, y: W - 6 }, view);
  const bl = project(cam, { x: x0 + 2, y: 6 }, view);
  if (tl && tr && bl && Math.abs(goalInfo(cam).bearing) < 1.2) {
    const TW = 300;
    const TH = 60;
    ctx.save();
    ctx.transform((tr.sx - tl.sx) / TW, (tr.sy - tl.sy) / TW, (bl.sx - tl.sx) / TH, (bl.sy - tl.sy) / TH, tl.sx, tl.sy);
    ctx.font = '900 56px Montserrat, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    ctx.fillText('ENDZONE', TW / 2, TH / 2, TW);
    ctx.restore();
  }

  // cờ vàng ở 4 góc
  for (const p of [{ x: x0, y: 0 }, { x: x0, y: W }, { x: x1, y: 0 }, { x: x1, y: W }]) {
    const foot = project(cam, p, view);
    if (!foot) continue;
    const top = project(cam, p, view, 1.6);
    const k = f / foot.z;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = Math.max(1, 0.05 * k);
    ctx.beginPath(); ctx.moveTo(foot.sx, foot.sy); ctx.lineTo(top.sx, top.sy); ctx.stroke();
    ctx.fillStyle = C.mate;
    ctx.beginPath();
    ctx.moveTo(top.sx, top.sy);
    ctx.lineTo(top.sx + Math.max(4, 0.6 * k), top.sy + Math.max(2, 0.2 * k));
    ctx.lineTo(top.sx, top.sy + Math.max(4, 0.4 * k));
    ctx.fill();
  }

  // cổng vòm "GHI ĐIỂM" ở vạch cuối sân
  const L = project(cam, { x: x1, y: W / 2 - 7 }, view);
  const R = project(cam, { x: x1, y: W / 2 + 7 }, view);
  if (!L || !R) return false;
  const k = f / ((L.z + R.z) / 2);
  const H = 4.2;
  const Lt = project(cam, { x: x1, y: W / 2 - 7 }, view, H);
  const Rt = project(cam, { x: x1, y: W / 2 + 7 }, view, H);
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = Math.max(2, 0.3 * k);
  ctx.beginPath(); ctx.moveTo(L.sx, L.sy); ctx.lineTo(Lt.sx, Lt.sy); ctx.moveTo(R.sx, R.sy); ctx.lineTo(Rt.sx, Rt.sy); ctx.stroke();
  const bh = Math.max(10, 1.4 * k);
  const left = Math.min(Lt.sx, Rt.sx);
  const bw = Math.abs(Rt.sx - Lt.sx);
  const by = Math.min(Lt.sy, Rt.sy) - bh / 2;
  if (bw < 6) return false;
  ctx.fillStyle = C.ink;
  ctx.strokeStyle = C.mate;
  ctx.lineWidth = Math.max(1.5, bh * 0.12);
  ctx.beginPath(); ctx.roundRect(left, by, bw, bh, bh * 0.25); ctx.fill(); ctx.stroke();
  const fs = Math.min(bh * 0.62, bw / 7);
  if (fs >= 5) {
    ctx.font = `900 ${fs}px Montserrat, sans-serif`;
    ctx.fillStyle = C.accent;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GHI ĐIỂM', left + bw / 2 + fs * 0.6, by + bh / 2);
    if (beeImg.complete && beeImg.naturalWidth) ctx.drawImage(beeImg, left + bw / 2 - fs * 3.6, by + bh / 2 - fs * 0.6, fs * 1.2, fs * 1.2);
  }
  ctx.textBaseline = 'alphabetic';
  return L.sx < view.w && R.sx > 0;
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
    if (!state) return { screen, role: null, index: 0, score: 0, answered: false, animating: loopId !== 0 };
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
      goal: goalInfo(live ? live.camera : cam), // theo camera đang vẽ, khớp với la bàn #goal
      marker: markerScreen ? { sx: markerScreen.sx * k, sy: markerScreen.sy * k } : null,
      animating: loopId !== 0,
      phase,
      live,
      drawn,
    };
  },
};
