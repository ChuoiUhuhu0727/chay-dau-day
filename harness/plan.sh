#!/usr/bin/env bash
# HARNESS PLAN — AI đọc Wiki (product.md) rồi chia thành danh sách tính năng nhỏ, mỗi cái có câu "kiểm thế nào".
#   bash harness/plan.sh            → ghi bản nháp memory/features.plan.json để bạn đọc lại
#   bash harness/plan.sh --apply    → gộp bản nháp vào memory/features.json (tính năng cũ giữ nguyên trạng thái)
set -eu
cd "$(dirname "$0")/.."
DRAFT="memory/features.plan.json"

if [ "${1:-}" = "--apply" ]; then
  [ -f "$DRAFT" ] || { echo "Chưa có $DRAFT. Chạy: bash harness/plan.sh"; exit 1; }
  node -e '
    const fs = require("fs");
    const draft = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const cur = fs.existsSync("memory/features.json") ? JSON.parse(fs.readFileSync("memory/features.json", "utf8")) : [];
    const old = Object.fromEntries(cur.map((f) => [f.id, f]));
    // Chỉ giữ trạng thái khi cùng id VÀ cùng tên; tính năng đổi nghĩa thì làm lại từ đầu.
    const merged = draft.map((f) => ({ ...f, state: old[f.id] && old[f.id].title === f.title ? old[f.id].state : "pending" }));
    fs.writeFileSync("memory/features.json", JSON.stringify(merged, null, 2) + "\n");
  ' "$DRAFT"
  echo "Đã gộp vào memory/features.json:"
  node harness/lib/features.mjs list
  exit 0
fi

command -v claude >/dev/null || { echo "Cần cài Claude Code: https://claude.com/claude-code"; exit 1; }
echo "┌─ HARNESS PLAN"
echo "│ Model đọc wiki/product.md và chia việc…"
PROMPT='Đọc wiki/product.md. Chia sản phẩm thành danh sách tính năng NHỎ, mỗi tính năng làm xong trong một vòng (viết test + code).
Mỗi tính năng có:
- "id": F1, F2, … theo thứ tự nên làm (cái nền tảng trước)
- "title": tên ngắn tiếng Việt
- "check": MỘT câu nói rõ máy kiểm tra thế nào là đúng (đo được, không mơ hồ)
Chỉ in ra một mảng JSON hợp lệ, không giải thích, không markdown.'
RAW=$(echo "$PROMPT" | claude -p --allowedTools "Read" --output-format text)
echo "$RAW" | node -e '
  const s = require("fs").readFileSync(0, "utf8");
  const a = s.indexOf("["), b = s.lastIndexOf("]");
  if (a < 0 || b < a) { console.error("Model không trả JSON:\n" + s); process.exit(1); }
  require("fs").writeFileSync(process.argv[1], JSON.stringify(JSON.parse(s.slice(a, b + 1)), null, 2) + "\n");
' "$DRAFT"
node harness/lib/features.mjs validate "$DRAFT" | sed 's/^/│ /'
node -e 'for (const f of JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"))) console.log(`│  ${f.id.padEnd(4)} ${f.title}\n│       kiểm: ${f.check}`)' "$DRAFT"
echo "└─ Bản nháp: $DRAFT. Đọc lại, sửa nếu cần, rồi chạy: bash harness/plan.sh --apply"
