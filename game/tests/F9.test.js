// F9 — Full màn hình: FOV 70° áp cho cạnh ngắn của khung, sân vẫn nhìn đúng ở mọi khung.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FOV, focal, project, unproject, makeCamera } from '../logic.js';

const views = [{ w: 360, h: 480 }, { w: 390, h: 844 }, { w: 844, h: 390 }, { w: 1280, h: 720 }];
const cam = makeCamera(30, 18, 0); // đứng giữa sân, nhìn về endzone đích (x tăng)

test('focal = min(w, h) / (2·tan(fov/2)) cho cả khung dọc và khung ngang', () => {
  for (const v of views) {
    const want = Math.min(v.w, v.h) / (2 * Math.tan(FOV / 2));
    assert.ok(Math.abs(focal(cam, v) - want) <= 1e-9, `${v.w}×${v.h}: ${focal(cam, v)} ≠ ${want}`);
  }
  assert.ok(Math.abs(focal(cam, { w: 360, h: 480 }) - 360 / (2 * Math.tan((35 * Math.PI) / 180))) <= 1e-9, 'khung cũ 360×480 phải giữ nguyên');
});

test('điểm 2.5m và 30m ngay trước mặt đều nằm trong khung ở mọi cỡ màn', () => {
  for (const v of [{ w: 390, h: 844 }, { w: 844, h: 390 }, { w: 1280, h: 720 }, { w: 360, h: 360 }]) {
    for (const d of [2.5, 30]) {
      const s = project(cam, { x: cam.x + d, y: cam.y }, v);
      assert.ok(s, `${v.w}×${v.h}, ${d}m: không chiếu được`);
      assert.ok(s.sx >= 0 && s.sx <= v.w && s.sy >= 0 && s.sy <= v.h, `${v.w}×${v.h}, ${d}m: (${s.sx.toFixed(1)}, ${s.sy.toFixed(1)}) ngoài khung`);
    }
    const near = { x: cam.x + 2.5, y: cam.y };
    const s = project(cam, near, v);
    const back = unproject(cam, s.sx, s.sy, v);
    assert.ok(back && Math.hypot(back.x - near.x, back.y - near.y) <= 0.05, `${v.w}×${v.h}: unproject lệch`);
  }
});
