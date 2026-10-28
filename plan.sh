#!/usr/bin/env bash
# HARNESS PLAN — AI đọc ý tưởng gốc trong 1-wiki/raw/ rồi viết Wiki theo kiến trúc:
#   features/ (mỗi tính năng một trang, có "Done when") · screens/ · decisions/ · index.md · log.md
# Sau đó harness đồng bộ danh sách tính năng sang ④ Memory (4-memory/features.json).
#   bash plan.sh
#   (Bạn đọc lại bằng: git diff 1-wiki/   — người duyệt kế hoạch trước khi build.)
set -eu
cd "$(dirname "$0")"
command -v claude >/dev/null || { echo "Cần cài Claude Code: https://claude.com/claude-code"; exit 1; }

echo "┌─ HARNESS PLAN"
echo "│ Model đọc 1-wiki/raw/ và viết lại Wiki…"
PROMPT='Bạn là người viết Wiki cho dự án này. Đọc 2-environment/rules.md, rồi đọc mọi file trong 1-wiki/raw/ (ý tưởng gốc, KHÔNG sửa raw/).
Đọc các trang wiki đang có (1-wiki/index.md, overview.md, features/, screens/, decisions/).

Cập nhật Wiki cho khớp raw/:
1. 1-wiki/features/: mỗi tính năng NHỎ (làm xong trong một vòng) là một file "F<số>-<ten-ngan>.md".
   Dòng đầu đúng dạng "# F5 — Tên tính năng". Có mục "## Done when" gồm các dòng "- [ ] …",
   mỗi dòng là một điều máy kiểm được (đo được, không mơ hồ). Giữ nguyên id và tên của tính năng đã có nếu ý không đổi.
2. 1-wiki/screens/ và 1-wiki/decisions/: thêm hoặc sửa nếu raw/ có màn hình hay quyết định mới.
3. 1-wiki/index.md: liệt kê mọi trang. 1-wiki/log.md: thêm MỘT dòng mô tả lần plan này.
Không đụng vào game/, 4-memory/, raw/. Cuối cùng in 2–3 dòng: đã thêm/sửa trang nào.'
echo "$PROMPT" | claude -p --permission-mode acceptEdits --allowedTools "Read,Glob,Grep,Write,Edit" ${MODEL:+--model "$MODEL"} | sed 's/^/│   /'

echo "│"
echo "│ Harness đồng bộ ④ Memory từ 1-wiki/features/…"
node 4-memory/features.mjs sync | sed 's/^/│ /'
node 4-memory/features.mjs list | sed 's/^/│   /'
echo "└─ Xong. Đọc lại thay đổi: git diff 1-wiki/   rồi chạy: bash execute.sh"
