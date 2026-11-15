// Giao diện: vẽ state ra DOM/canvas, nhận thao tác của người chơi. Không chứa luật chơi.
import {
  FIELD, ZONE_R, startLesson, current, cameraOf, project, unproject, toCamera, focal, clipProject,
  answer, next, isFinished, passed, toMinimap, HORIZON, goalInfo, markerPose, GOAL,
  INTRO, EYE, introPose, runPose, runDuration, discArc,
  LIVES, STALL, stallCount, stallOut,
  startTutorial, comboWord, starsFor, bodyPose, lookOf,
} from './logic.js';
import { track, initTracking } from './track.js';
import { sfx, unlock, setMuted, isMuted, buzz } from './sfx.js';

const $ = (id) => document.getElementById(id);
const field = $('field');
const minimap = $('minimap');
const ROLE_NAME = { handler: 'Người ném', cutter: 'Người chạy', tutorial: 'Tập chơi' }; // F12: tên dễ hiểu
const C = {
  mate: '#F5A300', opp: '#FFFFFF', ink: '#111111', accent: '#FFC93C', wrong: '#E5484D',
  grass: '#2E8B3E', stripe: '#37A04D', endzone: '#25733A', rough: '#1F5A2A', line: 'rgba(255,255,255,.92)',
};

let state = null;
let screen = 'start';
let view = { w: 360, h: 480 };
let drawn = { players: 0, onScreen: 0, offScreen: 0, goal: false };
const now = () => performance.now() / 1000;
let clock = 0; // giây, chạy liên tục khi đang ở màn chơi (F8)
let answeredAt = 0;
let loopId = 0;
let markerScreen = null;
// F8 · pha bóng: 'intro' (vào pha) → 'decide' (chờ chạm) → 'run' (bạn chạy tới chỗ đã chạm) → 'done'
let phase = 'intro';
let phaseStart = 0;
let run = null;
let live = null; // vị trí đang vẽ ở khung hình gần nhất (cho bot đọc)
let decideAt = 0; // F10: lúc bắt đầu đếm stall
let stallNow = 0;
// F11 · tracking
let attempt = 0; // số point đã bắt đầu trong phiên này
let pointStartAt = 0;
let lastResult = null;
const HINT_TAP = '👆 Chạm vào cỏ chỗ bạn muốn chạy tới';
// F12 · phần tập chơi
let tutorialAt = 0;
// F13 · hạt bắn, F14 · tốc độ từng người (để vẽ dáng chạy)
const fx = { particles: [], last: 0 };
const motion = new Map();
let lastFrame = 0;
const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const load = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const store = (k, v) => { try { localStorage.setItem(k, v); } catch { /* trình duyệt chặn lưu: bỏ qua */ } };
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
    tickStall();
    loopId = requestAnimationFrame(tick);
  };
  loopId = requestAnimationFrame(tick);
}

function stopLoop() {
  cancelAnimationFrame(loopId);
  loopId = 0;
}

function begin(role) {
  unlock();
  if (role === 'tutorial') {
    state = startTutorial();
    tutorialAt = now();
  } else {
    state = startLesson(role);
    attempt += 1;
    pointStartAt = now();
    track('role_select', { role });
    track('point_start', { role, attempt });
    store('cdd-last-role', role);
  }
  $('screen-play').classList.toggle('tut', role === 'tutorial');
  $('role-label').textContent = ROLE_NAME[role];
  show('play');
  renderScenario();
}

function renderScenario() {
  const scn = current(state);
  $('progress').textContent = `${state.index + 1}/${state.total}`;
  $('score').textContent = state.score;
  renderPoint();
  $('stall').hidden = true;
  stallNow = 0;
  $('scn-title').textContent = scn.title;
  $('prompt').textContent = scn.prompt;
  $('feedback').textContent = '';
  $('feedback').className = '';
  for (const id of ['sheet', 'minimap', 'legend', 'explain', 'term', 'next', 'hand']) $(id).hidden = true;
  if (state.role === 'tutorial') $('role-label').textContent = `Tập ${state.index + 1}/${state.total}`;
  $('stage').classList.remove('hurry');
  $('countdown').hidden = false;
  setCountdown('3');
  $('hint').hidden = false;
  $('hint').textContent = 'Chuẩn bị…';
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

/** Kỷ lục mỗi vai, lưu trong máy. Trình duyệt chặn lưu trữ thì vẫn chạy, chỉ không nhớ. */
function saveBest(role, points) {
  const key = `cdd-best-${role}`;
  let old = 0;
  try { old = Number(localStorage.getItem(key)) || 0; } catch { /* không đọc được */ }
  const isNew = points > old;
  if (isNew) { try { localStorage.setItem(key, String(points)); } catch { /* không ghi được */ } }
  return { value: Math.max(old, points), isNew };
}

function showResult() {
  const ok = passed(state);
  $('result-role').textContent = `Bài ${ROLE_NAME[state.role]}`;
  $('final-score').textContent = `${state.score}/${state.total}`;
  countUp($('final-points'), state.points);
  showStars(starsFor(state.score));
  const best = saveBest(state.role, state.points);
  const isNew = best.isNew && state.points > 0;
  lastResult = ok ? 'score' : 'turnover';
  track('point_end', {
    role: state.role, result: lastResult, correct: state.score, points: state.points, phases_played: state.index + 1,
    duration_ms: Math.round((now() - pointStartAt) * 1000), new_best: isNew, attempt,
  });
  $('best').textContent = isNew ? '🏆 Kỷ lục mới!' : `Kỷ lục: ${best.value.toLocaleString('vi-VN')}`;
  $('best').className = isNew ? 'best new' : 'best';
  $('verdict').textContent = ok ? 'Ghi điểm! Qua bài 🐝' : 'Mất đĩa — Chưa qua';
  $('verdict').className = ok ? 'win' : '';
  $('verdict-sub').textContent = ok
    ? 'Cả đội đưa đĩa vào vùng ghi điểm. Chơi lại để phá kỷ lục nhé!'
    : `Sai ${LIVES} lần là mất đĩa. Thử lại — bạn sắp được rồi!`;
  show('result');
  sfx(ok ? 'win' : 'turnover');
  if (ok) confetti();
  if (isNew && !ok) confetti();
}

// ---------------------------------------------------------------- chạm sân

function onTap(ev) {
  if (!state || state.answered) return;
  const rect = field.getBoundingClientRect();
  const sx = ((ev.clientX - rect.left) / rect.width) * view.w;
  const sy = ((ev.clientY - rect.top) / rect.height) * view.h;
  ripple(ev.clientX - rect.left, ev.clientY - rect.top);
  sfx('tap');
  if (phase !== 'decide') return; // đang vào pha bóng: chưa tính
  const point = unproject(cameraOf(current(state)), sx, sy, view);
  if (!point) {
    $('hint').textContent = '👇 Chạm thấp hơn — vào mặt cỏ nhé';
    return;
  }
  const before = state.points;
  state = answer(state, point, stallNow);
  const fb = $('feedback');
  const x = ev.clientX - rect.left;
  const y = ev.clientY - rect.top;
  if (state.role === 'tutorial' && !state.answered) { // F12: chạm sai lúc tập → chạm lại, không phạt
    fb.textContent = 'Chưa trống! Thử lại 👀';
    fb.className = '';
    void fb.offsetWidth;
    fb.className = 'no';
    sfx('wrong');
    flash('no');
    field.classList.remove('shake'); void field.offsetWidth; field.classList.add('shake');
    return;
  }
  if (state.role !== 'tutorial') trackAnswer(state.correct ? 'correct' : 'wrong', state.points - before);
  if (state.correct) {
    const gain = state.points - before;
    fb.textContent = 'Đúng!';
    fb.className = 'ok';
    sfx('correct', { combo: state.combo });
    buzz(20);
    flash('ok');
    burst(x, y, 16 + 8 * Math.min(state.combo, 4));
    callout(comboWord(state.combo), state.combo);
    if (state.role !== 'tutorial') flyScore(`+${gain}`, x, y);
    if (state.combo >= 2 && state.role !== 'tutorial') floatText(`COMBO ×${Math.min(state.combo, 3)}`, x, y - 34, 'combo');
    const sc = $('score');
    sc.textContent = state.score;
    sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump');
  } else {
    fb.textContent = 'Chưa đúng — mất đĩa!';
    fb.className = 'no';
    sfx('wrong');
    buzz([40, 50, 40]);
    flash('no');
    heartBreak();
    field.classList.remove('shake'); void field.offsetWidth; field.classList.add('shake');
  }
  reveal();
  // F8: bạn chạy tới chỗ vừa chạm; đĩa bay tới bạn (đúng) hoặc tới vùng đúng (sai)
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
    fb.textContent = `${fb.textContent.split(' · ')[0]} · Bắt được đĩa!`;
    fb.classList.remove('ok'); void fb.offsetWidth; fb.classList.add('ok');
    sfx('catch');
    const st = $('stage');
    st.classList.remove('punch'); void st.offsetWidth; st.classList.add('punch');
  }
}

/**
 * Vị trí mọi thứ ở khung hình hiện tại (F8). Chấm điểm KHÔNG dùng hàm này — chỉ để vẽ.
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
    if (p.u >= 1) { phase = 'decide'; decideAt = clock; $('hint').textContent = HINT_TAP; onDecide(); }
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

/** Hiện đáp án sau khi chấm (chạm hoặc hết stall): tấm đáy, sơ đồ, giải thích, mạng/điểm. */
function reveal() {
  $('hint').hidden = true;
  $('stall').hidden = true;
  const scn = current(state);
  const tut = state.role === 'tutorial';
  $('explain').textContent = scn.explain;
  $('term').innerHTML = scn.term ? `Dân Ultimate gọi là: <b>${scn.term}</b>` : '';
  for (const id of ['sheet', 'explain', 'next']) $(id).hidden = false;
  for (const id of ['minimap', 'legend']) $(id).hidden = tut; // F12: lúc tập chỉ cần một câu khen
  $('term').hidden = !scn.term;
  $('hand').hidden = true;
  $('stage').classList.remove('hurry');
  $('next').firstChild.textContent = tut ? (isFinished(state) ? 'Vào trận thật ' : 'Bước tiếp ') : isFinished(state) ? 'Xem kết quả ' : 'Tiếp ';
  answeredAt = clock;
  renderPoint();
  if (!state.correct) { const l = $('lives'); l.classList.remove('hit'); void l.offsetWidth; l.classList.add('hit'); }
  if (!tut) drawMinimap();
}

/** F10 · mạng, thanh 5 pha, điểm trận. */
function renderPoint() {
  $('lives').textContent = '❤️'.repeat(Math.max(0, state.lives)) + '🖤'.repeat(Math.max(0, LIVES - state.lives));
  const pts = $('points');
  if (pts.textContent !== String(state.points)) {
    pts.textContent = state.points;
    const wrap = pts.parentElement;
    wrap.classList.remove('bump'); void wrap.offsetWidth; wrap.classList.add('bump');
  }
  const track = $('track');
  if (track.children.length !== state.total) track.innerHTML = '<i></i>'.repeat(state.total);
  [...track.children].forEach((seg, i) => {
    seg.className = i < state.index ? (state.results?.[i] ? 'ok' : 'no')
      : i === state.index ? (state.answered ? (state.correct ? 'ok' : 'no') : 'now') : '';
  });
}

/** F10 · đếm stall ở pha decide; tới 10 mà chưa chạm → mất đĩa. */
function tickStall() {
  if (!state || state.answered || phase !== 'decide') return;
  if (state.role === 'tutorial' && !current(state).stall) return; // F12: bước 1–2 không đếm giờ
  const t = clock - decideAt;
  if (t >= STALL) return onStallOut();
  const n = stallCount(t);
  const box = $('stall');
  box.hidden = false;
  if (n !== stallNow) {
    stallNow = n;
    const b = $('stall-n');
    b.textContent = n;
    b.classList.remove('tick'); void b.offsetWidth; b.classList.add('tick');
    box.classList.toggle('hot', n >= 7);
    $('stage').classList.toggle('hurry', n >= 8); // F13: 3 giây cuối
    if (n >= 8) sfx('tick');
  }
}

function onStallOut() {
  if (state.role === 'tutorial') { // F12: hết giờ lúc tập → đếm lại, không phạt
    state = stallOut(state);
    decideAt = clock;
    stallNow = 0;
    $('stage').classList.remove('hurry');
    const fb = $('feedback');
    fb.textContent = 'Hết giờ! Thử lại nhé ⏱';
    fb.className = '';
    void fb.offsetWidth;
    fb.className = 'no';
    sfx('wrong');
    return;
  }
  state = stallOut(state);
  stallNow = STALL;
  trackAnswer('stall', 0);
  const fb = $('feedback');
  fb.textContent = 'Stall 10 — mất đĩa!';
  fb.className = 'no';
  sfx('wrong');
  buzz([40, 50, 40]);
  flash('no');
  heartBreak();
  field.classList.remove('shake'); void field.offsetWidth; field.classList.add('shake');
  phase = 'done';
  run = null;
  reveal();
}

/** F11 · một pha vừa được chấm. */
function trackAnswer(outcome, gain) {
  track('phase_answer', {
    role: state.role, scenario_id: current(state).id, phase: state.index + 1, outcome,
    stall: stallNow, combo: state.combo, gain, decide_ms: Math.round((clock - decideAt) * 1000),
  });
}

function onNext() {
  if (!state || !state.answered) return;
  sfx('click');
  if (state.role === 'tutorial') { // F12
    track('tutorial_step', { step: state.index + 1, tries: state.misses || 0 });
    if (isFinished(state)) {
      store('cdd-tutorial-done', '1');
      track('tutorial_done', { ms: Math.round((now() - tutorialAt) * 1000) });
      renderStart();
      return begin('cutter');
    }
    state = next(state);
    return renderScenario();
  }
  track('explanation_read', {
    scenario_id: current(state).id, outcome: state.stalled ? 'stall' : state.correct ? 'correct' : 'wrong',
    read_ms: Math.max(1, Math.round((now() - answeredAt) * 1000)),
  });
  if (isFinished(state)) return showResult();
  const results = [...(state.results || []), state.correct];
  state = { ...next(state), results };
  renderScenario();
}

// ---------------------------------------------------------------- vẽ sân góc nhìn thứ nhất

function setupCanvas(cv, w, h) {
  // F9: khung giờ to bằng cả màn hình → giới hạn dpr 2, và chỉ cấp lại bộ nhớ khi đổi cỡ (không phải mỗi khung hình)
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = Math.round(w * dpr);
  const H = Math.round(h * dpr);
  if (cv.width !== W) cv.width = W;
  if (cv.height !== H) cv.height = H;
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
  view = { w, h: field.clientHeight || w }; // F9: khung = cả cửa sổ (dọc hoặc ngang)
  const ctx = setupCanvas(field, view.w, view.h);
  const scn = current(state);
  const snap = snapshot(scn);
  snapDisc = snap.disc;
  const cam = snap.cam;
  live = { camera: { x: cam.x, y: cam.y, heading: cam.heading }, mates: snap.mates.map((p) => ({ x: p.x, y: p.y })), disc: snap.disc };
  updateGoal(cam);
  const f = focal(cam, view);
  const hy = view.h * HORIZON;

  // trời: xanh đậm như logo CLB, sáng dần về đường chân trời
  const sky = ctx.createLinearGradient(0, 0, 0, hy);
  sky.addColorStop(0, '#050A1F');
  sky.addColorStop(0.6, '#0D3A9E');
  sky.addColorStop(1, '#2A78F0');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, view.w, hy + 1);
  const scenery = drawSky(ctx, cam, f, hy); // F14: mây, hàng cây 2 lớp

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
  scenery.lights = drawLights(ctx, cam, f); // F14: cột đèn sân
  // F14: sương mờ gần chân trời — xa thì nhạt như mắt thật
  const haze = ctx.createLinearGradient(0, hy, 0, hy + view.h * 0.16);
  haze.addColorStop(0, 'rgba(140,180,255,.32)');
  haze.addColorStop(1, 'rgba(140,180,255,0)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, hy, view.w, view.h * 0.16);
  drawRings(ctx, cam, scn); // F12: vòng sáng lúc tập

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
    ...snap.mates.map((p, i) => ({ p, kind: 'mate', holder: i === 0, idx: i })),
    ...snap.opps.map((p, i) => {
      if (i === scn.myMarker) {
        const pose = markerPose({ x: p.x + snap.shift.x, y: p.y + snap.shift.y }, { x: cam.x, y: cam.y }, clock);
        lunge = pose.lunge;
        return { p: pose, kind: 'mine', arms: pose.arms, idx: 6 + i };
      }
      const sway = 0.15 * Math.sin(clock * 2.4 + i * 1.7);
      return { p: { x: p.x, y: p.y + sway }, kind: 'opp', arms: 0.35 + 0.25 * Math.sin(clock * 3 + i), idx: 6 + i };
    }),
  ].map((o) => ({ ...o, cam: toCamera(cam, o.p), speed: speedOf(`${o.kind}${o.idx}`, o.p) }));
  lastFrame = clock;
  if (state.role === 'tutorial' && !state.answered && phase === 'decide' && state.index === 0) placeHand(cam, scn);
  const onScreen = [];
  const offScreen = [];
  for (const o of people) {
    const s = project(cam, o.p, view);
    if (s && s.sx > -10 && s.sx < view.w + 10) onScreen.push({ ...o, s });
    else offScreen.push(o);
  }
  // đĩa đang bay (F8) được xếp lớp theo khoảng cách như một vật trên sân
  const d = snap.disc;
  const ds = !d.held && !d.mine ? project(cam, d, view) : null;
  if (ds && ds.sx > -10 && ds.sx < view.w + 10) onScreen.push({ kind: 'disc', p: d, s: ds });
  onScreen.sort((a, b) => b.s.z - a.s.z);
  tags = [];
  let discDrawn = !!ds || !!d.mine;
  for (const o of onScreen) {
    if (o.kind === 'disc') { drawFlyingDisc(ctx, cam, o, f); continue; }
    ctx.globalAlpha = o.kind === 'mine' ? 1 : Math.min(1, Math.max(0, (o.s.z - 1.6) / 2.4));
    if (ctx.globalAlpha > 0.02) drawPerson(ctx, cam, o, f);
    ctx.globalAlpha = 1;
    if (o.holder && d.held) { drawDisc(ctx, cam, o, f); discDrawn = true; }
  }
  if (d.mine) drawCaughtDisc(ctx);
  const holderOff = d.held ? offScreen.find((o) => o.holder) : null;
  drawOffscreen(ctx, offScreen, holderOff);
  for (const [draw, x, y] of tags) draw(ctx, x, y);

  // áp lực: người kèm lao sát (hoặc đứng sau lưng) → viền đỏ chớp
  const mine = onScreen.find((o) => o.kind === 'mine');
  markerScreen = mine ? { sx: mine.s.sx, sy: mine.s.sy } : null;
  const behind = scn.markedBehind && !mine && offScreen.some((o) => o.kind === 'mine');
  field.classList.toggle('pressure', mine ? lunge > 0.7 : behind && Math.sin(clock * 6) > 0.4);
  if (behind) warnBehind(ctx);

  // F13: hạt bắn · F14: viền tối quanh màn để mắt dồn vào giữa
  const vig = ctx.createRadialGradient(view.w / 2, view.h * 0.55, Math.min(view.w, view.h) * 0.35, view.w / 2, view.h * 0.55, Math.max(view.w, view.h) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,20,0)');
  vig.addColorStop(1, 'rgba(0,0,20,.42)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, view.w, view.h);
  drawFx(ctx);
  if (phase === 'intro') setCountdown(String(Math.max(1, 3 - Math.floor(((clock - phaseStart) / INTRO) * 3))));

  drawn = {
    players: onScreen.length + offScreen.length + (discDrawn || holderOff ? 1 : 0),
    onScreen: onScreen.length, offScreen: offScreen.length, goal: goalSeen,
    running: onScreen.filter((o) => o.kind !== 'disc' && o.speed >= 2).length,
    scenery,
  };
}

/** Đĩa đang bay (F8): bóng mờ trên cỏ + đĩa trắng ở độ cao h. */
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

// F14 · màu áo theo đội: áo, áo phần tối (đổ bóng), viền, quần, số áo
const KIT = {
  mate: { shirt: '#FFB81C', shade: '#D98A00', trim: '#111111', shorts: '#161616', num: '#111111', shoe: '#F4F4F4' },
  opp: { shirt: '#FFFFFF', shade: '#C7D2EA', trim: '#1B2A55', shorts: '#1B2A55', num: '#1B2A55', shoe: '#1B2A55' },
  mine: { shirt: '#F0484E', shade: '#A9262B', trim: '#111111', shorts: '#3A0E10', num: '#FFFFFF', shoe: '#F4F4F4' },
};
const INK = '#111111';

/** Đoạn thẳng bo tròn có viền: vẽ nét đậm màu viền trước, nét màu chính đè lên. */
function limb(ctx, pts, color, w, lw) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [c, width] of [[INK, w + 2 * lw], [color, w]]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = width;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }
}

/**
 * F14 · người kiểu cartoon thể thao, nhìn chính diện: giày, chân, quần, áo có đổ bóng và số, tay, đầu có tóc.
 * Chiều cao theo mét (k = pixel/mét ở khoảng cách này). Đang di chuyển thì chân bước, tay đánh, người nhún (bodyPose).
 */
function drawPerson(ctx, cam, o, f) {
  const { s } = o;
  const k = f / s.z;
  const look = lookOf(o.idx ?? 0);
  const kit = KIT[o.kind];
  const pose = bodyPose(clock + (o.idx ?? 0) * 0.37, o.speed ?? 0);
  const lift = pose.bob * k;
  const X = s.sx;
  const Y = (h) => s.sy - k * h - lift; // toạ độ màn hình ở độ cao h mét
  const lw = Math.max(1, Math.min(2.4, k * 0.028));

  // bóng mềm dưới chân
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ctx.beginPath();
  ctx.ellipse(X, s.sy, Math.max(3, 0.34 * k), Math.max(1, 0.08 * k), 0, 0, Math.PI * 2);
  ctx.fill();

  if (k < 9) { // người ở xa: vẽ giản lược cho nhẹ máy
    ctx.lineCap = 'round';
    ctx.strokeStyle = kit.shorts;
    ctx.lineWidth = Math.max(1.5, 0.12 * k);
    for (const [side, a] of [[-1, pose.legL], [1, pose.legR]]) {
      ctx.beginPath(); ctx.moveTo(X + side * 0.08 * k, Y(0.9)); ctx.lineTo(X + side * 0.1 * k, s.sy - Math.max(0, a) * 0.3 * k); ctx.stroke();
    }
    ctx.fillStyle = kit.shirt;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(X - 0.22 * k, Y(1.48), 0.44 * k, 0.58 * k, 0.12 * k); ctx.fill(); ctx.stroke();
    ctx.fillStyle = look.skin;
    ctx.beginPath(); ctx.arc(X, Y(1.66), Math.max(1.5, 0.14 * k), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (o.holder && snapDisc?.held) tags.push([holderTag, X, Y(1.66) - 0.14 * k]);
    if (o.kind === 'mine') tags.push([markTag, X, Y(1.66) - 0.14 * k]);
    return;
  }

  // chân: chân nào đang bước tới thì gối nhấc lên (nhìn chính diện)
  const hipY = Y(0.9);
  const legW = Math.max(2, 0.13 * k);
  for (const [side, a] of [[-1, pose.legL], [1, pose.legR]]) {
    const up = Math.max(0, a) / 0.8;
    const footY = s.sy - up * 0.3 * k;
    const hx = X + side * 0.1 * k;
    const kx = hx + side * (0.02 + up * 0.05) * k;
    const kneeY = hipY + (footY - hipY) * 0.5 - up * 0.1 * k;
    const fx = X + side * (0.12 + a * 0.03) * k;
    limb(ctx, [[hx, hipY], [kx, kneeY], [fx, footY - 0.05 * k]], look.skin, legW, lw);
    ctx.fillStyle = kit.shoe; // giày
    ctx.strokeStyle = INK;
    ctx.lineWidth = lw;
    ctx.beginPath(); ctx.ellipse(fx + side * 0.02 * k, footY - 0.03 * k, 0.1 * k, 0.055 * k, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }

  // quần short
  ctx.fillStyle = kit.shorts;
  ctx.strokeStyle = INK;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(X - 0.21 * k, Y(1.0));
  ctx.lineTo(X + 0.21 * k, Y(1.0));
  ctx.lineTo(X + 0.24 * k, Y(0.72));
  ctx.lineTo(X + 0.03 * k, Y(0.74));
  ctx.lineTo(X, Y(0.82));
  ctx.lineTo(X - 0.03 * k, Y(0.74));
  ctx.lineTo(X - 0.24 * k, Y(0.72));
  ctx.closePath(); ctx.fill(); ctx.stroke();

  // tay sau thân (phòng thủ giang tay thì vẽ sau áo để vai che gốc tay)
  const shY = Y(1.46);
  const shW = 0.25 * k;
  const armW = Math.max(2, 0.1 * k);
  const arm = (side) => {
    const sx = X + side * (shW - 0.05 * k);
    const sy = shY + 0.06 * k;
    let el;
    let hand;
    if (o.arms !== undefined) { // giang tay chặn: 0 = buông chéo, 1 = giơ cao (hai tay lệch nhịp)
      const ang = 0.35 + 1.35 * (side < 0 ? o.arms : 1 - o.arms * 0.6);
      el = [sx + side * Math.sin(ang) * 0.3 * k, sy + Math.cos(ang) * 0.3 * k];
      hand = [el[0] + side * Math.sin(ang + 0.2) * 0.28 * k, el[1] + Math.cos(ang + 0.2) * 0.28 * k];
    } else if (o.holder && side > 0 && snapDisc?.held) { // tay cầm đĩa đưa ra
      el = [sx + 0.12 * k, sy + 0.22 * k];
      hand = [X + 0.32 * k, Y(1.08)];
    } else { // chạy: tay đánh tới thì bàn tay nâng lên trước ngực
      const a = side < 0 ? pose.armL : pose.armR;
      const up = Math.max(0, a) / 0.8;
      el = [sx + side * 0.07 * k, sy + 0.27 * k - up * 0.06 * k];
      hand = [el[0] - side * up * 0.1 * k, el[1] + 0.24 * k - up * 0.3 * k];
    }
    limb(ctx, [[sx, sy], el, hand], look.skin, armW, lw);
    ctx.fillStyle = kit.shirt; // tay áo ngắn
    ctx.strokeStyle = INK;
    ctx.lineWidth = lw;
    ctx.beginPath(); ctx.arc(sx, sy + 0.02 * k, 0.075 * k, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  };
  if (o.arms !== undefined) { arm(-1); arm(1); }

  // thân áo có đổ bóng
  const waistY = Y(0.94);
  const g = ctx.createLinearGradient(X - shW, shY, X + shW, waistY);
  g.addColorStop(0, kit.shirt);
  g.addColorStop(1, kit.shade);
  ctx.fillStyle = g;
  ctx.strokeStyle = INK;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(X - 0.2 * k, waistY);
  ctx.lineTo(X - shW, shY + 0.1 * k);
  ctx.quadraticCurveTo(X - shW, shY, X - shW + 0.08 * k, shY);
  ctx.lineTo(X + shW - 0.08 * k, shY);
  ctx.quadraticCurveTo(X + shW, shY, X + shW, shY + 0.1 * k);
  ctx.lineTo(X + 0.2 * k, waistY);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.clip();
  if (o.kind === 'mate') { ctx.fillStyle = INK; ctx.fillRect(X - shW, Y(1.3), 2 * shW, 0.07 * k); } // sọc ong
  if (o.kind === 'opp') { ctx.fillStyle = kit.trim; ctx.fillRect(X - shW, shY, 0.06 * k, 1 * k); ctx.fillRect(X + shW - 0.06 * k, shY, 0.06 * k, 1 * k); }
  ctx.restore();
  ctx.stroke();
  if (k > 26) { // số áo
    ctx.fillStyle = kit.num;
    ctx.font = `900 ${Math.round(0.2 * k)}px Montserrat, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(look.number), X, Y(1.12));
    ctx.textBaseline = 'alphabetic';
  }
  if (o.arms === undefined) { arm(-1); arm(1); }

  // cổ + đầu + tóc
  const headR = Math.max(2, 0.14 * k);
  const headY = Y(1.67);
  ctx.fillStyle = look.skin;
  ctx.fillRect(X - 0.05 * k, Y(1.56), 0.1 * k, 0.12 * k);
  if (look.long) { // tóc buộc đuôi ngựa
    ctx.fillStyle = look.hair;
    ctx.beginPath(); ctx.ellipse(X + headR * 0.9, headY + headR * 0.6, headR * 0.35, headR * 0.7, -0.4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = look.skin;
  ctx.strokeStyle = INK;
  ctx.lineWidth = lw;
  ctx.beginPath(); ctx.arc(X, headY, headR, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = look.hair;
  ctx.beginPath();
  ctx.moveTo(X - headR, headY - headR * 0.05);
  ctx.quadraticCurveTo(X - headR * 0.3, headY - headR * 0.55, X + headR * 0.2, headY - headR * 0.35);
  ctx.quadraticCurveTo(X + headR * 0.7, headY - headR * 0.25, X + headR, headY + headR * 0.05);
  ctx.lineTo(X + headR, headY - headR);
  ctx.lineTo(X - headR, headY - headR);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.beginPath(); ctx.arc(X, headY, headR, 0, Math.PI * 2); ctx.stroke();
  if (headR > 6) { // mắt
    ctx.fillStyle = INK;
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(X + side * headR * 0.36, headY + headR * 0.15, Math.max(1, headR * 0.1), 0, Math.PI * 2); ctx.fill(); }
  }
  if (o.holder && snapDisc?.held) tags.push([holderTag, X, headY - headR]);
  if (o.kind === 'mine') tags.push([markTag, X, headY - headR]);
}

/** F12 · nhãn "ĐĨA" trên đầu người đang cầm đĩa — người mới luôn biết đĩa ở đâu. */
function holderTag(ctx, x, top) {
  const y = Math.max(14, top - 14);
  ctx.font = '600 12px Oswald, sans-serif';
  const w = ctx.measureText('ĐĨA').width + 16;
  ctx.fillStyle = C.mate;
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(x - w / 2, y - 10, w, 20, 10); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 5, y + 10); ctx.lineTo(x + 5, y + 10); ctx.lineTo(x, y + 16); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ĐĨA', x, y + 1);
  ctx.textBaseline = 'alphabetic';
}

/** Nhãn trên đầu người kèm bạn (F8). */
function markTag(ctx, x, top) {
  const y = Math.max(16, top - 14);
  ctx.font = '600 12px Oswald, sans-serif';
  const w = ctx.measureText('KÈM BẠN').width + 14;
  ctx.fillStyle = C.wrong;
  ctx.beginPath(); ctx.roundRect(x - w / 2, y - 10, w, 20, 10); ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('KÈM BẠN', x, y);
  ctx.textBaseline = 'alphabetic';
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

function floatText(text, x, y, extra = '') {
  const el = document.createElement('span');
  el.className = `float ${extra}`.trim();
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

// ---------------------------------------------------------------- F12 · màn mở đầu, phần tập

let snapDisc = null;
let tags = []; // nhãn trên đầu (ĐĨA, KÈM BẠN) vẽ sau cùng để không bị người gần che // đĩa ở khung hình đang vẽ (để biết người cầm đĩa có đang cầm không)

/** Nút chính đổi theo việc đã tập chơi hay chưa. */
function renderStart() {
  const done = load('cdd-tutorial-done') === '1';
  $('play-label').innerHTML = done ? '▶ Chơi<small>vào trận ngay</small>' : '▶ Chơi ngay<small>30 giây tập chơi</small>';
  $('how').hidden = !done;
}

/** Bàn tay 👆 chỉ vào vòng sáng ở bước tập 1. */
function placeHand(cam, scn) {
  const ring = scn.rings?.[0];
  const q = ring && project(cam, ring, view);
  const el = $('hand');
  if (!q) { el.hidden = true; return; }
  el.hidden = false;
  el.style.left = `${q.sx}px`;
  el.style.top = `${q.sy + 6}px`;
}

/** Vòng sáng trên cỏ lúc tập: nhấp nháy + một vòng loang ra mời chạm. */
function drawRings(ctx, cam, scn) {
  if (!scn.rings?.length || state.answered) return;
  const pulse = 0.5 + 0.5 * Math.sin(clock * 5);
  const wave = (clock * 0.9) % 1;
  for (const r of scn.rings) {
    poly(ctx, clipProject(cam, circle(r, scn.zone.r), view), `rgba(255,201,60,${0.2 + 0.14 * pulse})`, C.accent, 3);
    ctx.globalAlpha = 0.8 * (1 - wave);
    poly(ctx, clipProject(cam, circle(r, scn.zone.r * (1 + 0.4 * wave)), view), null, '#FFFFFF', 2);
    ctx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------- F13 · juice

function setCountdown(n) {
  const el = $('countdown');
  if (el.textContent === n) return;
  el.textContent = n;
  el.classList.remove('tickin'); void el.offsetWidth; el.classList.add('tickin');
}

/** Hết "3… 2… 1…": tới lượt bạn. */
function onDecide() {
  $('countdown').hidden = true;
  callout('Chạm!', 0, 'go');
}

function callout(text, combo = 1, cls = '') {
  if (!text) return;
  const el = document.createElement('span');
  el.className = `callout ${cls}`.trim();
  el.textContent = text;
  if (!cls) el.style.fontSize = `${30 + 6 * Math.min(combo, 4)}px`;
  $('stage').append(el);
  setTimeout(() => el.remove(), 1050);
}

function flash(kind) {
  const el = $('flash');
  el.className = '';
  void el.offsetWidth;
  el.className = kind;
}

/** Hạt bắn tại chỗ chạm: vàng, trắng, có ngôi sao. Nhiều hạt hơn khi combo cao. */
function burst(x, y, n) {
  const calm = reduced ? 0.12 : 1; // giảm chuyển động: hạt chỉ loé quanh chỗ chạm, không bắn xa
  const colors = ['#FFC93C', '#F5A300', '#FFFFFF', '#FFE48A'];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.6;
    const v = (220 + Math.random() * 380) * calm;
    fx.particles.push({
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.6 + Math.random() * 0.5, rot: Math.random() * 6,
      vr: (Math.random() - 0.5) * 14, size: 6 + Math.random() * 7, c: colors[i % colors.length], star: i % 3 === 0,
    });
  }
}

function drawFx(ctx) {
  const dt = Math.min(0.05, Math.max(0, clock - (fx.last || clock)));
  fx.last = clock;
  fx.particles = fx.particles.filter((p) => (p.life -= dt) > 0);
  for (const p of fx.particles) {
    p.vy += (reduced ? 0 : 900) * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
    ctx.save();
    ctx.globalAlpha = Math.min(1, p.life / 0.3);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.c;
    if (p.star) {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? p.size * 0.42 : p.size;
        const a = (i * Math.PI) / 5;
        i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(r, 0);
      }
      ctx.closePath();
      ctx.fill();
    } else ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    ctx.restore();
  }
}

/** "+170" bay từ chỗ chạm về ô điểm trận. */
function flyScore(text, x, y) {
  const el = document.createElement('span');
  el.className = 'fly';
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  $('stage').append(el);
  const t = $('points').getBoundingClientRect();
  const st = $('stage').getBoundingClientRect();
  const dx = t.left + t.width / 2 - st.left - x;
  const dy = t.top + t.height / 2 - st.top - y;
  el.animate?.([
    { transform: 'translate(-50%, -50%) scale(1.3)', opacity: 1 },
    { transform: 'translate(-50%, -110%) scale(1.15)', opacity: 1, offset: 0.3 },
    { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.5)`, opacity: 0.4 },
  ], { duration: 720, easing: 'ease-in' });
  setTimeout(() => el.remove(), 740);
}

/** Trái tim vừa mất vỡ ra, rơi khỏi HUD. */
function heartBreak() {
  const r = $('lives').getBoundingClientRect();
  const el = document.createElement('span');
  el.className = 'heart-break';
  el.textContent = '💔';
  el.style.left = `${r.left + (r.width / LIVES) * Math.max(0, state.lives)}px`;
  el.style.top = `${r.top - 4}px`;
  document.body.append(el);
  setTimeout(() => el.remove(), 950);
}

/** Sao bật lần lượt, mỗi sao một tiếng cao dần. */
function showStars(n) {
  const stars = [...$('stars').children];
  stars.forEach((el) => { el.className = 'star'; });
  for (let i = 0; i < n; i++) {
    setTimeout(() => { stars[i].className = 'star on'; sfx('star', { combo: i + 1 }); }, 450 + i * 380);
  }
}

/** Điểm chạy số từ 0 lên. */
function countUp(el, value) {
  const fmt = (v) => `${Math.round(v).toLocaleString('vi-VN')} điểm`;
  const t0 = performance.now();
  const dur = 900;
  el.textContent = fmt(0);
  const step = () => {
    const u = Math.min(1, (performance.now() - t0) / dur);
    el.textContent = fmt(value * (1 - (1 - u) ** 3));
    if (u < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  setTimeout(() => { el.textContent = fmt(value); }, dur + 60);
}

// ---------------------------------------------------------------- F14 · cảnh và dáng chạy

/** Tốc độ (m/s) của một người giữa hai khung hình, làm mượt — để vẽ dáng chạy. */
function speedOf(key, p) {
  const prev = motion.get(key);
  const dt = clock - lastFrame;
  let v = prev ? prev.v : 0;
  if (prev && dt > 0.001 && dt < 0.25) v = prev.v + (Math.min(9, Math.hypot(p.x - prev.x, p.y - prev.y) / dt) - prev.v) * 0.25;
  motion.set(key, { x: p.x, y: p.y, v });
  return v;
}

/** Mây trôi chậm + hàng cây 2 lớp ở chân trời (lớp gần trôi nhanh hơn khi bạn chạy → có chiều sâu). */
function drawSky(ctx, cam, f, hy) {
  const w = view.w;
  let clouds = 0;
  for (let i = 0; i < 12; i++) {
    const d = angleDiff(cam.heading, i * (Math.PI / 6) + 0.2 + clock * 0.01);
    if (Math.abs(d) > 1.25) continue;
    const x = w / 2 + f * Math.tan(d);
    const cw = 70 + (40 * ((i * 7) % 5)) / 4;
    if (x < -cw || x > w + cw) continue;
    const y = hy * (0.16 + (0.5 * ((i * 5) % 7)) / 7);
    ctx.fillStyle = 'rgba(200,220,255,.09)';
    for (const [ox, oy, rx, ry] of [[0, 0, 1, 0.32], [-0.38, 0.08, 0.55, 0.24], [0.4, 0.06, 0.6, 0.26], [0.08, -0.12, 0.5, 0.3]]) {
      ctx.beginPath(); ctx.ellipse(x + ox * cw, y + oy * cw, rx * cw * 0.6, ry * cw * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    }
    clouds++;
  }
  const layer = (color, base, amp, scale, shift, crowns) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, hy + 1);
    for (let x = 0; x <= w + 6; x += 6) {
      const u = (cam.heading + Math.atan((x - w / 2) / f)) * scale + shift;
      const h = base + amp * (0.5 + 0.5 * Math.sin(u * 3.1)) * (0.6 + 0.4 * Math.sin(u * 7.3 + 1)) + (crowns ? 7 * Math.abs(Math.sin(u * 21)) : 0);
      ctx.lineTo(x, hy - h);
    }
    ctx.lineTo(w, hy + 1);
    ctx.closePath();
    ctx.fill();
  };
  layer('#16438A', 10, 16, 2, 0, false); // đồi xa, xanh nhạt vì sương
  layer('#0A2140', 5, 18, 3.2, (cam.x + cam.y) * 0.015, true); // hàng cây gần, tối
  return { clouds, trees: 2, lights: 0 };
}

const POLES = [{ x: -6, y: -7 }, { x: 33, y: -8 }, { x: 67, y: -8 }, { x: 106, y: -7 }, { x: -6, y: 44 }, { x: 33, y: 45 }, { x: 67, y: 45 }, { x: 106, y: 44 }];

/** Cột đèn sân có quầng sáng. Trả về số cột thấy được. */
function drawLights(ctx, cam, f) {
  let n = 0;
  for (const p of POLES) {
    const foot = project(cam, p, view);
    if (!foot) continue;
    const top = project(cam, p, view, 16);
    if (top.sx < -40 || top.sx > view.w + 40) continue;
    const k = f / foot.z;
    ctx.strokeStyle = '#1B2540';
    ctx.lineWidth = Math.max(1.2, 0.3 * k);
    ctx.beginPath(); ctx.moveTo(foot.sx, foot.sy); ctx.lineTo(top.sx, top.sy); ctx.stroke();
    const R = Math.max(18, 4 * k);
    const g = ctx.createRadialGradient(top.sx, top.sy, 0, top.sx, top.sy, R);
    g.addColorStop(0, 'rgba(255,240,200,.9)');
    g.addColorStop(0.25, 'rgba(255,214,120,.35)');
    g.addColorStop(1, 'rgba(255,214,120,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(top.sx, top.sy, R, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFF4D0';
    ctx.fillRect(top.sx - Math.max(2, 0.6 * k), top.sy - Math.max(1.5, 0.3 * k), Math.max(4, 1.2 * k), Math.max(3, 0.6 * k));
    n++;
  }
  return n;
}

// ---------------------------------------------------------------- nối sự kiện

$('role-handler').addEventListener('click', (e) => { press(e.currentTarget); sfx('click'); begin('handler'); });
$('role-cutter').addEventListener('click', (e) => { press(e.currentTarget); sfx('click'); begin('cutter'); });
// F12 · nút chính: chưa tập thì vào phần tập; đã tập thì vào vai chơi lần trước
$('play').addEventListener('click', (e) => {
  press(e.currentTarget);
  sfx('click');
  begin(load('cdd-tutorial-done') === '1' ? (load('cdd-last-role') === 'handler' ? 'handler' : 'cutter') : 'tutorial');
});
$('how').addEventListener('click', (e) => { press(e.currentTarget); sfx('click'); begin('tutorial'); });
$('home').addEventListener('click', () => { sfx('click'); state = null; show('start'); renderStart(); });
// F13 · bật/tắt âm thanh, nhớ trong máy
const syncSound = () => {
  const on = !isMuted();
  const b = $('sound');
  b.textContent = on ? '🔊' : '🔇';
  b.setAttribute('aria-pressed', String(on));
  b.setAttribute('aria-label', on ? 'Tắt âm thanh' : 'Bật âm thanh');
  b.title = b.getAttribute('aria-label');
};
setMuted(load('cdd-sound') === '0');
syncSound();
$('sound').addEventListener('click', () => {
  setMuted(!isMuted());
  store('cdd-sound', isMuted() ? '0' : '1');
  syncSound();
  unlock();
  sfx('click');
  track('sound_toggle', { on: !isMuted() });
});
document.addEventListener('pointerdown', unlock, { once: true });
$('next').addEventListener('click', (e) => { press(e.currentTarget); onNext(); });
renderStart();
$('retry').addEventListener('click', (e) => {
  press(e.currentTarget);
  sfx('click');
  track('retry_click', { role: state?.role ?? 'none', last_result: lastResult ?? 'none', attempt });
  state = null;
  show('start');
});
field.addEventListener('click', onTap);
window.addEventListener('resize', () => { if (screen === 'play') { drawField(); if (state?.answered) drawMinimap(); } });

// F9 · nút toàn màn hình (Fullscreen API). Trình duyệt không hỗ trợ (iPhone Safari) → ẩn nút, game vẫn phủ cả cửa sổ.
const fsBtn = $('fullscreen');
const root = document.documentElement;
const fsOn = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
if (!(root.requestFullscreen || root.webkitRequestFullscreen)) fsBtn.hidden = true;
fsBtn.addEventListener('click', async () => {
  try {
    if (fsOn()) await (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else await (root.requestFullscreen || root.webkitRequestFullscreen).call(root, { navigationUI: 'hide' });
  } catch { /* người dùng hoặc trình duyệt từ chối: giữ nguyên */ }
});
const syncFs = () => {
  const on = fsOn();
  track('fullscreen_toggle', { on });
  fsBtn.setAttribute('aria-label', on ? 'Thoát toàn màn hình' : 'Toàn màn hình');
  fsBtn.title = fsBtn.getAttribute('aria-label');
  $('fs-icon').setAttribute('d', on ? 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5' : 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5');
};
document.addEventListener('fullscreenchange', syncFs);
document.addEventListener('webkitfullscreenchange', syncFs);

// Hợp đồng với bot test. Đừng xoá.
// F11 · bật tracking và ghi lượt mở trang
initTracking();
track('game_open', { screen_w: window.innerWidth, screen_h: window.innerHeight, fullscreen_supported: !fsBtn.hidden });

window.__game = {
  state: () => {
    if (!state) return { screen, role: null, index: 0, score: 0, answered: false, animating: loopId !== 0, sound: !isMuted() };
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
      stall: stallNow,
      live,
      drawn,
      sound: !isMuted(),
      fx: { particles: fx.particles.length },
      ringsScreen: (scn.rings || []).map((r) => { const q = project(cam, r, view); return q && { x: q.sx * k, y: q.sy * k, correct: Math.hypot(r.x - scn.zone.x, r.y - scn.zone.y) < 1e-6 }; }),
    };
  },
};
