# Mini Harness — Parking Jam

Một harness nhỏ, đọc hết trong 10 phút, để thấy tận mắt: **AI tự build game, tự kiểm tra, và chỉ được tính là xong khi máy chứng minh được.**
Build được game **web** (mặc định) hoặc game/app **Android**.

> **Sinh viên: đọc [HUONG-DAN.md](HUONG-DAN.md)** — chỉ cần mở `claude` trong thư mục này rồi chat `/game`, `/build`, `/play`.
> File README này dành cho ai muốn hiểu bên trong harness.

## Chế độ duy nhất: model_led

**Model (Claude) tự xếp việc và tự làm. Harness giữ sổ và chấm.**

```
⏳ pending ──Model làm xong──▶ 🟡 claimed ──verify.sh xanh──▶ ✅ passing
                                   │
                                   └─ 3 lần verify đỏ ──▶ ⛔ blocked (có lý do + bài học)
```

- Model chỉ được đánh dấu **🟡 claimed** ("đã làm, chưa chứng minh"). Không tự đánh dấu passing được.
- **Chỉ `3-verification/verify.sh`** chuyển 🟡 → ✅, sau khi unit test xanh và bot chơi thử đạt.
- Model được làm nhiều tính năng liên tiếp, chạy verify **một lần** ở cuối, đỏ thì tự sửa.

## 4 thành phần = 4 thư mục (khớp với sơ đồ trên slide)

```
mini-harness/
├── 1-wiki/                ← ① WIKI · nguồn sự thật (kiến trúc giống Lecture 1)
│   ├── raw/               ←    ý tưởng gốc — không bao giờ sửa
│   ├── overview.md        ←    game là gì, cho ai
│   ├── features/          ←    mỗi tính năng một trang, có "Done when"
│   ├── screens/  decisions/
│   ├── learned.md         ←    Learned Wiki: bài học từ lần sai
│   └── index.md  log.md   ←    mục lục · nhật ký thay đổi
├── 2-environment/         ← ② ENVIRONMENT · tay và mắt của AI
│   ├── rules.md           ←    luật làm việc + quy trình model_led (CLAUDE.md kéo vào)
│   ├── mcp.example.json   ←    MCP: Playwright, context7 (tuỳ chọn)
│   ├── bot.mjs            ←    web: bot điều khiển Chrome, tự chơi game
│   └── android-smoke.sh   ←    android: cài APK lên emulator, mở app, bắt crash
├── 3-verification/        ← ③ VERIFICATION · giám khảo
│   └── verify.sh          ←    có test? unit test xanh? chạy thử được? → 🟢 thì 🟡→✅
├── 4-memory/              ← ④ MEMORY · sổ tay
│   ├── features.json      ←    ⏳ · 🟡 · ✅ · ⛔ (đồng bộ từ 1-wiki/features/)
│   ├── features.mjs       ←    lệnh đọc/ghi sổ: brief · claim · block · note
│   ├── progress.md        ←    nhật ký tiến độ
│   └── po-questions.md    ←    câu hỏi AI để lại cho bạn (PO)
│
├── .claude/commands/      ← 3 LỆNH CHAT: /game (Plan) · /build (Execute) · /play (Automation Test)
├── .claude/settings.json  ← Tool Calling: AI được chạy lệnh nào, KHÔNG được sửa file nào
├── harness.config         ← loại dự án: STACK=web | android
├── new-game.sh · test.sh  ← tạo trang trắng · bot chơi thử + báo cáo ảnh
├── CLAUDE.md              ← Claude Code tự đọc; trỏ tới 2-environment/rules.md
└── game/                  ← SẢN PHẨM mà AI đang build (Parking Jam mẫu)
```

## Xem harness chạy trong 2 phút (không cần Claude)

```bash
node 2-environment/serve.mjs          # mở http://localhost:5173 — game mẫu, F1–F4 đã xong
node 4-memory/features.mjs brief      # sổ tay: đang ở đâu, còn gì
bash test.sh                          # bot tự chơi, mở báo cáo có ảnh
bash 3-verification/verify.sh F5      # 🔴 đỏ — F5 chưa có test, nên chưa thể passing
```

## Vòng lặp model_led

```
   ┌──────────────────────────────────────────────────────────────┐
   ▼                                                              │
 Model đọc brief + trang feature + learned.md                     │
   → viết test (đỏ) → code (xanh) → claim 🟡  (lặp cho vài tính năng)
   ▼                                                              │
 bash 3-verification/verify.sh ── 🔴 đỏ: lỗi cụ thể ──────────────┘ (tối đa 3 lần/tính năng)
   │ 🟢 xanh
   ▼
 verify.sh chuyển 🟡 → ✅ · log.md + progress.md thêm dòng
```

## Build game/app Android

1. Tạo project trong Android Studio (*New Project → Empty Activity*) vào thư mục, ví dụ `android-game/`.
2. Sửa `harness.config`: `STACK=android`, `APP_DIR=android-game`, `ANDROID_PACKAGE=com.example.…`,
   và `ANDROID_SERIAL=emulator-5554` nếu máy cắm nhiều thiết bị.
3. Trong Claude Code: `/game …` → `/build` → `/play`.

Verification khi đó chạy: `./gradlew testDebugUnitTest` → `./gradlew assembleDebug` → cài APK lên emulator, mở app, bắt crash.
Không có emulator thì bước chạy thử **bị bỏ qua và báo rõ** — bỏ qua không có nghĩa là đạt.

## Mở rộng Environment bằng MCP (tuỳ chọn)

```bash
cp 2-environment/mcp.example.json .mcp.json
```

Playwright cho AI "mắt" trình duyệt khi code; context7 cho AI tài liệu thư viện mới nhất.
MCP giúp AI **khi code**. Còn **cổng chấm** vẫn phải là script chạy ra cùng kết quả mỗi lần (`verify.sh`).
