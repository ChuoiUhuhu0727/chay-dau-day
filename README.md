# Mini Harness — Parking Jam

Một harness nhỏ, đọc hết trong 10 phút, để thấy tận mắt: **AI tự build game, tự kiểm tra, và chỉ được tính là xong khi máy chứng minh được.**
Build được game **web** (mặc định) hoặc game/app **Android**.

> **Sinh viên: đọc [HUONG-DAN.md](HUONG-DAN.md)** — chỉ cần mở `claude` trong thư mục này rồi chat `/game`, `/build`, `/play`.
> File README này dành cho ai muốn hiểu bên trong harness.

## Cần cài

| Công cụ | Kiểm tra | Ghi chú |
|---|---|---|
| Node.js 22+ | `node -v` | https://nodejs.org |
| Google Chrome | — | Bot test điều khiển Chrome để tự chơi game web |
| Claude Code | `claude --version` | https://claude.com/claude-code — cần cho `plan` và `execute` |
| Bash | — | macOS/Linux có sẵn. Windows: Git Bash hoặc WSL |
| *(Android)* Android Studio + emulator | `adb devices` | Chỉ khi `STACK=android` |

Không cần `npm install`. Không có thư viện nào.

## 4 thành phần = 4 thư mục (khớp với sơ đồ trên slide)

```
mini-harness/
├── 1-wiki/                ← ① WIKI · nguồn sự thật (kiến trúc giống Lecture 1)
│   ├── raw/               ←    ý tưởng gốc — không bao giờ sửa
│   ├── overview.md        ←    game là gì, cho ai
│   ├── features/          ←    mỗi tính năng một trang, có "Done when"
│   ├── screens/  decisions/
│   ├── learned.md         ←    Learned Wiki: bài học từ lần sai (harness tự ghi thêm)
│   └── index.md  log.md   ←    mục lục · nhật ký thay đổi
├── 2-environment/         ← ② ENVIRONMENT · tay và mắt của AI
│   ├── rules.md           ←    luật làm việc (CLAUDE.md kéo vào)
│   ├── tools.txt          ←    Tool Calling: công cụ AI được tự gọi
│   ├── mcp.example.json   ←    MCP: Playwright, context7 (tuỳ chọn)
│   ├── bot.mjs            ←    web: bot điều khiển Chrome, tự chơi game
│   └── android-smoke.sh   ←    android: cài APK lên emulator, mở app, bắt crash
├── 3-verification/        ← ③ VERIFICATION · giám khảo
│   └── verify.sh          ←    có test? unit test xanh? chạy thử được? → 🟢/🔴
├── 4-memory/              ← ④ MEMORY · sổ tay
│   ├── features.json      ←    ⏳ pending · ✅ passing · ⛔ blocked (đồng bộ từ 1-wiki/features/)
│   ├── progress.md        ←    nhật ký từng lần chạy
│   └── logs/              ←    log từng vòng lặp
│
├── plan.sh                ← HARNESS PLAN: raw/ → trang feature/screen/decision
├── execute.sh             ← HARNESS EXECUTE: VÒNG LẶP code → verify → sửa
├── test.sh                ← HARNESS AUTOMATION TEST: máy tự chạy thử + báo cáo ảnh
├── harness.config         ← loại dự án: STACK=web | android
├── CLAUDE.md              ← Claude Code tự đọc; trỏ tới 2-environment/rules.md
└── game/                  ← SẢN PHẨM mà AI đang build (Parking Jam web)
```

Mỗi thư mục có một `README.md` ngắn nói nó là gì.

## Chạy thử trong 5 phút

```bash
# 0. Xem game hiện tại (F1–F4 đã xong)
node 2-environment/serve.mjs          # mở http://localhost:5173

# 1. Sổ tay: đang ở đâu?
node 4-memory/features.mjs list

# 2. Automation test: bot tự chơi và chụp ảnh
bash test.sh                          # mở reports/latest/report.html

# 3. Verification: cổng đậu/rớt
bash 3-verification/verify.sh F4      # 🟢 xanh
bash 3-verification/verify.sh F5      # 🔴 đỏ — chưa có test cho F5

# 4. VÒNG LẶP: để AI tự làm F5 tới khi xanh
bash execute.sh                       # tự chọn tính năng ⏳ kế tiếp
```

Muốn mỗi tính năng xanh được lưu thành một commit: chạy `git init && git add -A && git commit -m init` trước.

## Harness Plan: từ ý tưởng ra trang tính năng

```bash
# Thêm một ghi chú vào 1-wiki/raw/, ví dụ raw/them-dong-ho.md: "Hiện đồng hồ đếm thời gian mỗi level."
bash plan.sh                          # AI viết features/F8-….md có "Done when", cập nhật index.md, log.md
git diff 1-wiki/                      # bạn đọc lại kế hoạch trước khi build
bash execute.sh                       # vòng lặp build F8
```

## Vòng lặp chạy thế nào

```
           ┌────────────────────────────────────────────┐
           ▼                                            │
 ① Model đọc trang feature + learned.md → test + code   │ 🔴 đỏ: lỗi cụ thể
           │  (Tool Calling: sửa file, chạy lệnh)       │      quay lại Model
           ▼                                            │
 ② verify.sh chấm: test có không? unit test? chạy thử? ─┘
           │ 🟢 xanh
           ▼
 ③ features.json ✅ · progress.md + log.md thêm một dòng · git commit
```

Sau `MAX_ATTEMPTS` (mặc định 3) vòng vẫn đỏ: tính năng thành ⛔ blocked — đó là kết quả hợp lệ.
Harness ghi **một dòng bài học** vào `1-wiki/learned.md` để lần sau AI đọc trước khi code. Người vào xem `4-memory/logs/`.

## Build game/app Android

1. Tạo project trong Android Studio (*New Project → Empty Activity*) vào thư mục, ví dụ `android-game/`.
2. Sửa `harness.config`:
   ```
   STACK=android
   APP_DIR=android-game
   ANDROID_PACKAGE=com.example.parkingjam
   ```
3. Thay ý tưởng trong `1-wiki/raw/`, chạy `bash plan.sh`, rồi `bash execute.sh`.

Verification khi đó chạy: `./gradlew testDebugUnitTest` → `./gradlew assembleDebug` → cài APK lên emulator, mở app, bắt crash.
Không có emulator thì bước chạy thử **bị bỏ qua và báo rõ** — bỏ qua không có nghĩa là đạt.

## Luật quan trọng nhất

> **AI không được tự nói "xong".** Chỉ `verify.sh` thoát mã 0 mới là xong.

## Mở rộng Environment bằng MCP (tuỳ chọn)

```bash
cp 2-environment/mcp.example.json .mcp.json
```

Playwright cho AI "mắt" trình duyệt khi code; context7 cho AI tài liệu thư viện mới nhất.
MCP giúp AI **khi code**. Còn **cổng chấm** vẫn phải là script chạy ra cùng kết quả mỗi lần (`verify.sh`).
