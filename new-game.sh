#!/usr/bin/env bash
# BẮT ĐẦU GAME MỚI — cất game mẫu Parking Jam vào examples/, tạo trang trắng để harness build game của bạn.
#   bash new-game.sh
# Thường không gõ tay: lệnh chat /game trong Claude Code gọi script này.
set -eu
cd "$(dirname "$0")"
if [ -d examples/parking-jam ]; then
  echo "Đã có examples/parking-jam — game mới đã được tạo trước đó. Xoá thư mục game/ và 1-wiki/ nếu muốn làm lại."
  exit 1
fi
mkdir -p examples/parking-jam
mv game examples/parking-jam/game
cp -R 1-wiki examples/parking-jam/1-wiki
cp 4-memory/features.json examples/parking-jam/features.json

# ① Wiki trống, giữ learned.md
rm -rf 1-wiki/features 1-wiki/screens 1-wiki/decisions 1-wiki/raw
rm -f 1-wiki/design/style.md 1-wiki/design/credits.md
mkdir -p 1-wiki/features 1-wiki/screens 1-wiki/decisions 1-wiki/raw
cat > 1-wiki/raw/idea.md <<'IDEA'
# Ý tưởng game (raw)

> Viết bằng lời của bạn, càng cụ thể càng tốt. Sau khi viết xong, KHÔNG sửa file này nữa —
> muốn thêm ý thì tạo file mới trong raw/.

**Tên game:**

**Cho ai:**

**Chơi thế nào:** (người chơi làm gì, thắng/thua khi nào)

**Các tính năng muốn có:** (gạch đầu dòng, cái quan trọng nhất trước)
-
-
-
IDEA
printf '# Overview\n\n(/game sẽ viết trang này từ raw/)\n' > 1-wiki/overview.md
printf '# Index — mọi trang trong wiki\n\n- [raw/idea.md](raw/idea.md) — ý tưởng gốc\n' > 1-wiki/index.md
printf '# Log — mỗi thay đổi một dòng\n\n- %s · new-game · bắt đầu game mới\n' "$(date +%F)" > 1-wiki/log.md

# ④ Memory trống
echo '[]' > 4-memory/features.json
printf '# Progress — sổ tay của harness\n\n- %s · bắt đầu game mới\n' "$(date +%F)" > 4-memory/progress.md
rm -rf 4-memory/logs reports 4-memory/po-questions.md

# Sản phẩm: khung trống tối thiểu
mkdir -p game/tests
cat > game/index.html <<'HTML'
<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Game mới</title>
<style>
  body { margin: 0; min-height: 100vh; font: 16px/1.4 system-ui, sans-serif; background: #F6F1E7; color: #1D1B26;
         display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 24px 12px; }
</style>
</head>
<body>
  <h1 id="title">Game mới</h1>
  <main id="app"></main>
  <script type="module" src="./ui.js"></script>
</body>
</html>
HTML
cat > game/logic.js <<'JS'
// Luật chơi: hàm thuần, không đụng DOM. Harness sẽ build dần từng tính năng vào đây.
export function createState() {
  return {};
}
JS
cat > game/ui.js <<'JS'
// Giao diện: vẽ state ra DOM, nhận thao tác của người chơi. Không chứa luật chơi.
import { createState } from './logic.js';

let state = createState();

// Hợp đồng với bot test. Đừng xoá.
window.__game = { state: () => state };
JS
cat > game/e2e.mjs <<'JS'
// Kịch bản bot tự chơi game (2-environment/bot.mjs gọi hàm play).
// Mỗi tính năng có giao diện thì thêm bước bấm thử + check vào đây.
//   evaluate(js) · click(selector) · shot(nhãn) · check(tên, đúng?, chi tiết) · sleep(ms)
export async function play({ evaluate, check }) {
  const title = await evaluate(`document.title`);
  check('Trang có tiêu đề', title.length > 0, title);
}
JS
cat > game/tests/F0.test.js <<'JS'
// Test khởi đầu: logic.js load được. Tính năng thật bắt đầu từ F1.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../logic.js';

test('createState trả về một object', () => {
  assert.equal(typeof createState(), 'object');
});
JS
echo "✅ Đã tạo trang trắng. Game mẫu Parking Jam được cất ở examples/parking-jam/ để tham khảo."
echo
echo "Tiếp theo:"
echo "  Trong Claude Code: /game <ý tưởng> → /build → /play"
