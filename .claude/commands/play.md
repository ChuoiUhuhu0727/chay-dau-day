---
description: Mở game để chơi thử và cho bot tự chơi, xuất báo cáo có ảnh (Harness Automation Test)
---

Trả lời tiếng Việt, ngắn.

1. Chạy `bash test.sh` (bot tự chơi trong Chrome, mở báo cáo có ảnh). Báo 🟢/🔴 và các bước bot đã kiểm.
2. Chạy server game ở chế độ nền: `node 2-environment/serve.mjs` (chạy nền, không chờ), rồi mở http://localhost:5173
   (`open` trên macOS, `start` trên Windows, `xdg-open` trên Linux).
3. Gợi ý: "Muốn thêm tính năng? Cứ nói ý tưởng." Nếu họ nói: tạo file mới trong `1-wiki/raw/` (ví dụ `them-am-thanh.md`),
   viết trang feature mới như trong /game (bước 4), `node 4-memory/features.mjs sync`, trình bày, rồi bảo gõ /build.
