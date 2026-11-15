// F14 — Đồ hoạ: dáng chạy và ngoại hình riêng cho từng cầu thủ.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bodyPose, lookOf } from '../logic.js';

const swing = (speed) => {
  let max = 0;
  for (let t = 0; t < 2; t += 0.01) { const p = bodyPose(t, speed); max = Math.max(max, Math.abs(p.legL), Math.abs(p.legR)); }
  return max;
};

test('bodyPose: chạy thì bước chân rộng, đứng yên thì gần như không', () => {
  assert.ok(swing(3) >= 0.5, `chạy: ${swing(3)}`);
  assert.ok(swing(7) >= 0.5);
  assert.ok(swing(0) <= 0.1, `đứng: ${swing(0)}`);
});

test('bodyPose: tay đánh ngược nhịp chân', () => {
  for (let t = 0.05; t < 2; t += 0.13) {
    const p = bodyPose(t, 5);
    if (Math.abs(p.legR) < 0.05) continue;
    assert.ok(Math.sign(p.armL) === Math.sign(p.legR), `t=${t.toFixed(2)} armL ${p.armL} legR ${p.legR}`);
    assert.ok(Math.sign(p.armR) === Math.sign(p.legL), `t=${t.toFixed(2)}`);
  }
});

test('lookOf: cố định, đa dạng màu da, số áo không trùng trong một đội', () => {
  assert.deepEqual(lookOf(3), lookOf(3));
  const looks = Array.from({ length: 13 }, (_, i) => lookOf(i));
  for (const l of looks) assert.ok(l.skin && l.hair && Number.isInteger(l.number), JSON.stringify(l));
  assert.ok(new Set(looks.map((l) => l.skin)).size >= 4);
  const mates = looks.slice(0, 6).map((l) => l.number);
  const opps = looks.slice(6).map((l) => l.number);
  assert.equal(new Set(mates).size, mates.length);
  assert.equal(new Set(opps).size, opps.length);
});
