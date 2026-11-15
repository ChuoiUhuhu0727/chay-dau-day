// F13 · Âm thanh tổng hợp bằng Web Audio — không file, không thư viện. Lỗi âm thanh không bao giờ làm hỏng game.

export const SOUNDS = ['tap', 'click', 'correct', 'catch', 'wrong', 'tick', 'turnover', 'win', 'star'];

const N = (f, d, t = 0, type = 'triangle', v = 0.18) => ({ f, d, t, type, v });
const semi = (n) => 2 ** (n / 12);

/** Các nốt của một tiếng: f (Hz), d (giây), t (bắt đầu sau t giây), type (dạng sóng), v (âm lượng). */
export function toneFor(name, combo = 1) {
  const c = Math.min(Math.max(combo, 1), 8);
  switch (name) {
    case 'tap': return [N(700, 0.05, 0, 'sine', 0.12)];
    case 'click': return [N(540, 0.04, 0, 'square', 0.05)];
    case 'correct': { // đô–mi–sol, mỗi combo lên 2 cung
      const b = 523.25 * semi(2 * (c - 1));
      return [N(b, 0.08), N(b * semi(4), 0.08, 0.07), N(b * semi(7), 0.18, 0.14)];
    }
    case 'catch': return [N(880, 0.06, 0, 'sine', 0.14), N(1318.5, 0.2, 0.05, 'sine', 0.12)];
    case 'wrong': return [N(196, 0.16, 0, 'sawtooth', 0.09), N(130.8, 0.26, 0.12, 'sawtooth', 0.09)];
    case 'tick': return [N(1200, 0.03, 0, 'square', 0.06)];
    case 'turnover': return [N(392, 0.16), N(311.1, 0.16, 0.15), N(233.1, 0.4, 0.3)];
    case 'win': return [N(523.25, 0.11), N(659.25, 0.11, 0.11), N(784, 0.11, 0.22), N(1046.5, 0.45, 0.33)];
    case 'star': return [N(880 * semi(4 * (c - 1)), 0.16, 0, 'triangle', 0.15), N(1760 * semi(4 * (c - 1)), 0.1, 0.04, 'sine', 0.06)];
    default: return [];
  }
}

let ctx = null;
let muted = false;

export function setMuted(m) { muted = !!m; }
export function isMuted() { return muted; }

function audio() {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/** Gọi trong lần bấm đầu tiên: trình duyệt chỉ cho phát tiếng sau khi người dùng chạm. */
export function unlock() {
  try { audio(); } catch { /* không có âm thanh: vẫn chơi được */ }
}

/** Phát một tiếng. Luôn ghi tên vào window.__sfx (bot đọc được), kể cả khi đang tắt tiếng. */
export function sfx(name, opts = {}) {
  try {
    if (typeof window !== 'undefined') (window.__sfx = window.__sfx || []).push(name);
    if (muted || !SOUNDS.includes(name)) return;
    const ac = audio();
    if (!ac) return;
    const t0 = ac.currentTime + 0.01;
    for (const n of toneFor(name, opts.combo ?? 1)) {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = n.type;
      osc.frequency.setValueAtTime(n.f, t0 + n.t);
      g.gain.setValueAtTime(0.0001, t0 + n.t);
      g.gain.exponentialRampToValueAtTime(n.v, t0 + n.t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.t + n.d);
      osc.connect(g).connect(ac.destination);
      osc.start(t0 + n.t);
      osc.stop(t0 + n.t + n.d + 0.02);
    }
  } catch { /* lỗi âm thanh không làm hỏng game */ }
}

/** Rung nhẹ (Android). iPhone không hỗ trợ thì thôi. */
export function buzz(pattern) {
  try { if (!muted && typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern); } catch { /* bỏ qua */ }
}
