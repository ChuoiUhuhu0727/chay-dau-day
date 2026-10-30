// F3 — Chọn vai, bắt đầu bài.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startLesson } from '../logic.js';

test('startLesson(role) bắt đầu bài 5 tình huống từ đầu', () => {
  for (const role of ['handler', 'cutter']) {
    const s = startLesson(role);
    assert.equal(s.role, role);
    assert.equal(s.index, 0);
    assert.equal(s.score, 0);
    assert.equal(s.total, 5);
  }
});

test('vai không hợp lệ thì báo lỗi', () => {
  assert.throws(() => startLesson('goalie'));
  assert.throws(() => startLesson());
});
