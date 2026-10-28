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

## 4 thành phần = 4 thư mục (khớp với sơ đồ trên slide)

```
mini-harness/
├── 1-wiki/                ← ① WIKI · nguồn sự thật
│   ├── product.md         ←    Product Requirement: game cần làm gì
│   └── learned.md         ←    Learned Wiki: bài học từ lần sai (harness tự ghi thêm)
├── 2-environment/         ← ② ENVIRONMENT · tay và mắt của AI
│   ├── rules.md           ←    luật làm việc (CLAUDE.md kéo vào)
│   ├── tools.txt          ←    Tool Calling: công cụ AI được tự gọi
│   ├── mcp.example.json   ←    MCP: cắm thêm công cụ (tuỳ chọn)
│   └── bot.mjs            ←    bot điều khiển Chrome, tự chơi game
├── 3-verification/        ← ③ VERIFICATION · giám khảo
│   └── verify.sh          ←    có test? unit test xanh? bot chơi được? → 🟢/🔴
├── 4-memory/              ← ④ MEMORY · sổ tay
│   ├── features.json      ←    ⏳ pending · ✅ passing · ⛔ blocked
│   ├── progress.md        ←    nhật ký
│   └── logs/              ←    log từng vòng lặp
│
├── plan.sh                ← HARNESS PLAN: đọc Wiki → chia việc
├── execute.sh             ← HARNESS EXECUTE: VÒNG LẶP code → verify → sửa
├── test.sh                ← HARNESS AUTOMATION TEST: bot chơi + báo cáo ảnh
│
├── CLAUDE.md              ← Claude Code tự đọc; trỏ tới 2-environment/rules.md
└── game/                  ← SẢN PHẨM mà AI đang build (Parking Jam)
```

Mỗi thư mục có một `README.md` ngắn nói nó là gì.

## Chạy thử trong 5 phút

```bash
# 0. Xem game hiện tại (F1–F4 đã xong)
node 2-environment/serve.mjs            # mở http://localhost:5173

# 1. Xem sổ tay: đang ở đâu?
node 4-4-memory/features.mjs list

# 2. Automation test: bot tự chơi và chụp ảnh
bash test.sh              # mở reports/latest/report.html

# 3. Verification: cổng đậu/rớt
bash 3-verification/verify.sh F4         # 🟢 xanh
bash 3-verification/verify.sh F5         # 🔴 đỏ — chưa có test cho F5

# 4. VÒNG LẶP: để AI tự làm F5 tới khi xanh
bash execute.sh           # tự chọn tính năng ⏳ kế tiếp
```

## Harness Plan: từ Wiki ra danh sách việc

```bash
bash plan.sh              # AI đọc 1-wiki/product.md → 4-memory/features.plan.json (bản nháp)
bash plan.sh --apply      # bạn duyệt xong → gộp vào 4-memory/features.json
```

Thử sửa `1-wiki/product.md` (thêm tính năng mới, ví dụ "đếm thời gian"), chạy lại `plan.sh`, rồi `execute.sh`.

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
vào `1-wiki/learned.md` để lần sau AI đọc trước khi code. Người vào xem `4-memory/logs/`.

## Luật quan trọng nhất

> **AI không được tự nói "xong".** Chỉ `verify.sh` thoát mã 0 mới là xong.

## Mở rộng Environment bằng MCP (tuỳ chọn)

Muốn AI tự "nhìn" game trong lúc code, thêm Playwright MCP:

```bash
cp 2-environment/mcp.example.json .mcp.json
```

MCP là mắt của AI **khi code**. Còn **cổng chấm** vẫn phải là script chạy ra cùng kết quả mỗi lần (`verify.sh`).

## Gắn harness này vào app của bạn

1. Thay `1-wiki/product.md` bằng mô tả app của bạn.
2. Sửa `3-verification/verify.sh` để chạy test của app bạn (`npm test`, `pytest`, …).
3. `bash plan.sh` → duyệt → `--apply` → `bash execute.sh`.
