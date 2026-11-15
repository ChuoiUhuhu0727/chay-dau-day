// F10 — Một point liên tục: 2 mạng, đếm stall, combo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startLesson, answer, next, current, isFinished, passed, LIVES, STALL, pointsFor, stallOut, stallCount } from '../logic.js';

const hit = (s) => { const z = current(s).zone; return { x: z.x, y: z.y }; };
const miss = (s) => { const z = current(s).zone; return { x: z.x + 12, y: z.y }; };

// 2026-11-15 tối: PO đổi 2 → 3 mạng (xem trang F10).
test('startLesson có 3 mạng, combo 0, điểm 0; LIVES = 3, STALL = 10', () => {
  assert.equal(LIVES, 3);
  assert.equal(STALL, 10);
  const s = startLesson('cutter');
  assert.equal(s.lives, 3);
  assert.equal(s.combo, 0);
  assert.equal(s.points, 0);
});

test('pointsFor: 100 × combo (tối đa ×3) + 10 × (10 − stall)', () => {
  assert.equal(pointsFor(1, 0), 200);
  assert.equal(pointsFor(2, 3), 270);
  assert.equal(pointsFor(5, 10), 300);
});

test('answer đúng: score +1, combo +1, cộng điểm theo combo và stall; mạng giữ nguyên', () => {
  let s = startLesson('cutter');
  s = answer(s, hit(s), 2);
  assert.equal(s.score, 1);
  assert.equal(s.combo, 1);
  assert.equal(s.points, pointsFor(1, 2));
  assert.equal(s.lives, 3);
  const again = answer(s, miss(s), 0);
  assert.deepEqual(again, s, 'gọi lần 2 không đổi gì');
  s = answer(next(s), hit(next(s)), 4);
  assert.equal(s.combo, 2);
  assert.equal(s.points, pointsFor(1, 2) + pointsFor(2, 4));
});

test('answer sai: −1 mạng, combo về 0, điểm giữ nguyên', () => {
  let s = startLesson('handler');
  s = answer(s, hit(s), 1);
  const before = s.points;
  s = next(s);
  s = answer(s, miss(s), 1);
  assert.equal(s.lives, 2);
  assert.equal(s.combo, 0);
  assert.equal(s.points, before);
  assert.equal(s.score, 1);
});

test('stallOut: tính là sai, đánh dấu stalled; đã trả lời thì không đổi', () => {
  let s = answer(startLesson('cutter'), hit(startLesson('cutter')), 0);
  s = next(s);
  const out = stallOut(s);
  assert.equal(out.answered, true);
  assert.equal(out.correct, false);
  assert.equal(out.stalled, true);
  assert.equal(out.lives, 2);
  assert.equal(out.combo, 0);
  assert.equal(out.tap, null);
  assert.deepEqual(stallOut(out), out);
});

test('stallCount: 1 ở t = 0, 4 ở t = 3.5, luôn trong [1, 10]', () => {
  assert.equal(stallCount(0), 1);
  assert.equal(stallCount(3.5), 4);
  for (let t = -1; t <= 30; t += 0.25) {
    const c = stallCount(t);
    assert.ok(c >= 1 && c <= 10, `t=${t}: ${c}`);
  }
});

test('hết mạng giữa chừng là kết thúc (turnover), không qua bài', () => {
  let s = startLesson('cutter');
  s = answer(s, miss(s), 0);
  assert.equal(isFinished(s), false);
  s = next(s);
  s = answer(s, miss(s), 0);
  assert.equal(isFinished(s), false);
  s = next(s);
  s = stallOut(s);
  assert.equal(s.lives, 0);
  assert.equal(isFinished(s), true);
  assert.equal(passed(s), false);
  assert.equal(next(s).index, s.index, 'hết mạng thì không sang pha sau');
});
