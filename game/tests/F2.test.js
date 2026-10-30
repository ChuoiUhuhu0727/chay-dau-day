// F2 — Bộ tình huống vertical stack.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCENARIOS, FIELD, project, cameraOf } from '../logic.js';

const view = { w: 360, h: 480 };
const all = [...SCENARIOS.handler, ...SCENARIOS.cutter];
const inField = (p) => p.x >= 0 && p.x <= FIELD.length && p.y >= 0 && p.y <= FIELD.width;

test('mỗi vai đúng 5 tình huống, id không trùng', () => {
  assert.equal(SCENARIOS.handler.length, 5);
  assert.equal(SCENARIOS.cutter.length, 5);
  assert.equal(new Set(all.map((s) => s.id)).size, 10);
});

test('mỗi tình huống: 6 đồng đội, 7 đối thủ, có prompt và explain', () => {
  for (const s of all) {
    assert.equal(s.teammates.length, 6, s.id);
    assert.equal(s.opponents.length, 7, s.id);
    assert.ok(s.prompt.trim().length > 0, s.id);
    assert.ok(s.explain.trim().length > 0, s.id);
    assert.ok(s.title.trim().length > 0, s.id);
  }
});

test('mọi cầu thủ, đĩa, tâm vùng đúng nằm trong sân; zone.r = 4', () => {
  for (const s of all) {
    for (const p of [s.me, s.disc, s.zone, ...s.teammates, ...s.opponents]) assert.ok(inField(p), `${s.id}: ${JSON.stringify(p)}`);
    assert.equal(s.zone.r, 4, s.id);
  }
});

test('tâm vùng đúng hiện trong khung nhìn của me (view 360×480)', () => {
  for (const s of all) {
    const p = project(cameraOf(s), s.zone, view);
    assert.ok(p, `${s.id}: vùng đúng ở sau lưng`);
    assert.ok(p.sx >= 0 && p.sx <= 360, `${s.id}: sx=${p.sx}`);
    assert.ok(p.sy >= 0 && p.sy <= 480, `${s.id}: sy=${p.sy}`);
  }
});
