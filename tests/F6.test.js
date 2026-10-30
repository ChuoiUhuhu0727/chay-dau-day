// F6 — Kết thúc bài: X/5, qua bài.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startLesson, answer, next, current, isFinished, passed } from '../logic.js';

function play(role, pattern) {
  let s = startLesson(role);
  pattern.forEach((ok, i) => {
    const z = current(s).zone;
    s = answer(s, ok ? { x: z.x, y: z.y } : { x: z.x + 12, y: z.y });
    assert.equal(isFinished(s), i === pattern.length - 1, `sau tình huống ${i + 1}`);
    if (i < pattern.length - 1) s = next(s);
  });
  return s;
}

test('isFinished chỉ đúng khi đã trả lời tình huống thứ 5', () => {
  const s = startLesson('handler');
  assert.equal(isFinished(s), false);
  play('handler', [true, true, true, true, true]);
});

test('4/5 là qua bài, 3/5 là chưa qua', () => {
  const four = play('cutter', [true, false, true, true, true]);
  assert.equal(four.score, 4);
  assert.equal(passed(four), true);
  const three = play('cutter', [true, false, false, true, true]);
  assert.equal(three.score, 3);
  assert.equal(passed(three), false);
  assert.equal(passed(play('handler', [false, false, false, false, false])), false);
  assert.equal(passed(play('handler', [true, true, true, true, true])), true);
});

test('next ở tình huống cuối không vượt quá 5', () => {
  const s = play('cutter', [true, true, true, true, true]);
  assert.equal(next(s).index, 4);
});
