# ② ENVIRONMENT — tay và mắt của AI

| File | Là gì |
|---|---|
| `rules.md` | Luật làm việc của AI. `CLAUDE.md` ở thư mục gốc kéo file này vào, nên Claude Code luôn đọc. |
| `tools.txt` | **Tool Calling**: danh sách công cụ AI được tự gọi (đọc/sửa file, chạy `node`, chạy verify). |
| `mcp.example.json` | **MCP** (tuỳ chọn): cắm thêm công cụ, ví dụ trình duyệt Playwright. |
| `bot.mjs` | "Mắt" của harness: điều khiển Chrome, tự chơi game như người, chụp ảnh. |
| `serve.mjs` | Server nhỏ để mở game: `node 2-environment/serve.mjs` |
