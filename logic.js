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

export function focal(cam, view) {
  return view.w / 2 / Math.tan(cam.fov / 2);
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
      id: 'C1', title: 'Cắt ngắn ra phía trống',
      prompt: 'Đĩa ở handler giữa sân. Người kèm đĩa chặn bên phải bạn, nên bên trái đang trống. Bạn đứng đầu stack — cắt tới đâu?',
      explain: 'Cắt ngắn (under) chéo về phía trống, cách người cầm đĩa 8–10m. Đường chuyền ngắn, dễ, người kèm đĩa không chặn được.',
      me: look(40, 18.5, 31, 23),
      teammates: [pt(30, 18.5), pt(25, 24), pt(44, 18.5), pt(48, 18.5), pt(52, 18.5), pt(56, 18.5)],
      zone: pt(32, 27),
    }),
    scenario({
      id: 'C2', title: 'Cắt hụt thì dọn đường',
      prompt: 'Bạn vừa cắt ngắn ra phía trống nhưng không nhận được đĩa. Đồng đội tiếp theo sắp cắt vào đúng chỗ bạn đứng. Bạn chạy đi đâu?',
      explain: 'Dọn đường (clear): chạy chéo lên phía trên, ra sát biên rồi về lại stack. Đứng lại sẽ chắn đường cắt của đồng đội.',
      me: look(33, 27, 44, 31),
      teammates: [pt(30, 18.5), pt(25, 24), pt(44, 18.5), pt(48, 18.5), pt(52, 18.5), pt(56, 18.5)],
      zone: pt(44, 32),
    }),
    scenario({
      id: 'C3', title: 'Cắt sâu khi bị chặn đường ngắn',
      prompt: 'Người kèm bạn đứng ngay sau lưng bạn (phía đĩa), chặn đường cắt ngắn. Bạn đứng đầu stack, đang nhìn lên phía endzone đối thủ. Chỗ trống ở đâu?',
      explain: 'Người kèm chặn phía dưới thì phía sau lưng họ trống: cắt sâu (deep) chéo về phía trống, ra xa stack để đĩa bay qua đầu mọi người.',
      me: look(38, 18.5, 52, 26),
      markedBehind: true,
      teammates: [pt(28, 18.5), pt(23, 24), pt(43, 18.5), pt(47, 18.5), pt(51, 18.5), pt(55, 18.5)],
      zone: pt(50, 28),
    }),
    scenario({
      id: 'C4', title: 'Gần endzone: đứng góc trống',
      prompt: 'Đĩa đã tới gần endzone đối thủ, người cầm đĩa ở phía bên trái bạn. Stack đứng trong endzone. Bạn chạy tới đâu để ghi điểm?',
      explain: 'Gần endzone, chạy vào góc endzone phía trống (xa người kèm đĩa). Chỗ đó rộng, đĩa ném vào dễ và bắt được là có điểm.',
      me: look(76, 22, 88, 29),
      teammates: [pt(72, 12), pt(68, 17), pt(86, 18.5), pt(90, 18.5), pt(94, 18.5), pt(83, 12)],
      zone: pt(87, 29),
    }),
    scenario({
      id: 'C5', title: 'Vào chỗ đồng đội vừa bỏ trống',
      prompt: 'Người đầu stack vừa cắt sâu lên trên. Bạn là người thứ hai trong stack. Chỗ nào vừa trống ra cho bạn?',
      explain: 'Đồng đội cắt sâu kéo người kèm đi, chỗ cắt ngắn phía trống bỏ ngỏ. Cắt ngắn vào đó ngay sau họ: hai đường cắt nối nhau, không chạy chung làn.',
      me: look(44, 18.5, 33, 22),
      teammates: [pt(30, 18.5), pt(25, 24), pt(58, 26), pt(48, 18.5), pt(52, 18.5), pt(56, 18.5)],
      zone: pt(35, 26),
    }),
  ],
  handler: [
    scenario({
      id: 'H1', title: 'Đứng reset sau người cầm đĩa',
      prompt: 'Đồng đội vừa bắt đĩa giữa sân. Bạn là handler thứ hai, đang ở phía sau. Đứng đâu để làm điểm chuyền an toàn (reset)?',
      explain: 'Reset đứng chéo phía sau người cầm đĩa khoảng 5m, về phía trống. Gần đủ để chuyền ngắn khi người cầm đĩa bị kẹp, mà không chắn đường cắt của stack.',
      me: look(28, 14, 38, 20),
      teammates: [pt(40, 18.5), pt(50, 18.5), pt(54, 18.5), pt(58, 18.5), pt(62, 18.5), pt(66, 18.5)],
      zone: pt(36, 23),
    }),
    scenario({
      id: 'H2', title: 'Cứu người bị kẹp biên',
      prompt: 'Người cầm đĩa bị ép sát biên, người kèm chặn đường lên. Stall đang đếm. Bạn đứng đâu để nhận đĩa cứu nguy?',
      explain: 'Khi đồng đội bị kẹp biên, chạy về phía giữa sân, chéo sau lưng họ. Chuyền về giữa sân mở lại cả hai phía để tấn công tiếp.',
      me: look(34, 10, 42, 9),
      teammates: [pt(46, 3), pt(56, 18.5), pt(60, 18.5), pt(64, 18.5), pt(68, 18.5), pt(72, 18.5)],
      zone: pt(41, 11),
    }),
    scenario({
      id: 'H3', title: 'Chuyền xong thì chạy lên',
      prompt: 'Bạn vừa chuyền đĩa cho đồng đội ở phía trước bên phải. Người kèm bạn đang đứng xem đĩa bay. Chạy đi đâu?',
      explain: 'Chuyền xong chạy lên ngay (give-and-go) vào khoảng trống phía trước, vượt qua người kèm đang đứng nhìn. Đồng đội chuyền trả lại là bạn tiến thêm 10m.',
      me: look(40, 18.5, 50, 20),
      teammates: [pt(46, 26), pt(36, 12), pt(60, 18.5), pt(64, 18.5), pt(68, 18.5), pt(72, 18.5)],
      zone: pt(51, 17),
    }),
    scenario({
      id: 'H4', title: 'Stall cao: chuyền ngang về giữa',
      prompt: 'Người cầm đĩa ở sát biên bên phải bạn, stall đã đếm tới 7. Stack không ai mở. Bạn đứng đâu để nhận đường chuyền ngang (swing)?',
      explain: 'Stall cao thì cần một đường chuyền ngang dễ: đứng ngang hoặc hơi sau người cầm đĩa, ở giữa sân. Đĩa về giữa thì cả sân mở lại.',
      me: look(42, 26, 49, 21),
      teammates: [pt(50, 33), pt(60, 18.5), pt(64, 18.5), pt(68, 18.5), pt(72, 18.5), pt(76, 18.5)],
      zone: pt(49, 22),
    }),
    scenario({
      id: 'H5', title: 'Gần endzone: giữ chỗ reset',
      prompt: 'Đĩa cách endzone đối thủ vài bước, ở phía bên trái bạn. Cutter đang chạy trong endzone. Bạn là handler — đứng đâu?',
      explain: 'Gần endzone, handler đứng trước vạch endzone ở giữa sân, sau người cầm đĩa một chút. Nếu không ai trống trong endzone, đĩa về bạn rồi chuyền sang phía kia.',
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
  return { role, index: 0, score: 0, total: LESSON_SIZE, answered: false, correct: null, tap: null };
}

export function current(state) {
  return SCENARIOS[state.role][state.index];
}

// ---------------------------------------------------------------- F4 · chấm điểm

export function judge(zone, point) {
  if (!point) return null;
  return Math.hypot(point.x - zone.x, point.y - zone.y) <= zone.r;
}

export function answer(state, point) {
  if (state.answered || !point) return state;
  const correct = judge(current(state).zone, point);
  return { ...state, answered: true, correct, tap: point, score: state.score + (correct ? 1 : 0) };
}

// ---------------------------------------------------------------- F5 · đáp án

export function toMinimap(p, w, h) {
  return { mx: (p.x / FIELD.length) * w, my: (p.y / FIELD.width) * h };
}

export function next(state) {
  if (!state.answered || state.index >= state.total - 1) return state;
  return { ...state, index: state.index + 1, answered: false, correct: null, tap: null };
}

// ---------------------------------------------------------------- F6 · kết thúc bài

export function isFinished(state) {
  return state.answered && state.index === state.total - 1;
}

export function passed(state) {
  return state.score >= 4;
}
