// F9 — Trận đấu chuyển động: vào pha, chạy tới chỗ đã chọn, đĩa bay.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCENARIOS, FIELD, INTRO, introPose, runPose, runDuration, discArc } from '../logic.js';

const all = [...SCENARIOS.handler, ...SCENARIOS.cutter];
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const inField = (p) => p.x >= 0 && p.x <= FIELD.length && p.y >= 0 && p.y <= FIELD.width;

test('INTRO = 2 giây', () => assert.equal(INTRO, 2));

test('introPose: bắt đầu xa, kết thúc đúng vị trí tình huống, camera tiến dần', () => {
  for (const s of all) {
    const p0 = introPose(s, 0);
    assert.ok(dist(p0.cam, s.me) >= 4, `${s.id}: camera chỉ cách ${dist(p0.cam, s.me).toFixed(2)}m`);
    for (const t of [INTRO, INTRO + 0.5, 99]) {
      const p = introPose(s, t);
      assert.ok(dist(p.cam, s.me) <= 1e-9 && Math.abs(p.cam.heading - s.me.heading) <= 1e-9, `${s.id}: camera t=${t}`);
      s.teammates.forEach((q, i) => assert.ok(dist(p.mates[i], q) <= 1e-9, `${s.id}: đồng đội ${i}`));
      s.opponents.forEach((q, i) => assert.ok(dist(p.opps[i], q) <= 1e-9, `${s.id}: đối thủ ${i}`));
      assert.ok(dist(p.disc, s.disc) <= 1e-9, `${s.id}: đĩa`);
    }
    let last = Infinity;
    for (let t = 0; t <= INTRO; t += 0.05) {
      const d = dist(introPose(s, t).cam, s.me);
      assert.ok(d <= last + 1e-9, `${s.id}: camera lùi lại lúc t=${t.toFixed(2)}`);
      last = d;
    }
  }
});

test('introPose lúc t = 0: mọi người còn cách chỗ cuối ≥ 2m, trong sân; đĩa cách người cầm ≥ 8m', () => {
  for (const s of all) {
    const p = introPose(s, 0);
    s.teammates.forEach((q, i) => {
      assert.ok(dist(p.mates[i], q) >= 2, `${s.id}: đồng đội ${i} chỉ cách ${dist(p.mates[i], q).toFixed(2)}m`);
      assert.ok(inField(p.mates[i]), `${s.id}: đồng đội ${i} ngoài sân`);
    });
    s.opponents.forEach((q, i) => {
      assert.ok(dist(p.opps[i], q) >= 2, `${s.id}: đối thủ ${i} chỉ cách ${dist(p.opps[i], q).toFixed(2)}m`);
      assert.ok(inField(p.opps[i]), `${s.id}: đối thủ ${i} ngoài sân`);
    });
    assert.ok(inField(p.cam), `${s.id}: camera ngoài sân`);
    assert.ok(dist(p.disc, s.disc) >= 8, `${s.id}: đĩa chỉ cách ${dist(p.disc, s.disc).toFixed(2)}m`);
  }
});

test('runPose: đi từ from tới to, không lùi', () => {
  const from = { x: 40, y: 18.5 };
  const to = { x: 32, y: 27 };
  assert.ok(dist(runPose(from, to, 0), from) <= 1e-9);
  assert.ok(dist(runPose(from, to, 1), to) <= 1e-9);
  let last = Infinity;
  for (let u = 0; u <= 1.0001; u += 0.02) {
    const d = dist(runPose(from, to, u), to);
    assert.ok(d <= last + 1e-9, `lùi lại lúc u=${u.toFixed(2)}`);
    last = d;
  }
});

test('runDuration = d / 7 giây, kẹp trong [0.8, 2]', () => {
  assert.equal(runDuration(7), 1);
  assert.equal(runDuration(10.5), 1.5);
  assert.equal(runDuration(1), 0.8);
  assert.equal(runDuration(40), 2);
});

test('discArc: bay vòng cung, bắt ở 1.1m', () => {
  assert.ok(Math.abs(discArc(0) - 1.1) <= 1e-9);
  assert.ok(Math.abs(discArc(1) - 1.1) <= 1e-9);
  assert.ok(discArc(0.5) >= 2.5);
});
