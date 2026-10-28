---
description: Mở game để chơi thử và cho bot tự chơi, xuất báo cáo có ảnh
---

Trả lời bằng tiếng Việt, ngắn.

1. Chạy `bash test.sh` (bot tự chơi trong Chrome, mở báo cáo có ảnh). Báo kết quả 🟢/🔴 và các bước bot đã kiểm.
2. Chạy server game ở chế độ nền: `node 2-environment/serve.mjs` (chạy nền, không chờ), rồi mở http://localhost:5173 cho người dùng
   (`open` trên macOS, `start` trên Windows, `xdg-open` trên Linux).
3. Gợi ý: "Muốn thêm tính năng? Nói ý tưởng, mình sẽ ghi vào raw/ rồi chạy lại kế hoạch." Nếu họ nói thêm tính năng:
   tạo file mới trong `1-wiki/raw/` (ví dụ `them-am-thanh.md`), chạy `bash plan.sh`, trình bày tính năng mới, rồi bảo gõ /build.
