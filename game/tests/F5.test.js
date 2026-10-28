// F5 — Đếm lượt chạm: mỗi lần chạm xe (kể cả bị chặn) tăng 1, level mới về 0.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, tap } from '../logic.js';

test('level mới bắt đầu với 0 lượt', () => {
  assert.equal(createState(0).moves, 0);
  assert.equal(createState(2).moves, 0);
});

test('chạm xe đi ra tăng 1 lượt', () => {
  const { state, result } = tap(createState(0), 'B');
  assert.equal(result, 'exited');
  assert.equal(state.moves, 1);
});

test('chạm xe bị chặn cũng tăng 1 lượt, không đổi state cũ', () => {
  const before = createState(0);
  const { state, result } = tap(before, 'A');
  assert.equal(result, 'blocked');
  assert.equal(state.moves, 1);
  assert.equal(before.moves, 0);
});

test('lượt cộng dồn qua nhiều lần chạm', () => {
  let s = createState(0);
  s = tap(s, 'A').state; // bị chặn
  s = tap(s, 'A').state; // bị chặn
  s = tap(s, 'B').state; // đi ra
  s = tap(s, 'A').state; // đi ra
  assert.equal(s.moves, 4);
});

test('chạm vào xe không tồn tại thì không tính lượt', () => {
  const { state, result } = tap(createState(0), 'Z');
  assert.equal(result, 'missing');
  assert.equal(state.moves, 0);
});
