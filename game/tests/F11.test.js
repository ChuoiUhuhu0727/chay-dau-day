// F11 — Event tracking: một hàm makeEvent kiểm tên, tham số bắt buộc, chặn dữ liệu cá nhân.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EVENTS, makeEvent } from '../track.js';
import { GA_ID } from '../track-config.js';

// 2026-11-15: plan thêm tutorial_step, tutorial_done (F12) và sound_toggle (F13) — xem trang F11.
test('EVENTS có đúng 11 sự kiện của tracking plan', () => {
  assert.deepEqual(Object.keys(EVENTS).sort(), [
    'explanation_read', 'fullscreen_toggle', 'game_open', 'phase_answer', 'point_end', 'point_start', 'retry_click', 'role_select',
    'sound_toggle', 'tutorial_done', 'tutorial_step',
  ]);
});

test('makeEvent trả { name, params } kèm params.t ≥ 0', () => {
  const ev = makeEvent('role_select', { role: 'cutter' });
  assert.equal(ev.name, 'role_select');
  assert.equal(ev.params.role, 'cutter');
  assert.equal(typeof ev.params.t, 'number');
  assert.ok(ev.params.t >= 0);
});

test('tên lạ hoặc thiếu tham số bắt buộc → ném lỗi', () => {
  assert.throws(() => makeEvent('khong_co', {}));
  assert.throws(() => makeEvent('phase_answer', { role: 'cutter', scenario_id: 'C1' }));
  for (const [name, required] of Object.entries(EVENTS)) {
    const full = Object.fromEntries(required.map((k) => [k, 1]));
    assert.doesNotThrow(() => makeEvent(name, full), name);
    if (required.length) {
      const { [required[0]]: _, ...missing } = full;
      assert.throws(() => makeEvent(name, missing), `${name} thiếu ${required[0]}`);
    }
  }
});

test('không thu dữ liệu cá nhân: name, email, phone, user, ip bị từ chối', () => {
  for (const k of ['name', 'email', 'phone', 'user', 'ip']) {
    assert.throws(() => makeEvent('role_select', { role: 'cutter', [k]: 'x' }), k);
  }
});

test('GA_ID mặc định để trống (không gửi gì ra ngoài)', () => {
  assert.equal(GA_ID, '');
});
