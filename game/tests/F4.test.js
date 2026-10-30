// F4 — Chạm chọn chỗ đứng + chấm đúng/sai.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { judge, answer, startLesson, current } from '../logic.js';

const zone = { x: 40, y: 20, r: 4 };

test('judge: trong bán kính là đúng, ngoài là sai, null là không tính', () => {
  assert.equal(judge(zone, { x: 40, y: 20 }), true);
  assert.equal(judge(zone, { x: 44, y: 20 }), true); // đúng mép
  assert.equal(judge(zone, { x: 43, y: 23 }), false); // 4.24m
  assert.equal(judge(zone, { x: 10, y: 5 }), false);
  assert.equal(judge(zone, null), null);
});

test('answer đúng: +1 điểm, answered = true', () => {
  const s0 = startLesson('cutter');
  const s1 = answer(s0, { ...current(s0).zone });
  assert.equal(s1.score, 1);
  assert.equal(s1.answered, true);
  assert.equal(s1.correct, true);
});

test('answer sai: giữ điểm, answered = true', () => {
  const s0 = startLesson('handler');
  const z = current(s0).zone;
  const s1 = answer(s0, { x: z.x + 10, y: z.y });
  assert.equal(s1.score, 0);
  assert.equal(s1.answered, true);
  assert.equal(s1.correct, false);
});

test('chạm lần 2 trong cùng tình huống không đổi gì; chạm null không tính', () => {
  const s0 = startLesson('cutter');
  const z = current(s0).zone;
  const wrong = answer(s0, { x: z.x + 10, y: z.y });
  const again = answer(wrong, { ...z });
  assert.deepEqual(again, wrong);
  const sky = answer(s0, null);
  assert.equal(sky.answered, false);
  assert.equal(sky.score, 0);
});
