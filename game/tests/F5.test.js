// F5 — Đáp án: sơ đồ nhìn từ trên + chuyển tình huống.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toMinimap, startLesson, answer, next, current } from '../logic.js';

test('toMinimap: (0,0) → (0,0), (100,37) → (w,h), giữa sân → giữa sơ đồ', () => {
  assert.deepEqual(toMinimap({ x: 0, y: 0 }, 340, 126), { mx: 0, my: 0 });
  assert.deepEqual(toMinimap({ x: 100, y: 37 }, 340, 126), { mx: 340, my: 126 });
  const mid = toMinimap({ x: 50, y: 18.5 }, 340, 126);
  assert.equal(mid.mx, 170);
  assert.equal(mid.my, 63);
});

test('next sau khi trả lời: sang tình huống kế, chưa trả lời thì không đi', () => {
  const s0 = startLesson('cutter');
  assert.equal(next(s0).index, 0, 'chưa trả lời thì đứng yên');
  const s1 = next(answer(s0, { ...current(s0).zone }));
  assert.equal(s1.index, 1);
  assert.equal(s1.answered, false);
  assert.equal(s1.score, 1);
});
