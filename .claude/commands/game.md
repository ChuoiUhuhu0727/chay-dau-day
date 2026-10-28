---
description: Bắt đầu một game mới từ ý tưởng của bạn (tạo Wiki + kế hoạch tính năng)
argument-hint: <mô tả game: chơi thế nào, thắng khi nào, muốn có tính năng gì>
---

Người dùng là sinh viên, có thể chưa biết code. Trả lời bằng tiếng Việt, ngắn, thân thiện. Ý tưởng game của họ:

$ARGUMENTS

Làm lần lượt:

1. Nếu chưa có thư mục `examples/parking-jam/` thì chạy `bash new-game.sh` (cất game mẫu, tạo trang trắng).
   Nếu đã có game khác đang làm dở (có trang trong `1-wiki/features/`), hỏi người dùng có muốn bỏ game cũ không trước khi làm gì.
2. Nếu ý tưởng quá mơ hồ (không biết người chơi làm gì hoặc khi nào thắng), hỏi lại đúng 1–2 câu rồi dừng.
3. Viết `1-wiki/raw/idea.md` theo mẫu có sẵn trong file (Tên game · Cho ai · Chơi thế nào · Các tính năng muốn có),
   giữ nguyên ý của người dùng, chỉ sắp xếp lại cho rõ. Game phải chơi bằng bấm/chạm, chạy trên trình duyệt.
4. Chạy `bash plan.sh` (mất khoảng 2–3 phút; báo người dùng là đang lên kế hoạch).
5. Trình bày kế hoạch cho người dùng duyệt, dạng:
   - Mỗi tính năng một dòng: `F1 · tên — điều quan trọng nhất trong Done when`
   - Các câu hỏi cho PO (nếu có trong các trang feature/decision).
   Kết thúc bằng: "Bạn là PO: muốn sửa gì cứ nói. Ổn rồi thì gõ **/build**."
6. Nếu người dùng muốn sửa: sửa trang tương ứng trong `1-wiki/features/` (giữ dạng `# F<số> — Tên` và `## Done when`),
   rồi chạy `node 4-memory/features.mjs sync`. Không tự viết code game ở bước này.
