// F12 — Dễ hiểu cho người chưa từng chơi: chữ ngắn, không thuật ngữ, tập chơi 3 bước.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SCENARIOS, JARGON, TUTORIAL, startTutorial, current, answer, stallOut, isFinished, next, project, cameraOf,
} from '../logic.js';

const all = [...SCENARIOS.handler, ...SCENARIOS.cutter];
const view = { w: 360, h: 480 };
const hasWord = (text, word) => new RegExp(`(^|[^\\p{L}])${word}([^\\p{L}]|$)`, 'iu').test(text); // từ trong JARGON chỉ có chữ và "-"
const gap = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

test('mọi tình huống: title ≤ 32, prompt ≤ 80, explain ≤ 110 ký tự, có term', () => {
  for (const s of all) {
    assert.ok(s.title.length <= 32, `${s.id} title ${s.title.length}: ${s.title}`);
    assert.ok(s.prompt.length <= 80, `${s.id} prompt ${s.prompt.length}: ${s.prompt}`);
    assert.ok(s.explain.length <= 110, `${s.id} explain ${s.explain.length}: ${s.explain}`);
    assert.ok(typeof s.term === 'string' && s.term.trim().length > 0, `${s.id} thiếu term`);
  }
});

test('JARGON có đủ các từ chuyên môn của wiki', () => {
  for (const w of ['stack', 'cutter', 'handler', 'under', 'deep', 'clear', 'reset', 'dump', 'swing', 'give-and-go', 'endzone', 'stall', 'force', 'mark']) {
    assert.ok(JARGON.includes(w), w);
  }
});

test('title, prompt, explain không chứa thuật ngữ', () => {
  for (const s of all) {
    for (const field of ['title', 'prompt', 'explain']) {
      for (const w of JARGON) assert.ok(!hasWord(s[field], w), `${s.id}.${field} có "${w}": ${s[field]}`);
    }
  }
});

test('TUTORIAL: đúng 3 bước, mỗi bước dạy một điều', () => {
  assert.equal(TUTORIAL.length, 3);
  const [a, b, c] = TUTORIAL;
  // bước 1: 1 đồng đội, không đối thủ, vòng sáng chính là vùng đúng
  assert.equal(a.teammates.length, 1);
  assert.equal(a.opponents.length, 0);
  assert.equal(a.rings.length, 1);
  assert.ok(gap(a.rings[0], a.zone) < 1e-9);
  // bước 2: 2 vòng, một vòng có đối thủ đứng trong và không phải vùng đúng
  assert.equal(b.rings.length, 2);
  const blocked = b.rings.filter((r) => b.opponents.some((o) => gap(o, r) <= 1));
  assert.equal(blocked.length, 1);
  assert.ok(gap(blocked[0], b.zone) > b.zone.r, 'vòng có đối thủ không được là vùng đúng');
  assert.ok(b.rings.some((r) => gap(r, b.zone) < 1e-9), 'vòng còn lại là vùng đúng');
  // bước 3: không vòng, có stall, đối thủ xa vùng đúng
  assert.equal(c.rings.length, 0);
  assert.equal(c.stall, true);
  assert.ok(c.opponents.length > 0);
  for (const o of c.opponents) assert.ok(gap(o, c.zone) >= 6, JSON.stringify(o));
  for (const s of TUTORIAL) {
    assert.ok(s.prompt.length <= 80, s.prompt);
    const z = project(cameraOf(s), s.zone, view);
    assert.ok(z && z.sx >= 0 && z.sx <= view.w, `${s.id}: vùng đúng ngoài khung`);
  }
});

test('startTutorial + current', () => {
  const s = startTutorial();
  assert.equal(s.role, 'tutorial');
  assert.equal(s.index, 0);
  assert.equal(s.total, 3);
  assert.equal(current(s), TUTORIAL[0]);
  assert.equal(current({ ...s, index: 2 }), TUTORIAL[2]);
});

test('lúc tập: chạm sai không mất mạng, được chạm lại; đúng thì qua bước', () => {
  let s = startTutorial();
  const z = current(s).zone;
  const wrong = { x: z.x + 15, y: z.y };
  s = answer(s, wrong);
  assert.equal(s.answered, false);
  assert.equal(s.lives, startTutorial().lives);
  assert.equal(s.misses, 1);
  assert.deepEqual(s.tap, wrong);
  s = answer(s, { x: z.x, y: z.y });
  assert.equal(s.answered, true);
  assert.equal(s.correct, true);
  assert.equal(isFinished(s), false);
});

test('lúc tập: hết stall thì đếm lại, không phạt', () => {
  let s = { ...startTutorial(), index: 2 };
  const lives = s.lives;
  s = stallOut(s);
  assert.equal(s.answered, false);
  assert.equal(s.misses, 1);
  assert.equal(s.lives, lives);
});

test('lúc tập: đúng bước 3 thì xong', () => {
  let s = startTutorial();
  for (let i = 0; i < 3; i++) {
    const z = current(s).zone;
    s = answer(s, { x: z.x, y: z.y });
    if (i < 2) { assert.equal(isFinished(s), false); s = next(s); assert.equal(s.misses, 0, 'sang bước mới thì misses về 0'); }
  }
  assert.equal(isFinished(s), true);
});
