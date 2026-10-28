---
description: Bắt đầu game mới từ ý tưởng của bạn — AI viết Wiki và kế hoạch tính năng (Harness Plan)
argument-hint: <mô tả game: chơi thế nào, thắng khi nào, muốn có tính năng gì>
---

Đọc `2-environment/rules.md` trước. Người dùng là sinh viên, có thể chưa biết code. Trả lời tiếng Việt, ngắn, thân thiện.
Ý tưởng game của họ:

$ARGUMENTS

Làm lần lượt:

1. Nếu chưa có thư mục `examples/parking-jam/` thì chạy `bash new-game.sh` (cất game mẫu, tạo trang trắng).
   Nếu đã có game khác đang làm dở (có trang trong `1-wiki/features/`), hỏi người dùng có muốn bỏ game cũ không trước khi làm gì.
2. Nếu ý tưởng quá mơ hồ (không rõ người chơi làm gì hoặc khi nào thắng), hỏi lại đúng 1–2 câu rồi dừng.
3. Viết `1-wiki/raw/idea.md` theo mẫu có sẵn (Tên game · Cho ai · Chơi thế nào · Các tính năng muốn có),
   giữ nguyên ý người dùng. Game chơi bằng bấm/chạm, chạy trên trình duyệt.
4. **Harness Plan — bạn tự viết Wiki** theo kiến trúc trong `1-wiki/README.md`:
   - `1-wiki/features/F<số>-<ten-ngan>.md`: mỗi tính năng NHỎ một file. Dòng đầu đúng dạng `# F1 — Tên tính năng`.
     Có mục `## Done when` gồm các dòng `- [ ] …`, mỗi dòng là một điều máy kiểm được (đo được, không mơ hồ),
     có cả điều cho unit test lẫn điều bot bấm thử trên giao diện (nêu rõ id/selector, ví dụ `#moves`).
   - `1-wiki/screens/` (màn hình, các selector), `1-wiki/decisions/` (lựa chọn và vì sao), `overview.md`, `index.md`, thêm 1 dòng `log.md`.
   - Chỗ nào ý tưởng không nói rõ: chọn cách hợp lý, ghi `Câu hỏi cho PO: …` vào `4-memory/po-questions.md`.
   - Cuối cùng chạy `node 4-memory/features.mjs sync`.
5. Trình bày kế hoạch cho người dùng duyệt:
   - Mỗi tính năng một dòng: `F1 · tên — điều quan trọng nhất trong Done when`
   - Các câu hỏi cho PO.
   Kết thúc bằng: "Bạn là PO: muốn sửa gì cứ nói. Ổn rồi thì gõ **/build**."
6. Nếu người dùng muốn sửa: sửa trang tương ứng trong `1-wiki/features/`, rồi chạy `node 4-memory/features.mjs sync`.
   Không viết code game ở bước này.
