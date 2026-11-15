// F16 — Khoảnh khắc highlight: lời tường thuật, quay chậm lúc bắt, lao người.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { commentary, catchScale, layoutDip } from '../logic.js';

test('commentary: pha đúng có số pha, quãng chạy, "bắt" và điểm; combo ≥ 2 có COMBO', () => {
  const a = commentary({ phase: 2, dist: 9, correct: true, stalled: false, combo: 1, gain: 190 });
  for (const k of ['Pha 2', '9m', 'bắt', '+190']) assert.ok(a.includes(k), `${k} · ${a}`);
  assert.ok(!a.includes('COMBO'), a);
  const b = commentary({ phase: 3, dist: 12, correct: true, stalled: false, combo: 2, gain: 290 });
  assert.ok(b.includes('COMBO ×2'), b);
});

test('commentary: sai và stall đều là mất đĩa; stall nói 10 giây', () => {
  const w = commentary({ phase: 3, dist: 5, correct: false, stalled: false, combo: 0, gain: 0 });
  assert.ok(w.includes('Pha 3') && w.includes('mất đĩa'), w);
  const s = commentary({ phase: 4, dist: 0, correct: false, stalled: true, combo: 0, gain: 0 });
  assert.ok(s.includes('10 giây') && s.includes('mất đĩa'), s);
});

test('catchScale: chậm lại 0.4× ở 12% cuối đường chạy', () => {
  assert.equal(catchScale(0), 1);
  assert.equal(catchScale(0.87), 1);
  assert.equal(catchScale(0.88), 0.4);
  assert.equal(catchScale(0.99), 0.4);
});

test('layoutDip: chỉ lao người khi chạy ≥ 6m, thấp dần tới 0.55m lúc bắt', () => {
  assert.equal(layoutDip(5, 1), 0);
  assert.equal(layoutDip(8, 0), 0);
  assert.ok(Math.abs(layoutDip(8, 1) - 0.55) < 1e-9);
  let prev = 0;
  for (let v = 0; v <= 1.0001; v += 0.05) {
    const d = layoutDip(8, Math.min(1, v));
    assert.ok(d >= prev - 1e-12, `v=${v}`);
    prev = d;
  }
});
