#!/usr/bin/env node
// ④ MEMORY — sổ trạng thái 4-memory/features.json. Chỉ HARNESS gọi file này, AI không tự sửa.
// Nội dung tính năng (tên, "Done when") lấy từ Wiki: 1-wiki/features/F*.md. Sổ này chỉ giữ TRẠNG THÁI.
//   node 4-memory/features.mjs sync              → đọc lại 1-wiki/features/*.md, giữ trạng thái cũ
//   node 4-memory/features.mjs list
//   node 4-memory/features.mjs next              → id tính năng "pending" đầu tiên
//   node 4-memory/features.mjs show F5           → JSON của 1 tính năng (kèm trang wiki + Done when)
//   node 4-memory/features.mjs set F5 passing    → đổi trạng thái (pending | passing | blocked)
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const FILE = path.join(HERE, 'features.json');
const PAGES = path.join(ROOT, '1-wiki', 'features');
const STATES = ['pending', 'passing', 'blocked'];
const ICON = { pending: '⏳', passing: '✅', blocked: '⛔' };

const load = () => (existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : []);
const save = (list) => writeFileSync(FILE, `${JSON.stringify(list, null, 2)}\n`);
const num = (id) => Number(id.slice(1));

/** Đọc một trang feature: "# F5 — Tên" và các dòng "- [ ] …" dưới "## Done when". */
function readPage(file) {
  const text = readFileSync(path.join(PAGES, file), 'utf8');
  const head = text.match(/^#\s+(F\d+)\s+[—-]\s+(.+)$/m);
  if (!head) throw new Error(`${file}: dòng đầu phải dạng "# F5 — Tên tính năng"`);
  const section = text.split(/^##\s+Done when\s*$/m)[1] ?? '';
  const done = [...section.matchAll(/^- \[[ x]\]\s+(.+)$/gm)].map((m) => m[1].trim());
  if (done.length === 0) throw new Error(`${file}: thiếu mục "## Done when" với ít nhất một dòng "- [ ] …"`);
  return { id: head[1], title: head[2].trim(), page: `1-wiki/features/${file}`, done };
}

function sync() {
  const old = Object.fromEntries(load().map((f) => [f.id, f]));
  const pages = readdirSync(PAGES).filter((f) => /^F\d+.*\.md$/.test(f)).map(readPage).sort((a, b) => num(a.id) - num(b.id));
  const ids = new Set();
  for (const p of pages) {
    if (ids.has(p.id)) throw new Error(`trùng id ${p.id} trong 1-wiki/features/`);
    ids.add(p.id);
  }
  // Giữ trạng thái khi cùng id và cùng tên; tính năng đổi nghĩa thì làm lại từ đầu.
  const list = pages.map((p) => {
    const o = old[p.id];
    const same = o && o.title === p.title;
    return { ...p, state: same ? o.state : 'pending', ...(same && o.attempts ? { attempts: o.attempts } : {}), ...(same && o.verified_at ? { verified_at: o.verified_at } : {}) };
  });
  save(list);
  return list;
}

const find = (list, id) => {
  const f = list.find((x) => x.id === id);
  if (!f) { console.error(`Không có tính năng ${id}`); process.exit(1); }
  return f;
};

const [cmd, a, b] = process.argv.slice(2);
switch (cmd) {
  case 'sync':
    console.log(`Đã đồng bộ ${sync().length} tính năng từ 1-wiki/features/`);
    break;
  case 'list':
    for (const f of load()) console.log(`${ICON[f.state]} ${f.id.padEnd(4)} ${f.title}${f.attempts ? `  (đã thử ${f.attempts} lần)` : ''}`);
    break;
  case 'next': {
    const f = load().find((x) => x.state === 'pending');
    if (!f) process.exit(1);
    console.log(f.id);
    break;
  }
  case 'show':
    console.log(JSON.stringify(find(load(), a), null, 2));
    break;
  case 'set': {
    if (!STATES.includes(b)) { console.error(`Trạng thái phải là: ${STATES.join(', ')}`); process.exit(1); }
    const list = load();
    const f = find(list, a);
    f.state = b;
    if (b === 'passing') f.verified_at = new Date().toISOString();
    save(list);
    break;
  }
  case 'attempt': {
    const list = load();
    const f = find(list, a);
    f.attempts = (f.attempts ?? 0) + 1;
    save(list);
    console.log(f.attempts);
    break;
  }
  default:
    console.error('Dùng: sync | list | next | show <id> | set <id> <state> | attempt <id>');
    process.exit(1);
}
