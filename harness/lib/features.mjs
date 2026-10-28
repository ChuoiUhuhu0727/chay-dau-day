#!/usr/bin/env node
// Quản lý memory/features.json. Chỉ HARNESS gọi file này — AI không tự sửa danh sách tính năng.
//   node harness/lib/features.mjs list
//   node harness/lib/features.mjs next              → id tính năng "pending" đầu tiên
//   node harness/lib/features.mjs show F5           → JSON của 1 tính năng
//   node harness/lib/features.mjs set F5 passing    → đổi trạng thái (pending | passing | blocked)
//   node harness/lib/features.mjs validate <file>   → kiểm tra file do Harness Plan sinh ra
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'memory', 'features.json');
const STATES = ['pending', 'passing', 'blocked'];
const ICON = { pending: '⏳', passing: '✅', blocked: '⛔' };

const load = (file = FILE) => JSON.parse(readFileSync(file, 'utf8'));
const save = (list) => writeFileSync(FILE, `${JSON.stringify(list, null, 2)}\n`);

function validate(list) {
  if (!Array.isArray(list) || list.length === 0) throw new Error('features phải là mảng không rỗng');
  const ids = new Set();
  for (const f of list) {
    for (const key of ['id', 'title', 'check']) if (!f[key]) throw new Error(`thiếu "${key}" ở ${JSON.stringify(f)}`);
    if (!/^F\d+$/.test(f.id)) throw new Error(`id "${f.id}" phải dạng F1, F2…`);
    if (ids.has(f.id)) throw new Error(`trùng id ${f.id}`);
    if (f.state && !STATES.includes(f.state)) throw new Error(`state "${f.state}" không hợp lệ`);
    ids.add(f.id);
  }
}

const [cmd, a, b] = process.argv.slice(2);
switch (cmd) {
  case 'list':
    for (const f of load()) console.log(`${ICON[f.state]} ${f.id.padEnd(4)} ${f.title}${f.attempts ? `  (đã thử ${f.attempts} lần)` : ''}`);
    break;
  case 'next': {
    const f = load().find((x) => x.state === 'pending');
    if (!f) process.exit(1);
    console.log(f.id);
    break;
  }
  case 'show': {
    const f = load().find((x) => x.id === a);
    if (!f) { console.error(`Không có tính năng ${a}`); process.exit(1); }
    console.log(JSON.stringify(f, null, 2));
    break;
  }
  case 'set': {
    if (!STATES.includes(b)) { console.error(`Trạng thái phải là: ${STATES.join(', ')}`); process.exit(1); }
    const list = load();
    const f = list.find((x) => x.id === a);
    if (!f) { console.error(`Không có tính năng ${a}`); process.exit(1); }
    f.state = b;
    if (b === 'passing') f.verified_at = new Date().toISOString();
    save(list);
    break;
  }
  case 'attempt': {
    const list = load();
    const f = list.find((x) => x.id === a);
    f.attempts = (f.attempts ?? 0) + 1;
    save(list);
    console.log(f.attempts);
    break;
  }
  case 'validate':
    validate(load(a));
    console.log('features hợp lệ');
    break;
  default:
    console.error('Dùng: list | next | show <id> | set <id> <state> | attempt <id> | validate <file>');
    process.exit(1);
}
