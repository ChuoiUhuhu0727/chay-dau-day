// F6 — Kết thúc bài: X/5, qua bài. Luật kết thúc theo F10 (2 mạng → sai 2 lần là turnover).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startLesson, answer, next, current, isFinished, passed } from '../logic.js';

/** Chơi theo mẫu đúng/sai tới khi kết thúc (hết 5 pha hoặc hết mạng). Trả về state và số pha đã chơi. */
function play(role, pattern) {
  let s = startLesson(role);
  let played = 0;
  for (const ok of pattern) {
    const z = current(s).zone;
    s = answer(s, ok ? { x: z.x, y: z.y } : { x: z.x + 12, y: z.y });
    played++;
    if (isFinished(s)) break;
    s = next(s);
  }
  return { s, played };
}

test('isFinished đúng khi đã trả lời tình huống thứ 5', () => {
  assert.equal(isFinished(startLesson('handler')), false);
  const { s, played } = play('handler', [true, true, true, true, true]);
  assert.equal(played, 5);
  assert.equal(isFinished(s), true);
});

test('isFinished đúng khi hết mạng giữa chừng (sai 2 lần = turnover)', () => {
  const { s, played } = play('cutter', [true, false, false, true, true]);
  assert.equal(played, 3);
  assert.equal(isFinished(s), true);
});

test('4/5 và 5/5 là qua bài; sai 2 lần là chưa qua', () => {
  const four = play('cutter', [true, false, true, true, true]).s;
  assert.equal(four.score, 4);
  assert.equal(passed(four), true);
  assert.equal(passed(play('handler', [true, true, true, true, true]).s), true);
  const three = play('cutter', [true, false, false, true, true]).s;
  assert.equal(passed(three), false);
  assert.equal(passed(play('handler', [false, false, false, false, false]).s), false);
});

test('next ở tình huống cuối không vượt quá 5', () => {
  const { s } = play('cutter', [true, true, true, true, true]);
  assert.equal(next(s).index, 4);
});
