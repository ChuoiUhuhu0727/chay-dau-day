---
description: Để harness build lần lượt từng tính năng tới khi máy chấm xanh
---

Trả lời bằng tiếng Việt, ngắn. Bạn KHÔNG tự viết code game ở đây — harness làm việc đó, bạn chỉ chạy và báo lại.

1. Chạy `node 4-memory/features.mjs list` và báo người dùng còn mấy tính năng ⏳.
2. Lặp cho tới khi `node 4-memory/features.mjs next` không trả ra gì:
   - Chạy `bash execute.sh <FID>` (mỗi tính năng khoảng 2–4 phút; đặt timeout 600000).
   - Sau mỗi tính năng báo MỘT dòng: `F2 · Lật thẻ và so cặp — 🟢 xanh ở vòng 1` (hoặc 🔴→🟢 nếu phải sửa).
   - Nếu `execute.sh` thoát khác 0 (⛔ bị chặn): dừng lặp, đọc `4-memory/logs/<FID>-*-verify.txt` và giải thích bằng lời
     đơn giản vì sao chưa đạt, gợi ý người dùng nói rõ hơn yêu cầu. Khi họ trả lời, sửa trang feature, chạy
     `node 4-memory/features.mjs set <FID> pending` rồi tiếp tục /build.
3. Xong hết: nếu có `4-memory/po-questions.md` thì tóm tắt các câu hỏi cho PO.
   Kết thúc bằng: "Gõ **/play** để chơi thử và xem bot tự chơi."
