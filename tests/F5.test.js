// F5 — Đếm lượt chạm "Lượt: N".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, createState, tap, canExit, movesLabel } from '../logic.js';

test('vào level: moves = 0 và HUD hiện "Lượt: 0"', () => {
  const state = createState(0);
  assert.equal(state.moves, 0);
  assert.equal(movesLabel(state), 'Lượt: 0');
});

test('chạm xe ra được bãi tăng đúng 1', () => {
  const state = createState(0);
  const car = state.cars.find((c) => canExit(state, c.id));
  const next = tap(state, car.id);
  assert.equal(next.result, 'exited');
  assert.equal(next.state.moves, 1);
  assert.equal(movesLabel(next.state), 'Lượt: 1');
});

test('chạm xe bị chặn vẫn tăng đúng 1', () => {
  const state = createState(0);
  const car = state.cars.find((c) => !canExit(state, c.id));
  const once = tap(state, car.id);
  assert.equal(once.result, 'blocked');
  assert.equal(once.state.moves, 1);
  assert.equal(tap(once.state, car.id).state.moves, 2);
});

test('chạm không đổi state cũ', () => {
  const state = createState(0);
  tap(state, state.cars[0].id);
  assert.equal(state.moves, 0);
});

test('chạm vào chỗ không có xe thì không tính', () => {
  const state = createState(0);
  const next = tap(state, 'KHONG_CO');
  assert.equal(next.result, 'missing');
  assert.equal(next.state.moves, 0);
});

test('sang level mới thì về 0', () => {
  let state = createState(0);
  state = tap(state, state.cars[0].id).state;
  state = tap(state, state.cars[0].id).state;
  assert.ok(state.moves > 0);
  LEVELS.forEach((_, i) => assert.equal(createState(i).moves, 0, `level ${i + 1}`));
});
