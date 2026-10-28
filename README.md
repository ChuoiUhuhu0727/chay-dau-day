# Mini Harness — Parking Jam

Một harness nhỏ, đọc hết trong 10 phút, để thấy tận mắt: **AI tự build game, tự kiểm tra, và chỉ được tính là xong khi máy chứng minh được.**

## Cần cài

| Công cụ | Kiểm tra | Ghi chú |
|---|---|---|
| Node.js 22+ | `node -v` | https://nodejs.org |
| Google Chrome | — | Bot test điều khiển Chrome để tự chơi game |
| Claude Code | `claude --version` | https://claude.com/claude-code — cần cho `plan` và `execute` |
| Bash | — | macOS/Linux có sẵn. Windows: dùng Git Bash hoặc WSL |

Không cần `npm install`. Không có thư viện nào.

## 4 thành phần (khớp với sơ đồ trên slide)

```
mini-harness/
├── CLAUDE.md              ← luật làm việc của AI (Claude Code tự đọc file này)
├── wiki/                  ← ① WIKI: nguồn sự thật
│   ├── product.md         ←    Product Requirement: game cần làm gì
│   └── learned.md         ←    Learned Wiki: bài học từ những lần sai (harness tự ghi thêm)
├── harness/               ← ② ENVIRONMENT + ③ VERIFICATION
│   ├── plan.sh            ←    Harness Plan: AI đọc Wiki → chia thành danh sách tính năng
│   ├── execute.sh         ←    Harness Execute: VÒNG LẶP code → verify → sửa → tới khi xanh
│   ├── test.sh            ←    Harness Automation Test: bot tự chơi game, chụp ảnh, ra báo cáo
│   ├── verify.sh          ←    Cổng chấm đậu/rớt (unit test + bot)
│   └── bot.mjs            ←    "Mắt" của harness: điều khiển Chrome như người chơi
├── memory/                ← ④ MEMORY: sổ tay
│   ├── features.json      ←    danh sách tính năng + trạng thái (⏳ pending · ✅ passing · ⛔ blocked)
│   ├── progress.md        ←    nhật ký: làm tới đâu
│   └── logs/              ←    log từng vòng lặp (tự sinh)
└── game/                  ← sản phẩm AI đang build
    ├── index.html, ui.js  ←    giao diện
    ├── logic.js           ←    luật chơi (hàm thuần, test được)
    └── tests/F*.test.js   ←    mỗi tính năng một file test
```

## Chạy thử trong 5 phút

```bash
# 0. Xem game hiện tại (F1–F4 đã xong)
node harness/serve.mjs            # mở http://localhost:5173

# 1. Xem sổ tay: đang ở đâu?
node harness/lib/features.mjs list

# 2. Automation test: bot tự chơi và chụp ảnh
bash harness/test.sh              # mở reports/latest/report.html

# 3. Verification: cổng đậu/rớt
bash harness/verify.sh F4         # 🟢 xanh
bash harness/verify.sh F5         # 🔴 đỏ — chưa có test cho F5

# 4. VÒNG LẶP: để AI tự làm F5 tới khi xanh
bash harness/execute.sh           # tự chọn tính năng ⏳ kế tiếp
```

## Harness Plan: từ Wiki ra danh sách việc

```bash
bash harness/plan.sh              # AI đọc wiki/product.md → memory/features.plan.json (bản nháp)
bash harness/plan.sh --apply      # bạn duyệt xong → gộp vào memory/features.json
```

Thử sửa `wiki/product.md` (thêm tính năng mới, ví dụ "đếm thời gian"), chạy lại `plan.sh`, rồi `execute.sh`.

## Vòng lặp chạy thế nào

```
           ┌────────────────────────────────────────────┐
           ▼                                            │
 ① Model đọc Wiki + Memory → code + viết test           │ 🔴 đỏ: lỗi cụ thể
           │  (Tool Calling: sửa file, chạy node)       │      quay lại Model
           ▼                                            │
 ② verify.sh chấm: test có không? unit test? bot chơi? ─┘
           │ 🟢 xanh
           ▼
 ③ features.json: ✅ passing · progress.md ghi lại · git commit
```

Sau `MAX_ATTEMPTS` (mặc định 3) vòng vẫn đỏ: tính năng thành ⛔ blocked, harness ghi **một dòng bài học**
vào `wiki/learned.md` để lần sau AI đọc trước khi code. Người vào xem `memory/logs/`.

## Luật quan trọng nhất

> **AI không được tự nói "xong".** Chỉ `verify.sh` thoát mã 0 mới là xong.

## Mở rộng Environment bằng MCP (tuỳ chọn)

Muốn AI tự "nhìn" game trong lúc code, thêm Playwright MCP:

```bash
claude mcp add playwright -- npx -y @playwright/mcp@latest
```

MCP là mắt của AI **khi code**. Còn **cổng chấm** vẫn phải là script chạy ra cùng kết quả mỗi lần (`verify.sh`).

## Gắn harness này vào app của bạn

1. Thay `wiki/product.md` bằng mô tả app của bạn.
2. Sửa `harness/verify.sh` để chạy test của app bạn (`npm test`, `pytest`, …).
3. `bash harness/plan.sh` → duyệt → `--apply` → `bash harness/execute.sh`.
