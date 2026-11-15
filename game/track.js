// F11 · Event tracking — mọi sự kiện đi qua track(). Đổi đích (GA4 → Firebase/PostHog) chỉ sửa file này.
// Tracking plan đầy đủ: 1-wiki/features/F11-event-tracking.md
import { GA_ID } from './track-config.js';

/** Tên sự kiện → tham số bắt buộc. */
export const EVENTS = {
  game_open: ['screen_w', 'screen_h', 'fullscreen_supported'],
  role_select: ['role'],
  point_start: ['role', 'attempt'],
  phase_answer: ['role', 'scenario_id', 'phase', 'outcome', 'stall', 'combo', 'gain', 'decide_ms'],
  explanation_read: ['scenario_id', 'outcome', 'read_ms'],
  point_end: ['role', 'result', 'correct', 'points', 'phases_played', 'duration_ms', 'new_best', 'attempt'],
  retry_click: ['role', 'last_result', 'attempt'],
  fullscreen_toggle: ['on'],
  tutorial_step: ['step', 'tries'], // F12
  tutorial_done: ['ms'], // F12
  sound_toggle: ['on'], // F13
};

const PERSONAL = ['name', 'email', 'phone', 'user', 'ip'];

/** Tạo sự kiện hợp lệ (hàm thuần trừ đồng hồ). Sai tên, thiếu tham số, hay có dữ liệu cá nhân → ném lỗi. */
export function makeEvent(name, params = {}) {
  const required = EVENTS[name];
  if (!required) throw new Error(`Sự kiện không có trong tracking plan: ${name}`);
  for (const k of required) if (!(k in params)) throw new Error(`${name} thiếu tham số ${k}`);
  for (const k of PERSONAL) if (k in params) throw new Error(`${name}: không thu dữ liệu cá nhân (${k})`);
  return { name, params: { ...params, t: Math.round(performance.now()) } };
}

let gaReady = false;

/** Bật GA4 nếu có GA_ID (chỉ chạy trong trình duyệt). */
export function initTracking() {
  if (typeof window === 'undefined') return;
  window.__events = window.__events || [];
  window.dataLayer = window.dataLayer || [];
  if (!GA_ID || gaReady) return;
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.append(s);
  gaReady = true;
}

/** Ghi một sự kiện. Lỗi tracking không bao giờ làm hỏng game. */
export function track(name, params) {
  try {
    const ev = makeEvent(name, params);
    if (typeof window === 'undefined') return ev;
    (window.__events = window.__events || []).push(ev);
    if (gaReady && window.gtag) window.gtag('event', name, ev.params);
    else (window.dataLayer = window.dataLayer || []).push({ event: name, ...ev.params });
    return ev;
  } catch (err) {
    console.warn('[track]', err.message);
    return null;
  }
}
