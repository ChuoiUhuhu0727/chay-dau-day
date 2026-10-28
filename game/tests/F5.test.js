// F5 — Đếm lượt chạm: mỗi lần chạm xe (kể cả bị chặn) tăng 1; level mới về 0.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, createState, tap, canExit } from '../logic.js';

test('level mới bắt đầu với 0 lượt', () => {
  LEVELS.forEach((_, i) => assert.equal(createState(i).moves, 0));
});

test('chạm xe ra bãi tăng 1 lượt', () => {
  const s0 = createState(0);
  const free = s0.cars.find((c) => canExit(s0, c.id));
  const { state, result } = tap(s0, free.id);
  assert.equal(result, 'exited');
  assert.equal(state.moves, 1);
});

test('chạm xe bị chặn vẫn tăng 1 lượt, số xe không đổi', () => {
  const s0 = createState(0);
  const blocked = s0.cars.find((c) => !canExit(s0, c.id));
  assert.ok(blocked, 'level 1 cần có xe bị chặn');
  const { state, result } = tap(s0, blocked.id);
  assert.equal(result, 'blocked');
  assert.equal(state.moves, 1);
  assert.equal(state.cars.length, s0.cars.length);
});

test('đếm dồn qua nhiều lần chạm và không đổi state cũ', () => {
  const s0 = createState(0);
  const blocked = s0.cars.find((c) => !canExit(s0, c.id));
  const s1 = tap(s0, blocked.id).state;
  const s2 = tap(s1, blocked.id).state;
  assert.equal(s2.moves, 2);
  assert.equal(s0.moves, 0);
});

test('chạm xe không tồn tại không tính lượt', () => {
  const s0 = createState(0);
  assert.equal(tap(s0, 'ZZ').state.moves, 0);
});
