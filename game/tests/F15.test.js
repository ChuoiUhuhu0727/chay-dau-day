// F15 — Luật Ultimate trong 30 giây + mục tiêu rõ ở màn đầu.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RULES, goalText, LIVES } from '../logic.js';

test('RULES: đúng 6 dòng ngắn, có icon', () => {
  assert.equal(RULES.length, 6);
  for (const r of RULES) {
    assert.ok(r.icon && r.icon.length > 0, JSON.stringify(r));
    assert.ok(r.text.length > 0 && r.text.length <= 90, `${r.text.length}: ${r.text}`);
  }
});

test('RULES gộp lại có đủ ý chính của Ultimate', () => {
  const all = RULES.map((r) => r.text).join(' ');
  for (const k of ['7 người', 'vùng ghi điểm', 'không được chạy', 'chỗ trống', '10 giây', 'mất đĩa', 'va chạm']) {
    assert.ok(all.includes(k), `thiếu "${k}"`);
  }
});

test('goalText nói mục tiêu, 5 pha và số lần được sai theo LIVES', () => {
  const g = goalText();
  assert.ok(g.includes('Mục tiêu'), g);
  assert.ok(g.includes('5 pha'), g);
  assert.ok(g.includes(`Sai ${LIVES} lần`), g);
});
