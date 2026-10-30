// F1 — Sân góc nhìn thứ nhất: phép chiếu phối cảnh project / unproject.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FIELD, project, unproject, makeCamera } from '../logic.js';

const view = { w: 360, h: 480 };

test('FIELD = 100 × 37, endzone 18', () => {
  assert.deepEqual(FIELD, { length: 100, width: 37, endzone: 18 });
});

test('điểm ngay trước mặt 10m nằm giữa màn (sai số ≤ 1px), ở nhiều hướng nhìn', () => {
  for (const heading of [0, Math.PI / 2, Math.PI, -2.3, 0.7]) {
    const cam = makeCamera(40, 18, heading);
    const p = { x: 40 + 10 * Math.cos(heading), y: 18 + 10 * Math.sin(heading) };
    const s = project(cam, p, view);
    assert.ok(s, 'phải thấy điểm trước mặt');
    assert.ok(Math.abs(s.sx - view.w / 2) <= 1, `sx=${s.sx}`);
  }
});

test('điểm xa hơn nằm cao hơn và gần đường chân trời hơn', () => {
  const cam = makeCamera(20, 18, 0);
  const near = project(cam, { x: 25, y: 18 }, view);
  const far = project(cam, { x: 45, y: 18 }, view);
  const horizon = project(cam, { x: 2000, y: 18 }, view);
  assert.ok(far.sy < near.sy, 'xa hơn thì sy nhỏ hơn');
  assert.ok(Math.abs(far.sy - horizon.sy) < Math.abs(near.sy - horizon.sy), 'xa hơn thì gần chân trời hơn');
});

test('điểm sau lưng camera trả về null', () => {
  const cam = makeCamera(50, 18, 0);
  assert.equal(project(cam, { x: 40, y: 18 }, view), null);
  assert.equal(project(cam, { x: 50, y: 30 }, view), null); // ngang vai, không ở trước mặt
});

test('unproject là ngược của project: 20 điểm sai số ≤ 0.05m', () => {
  const cam = makeCamera(30, 15, 0.4);
  let n = 0;
  for (let i = 0; i < 400 && n < 20; i++) {
    const p = { x: (i * 37) % 100, y: (i * 13) % 37 };
    const s = project(cam, p, view);
    if (!s || s.sx < 0 || s.sx > view.w || s.sy > view.h) continue;
    const back = unproject(cam, s.sx, s.sy, view);
    assert.ok(back, `unproject null cho ${JSON.stringify(p)}`);
    assert.ok(Math.hypot(back.x - p.x, back.y - p.y) <= 0.05, `${JSON.stringify(p)} → ${JSON.stringify(back)}`);
    n++;
  }
  assert.equal(n, 20);
});

test('chạm trên đường chân trời trả về null', () => {
  const cam = makeCamera(30, 15, 0);
  assert.equal(unproject(cam, 180, 5, view), null);
  const horizon = project(cam, { x: 5000, y: 15 }, view);
  assert.equal(unproject(cam, 180, horizon.sy - 1, view), null);
});
