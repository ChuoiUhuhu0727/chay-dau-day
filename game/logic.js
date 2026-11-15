// Luật chơi: hàm thuần, không đụng DOM.
// Toạ độ sân tính bằng mét: x dọc chiều dài (0 → 100, đội mình tấn công về endzone x 82–100),
// y ngang sân (0 → 37). Hướng nhìn (heading) tính bằng radian, 0 = nhìn về phía x tăng.

export const FIELD = { length: 100, width: 37, endzone: 18 };
export const EYE = 1.7; // mắt cao 1.7m
export const FOV = (70 * Math.PI) / 180; // góc nhìn ngang 70°
export const HORIZON = 0.4; // đường chân trời nằm ở 40% chiều cao khung
export const ZONE_R = 4;
export const LESSON_SIZE = 5;

export function createState() {
  return {};
}

// ---------------------------------------------------------------- F1 · phép chiếu phối cảnh

export function makeCamera(x, y, heading) {
  return { x, y, heading, h: EYE, fov: FOV };
}

/** Hai trục của camera: f = hướng nhìn, r = bên phải. */
function axes(cam) {
  const c = Math.cos(cam.heading);
  const s = Math.sin(cam.heading);
  return { fx: c, fy: s, rx: -s, ry: c };
}

/** Đổi điểm trên sân sang toạ độ camera: z = khoảng cách phía trước, u = lệch sang phải. */
export function toCamera(cam, p) {
  const { fx, fy, rx, ry } = axes(cam);
  const dx = p.x - cam.x;
  const dy = p.y - cam.y;
  return { z: dx * fx + dy * fy, u: dx * rx + dy * ry };
}

// F9: FOV áp cho cạnh ngắn của khung — màn ngang thấy rộng hơn mà vẫn thấy cỏ ngay trước chân.
export function focal(cam, view) {
  return Math.min(view.w, view.h) / 2 / Math.tan(cam.fov / 2);
}

export const NEAR = 0.3;

/** Chiếu điểm (cao `height` mét so với mặt cỏ) lên khung hình. Sau lưng → null. */
export function project(cam, p, view, height = 0) {
  const { z, u } = toCamera(cam, p);
  if (z < NEAR) return null;
  const f = focal(cam, view);
  return { sx: view.w / 2 + (f * u) / z, sy: view.h * HORIZON + (f * (cam.h - height)) / z, z };
}

/** Ngược của project cho điểm trên mặt cỏ. Chạm trên đường chân trời → null. */
export function unproject(cam, sx, sy, view) {
  const f = focal(cam, view);
  const below = sy - view.h * HORIZON;
  if (below <= 0.5) return null;
  const z = (f * cam.h) / below;
  const u = ((sx - view.w / 2) * z) / f;
  const { fx, fy, rx, ry } = axes(cam);
  return { x: cam.x + z * fx + u * rx, y: cam.y + z * fy + u * ry };
}

/** Cắt đa giác trên mặt cỏ theo mặt phẳng z = NEAR (phần sau lưng bỏ đi), trả về toạ độ màn hình. */
export function clipProject(cam, pts, view, near = NEAR + 0.01) {
  const cs = pts.map((p) => ({ p, z: toCamera(cam, p).z }));
  const out = [];
  for (let i = 0; i < cs.length; i++) {
    const a = cs[i];
    const b = cs[(i + 1) % cs.length];
    if (a.z >= near) out.push(a.p);
    if (a.z >= near !== b.z >= near) {
      const t = (near - a.z) / (b.z - a.z);
      out.push({ x: a.p.x + t * (b.p.x - a.p.x), y: a.p.y + t * (b.p.y - a.p.y) });
    }
  }
  return out.map((p) => project(cam, p, view, 0)).filter(Boolean);
}

// ---------------------------------------------------------------- F2 · tình huống vertical stack

const pt = (x, y) => ({ x, y });

/** Hướng nhìn từ (x, y) về điểm (lx, ly). */
function look(x, y, lx, ly) {
  return { x, y, heading: Math.atan2(ly - y, lx - x) };
}

/**
 * Người kèm của 7 cầu thủ tấn công: người kèm đĩa đứng phía trước, lệch sang phía y nhỏ
 * (chặn bên đó → phía y lớn là phía trống). Người kèm khác đứng giữa người mình kèm và đĩa.
 */
function markers(holder, others) {
  const list = [pt(holder.x + 1.4, holder.y - 0.9)];
  for (const p of others) {
    const dx = holder.x - p.x;
    const dy = holder.y - p.y;
    const d = Math.hypot(dx, dy) || 1;
    list.push(pt(+(p.x + (dx / d) * 1.4).toFixed(2), +(p.y + (dy / d) * 1.4 - 0.4).toFixed(2)));
  }
  return list;
}

/**
 * Xoay nhẹ hướng nhìn (tối đa ±0.6 rad quanh hướng gợi ý) để vùng đúng vẫn nằm gọn trong khung
 * mà thấy được nhiều cầu thủ nhất — người mới cần thấy đủ bối cảnh.
 */
function bestHeading(me, zone, people, marker) {
  const view = { w: 360, h: 480 };
  let best = { heading: me.heading, seen: -1, turn: Infinity };
  for (let t = -0.6; t <= 0.6001; t += 0.02) {
    const cam = makeCamera(me.x, me.y, me.heading + t);
    const z = project(cam, zone, view);
    if (!z || z.sx < 50 || z.sx > 310) continue;
    const m = marker && project(cam, marker, view);
    if (marker && (!m || m.sx < 24 || m.sx > view.w - 24)) continue; // người kèm bạn phải luôn trong khung (F8)
    const seen = people.filter((p) => { const s = project(cam, p, view); return s && s.sx >= 16 && s.sx <= view.w - 16; }).length;
    if (seen > best.seen || (seen === best.seen && Math.abs(t) < best.turn)) best = { heading: me.heading + t, seen, turn: Math.abs(t) };
  }
  return +best.heading.toFixed(4);
}

/**
 * Người kèm bạn (F8): đứng trước mặt 3m, lệch 1.5m về phía NGƯỢC vùng đúng — bám sát mà không che chỗ cần chạm
 * (lệch nhiều để đứng gần mép khung, không che người cầm đĩa ở giữa).
 * `behind: true` → đứng ngay sau lưng 1.5m (phía đĩa, chặn đường cắt ngắn).
 */
function myMarker(me, zone, behind) {
  const c = Math.cos(me.heading);
  const s = Math.sin(me.heading);
  const zoneSide = Math.sign(toCamera(makeCamera(me.x, me.y, me.heading), zone).u) || 1;
  const [ahead, right] = behind ? [-1.5, 0.3] : [3, -zoneSide * 1.5];
  return pt(+(me.x + ahead * c - right * s).toFixed(2), +(me.y + ahead * s + right * c).toFixed(2));
}

function scenario(o) {
  const holder = o.teammates[0];
  const mine = myMarker(o.me, o.zone, o.markedBehind);
  const opponents = [...markers(holder, o.teammates.slice(1)), mine];
  const heading = bestHeading(o.me, o.zone, [...o.teammates, ...opponents], o.markedBehind ? null : mine);
  return {
    id: o.id,
    title: o.title,
    prompt: o.prompt,
    explain: o.explain,
    term: o.term,
    me: { x: o.me.x, y: o.me.y, heading },
    disc: { x: holder.x, y: holder.y },
    teammates: o.teammates,
    opponents,
    myMarker: opponents.length - 1,
    markedBehind: !!o.markedBehind,
    zone: { ...o.zone, r: ZONE_R },
  };
}

export const SCENARIOS = {
  cutter: [
    scenario({
      id: 'C1', title: 'Chạy ra chỗ trống', term: 'cắt ngắn (under cut)',
      prompt: 'Đĩa ở áo vàng phía trước. Bên phải bị chặn, bên trái trống — chạy đâu?',
      explain: 'Chạy chéo sang bên trống, lại gần người cầm đĩa. Đường ném ngắn, không ai chặn được.',
      me: look(40, 18.5, 31, 23),
      teammates: [pt(30, 18.5), pt(25, 24), pt(44, 18.5), pt(48, 18.5), pt(52, 18.5), pt(56, 18.5)],
      zone: pt(32, 27),
    }),
    scenario({
      id: 'C2', title: 'Đừng đứng chắn đường', term: 'dọn đường (clear)',
      prompt: 'Bạn không nhận được đĩa. Đồng đội sắp chạy vào chỗ bạn — tránh đi đâu?',
      explain: 'Chạy ra xa, về phía biên. Đứng yên là bạn chắn đường chạy của đồng đội.',
      me: look(33, 27, 44, 31),
      teammates: [pt(30, 18.5), pt(25, 24), pt(44, 18.5), pt(48, 18.5), pt(52, 18.5), pt(56, 18.5)],
      zone: pt(44, 32),
    }),
    scenario({
      id: 'C3', title: 'Bị chặn gần? Chạy xa!', term: 'cắt sâu (deep cut)',
      prompt: 'Áo đỏ đứng sát sau lưng, chặn đường về phía đĩa. Chỗ trống ở đâu?',
      explain: 'Họ chặn phía gần thì phía xa đang trống. Chạy xa lên trên, đĩa bay qua đầu tới bạn.',
      me: look(38, 18.5, 52, 26),
      markedBehind: true,
      teammates: [pt(28, 18.5), pt(23, 24), pt(43, 18.5), pt(47, 18.5), pt(51, 18.5), pt(55, 18.5)],
      zone: pt(50, 28),
    }),
    scenario({
      id: 'C4', title: 'Ghi điểm ở góc trống', term: 'endzone — vùng ghi điểm',
      prompt: 'Đĩa ở bên trái, sắp tới vùng ghi điểm màu vàng. Chạy vào góc nào?',
      explain: 'Chạy vào góc vàng phía trống, xa người cầm đĩa. Bắt đĩa trong vùng vàng là ghi điểm!',
      me: look(76, 22, 88, 29),
      teammates: [pt(72, 12), pt(68, 17), pt(86, 18.5), pt(90, 18.5), pt(94, 18.5), pt(83, 12)],
      zone: pt(87, 29),
    }),
    scenario({
      id: 'C5', title: 'Lấp chỗ vừa trống', term: 'nối đường cắt (continuation)',
      prompt: 'Đồng đội vừa chạy xa, kéo theo áo trắng. Chỗ nào vừa trống ra?',
      explain: 'Chạy vào chỗ đồng đội vừa bỏ lại. Áo trắng đã đuổi theo họ, chỗ đó không ai canh.',
      me: look(44, 18.5, 33, 22),
      teammates: [pt(30, 18.5), pt(25, 24), pt(58, 26), pt(48, 18.5), pt(52, 18.5), pt(56, 18.5)],
      zone: pt(35, 26),
    }),
  ],
  handler: [
    scenario({
      id: 'H1', title: 'Đứng sau làm chỗ dựa', term: 'reset / dump',
      prompt: 'Đồng đội vừa bắt đĩa. Đứng đâu để họ chuyền về bạn an toàn?',
      explain: 'Đứng chéo sau người cầm đĩa, cách 5 bước, về phía trống. Bí thì họ chuyền về bạn.',
      me: look(28, 14, 38, 20),
      teammates: [pt(40, 18.5), pt(50, 18.5), pt(54, 18.5), pt(58, 18.5), pt(62, 18.5), pt(66, 18.5)],
      zone: pt(36, 23),
    }),
    scenario({
      id: 'H2', title: 'Cứu bạn bị kẹt biên', term: 'dump (cứu đĩa)',
      prompt: 'Đồng đội bị ép sát biên, sắp hết giờ cầm đĩa. Chạy đâu để đỡ?',
      explain: 'Chạy vào giữa sân, chéo sau lưng họ. Đĩa về giữa sân là mở lại được cả hai phía.',
      me: look(34, 10, 42, 9),
      teammates: [pt(46, 3), pt(56, 18.5), pt(60, 18.5), pt(64, 18.5), pt(68, 18.5), pt(72, 18.5)],
      zone: pt(41, 11),
    }),
    scenario({
      id: 'H3', title: 'Ném xong thì chạy!', term: 'ném rồi chạy (give-and-go)',
      prompt: 'Bạn vừa ném đĩa đi. Áo trắng của bạn đứng nhìn theo. Giờ chạy đâu?',
      explain: 'Chạy lên phía trước ngay, vượt qua người đang đứng nhìn. Được ném trả là tiến thêm 10m.',
      me: look(40, 18.5, 50, 20),
      teammates: [pt(46, 26), pt(36, 12), pt(60, 18.5), pt(64, 18.5), pt(68, 18.5), pt(72, 18.5)],
      zone: pt(51, 17),
    }),
    scenario({
      id: 'H4', title: 'Sắp hết giờ: chuyền ngang', term: 'swing (chuyền ngang)',
      prompt: 'Đồng đội sát biên, đã đếm tới 7. Phía trước không ai trống. Đứng đâu?',
      explain: 'Đứng ngang hàng người cầm đĩa, ở giữa sân. Một đường chuyền ngang dễ, đưa đĩa về giữa.',
      me: look(42, 26, 49, 21),
      teammates: [pt(50, 33), pt(60, 18.5), pt(64, 18.5), pt(68, 18.5), pt(72, 18.5), pt(76, 18.5)],
      zone: pt(49, 22),
    }),
    scenario({
      id: 'H5', title: 'Chờ ngay trước vạch', term: 'reset gần endzone',
      prompt: 'Đĩa sắp vào vùng ghi điểm, ở bên trái bạn. Bạn đứng đâu để đỡ?',
      explain: 'Đứng trước vạch vùng vàng, giữa sân, hơi sau người cầm đĩa. Không ai trống thì đĩa về bạn.',
      me: look(66, 20, 76, 17),
      teammates: [pt(78, 11), pt(86, 18.5), pt(90, 22), pt(94, 15), pt(88, 30), pt(92, 8)],
      zone: pt(75, 19),
    }),
  ],
};

export function cameraOf(scn) {
  return makeCamera(scn.me.x, scn.me.y, scn.me.heading);
}

// ---------------------------------------------------------------- F7 · endzone đích

export const GOAL = { x: FIELD.length - FIELD.endzone / 2, y: FIELD.width / 2, line: FIELD.length - FIELD.endzone };

/** Khoảng cách (m) tới vạch endzone đích và góc của tâm endzone so với hướng nhìn (dương = bên phải). */
export function goalInfo(cam) {
  const { z, u } = toCamera(cam, GOAL);
  return { distance: Math.max(0, Math.round(GOAL.line - cam.x)), bearing: Math.atan2(u, z) };
}

// ---------------------------------------------------------------- F8 · người kèm chuyển động

/**
 * Tư thế người kèm bạn tại thời điểm t (giây): lắc ngang ±0.6m, lao về phía bạn tối đa 0.5m,
 * tay giang lên/xuống. Hai nhịp lệch nhau nên chuyển động không đều — khó đoán như người thật.
 */
export function markerPose(base, me, t) {
  const dx = base.x - me.x;
  const dy = base.y - me.y;
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d;
  const uy = dy / d;
  const sway = 0.6 * Math.sin(2 * Math.PI * (t / 1.3)) * (0.75 + 0.25 * Math.sin(2 * Math.PI * (t / 3.7)));
  const lunge = (1 - Math.cos(2 * Math.PI * (t / 2.1))) / 2;
  const toward = Math.min(0.5 * lunge, Math.max(0, d - 1.25));
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  return {
    x: clamp(base.x - uy * sway - ux * toward, 0, FIELD.length),
    y: clamp(base.y + ux * sway - uy * toward, 0, FIELD.width),
    arms: (1 + Math.sin(2 * Math.PI * (t / 0.9) + 1)) / 2,
    lunge,
  };
}

// ---------------------------------------------------------------- F8 · trận đấu chuyển động (pha bóng)

export const INTRO = 2; // giây "vào pha bóng"
export const RUN_SPEED = 7; // m/s — tốc độ chạy nước rút của người mới

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, u) => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
const easeOut = (u) => 1 - (1 - u) ** 3;
const inField = (p) => p.x >= 0 && p.x <= FIELD.length && p.y >= 0 && p.y <= FIELD.width;

/** Chỗ xuất phát của một cầu thủ khi vào pha: cách chỗ cuối 4.5m theo một hướng cố định (lật lại nếu ra ngoài sân). */
function startOf(p, i) {
  const a = i * 2.399 + 0.6; // góc vàng → mỗi người chạy vào từ một hướng khác nhau
  const off = { x: 4.5 * Math.cos(a), y: 4.5 * Math.sin(a) };
  const q = { x: p.x + off.x, y: p.y + off.y };
  return inField(q) ? q : { x: p.x - off.x, y: p.y - off.y };
}

/** Vị trí mọi thứ lúc t giây kể từ khi vào pha. t ≥ INTRO → đúng vị trí của tình huống. */
export function introPose(scn, t) {
  const u = clamp(t / INTRO, 0, 1);
  const e = easeOut(u);
  const back = { x: scn.me.x - 6 * Math.cos(scn.me.heading), y: scn.me.y - 6 * Math.sin(scn.me.heading) };
  const camStart = { x: clamp(back.x, 0, FIELD.length), y: clamp(back.y, 0, FIELD.width) };
  const holder = scn.teammates[0];
  const discStart = { x: holder.x - 10, y: holder.y + (holder.y < FIELD.width / 2 ? 6 : -6) };
  const at = (a, b) => (u === 1 ? { x: b.x, y: b.y } : lerp(a, b, e));
  return {
    cam: { ...at(camStart, scn.me), heading: scn.me.heading },
    mates: scn.teammates.map((p, i) => at(startOf(p, i), p)),
    opps: scn.opponents.map((p, i) => at(startOf(p, i + 7), p)),
    disc: u === 1 ? { x: scn.disc.x, y: scn.disc.y } : lerp(discStart, scn.disc, u), // đĩa bay đều, không chậm dần
    discU: u,
    u,
  };
}

/** Chạy từ from tới to, u ∈ [0, 1] (tăng tốc rồi giảm tốc). */
export function runPose(from, to, u) {
  const k = clamp(u, 0, 1);
  return k === 1 ? { x: to.x, y: to.y } : lerp(from, to, k * k * (3 - 2 * k));
}

export function runDuration(d) {
  return clamp(d / RUN_SPEED, 0.8, 2);
}

/** Độ cao (m) của đĩa đang bay, u ∈ [0, 1]: rời tay 1.1m, vòng lên 2.7m, bắt ở 1.1m. */
export function discArc(u) {
  return 1.1 + 6.4 * u * (1 - u);
}

// ---------------------------------------------------------------- F3 · bắt đầu bài

export function startLesson(role) {
  if (role !== 'handler' && role !== 'cutter') throw new Error(`Vai không hợp lệ: ${role}`);
  return { role, index: 0, score: 0, total: LESSON_SIZE, answered: false, correct: null, tap: null,
    lives: LIVES, combo: 0, points: 0, stalled: false };
}

export function current(state) {
  return state.role === 'tutorial' ? TUTORIAL[state.index] : SCENARIOS[state.role][state.index];
}

// ---------------------------------------------------------------- F4 · chấm điểm

export function judge(zone, point) {
  if (!point) return null;
  return Math.hypot(point.x - zone.x, point.y - zone.y) <= zone.r;
}

export function answer(state, point, stall = 0) {
  if (state.answered || !point) return state;
  const correct = judge(current(state).zone, point);
  if (!correct && state.role === 'tutorial') return { ...state, correct: false, tap: point, misses: (state.misses || 0) + 1 }; // F12: chạm lại được
  if (!correct) return { ...state, answered: true, correct, tap: point, lives: state.lives - 1, combo: 0 };
  const combo = state.combo + 1;
  return { ...state, answered: true, correct, tap: point, score: state.score + 1, combo, points: state.points + pointsFor(combo, stall) };
}

// ---------------------------------------------------------------- F10 · một point liên tục: mạng, stall, combo

export const LIVES = 3; // sai 3 lần = turnover → sống sót hết 5 pha ⇔ đúng ≥ 3/5 (PO đổi từ 2, tối 2026-11-15)
export const STALL = 10; // người kèm đếm "Stall 1…10", mỗi giây một số

/** Điểm cho một lần đọc đúng: combo (tối đa ×3) + thưởng nhanh tay. */
export function pointsFor(combo, stall) {
  return 100 * Math.min(combo, 3) + 10 * Math.max(0, STALL - stall);
}

/** Số stall đang đếm sau t giây ở pha decide: 1 ở t = 0, tối đa 10. */
export function stallCount(t) {
  return Math.min(STALL, Math.max(1, Math.floor(t) + 1));
}

/** Hết đếm stall mà chưa chạm: tính là sai (mất đĩa). */
export function stallOut(state) {
  if (state.answered) return state;
  if (state.role === 'tutorial') return { ...state, misses: (state.misses || 0) + 1 }; // F12: đếm lại, không phạt
  return { ...state, answered: true, correct: false, tap: null, stalled: true, lives: state.lives - 1, combo: 0 };
}

// ---------------------------------------------------------------- F5 · đáp án

export function toMinimap(p, w, h) {
  return { mx: (p.x / FIELD.length) * w, my: (p.y / FIELD.width) * h };
}

export function next(state) {
  if (!state.answered || isFinished(state)) return state;
  return { ...state, index: state.index + 1, answered: false, correct: null, tap: null, stalled: false, misses: 0 };
}

// ---------------------------------------------------------------- F6 · kết thúc bài

export function isFinished(state) {
  return state.answered && (state.index === state.total - 1 || state.lives <= 0); // F10: hết mạng = turnover
}

export function passed(state) {
  return isFinished(state) && state.lives > 0;
}

// ---------------------------------------------------------------- F12 · dễ hiểu cho người chưa từng chơi

/** Từ chuyên môn: không được nằm trong title/prompt/explain — chỉ nằm trong term (hiện sau khi trả lời). */
export const JARGON = ['stack', 'cutter', 'handler', 'under', 'deep', 'clear', 'reset', 'dump', 'swing', 'give-and-go', 'endzone', 'stall', 'force', 'mark'];

/** Một bước tập chơi: như tình huống nhưng ít người, có vòng sáng gợi ý (rings) và có/không đếm giờ. */
function step(o) {
  return {
    id: o.id, title: o.title, prompt: o.prompt, explain: o.explain, term: '',
    me: { x: 40, y: 18.5, heading: 0 }, // đứng giữa sân, nhìn về phía tấn công
    disc: { ...o.teammates[0] },
    teammates: o.teammates,
    opponents: o.opponents,
    myMarker: -1,
    markedBehind: false,
    zone: { ...o.zone, r: o.r ?? ZONE_R },
    rings: o.rings,
    stall: !!o.stall,
  };
}

export const TUTORIAL = [
  step({
    id: 'T1', title: 'Tập 1 · Chạy tới đón đĩa', prompt: 'Chạm vào vòng sáng để chạy tới đó!',
    explain: 'Chuẩn! Chạm vào cỏ = chạy tới đó. Đồng đội áo vàng sẽ ném đĩa cho bạn.',
    teammates: [pt(53, 13)], opponents: [], zone: pt(50, 21.5), r: 4.5, rings: [pt(50, 21.5)],
  }),
  step({
    id: 'T2', title: 'Tập 2 · Né áo trắng', prompt: 'Áo trắng là đối thủ. Chạy tới vòng KHÔNG có ai!',
    explain: 'Quá chuẩn! Chỗ có áo trắng là bị chặn. Luôn chạy vào chỗ trống.',
    teammates: [pt(58, 18.5)], opponents: [pt(47.3, 22.2)], zone: pt(47, 15), r: 3, rings: [pt(47, 22), pt(47, 15)],
  }),
  step({
    id: 'T3', title: 'Tập 3 · Tự tìm chỗ trống', prompt: 'Hết vòng sáng rồi! Tự tìm chỗ trống trước khi hết 10 giây.',
    explain: 'Bạn đã biết đọc sân! 🎉 Vào trận: tìm chỗ trống, chạm thật nhanh.',
    teammates: [pt(58, 18.5)], opponents: [pt(50, 23), pt(53, 25.5), pt(56, 22.5), pt(47.5, 22.5), pt(59.4, 19.4)],
    zone: pt(52, 14.5), r: 5, rings: [], stall: true,
  }),
];

export function startTutorial() {
  return { role: 'tutorial', index: 0, score: 0, total: TUTORIAL.length, answered: false, correct: null, tap: null,
    lives: LIVES, combo: 0, points: 0, stalled: false, misses: 0 };
}

// ---------------------------------------------------------------- F13 · cảm giác đã

const PRAISE = ['', 'Hay!', 'Tuyệt!', 'Quá đỉnh!'];
/** Chữ khen to dần theo combo. */
export function comboWord(combo) {
  return combo >= 4 ? 'Không thể cản! 🔥' : PRAISE[Math.max(0, combo)] ?? '';
}

/** Số sao cuối point theo số pha đọc đúng. */
export function starsFor(score) {
  return score >= 5 ? 3 : score === 4 ? 2 : score >= 2 ? 1 : 0;
}

// ---------------------------------------------------------------- F14 · đồ hoạ người

/**
 * Dáng người lúc t giây khi di chuyển với tốc độ speed (m/s). Góc tính bằng radian, 0 = thẳng đứng.
 * Tay đánh ngược nhịp chân như người chạy thật; đứng yên thì chỉ nhún rất nhẹ.
 */
export function bodyPose(t, speed) {
  const v = Math.max(0, speed);
  const amp = v < 0.2 ? 0.05 : Math.min(0.8, 0.2 * v);
  const freq = 1.4 + 0.22 * v; // bước/giây tăng theo tốc độ
  const w = Math.sin(2 * Math.PI * freq * t);
  const legL = amp * w;
  const legR = -legL;
  return { legL, legR, armL: 0.9 * legR, armR: 0.9 * legL,
    bob: Math.abs(w) * Math.min(0.06, 0.012 * v) + 0.01 * Math.sin(2 * Math.PI * 0.8 * t) };
}

const SKINS = ['#F2C79B', '#C98E5F', '#8D5A3B', '#E8B48A', '#5E3A24'];
const HAIRS = ['#1A1410', '#3B2416', '#6B4A2B', '#0E0E0E'];
const MATE_NO = [7, 23, 10, 4, 17, 88];
const OPP_NO = [3, 11, 21, 9, 14, 5, 30];
/** Ngoại hình cố định của cầu thủ thứ i (0–5 đồng đội, 6–12 đối thủ). */
export function lookOf(i) {
  return {
    skin: SKINS[(i * 3) % SKINS.length],
    hair: HAIRS[(i * 7 + 1) % HAIRS.length],
    number: i < 6 ? MATE_NO[i % 6] : OPP_NO[(i - 6) % 7],
    long: i % 4 === 1, // tóc dài buộc sau
  };
}

// ---------------------------------------------------------------- F15 · luật Ultimate trong 30 giây

export const RULES = [
  { icon: '👥', text: 'Hai đội, mỗi đội 7 người, chơi bằng một chiếc đĩa.' },
  { icon: '🏆', text: 'Ghi điểm = bắt được đĩa trong vùng ghi điểm của đối thủ.' },
  { icon: '✋', text: 'Người cầm đĩa không được chạy — chỉ xoay người và ném.' },
  { icon: '🏃', text: 'Vì vậy đồng đội phải chạy vào chỗ trống để nhận đĩa. Game này luyện đúng việc đó!' },
  { icon: '⏱', text: 'Cầm đĩa tối đa 10 giây. Đĩa rơi, ra ngoài hay bị chặn = mất đĩa.' },
  { icon: '🤝', text: 'Không va chạm, tự làm trọng tài — tinh thần fair play.' },
];

export function goalText() {
  return `🎯 Mục tiêu: qua 5 pha, đưa đĩa tới vùng ghi điểm. Sai ${LIVES} lần là mất đĩa.`;
}

// ---------------------------------------------------------------- F16 · khoảnh khắc highlight

/** Dòng tường thuật kiểu bình luận viên sau mỗi pha. */
export function commentary({ phase, dist, correct, stalled, combo, gain }) {
  if (stalled) return `📣 Pha ${phase} · đứng yên quá 10 giây — mất đĩa`;
  if (!correct) return `📣 Pha ${phase} · chạy ${dist}m nhưng chỗ đó chưa trống — mất đĩa`;
  return `📣 Pha ${phase} · chạy ${dist}m vào chỗ trống, bắt gọn!${combo >= 2 ? ` · COMBO ×${Math.min(combo, 3)}` : ''} · +${gain}`;
}

/** Tốc độ thời gian lúc chạy tới bắt đĩa: 12% cuối quay chậm 0.4×. */
export function catchScale(u) {
  return u >= 0.88 && u < 1 ? 0.4 : 1;
}

/** Máy quay hạ thấp bao nhiêu mét khi lao người bắt đĩa (chỉ khi chạy ≥ 6m); v = 0 → 1 ở đoạn cuối đường chạy. */
export function layoutDip(dist, v) {
  if (dist < 6) return 0;
  const k = Math.min(1, Math.max(0, v));
  return 0.55 * Math.sin((Math.PI / 2) * k);
}
