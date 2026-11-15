// F13 — Cảm giác "đã": chữ khen theo combo, sao, âm thanh tổng hợp.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { comboWord, starsFor } from '../logic.js';
import { SOUNDS, toneFor, sfx } from '../sfx.js';

test('comboWord: khen to dần theo combo', () => {
  assert.equal(comboWord(0), '');
  assert.equal(comboWord(1), 'Hay!');
  assert.equal(comboWord(2), 'Tuyệt!');
  assert.equal(comboWord(3), 'Quá đỉnh!');
  assert.ok(comboWord(7).includes('Không thể cản'));
});

test('starsFor: 5 → 3 sao, 4 → 2, 2–3 → 1, 0–1 → 0', () => {
  assert.deepEqual([5, 4, 3, 2, 1, 0].map(starsFor), [3, 2, 1, 1, 0, 0]);
});

test('SOUNDS có đủ 9 tiếng', () => {
  assert.deepEqual([...SOUNDS].sort(), ['catch', 'click', 'correct', 'star', 'tap', 'tick', 'turnover', 'win', 'wrong'].sort());
  for (const name of SOUNDS) {
    const notes = toneFor(name, 1);
    assert.ok(Array.isArray(notes) && notes.length > 0, name);
    for (const n of notes) assert.ok(n.f > 20 && n.f < 8000 && n.d > 0, `${name}: ${JSON.stringify(n)}`);
  }
});

test('correct: combo càng cao thì nốt cao nhất càng cao', () => {
  const top = (c) => Math.max(...toneFor('correct', c).map((n) => n.f));
  assert.ok(top(2) > top(1));
  assert.ok(top(3) > top(2));
});

test('sfx() không ném lỗi khi không có AudioContext (Node)', () => {
  assert.doesNotThrow(() => sfx('correct', { combo: 2 }));
  assert.doesNotThrow(() => sfx('khong-co'));
});
