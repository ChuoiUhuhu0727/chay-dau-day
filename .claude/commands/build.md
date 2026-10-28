---
description: Bạn (Model) tự build các tính năng tới khi Verification chấm xanh — chế độ model_led
---

Đọc `2-environment/rules.md` và làm đúng mục **Chế độ duy nhất: model_led**. Trả lời tiếng Việt, ngắn — người dùng là sinh viên.

1. `node 4-memory/features.mjs brief` → báo người dùng còn mấy tính năng và bạn sẽ làm theo thứ tự nào (một dòng).
1b. Trước khi code giao diện: đọc `1-wiki/design/README.md` + `1-wiki/design/style.md`, tải asset bằng
   `bash 2-environment/get-asset.sh <url> <tên-file>`, đặt màu/font theo `style.md`.
2. Làm từng tính năng theo thứ tự đã chọn: đọc trang feature → viết test trước (đỏ) → code (xanh) →
   cập nhật `game/e2e.mjs` để bot bấm thử đúng Done when (gọi `shot()` sau mỗi bước quan trọng) →
   `node 4-memory/features.mjs claim F<số>` → `node 4-memory/features.mjs note "…"`.
   Sau mỗi tính năng báo một dòng: `F2 · Lật thẻ và so cặp — đã làm, chờ verify 🟡`.
2b. Trước khi claim, tự trả lời 5 câu ở mục 7 của `1-wiki/design/README.md` và sửa nếu chưa ổn.
3. Khi mọi tính năng đã claim (hoặc sau 2–3 tính năng nếu game lớn): `bash 3-verification/verify.sh`.
   - 🟢: báo `F1 F2 F3 ✅ passing`.
   - 🔴: đọc lỗi, sửa đúng chỗ, chạy lại verify. Tối đa 3 lần đỏ cho một tính năng; quá thì `block` kèm lý do,
     ghi một dòng bài học vào `1-wiki/learned.md`, giải thích cho người dùng bằng lời đơn giản.
4. Lặp tới khi `node 4-memory/features.mjs list` không còn ⏳ hay 🟡.
5. Cuối cùng: `node 4-memory/features.mjs list`, tóm tắt các dòng trong `4-memory/po-questions.md` (nếu có),
   và kết thúc bằng: "Gõ **/play** để chơi thử và xem bot tự chơi."
