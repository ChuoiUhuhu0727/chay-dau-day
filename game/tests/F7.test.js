// F7 — Endzone đích: khoảng cách và hướng tới endzone đối thủ.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { goalInfo, makeCamera } from '../logic.js';

test('đứng giữa sân nhìn thẳng về endzone đích: 42m, góc 0', () => {
  const g = goalInfo(makeCamera(40, 18.5, 0));
  assert.equal(g.distance, 42);
  assert.ok(Math.abs(g.bearing) <= 0.001, `bearing=${g.bearing}`);
});

test('quay lưng lại endzone đích: |bearing| = π', () => {
  const g = goalInfo(makeCamera(40, 18.5, Math.PI));
  assert.ok(Math.abs(Math.abs(g.bearing) - Math.PI) <= 0.001, `bearing=${g.bearing}`);
  assert.equal(g.distance, 42);
});

test('đứng trong endzone đích thì distance = 0', () => {
  assert.equal(goalInfo(makeCamera(90, 10, 0)).distance, 0);
  assert.equal(goalInfo(makeCamera(82, 10, 0)).distance, 0);
});

test('endzone ở bên phải hướng nhìn thì bearing > 0, bên trái thì < 0', () => {
  // nhìn theo hướng y giảm (heading −π/2): x tăng nằm bên trái
  assert.ok(goalInfo(makeCamera(40, 18.5, Math.PI / 2)).bearing < 0);
  assert.ok(goalInfo(makeCamera(40, 18.5, -Math.PI / 2)).bearing > 0);
  assert.ok(goalInfo(makeCamera(40, 30, 0)).bearing < 0); // tâm endzone y 18.5 < 30 → bên trái
});
