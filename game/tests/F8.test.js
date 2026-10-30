// F8 — Người kèm bạn chuyển động.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCENARIOS, FIELD, project, cameraOf, markerPose } from '../logic.js';

const view = { w: 360, h: 480 };
const all = [...SCENARIOS.handler, ...SCENARIOS.cutter];
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

test('mỗi tình huống chỉ rõ người kèm bạn; người kèm đứng trước mặt, không che vùng đúng', () => {
  for (const s of all) {
    assert.ok(Number.isInteger(s.myMarker) && s.opponents[s.myMarker], s.id);
    if (s.markedBehind) continue;
    const m = s.opponents[s.myMarker];
    const p = project(cameraOf(s), m, view);
    assert.ok(p && p.sx >= 0 && p.sx <= 360, `${s.id}: người kèm không hiện trong khung (${p && p.sx})`);
    const d = dist(m, s.me);
    assert.ok(d >= 1.5 && d <= 4, `${s.id}: cách bạn ${d.toFixed(2)}m`);
    assert.ok(dist(m, s.zone) > s.zone.r + 1, `${s.id}: che vùng đúng`);
  }
});

test('markerPose: luôn gần chỗ đứng gốc, không đè lên bạn, trong sân, arms/lunge trong [0,1]', () => {
  for (const s of all) {
    const base = s.opponents[s.myMarker];
    for (let t = 0; t <= 10; t += 0.05) {
      const p = markerPose(base, s.me, t);
      assert.ok(dist(p, base) <= 0.9, `${s.id} t=${t.toFixed(2)}: lệch ${dist(p, base).toFixed(2)}m`);
      assert.ok(dist(p, s.me) >= 1.2, `${s.id} t=${t.toFixed(2)}: sát bạn ${dist(p, s.me).toFixed(2)}m`);
      assert.ok(p.x >= 0 && p.x <= FIELD.length && p.y >= 0 && p.y <= FIELD.width, `${s.id}: ra ngoài sân`);
      assert.ok(p.arms >= 0 && p.arms <= 1 && p.lunge >= 0 && p.lunge <= 1, `${s.id}: arms/lunge ngoài [0,1]`);
    }
  }
});

test('markerPose thật sự chuyển động: lắc ngang ≥ 0.8m, arms đổi ≥ 0.5', () => {
  for (const s of all) {
    const base = s.opponents[s.myMarker];
    // trục ngang = vuông góc với đường nối bạn → người kèm
    const d = dist(base, s.me);
    const px = -(base.y - s.me.y) / d;
    const py = (base.x - s.me.x) / d;
    const lat = [];
    const arms = [];
    for (let t = 0; t <= 10; t += 0.05) {
      const p = markerPose(base, s.me, t);
      lat.push((p.x - base.x) * px + (p.y - base.y) * py);
      arms.push(p.arms);
    }
    assert.ok(Math.max(...lat) - Math.min(...lat) >= 0.8, `${s.id}: lắc ngang ${(Math.max(...lat) - Math.min(...lat)).toFixed(2)}m`);
    assert.ok(Math.max(...arms) - Math.min(...arms) >= 0.5, `${s.id}: tay gần như đứng yên`);
  }
});
