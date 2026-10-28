# ② ENVIRONMENT — tay và mắt của AI

| File | Là gì |
|---|---|
| `../.claude/settings.json` | **Tool Calling**: AI được tự chạy lệnh nào, và **không** được sửa file nào (ví dụ `features.json`). |
| `rules.md` | Luật làm việc của AI. `CLAUDE.md` ở thư mục gốc kéo file này vào, nên Claude Code luôn đọc. |
| `mcp.example.json` | **MCP** (tuỳ chọn): Playwright (mắt trình duyệt), context7 (tài liệu thư viện mới). |
| `bot.mjs` | Web: "mắt" của harness, điều khiển Chrome, tự chơi game như người, chụp ảnh. |
| `android-smoke.sh` | Android: cài APK lên emulator qua adb, mở app, bắt crash, chụp màn hình. |
| `serve.mjs` | Server nhỏ để mở game: `node 2-environment/serve.mjs` |
